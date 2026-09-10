import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { NbMenuItem } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, pairwise, tap } from 'rxjs';
import { NgxPermissionsService } from 'ngx-permissions';
import { distinctUntilChange, isNotEmpty } from '@gauzy/ui-core/common';
import { FeatureEnum, IOrganization, IRolePermission, IUser, PermissionsEnum } from '@gauzy/contracts';
import {
	AuthStrategy,
	NavMenuBuilderService,
	NavMenuSectionItem,
	PermissionsService,
	Store,
	UsersService
} from '@gauzy/ui-core/core';
import { TranslationBaseComponent } from '@gauzy/ui-core/i18n';
import { ReportService } from './reports/all-report/report.service';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ngx-pages',
	styleUrls: ['pages.component.scss'],
	template: `
		@if (!!menu && user) {
			<ngx-one-column-layout>
				<ga-main-nav-menu></ga-main-nav-menu>
				<router-outlet></router-outlet>
			</ngx-one-column-layout>
		}
	`,
	standalone: false
})
export class PagesComponent extends TranslationBaseComponent implements AfterViewInit, OnInit, OnDestroy {
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);
	private readonly _store = inject(Store);
	private readonly _reportService = inject(ReportService);
	private readonly _ngxPermissionsService = inject(NgxPermissionsService);
	private readonly _usersService = inject(UsersService);
	private readonly _authStrategy = inject(AuthStrategy);
	private readonly _navMenuBuilderService = inject(NavMenuBuilderService);
	private readonly _permissionsService = inject(PermissionsService);

	public organization: IOrganization;
	public user: IUser;
	public menu: NbMenuItem[] = [];
	public reportMenuItems: NavMenuSectionItem[] = [];

	constructor() {
		super(inject(TranslateService));
	}

	async ngOnInit() {
		this._route.data
			.pipe(
				filter(({ user }: Data) => !!user),
				tap(({ user }: Data) => {
					if (!user.tenantId) {
						this._router.navigate(['/onboarding/tenant']);
						return;
					}
				}),
				untilDestroyed(this)
			)
			.subscribe();
		await this._createEntryPoint();

		this._store.selectedOrganization$
			.pipe(
				filter((organization: IOrganization) => !!organization),
				distinctUntilChange(),
				pairwise(),
				tap(([previousOrganization]: [IOrganization, IOrganization]) => {
					this.removeOrganizationReportsMenuItems(previousOrganization);
				}),
				untilDestroyed(this)
			)
			.subscribe();

		this._store.selectedOrganization$
			.pipe(
				filter((organization: IOrganization) => !!organization),
				distinctUntilChange(),
				tap((organization: IOrganization) => (this.organization = organization)),
				tap(() => this.getReportsMenus()),
				untilDestroyed(this)
			)
			.subscribe();

		this._store.userRolePermissions$
			.pipe(
				filter((permissions: IRolePermission[]) => isNotEmpty(permissions)),
				map((permissions) => permissions.map(({ permission }) => permission)),
				tap((permissions) => {
					this._ngxPermissionsService.flushPermissions();
					this._ngxPermissionsService.loadPermissions(permissions);
				}),
				untilDestroyed(this)
			)
			.subscribe();

		this._reportService.menuItems$.pipe(distinctUntilChange(), untilDestroyed(this)).subscribe((menuItems) => {
			const reportItems = menuItems ? Object.values(menuItems) : [];

			this.reportMenuItems = reportItems.map((item) => ({
				id: item.slug,
				title: item.name,
				link: `/pages/reports/${item.slug}`,
				icon: item.iconClass,
				data: {
					translationKey: item.name
				}
			}));

			this.addOrRemoveOrganizationReportsMenuItems();
		});
	}

	ngAfterViewInit(): void {
		this._store.selectedOrganization$
			.pipe(
				distinctUntilChange(),
				filter((organization: IOrganization) => !!organization),
				tap((organization: IOrganization) => this.addOrganizationManageMenuItem(organization)),
				untilDestroyed(this)
			)
			.subscribe();
	}

	private removeOrganizationReportsMenuItems(organization: IOrganization): void {
		if (!organization) {
			return;
		}

		const { id: organizationId, tenantId } = organization;
		const itemIdsToRemove = this.getReportMenuBaseItemIds().map(
			(itemId) => `${itemId}-${organizationId}-${tenantId}`
		);

		this._navMenuBuilderService.removeNavMenuItems(itemIdsToRemove, 'reports');
	}

	private addOrRemoveOrganizationReportsMenuItems() {
		if (!this.organization) {
			return;
		}

		const { id: organizationId, tenantId } = this.organization;
		this.removeOrganizationReportsMenuItems(this.organization);

		this.reportMenuItems.forEach((report: NavMenuSectionItem) => {
			if (report?.id && report?.title) {
				this._navMenuBuilderService.addNavMenuItem(
					{
						id: `${report.id}-${organizationId}-${tenantId}`,
						title: report.title,
						icon: report.icon,
						link: report.link,
						data: report.data
					},
					'reports'
				);
			}
		});
	}

	public getReportMenuBaseItemIds() {
		return ['amounts-owed', 'client-budgets', 'expense', 'payments'];
	}

	private addOrganizationManageMenuItem(organization: IOrganization): void {
		this._navMenuBuilderService.addNavMenuItem(
			{
				id: 'organization-manage',
				title: 'Manage',
				icon: 'fas fa-globe-americas',
				link: `/pages/organizations/edit/${organization?.id}`,
				pathMatch: 'prefix',
				data: {
					translationKey: 'MENU.MANAGE',
					permissionKeys: [PermissionsEnum.ALL_ORG_EDIT],
					featureKey: FeatureEnum.FEATURE_ORGANIZATION
				}
			},
			'reports'
		);
	}

	async getReportsMenus(): Promise<void> {
		if (!this.organization) {
			return;
		}

		const { id: organizationId, tenantId } = this.organization;
		await this._reportService.getReportMenuItems({ tenantId, organizationId });
	}

	private async _createEntryPoint() {
		const id = this._store.userId;

		if (!id) return;

		const relations = ['role', 'tenant', 'tenant.featureOrganizations', 'tenant.featureOrganizations.feature'];
		this.user = await this._usersService.getMe(relations, true);

		this._authStrategy.electronAuthentication({
			user: this.user,
			token: this._store.token,
			refresh_token: this._store.refresh_token
		});

		if (!this.user.tenantId) {
			this._router.navigate(['/onboarding/tenant']);
			return;
		}

		this._store.user = this.user;
		this._permissionsService.loadPermissions();

		const { tenant } = this.user;
		this._store.featureTenant = tenant.featureOrganizations.filter((item) => !item.organizationId);
	}

	ngOnDestroy() {
		this.removeOrganizationReportsMenuItems(this.organization);
	}
}
