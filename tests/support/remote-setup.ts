import { mkdirSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { request, type FullConfig } from '@playwright/test';

/** Send the protection credential only to one verified first-party request. */
export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL!;
  const production = new URL(baseURL).hostname === 'sql-select-lab.vercel.app';
  const secret = production
    ? undefined
    : parseEnv(readFileSync('.env.vercel-preview.local', 'utf8')).VERCEL_AUTOMATION_BYPASS_SECRET;
  const client = await request.newContext();
  try {
    const response = await client.get(baseURL, {
      maxRedirects: 0,
      headers: secret
        ? { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' }
        : {},
    });
    if (!response.ok()) throw new Error(`Remote gate returned HTTP ${response.status()}.`);
    mkdirSync('output/playwright/phase5', { recursive: true });
    await client.storageState({ path: 'output/playwright/phase5/remote-state.json' });
  } finally {
    await client.dispose();
  }
}
