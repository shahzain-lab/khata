import { LanguagesEnum, WeekDaysEnum } from '@gauzy/contracts';
import { DocsUiPlugin } from '@gauzy/plugin-docs-ui';
import { AiChatReactUiPlugin } from '@gauzy/plugin-ai-chat-react-ui';
import { DayOfWeek, PluginUiConfig } from '@gauzy/plugin-ui';
import { dayOfWeekAsString } from '@gauzy/ui-core/shared';

/**
 * Khata UI plugins — accounting-focused. Jobs and time-tracking dashboards removed.
 */
export const uiPluginConfig: PluginUiConfig = {
	defaultLanguage: LanguagesEnum.ENGLISH,
	defaultLocale: 'en-US',
	fallbackLocale: LanguagesEnum.ENGLISH,

	availableLanguages: [
		LanguagesEnum.ENGLISH,
		LanguagesEnum.FRENCH,
		LanguagesEnum.SPANISH,
		LanguagesEnum.GERMAN,
		LanguagesEnum.PORTUGUESE,
		LanguagesEnum.ITALIAN,
		LanguagesEnum.DUTCH,
		LanguagesEnum.POLISH,
		LanguagesEnum.RUSSIAN,
		LanguagesEnum.CHINESE,
		LanguagesEnum.ARABIC,
		LanguagesEnum.BULGARIAN,
		LanguagesEnum.HEBREW
	],

	availableLocales: [
		'en-US',
		'fr-FR',
		'es-ES',
		'de-DE',
		'pt-PT',
		'it-IT',
		'nl-NL',
		'pl-PL',
		'ru-RU',
		'zh-CN',
		'ar-SA',
		'bg-BG',
		'he-IL'
	],

	startWeekOn: dayOfWeekAsString(WeekDaysEnum.MONDAY) as DayOfWeek,

	plugins: [
		DocsUiPlugin,
		AiChatReactUiPlugin
	]
};
