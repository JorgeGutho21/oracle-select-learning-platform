import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';

const [baseURL, ...args] = process.argv.slice(2);
if (
  !baseURL ||
  !/^https:\/\/sql-select-[a-z0-9]+-jorge-gutierrez1\.vercel\.app\/?$/.test(baseURL)
) {
  throw new Error("Authenticated remote QA is restricted to this project's preview deployments.");
}
// Immutable production URLs share the same hostname pattern. Verify the actual target
// before allowing this runner to create any QA accounts or assessments.
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
const { token } = JSON.parse(readFileSync('.vercel/cli/auth.json', 'utf8'));
const inspection = await fetch(
  `https://api.vercel.com/v13/deployments/${new URL(baseURL).hostname}?teamId=${project.orgId}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!inspection.ok) throw new Error(`Preview inspection returned HTTP ${inspection.status}.`);
const deployment = await inspection.json();
if (
  deployment.projectId !== project.projectId ||
  deployment.target === 'production' ||
  deployment.readyState !== 'READY'
) {
  throw new Error('Authenticated remote QA requires a ready preview of the linked project.');
}
const local = parseEnv(readFileSync('.env.local', 'utf8'));
const preview = parseEnv(readFileSync('.env.vercel-preview.local', 'utf8'));
const env = {
  ...process.env,
  REMOTE_BASE_URL: baseURL,
  PHASE5_REMOTE_QA: 'preview',
  E2E_SUPABASE_URL: local.NEXT_PUBLIC_SUPABASE_URL,
  E2E_SUPABASE_PUBLISHABLE_KEY: local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  E2E_SUPABASE_SECRET_KEY: local.SUPABASE_SECRET_KEY,
  E2E_PREVIEW_PRESENTER_ACCESS_CODE: preview.PREVIEW_PRESENTER_ACCESS_CODE,
};
if (!env.E2E_SUPABASE_URL || !env.E2E_SUPABASE_SECRET_KEY)
  throw new Error('Remote QA variables are missing.');
const child = spawn(
  process.execPath,
  ['node_modules/playwright/cli.js', 'test', '--config=playwright.remote.config.ts', ...args],
  { env, stdio: 'inherit' },
);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.on('error', () => {
  console.error('Unable to start remote QA.');
  process.exitCode = 1;
});
