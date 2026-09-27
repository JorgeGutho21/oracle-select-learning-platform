import { expect, test } from '@playwright/test';

/**
 * Vista de datos adaptable: los mismos datos cambian de representación según el espacio.
 * Con espacio, tabla; sin él, fichas por registro. Nunca una tabla comprimida ni una barra
 * horizontal como experiencia principal.
 */

test('EMPLEADOS completa: tabla en escritorio ancho, fichas en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/presentation?scene=4');
  const scene = page.locator('[data-scene="4"]');
  await expect(scene.getByRole('table')).toBeVisible();
  await expect(scene.getByRole('columnheader')).toHaveCount(8);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/presentation?scene=4');
  const mobile = page.locator('[data-scene="4"]');
  await expect(mobile.getByRole('table')).toBeHidden();
  const cards = mobile.getByRole('list', { name: /Primeras filas de EMPLEADOS/ });
  await expect(cards.getByRole('listitem')).toHaveCount(3);
  await expect(cards.getByRole('listitem').first()).toContainText('Ana Rojas');
  await expect(cards.getByRole('listitem').first()).toContainText('ACTIVO');
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
  await page.goto('/presentation?scene=18');
  const nulls = page.locator('[data-scene="18"] .dv-null');
  await expect(nulls.first()).toBeVisible();
  await expect(nulls.first()).toContainText('NULL');
  await expect(nulls.first().locator('.visually-hidden')).toHaveText(' (valor nulo)');
});
