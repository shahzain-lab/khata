import { Route, Routes } from '@angular/router';
import { PageRouteRegistryService, UserResolver } from '@gauzy/ui-core/core';
import { DateRangePickerResolver, NotFoundComponent } from '@gauzy/ui-core/shared';
import { PagesComponent } from './pages.component';

/**
 * Khata (accounting-only) pages routes.
 * Kept: accounting, financial reports, dashboard, users, organizations, settings, auth.
 * Removed: projects, teams, tasks, sales CRM, employees HR, goals, jobs, time tracking.
 */
export const getPagesRoutes = (_pageRouteRegistryService: PageRouteRegistryService): Routes => {
	const children: Route[] = [
		{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
		...getDashboardRoute(),
		...getAccountingRoutes(_pageRouteRegistryService),
		...getClientsRoute(),
		...getReportsRoutes(_pageRouteRegistryService),
		...getOrganizationRoutes(),
		...getUsersRoute(),
		...getOrganizationsRoute(),
		...getAuthRoute(),
		...getSettingsRoute(),
		...getHelpRoute(),
		...getAboutRoute(),
		...getLegalRoute(),
		{ path: '**', component: NotFoundComponent, data: { selectors: false } }
	];

	return [
		{
			path: '',
			component: PagesComponent,
			resolve: { user: UserResolver },
			children
		}
	];
};

function getDashboardRoute(): Route[] {
	return [
		{
			path: 'dashboard',
			loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule)
		}
	];
}

function getAccountingRoutes(_pageRouteRegistryService: PageRouteRegistryService): Route[] {
	return [
		{
			path: 'accounting',
			children: [
				{ path: '', redirectTo: 'invoices', pathMatch: 'full' },
				{
					path: 'income',
					loadChildren: () => import('./income/income.module').then((m) => m.IncomeModule),
					data: {
						selectors: { project: false, team: false },
						datePicker: { unitOfTime: 'month' }
					},
					resolve: { dates: DateRangePickerResolver }
				},
				{
					path: 'expenses',
					loadChildren: () => import('./expenses/expenses.module').then((m) => m.ExpensesModule),
					data: { datePicker: { unitOfTime: 'month' } },
					resolve: { dates: DateRangePickerResolver }
				},
				{
					path: 'expense-recurring',
					loadChildren: () =>
						import('./expense-recurring/expense-recurring.module').then((m) => m.ExpenseRecurringModule)
				},
				{
					path: 'invoices',
					loadChildren: () => import('./invoices/invoices.module').then((m) => m.InvoicesModule),
					data: {
						selectors: { project: false, team: false, employee: false },
						datePicker: { unitOfTime: 'month' }
					}
				},
				{
					path: 'payments',
					loadChildren: () => import('./payments/payments.module').then((m) => m.PaymentsModule)
				},
				..._pageRouteRegistryService.getPageLocationRoutes('accounting-sections')
			]
		}
	];
}

/** Billing parties for invoices (clients/customers) — required for accounting */
function getClientsRoute(): Route[] {
	return [
		{
			path: 'contacts',
			loadChildren: () => import('./contacts/contacts.module').then((m) => m.ContactsModule)
		}
	];
}

function getReportsRoutes(_pageRouteRegistryService: PageRouteRegistryService): Route[] {
	const reportSelectors = { project: false, team: false, employee: false, date: false, organization: true };
	return [
		{
			path: 'reports',
			children: [
				{ path: '', redirectTo: 'all', pathMatch: 'full' },
				{
					path: 'all',
					loadChildren: () => import('./reports/all-report/all-report.module').then((m) => m.AllReportModule),
					data: { selectors: { ...reportSelectors, organization: true } }
				},
				{
					path: 'expense',
					loadChildren: () =>
						import('./reports/expenses-report/expenses-report.module').then((m) => m.ExpensesReportModule)
				},
				{
					path: 'payments',
					loadChildren: () =>
						import('./reports/payment-report/payment-report.module').then((m) => m.PaymentReportModule)
				},
				{
					path: 'amounts-owed',
					loadChildren: () =>
						import('./reports/amounts-owed-report/amounts-owed-report.module').then(
							(m) => m.AmountsOwedReportModule
						)
				},
				{
					path: 'client-budgets',
					loadChildren: () =>
						import('./reports/client-budgets-report/client-budgets-report.module').then(
							(m) => m.ClientBudgetsReportModule
						)
				},
				..._pageRouteRegistryService.getPageLocationRoutes('reports-sections'),
				{ path: '**', component: NotFoundComponent, data: { selectors: false } }
			]
		}
	];
}

function getOrganizationRoutes(): Route[] {
	const orgSelectors = { project: false, team: false, employee: false, date: false };
	return [
		{
			path: 'organization',
			children: [
				{
					path: 'tags',
					loadChildren: () => import('./tags/tags.module').then((m) => m.TagsModule),
					data: { selectors: orgSelectors }
				},
				{
					path: 'vendors',
					loadChildren: () => import('./vendors/vendors.module').then((m) => m.VendorsModule),
					data: { selectors: orgSelectors }
				},
				{
					path: 'expense-recurring',
					loadChildren: () =>
						import('./expense-recurring/expense-recurring.module').then((m) => m.ExpenseRecurringModule)
				}
			]
		}
	];
}

function getUsersRoute(): Route[] {
	return [
		{
			path: 'users',
			loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
			data: { selectors: { project: false, team: false, employee: false, date: false } }
		}
	];
}

function getOrganizationsRoute(): Route[] {
	return [
		{
			path: 'organizations',
			loadChildren: () => import('./organizations/organizations.module').then((m) => m.OrganizationsModule)
		}
	];
}

function getAuthRoute(): Route[] {
	return [
		{
			path: 'auth',
			loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
		}
	];
}

function getSettingsRoute(): Route[] {
	return [
		{
			path: 'settings',
			loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule)
		}
	];
}

function getHelpRoute(): Route[] {
	return [
		{
			path: 'help',
			loadChildren: () => import('./help/help.module').then((m) => m.HelpModule)
		}
	];
}

function getAboutRoute(): Route[] {
	return [
		{
			path: 'about',
			loadChildren: () => import('./about/about.module').then((m) => m.AboutModule)
		}
	];
}

function getLegalRoute(): Route[] {
	return [
		{
			path: 'legal',
			loadChildren: () => import('@gauzy/plugin-legal-ui').then((m) => m.PageLegalModule)
		}
	];
}
