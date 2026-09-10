import { Component, OnDestroy, OnInit, Signal, ViewChild, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ISelectedEmployee, PermissionsEnum } from '@gauzy/contracts';
import { PageTabRegistryService, Store, PageTabsetPageId } from '@gauzy/ui-core/core';
import { TranslationBaseComponent } from '@gauzy/ui-core/i18n';
import { DynamicTabsComponent } from '@gauzy/ui-core/shared';

@UntilDestroy()
@Component({
	selector: 'ga-dashboard-layout',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	standalone: false
})
export class DashboardComponent extends TranslationBaseComponent implements OnInit, OnDestroy {
	private readonly _route = inject(ActivatedRoute);
	private readonly _store = inject(Store);
	private readonly _pageTabRegistryService = inject(PageTabRegistryService);

	public tabsetId: PageTabsetPageId = this._route.snapshot.data.tabsetId;
	public selectedEmployee: ISelectedEmployee;

	public readonly isCustomDashboard: Signal<boolean> = toSignal(
		inject(Router).events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map((event: NavigationEnd) => event.urlAfterRedirects.includes('/dashboard/custom/'))
		),
		{ initialValue: inject(Router).url.includes('/dashboard/custom/') }
	);

	@ViewChild('dynamicTabs', { static: true }) dynamicTabsComponent!: DynamicTabsComponent;

	constructor(public readonly translateService: TranslateService) {
		super(translateService);
	}

	ngOnInit(): void {
		this.registerAccountingTab();

		this._store.selectedEmployee$
			.pipe(
				filter((employee: ISelectedEmployee) => !!employee),
				tap((employee: ISelectedEmployee) => (this.selectedEmployee = employee)),
				tap(() => this.registerAccountingTab()),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Khata: only the accounting dashboard tab.
	 */
	registerAccountingTab(): void {
		this._pageTabRegistryService.removePageTab(this.tabsetId, 'accounting');
		this._pageTabRegistryService.removePageTab(this.tabsetId, 'teams');
		this._pageTabRegistryService.removePageTab(this.tabsetId, 'project-management');
		this._pageTabRegistryService.removePageTab(this.tabsetId, 'hr');
		this._pageTabRegistryService.removePageTab(this.tabsetId, 'time-tracking');

		this._pageTabRegistryService.registerPageTab({
			tabsetId: this.tabsetId,
			tabId: 'accounting',
			tabsetType: 'route',
			route: '/pages/dashboard/accounting',
			tabTitle: (_i18n) => _i18n.getTranslation('DASHBOARD_PAGE.ACCOUNTING'),
			tabIcon: 'credit-card-outline',
			responsive: true,
			activeLinkOptions: { exact: false },
			order: 1,
			permissions: [PermissionsEnum.ADMIN_DASHBOARD_VIEW, PermissionsEnum.ACCOUNTING_DASHBOARD]
		});

		this.dynamicTabsComponent?.reload$?.next(true);
	}

	ngOnDestroy(): void {}
}
