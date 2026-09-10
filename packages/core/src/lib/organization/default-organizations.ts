import { CurrenciesEnum, DefaultValueDateTypeEnum } from '@gauzy/contracts';

export const DEFAULT_EVER_ORGANIZATIONS = [
	{
		name: 'PipBattle',
		currency: CurrenciesEnum.USD,
		defaultValueDateType: DefaultValueDateTypeEnum.TODAY,
		imageUrl: 'assets/images/logos/logo_Gauzy.svg',
		isDefault: true,
		totalEmployees: 0
	},
	{
		name: 'SAAZ',
		currency: CurrenciesEnum.USD,
		defaultValueDateType: DefaultValueDateTypeEnum.TODAY,
		imageUrl: 'assets/images/logos/logo_Gauzy.svg',
		isDefault: false,
		totalEmployees: 0
	}
];

/** Khata workspaces seeded on empty database */
export const DEFAULT_ORGANIZATIONS = [
	{
		name: 'PipBattle',
		currency: CurrenciesEnum.USD,
		defaultValueDateType: DefaultValueDateTypeEnum.TODAY,
		imageUrl: 'assets/images/logos/logo_Gauzy.svg',
		isDefault: true,
		totalEmployees: 0
	},
	{
		name: 'SAAZ',
		currency: CurrenciesEnum.USD,
		defaultValueDateType: DefaultValueDateTypeEnum.TODAY,
		imageUrl: 'assets/images/logos/logo_Gauzy.svg',
		isDefault: false,
		totalEmployees: 0
	}
];
