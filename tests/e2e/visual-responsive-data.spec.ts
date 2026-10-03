import { expect, test } from '@playwright/test';

/**
 * Vista de datos adaptable: los mismos datos cambian de representación según el espacio.
 * Con espacio, la tabla completa; sin él, grupos de columnas con pestañas, siempre tablas.
 * Nunca fichas por registro ni una barra horizontal como experiencia principal.
 */

test('EMPLEADOS: tabla en escritorio ancho y grupos de cuatro columnas en móvil', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/presentation?scene=5');
  const scene = page.locator('[data-scene="5"]');
  await expect(scene.getByRole('table')).toBeVisible();
  await expect(scene.getByRole('columnheader')).toHaveCount(8);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/presentation?scene=5');
  const mobile = page.locator('[data-scene="5"]');
  const groups = mobile.locator('.dv__groups:visible');
  await expect(groups).toHaveCount(1);
  await expect(mobile.locator('.dv-record:visible')).toHaveCount(0);
  const table = groups.getByRole('tabpanel').getByRole('table');
  const headers = await table.getByRole('columnheader').allTextContents();
  expect(headers.slice(0, 2)).toEqual(['ID_EMPLEADO', 'NOMBRE']);
  expect(headers.length).toBeLessThanOrEqual(4);
  await expect(table.locator('tbody tr').first()).toContainText('Ana');
});

test('en el Estudio la tabla de origen cabe entera junto a la columna pedida', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/learn/select');
  const source = page.getByRole('table', { name: 'Tabla EMPLEADOS de origen' });
  await expect(source).toBeVisible();
  await source.scrollIntoViewIfNeeded();
  // CORREO es la columna que pide el ejemplo: antes quedaba oculta tras una barra.
  await expect(source.getByRole('columnheader', { name: /CORREO/ })).toBeInViewport();
  const scroll = await source.evaluate((table) => {
    const region = table.closest('.dv__table')!;
    return region.scrollWidth - region.clientWidth;
  });
  expect(scroll).toBeLessThanOrEqual(1);
});

test('NULL es una insignia con texto accesible en todas las vistas', async ({ page }) => {
  await page.goto('/presentation?scene=19');
  const nulls = page.locator('[data-scene="19"] .dv-null');
  await expect(nulls.first()).toBeVisible();
  await expect(nulls.first()).toContainText('NULL');
  await expect(nulls.first().locator('.visually-hidden')).toHaveText(' (valor nulo)');
});
