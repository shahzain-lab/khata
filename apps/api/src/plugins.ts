import { environment } from '@gauzy/config';

import { AiChatPlugin } from '@gauzy/plugin-ai-chat';
import { AiProviderAnthropicPlugin } from '@gauzy/plugin-ai-provider-anthropic';
import { AiProviderOpenAiPlugin } from '@gauzy/plugin-ai-provider-openai';
import { AiProviderOpenRouterPlugin } from '@gauzy/plugin-ai-provider-openrouter';
import { AiProviderVercelGatewayPlugin } from '@gauzy/plugin-ai-provider-vercel-gateway';
import { AiProviderGauzyAiPlugin } from '@gauzy/plugin-ai-provider-gauzy-ai';
import { AiProviderGeminiPlugin } from '@gauzy/plugin-ai-provider-gemini';
import { AiProviderGrokPlugin } from '@gauzy/plugin-ai-provider-grok';
import { AiProviderGroqPlugin } from '@gauzy/plugin-ai-provider-groq';
import { AiProviderMistralPlugin } from '@gauzy/plugin-ai-provider-mistral';
import { AiProviderDeepgramPlugin } from '@gauzy/plugin-ai-provider-deepgram';
import { AiProviderElevenLabsPlugin } from '@gauzy/plugin-ai-provider-elevenlabs';
import { AiProviderSpeachesPlugin } from '@gauzy/plugin-ai-provider-speaches';
import { AiProviderLocalAiPlugin } from '@gauzy/plugin-ai-provider-localai';
import { AiProviderWhisperCppPlugin } from '@gauzy/plugin-ai-provider-whisper-cpp';
import { AiProviderOpenAiCompatiblePlugin } from '@gauzy/plugin-ai-provider-openai-compatible';
import { ChangelogPlugin } from '@gauzy/plugin-changelog';
import { DocsPlugin } from '@gauzy/plugin-docs';
import { JitsuAnalyticsPlugin } from '@gauzy/plugin-jitsu-analytics';
import { KnowledgeBasePlugin } from '@gauzy/plugin-knowledge-base';
import { RegistryPlugin } from '@gauzy/plugin-registry';

import { SentryTracing as SentryPlugin } from './sentry';
import { PosthogAnalytics as PosthogPlugin } from './posthog';

const { jitsu, sentry, posthog } = environment;

/**
 * Khata API plugins — jobs, time-tracking integrations, and product reviews removed.
 */
export const plugins = [
	...(sentry?.dsn ? [SentryPlugin] : []),
	...(posthog?.posthogEnabled && posthog?.posthogKey ? [PosthogPlugin] : []),
	JitsuAnalyticsPlugin.init({
		config: {
			host: jitsu.serverHost,
			writeKey: jitsu.serverWriteKey,
			debug: jitsu.debug,
			echoEvents: jitsu.echoEvents
		}
	}),
	AiChatPlugin,
	AiProviderAnthropicPlugin,
	AiProviderOpenAiPlugin,
	AiProviderOpenRouterPlugin,
	AiProviderVercelGatewayPlugin,
	AiProviderGauzyAiPlugin,
	AiProviderGeminiPlugin,
	AiProviderGrokPlugin,
	AiProviderGroqPlugin,
	AiProviderMistralPlugin,
	AiProviderSpeachesPlugin,
	AiProviderLocalAiPlugin,
	AiProviderWhisperCppPlugin,
	AiProviderOpenAiCompatiblePlugin,
	AiProviderDeepgramPlugin,
	AiProviderElevenLabsPlugin,
	DocsPlugin,
	ChangelogPlugin,
	KnowledgeBasePlugin,
	RegistryPlugin
];
