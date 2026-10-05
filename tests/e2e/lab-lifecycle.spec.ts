import { expect, test } from '@playwright/test';
import { watchConsole } from './support/layout';

for (const navigation of ['spa', 'document'] as const) {
  test(`Lab: estado servido por el servidor y salida ${navigation} sin otra petición de salud`, async ({
    page,
  }) => {
    const errors = watchConsole(page);
    const healthRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/oracle/status')
        healthRequests.push(request.method());
    });
    await page.goto('/lab');
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.getByText('Conectado', { exact: true })).toBeVisible();
    if (navigation === 'spa') {
      await page.locator('.site-brand').click();
      await expect(page).toHaveURL(/\/$/);
    } else {
      await page.goto('/challenge');
      await expect(page).toHaveURL(/\/challenge$/);
    }
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(healthRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
