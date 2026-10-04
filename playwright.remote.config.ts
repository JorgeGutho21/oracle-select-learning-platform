import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.REMOTE_BASE_URL;
if (
  !baseURL ||
  !/^https:\/\/sql-select(?:-lab|-[a-z0-9]+-jorge-gutierrez1)\.vercel\.app\/?$/.test(baseURL)
) {
  throw new Error('REMOTE_BASE_URL must identify this project on Vercel.');
}
export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'remote/**/*.spec.ts'],
  globalSetup: './tests/support/remote-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'output/playwright/phase5/remote-results',
  use: {
    baseURL,
    storageState: 'output/playwright/phase5/remote-state.json',
    // The bypass cookie is private. Do not put it in traces or reports.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
