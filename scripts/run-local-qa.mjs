import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';

// Explicit isolated Supabase only. Never fall back to the production .env.local.
const qa = parseEnv(readFileSync('.env.qa.local', 'utf8'));
const url = new URL(qa.SUPABASE_TEST_URL ?? '');
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('Local QA requires a loopback Supabase URL.');
}
for (const key of ['SUPABASE_TEST_PUBLISHABLE_KEY', 'SUPABASE_TEST_SECRET_KEY']) {
  if (!qa[key]) throw new Error(`Missing local QA variable: ${key}`);
}
const env = {
  ...process.env,
  ...qa,
  NEXT_PUBLIC_SUPABASE_URL: url.origin,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: qa.SUPABASE_TEST_PUBLISHABLE_KEY,
  SUPABASE_URL: url.origin,
  SUPABASE_SECRET_KEY: qa.SUPABASE_TEST_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: qa.SUPABASE_TEST_SECRET_KEY,
  CLASSROOM_BACKEND: 'memory',
  PRESENTER_ACCESS_CODE: 'clave-e2e-profesor',
  E2E_SUPABASE_URL: url.origin,
  E2E_SUPABASE_PUBLISHABLE_KEY: qa.SUPABASE_TEST_PUBLISHABLE_KEY,
  E2E_SUPABASE_SECRET_KEY: qa.SUPABASE_TEST_SECRET_KEY,
  E2E_MAILPIT_URL: qa.E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324',
};
const [mode, ...args] = process.argv.slice(2);
if (mode === 'start') {
  // Next compila las cabeceras con el entorno de build. Cambiar solo el entorno al
  // arrancar no cambia connect-src: Realtime quedaría bloqueado por una CSP ajena al QA.
  const manifest = JSON.parse(readFileSync('.next/routes-manifest.json', 'utf8'));
  const policy = manifest.headers
    .flatMap((route) => route.headers)
    .find((header) => header.key.toLowerCase() === 'content-security-policy')?.value;
  const connect = policy
    ?.split(';')
    .find((directive) => directive.trim().startsWith('connect-src '))
    ?.trim()
    .split(/\s+/);
  if (!connect?.includes(url.origin) || !connect.includes(`ws://${url.host}`)) {
    throw new Error(
      'El build no tiene la CSP del Supabase aislado. Ejecuta node scripts/run-local-qa.mjs build antes de start.',
    );
  }
}
const commands = {
  vitest: ['node_modules/vitest/vitest.mjs', 'run', '--maxWorkers=1'],
  playwright: ['node_modules/playwright/cli.js', 'test', '--workers=1'],
  build: ['node_modules/next/dist/bin/next', 'build'],
  start: ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3200'],
};
const command = commands[mode];
if (!command)
  throw new Error('Use: node scripts/run-local-qa.mjs vitest|playwright|build|start [args]');
const child = spawn(process.execPath, [...command, ...args], { env, stdio: 'inherit' });
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.on('error', () => {
  console.error('Unable to start local QA.');
  process.exitCode = 1;
});
