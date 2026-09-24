import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // El screencast de la traza en WebKit/Windows duplica la duración de cada prueba.
        // Se conservan los snapshots DOM de la traza y la captura final del fallo.
        trace: { mode: 'retain-on-failure', screenshots: false },
      },
    },
  ],
  // Las E2E usan el build de producción: `next dev` compila cada ruta bajo demanda y, con
  // la suite completa, las Server Functions superaban las esperas en Edge. Next 16 separa
  // `.next/dev`, así que un servidor de desarrollo puede seguir abierto en el puerto 3100.
  webServer: {
    command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3200',
    url: 'http://127.0.0.1:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
