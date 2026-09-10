/**
 * Seed entry — load env BEFORE any @gauzy/config import so DB_TYPE/JWT secrets apply.
 */
import { loadEnv } from './load-env';

loadEnv();

async function main() {
	const { seedDefault } = await import('@gauzy/core');
	const { pluginConfig } = await import('./plugin.config');
	await seedDefault(pluginConfig);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
