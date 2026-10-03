// Configuración temporal (no se versiona): ejecuta las pruebas contra un despliegue remoto.
// REMOTE_BASE_URL indica el despliegue; en vistas previas protegidas se envía el secreto de
// «Protection Bypass for Automation» leído de .env.vercel-preview.local, sin imprimirlo.
import { readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

function bypassSecret(): string | null {
  try {
    const line = readFileSync('.env.vercel-preview.local', 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith('VERCEL_AUTOMATION_BYPASS_SECRET='));
    return line ? line.slice(line.indexOf('=') + 1).trim() : null;
  } catch {
    return null;
  }
}

const baseURL = process.env.REMOTE_BASE_URL ?? 'https://sql-select-lab.vercel.app';
const secret = baseURL.includes('sql-select-lab.vercel.app') ? null : bypassSecret();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 3,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-remote' }]],
  outputDir: 'test-results-remote',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(secret
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': secret,
            'x-vercel-set-bypass-cookie': 'true',
          },
        }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
