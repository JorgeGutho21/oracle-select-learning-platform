import { expect, test } from '@playwright/test';
import { watchConsole } from './support/layout';

test('Lab: salir durante la lectura de estado la cancela sin una excepción de transporte', async ({
  page,
}) => {
  const errors = watchConsole(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/oracle/status', async (route) => {
    await pending;
    // Solo se retrasa y cancela la lectura; no se inventa una respuesta de Oracle.
    await route.abort('aborted');
  });
  try {
    const requested = page.waitForRequest('**/api/oracle/status');
    await page.goto('/lab');
    await requested;
    await expect(page.getByRole('region', { name: 'Resultado' })).toContainText('Comprobando…');
    await page.locator('.site-brand').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main h1').first()).toBeVisible();
    release();
    await page.unrouteAll({ behavior: 'wait' });
    expect(errors).toEqual([]);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
