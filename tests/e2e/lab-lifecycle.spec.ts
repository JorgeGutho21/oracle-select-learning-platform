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

test('Lab: cerrar el documento aborta la lectura antes de destruir el contexto de React', async ({
  page,
}) => {
  const errors = watchConsole(page);
  await page.addInitScript(() => {
    let hiding = false;
    window.addEventListener('pagehide', () => {
      hiding = true;
    });
    const originalFetch = window.fetch;
    window.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.pathname === '/api/oracle/status')
        init?.signal?.addEventListener('abort', () => {
          if (hiding) sessionStorage.setItem('dblab-qa-status-abort-stage', 'pagehide');
        });
      return originalFetch.call(window, input, init);
    };
  });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/oracle/status', async (route) => {
    await pending;
    await route.abort('aborted');
  });
  try {
    const requested = page.waitForRequest('**/api/oracle/status');
    await page.goto('/lab');
    await requested;
    await expect(page.getByRole('region', { name: 'Resultado' })).toContainText('Comprobando…');
    // Navegación completa: no provoca la limpieza de un cambio de ruta dentro de React.
    await page.goto('/challenge');
    await expect(page.locator('main h1').first()).toBeVisible();
    release();
    await page.unrouteAll({ behavior: 'wait' });
    expect(await page.evaluate(() => sessionStorage.getItem('dblab-qa-status-abort-stage'))).toBe(
      'pagehide',
    );
    expect(errors).toEqual([]);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
    await page.evaluate(() => sessionStorage.removeItem('dblab-qa-status-abort-stage'));
  }
});
