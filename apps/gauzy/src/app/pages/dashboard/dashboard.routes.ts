import { Route } from '@angular/router';
import {
	BookmarkQueryParamsResolver,
	customDashboardGuard,
	defaultDashboardGuard,
	PageRouteRegistryService,
	standardDashboardGuard
} from '@gauzy/ui-core/core';
import { DateRangePickerResolver } from '@gauzy/ui-core/shared';
import { DashboardComponent } from './dashboard.component';
import { CustomDashboardComponent } from './custom-dashboard/custom-dashboard.component';
import { AccountingComponent } from './accounting/accounting.component';

/**
 * Khata accounting-only dashboard routes.
 */
export function createDashboardRoutes(_pageRouteRegistryService: PageRouteRegistryService): Route[] {
	return [
		{
			path: '',
			component: DashboardComponent,
			data: {
				tabsetId: 'dashboard-page'
			},
			children: [
				{
					path: '',
					pathMatch: 'full',
					canActivate: [defaultDashboardGuard],
					children: []
				},
				{
					path: 'switching',
					children: []
				},
				{
					path: 'custom/:id',
					component: CustomDashboardComponent,
					canActivate: [customDashboardGuard],
					data: {
						selectors: {
							project: false
						},
						datePicker: {
							unitOfTime: 'week'
						}
					},
					resolve: {
						dates: DateRangePickerResolver,
						bookmarkParams: BookmarkQueryParamsResolver
					}
				},
				{
					path: 'accounting',
					component: AccountingComponent,
					canActivate: [standardDashboardGuard],
					data: {
						selectors: {
							project: false
						},
						datePicker: {
							unitOfTime: 'week'
						}
					},
					resolve: {
						dates: DateRangePickerResolver,
						bookmarkParams: BookmarkQueryParamsResolver
					}
				},
				// Redirect legacy time-tracking / HR / PM / teams dashboard paths to accounting
				{ path: 'time-tracking', redirectTo: 'accounting', pathMatch: 'full' },
				{ path: 'hr', redirectTo: 'accounting', pathMatch: 'full' },
				{ path: 'project-management', redirectTo: 'accounting', pathMatch: 'full' },
				{ path: 'teams', redirectTo: 'accounting', pathMatch: 'full' },
				..._pageRouteRegistryService.getPageLocationRoutes('dashboard-sections')
			]
		}
	];
}
