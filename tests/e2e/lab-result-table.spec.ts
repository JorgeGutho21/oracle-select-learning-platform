import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll, watchConsole } from './support/layout';

/**
 * El resultado del laboratorio es una tabla SQL reconocible: las columnas y filas reales del
 * resultado, en una sola tabla en escritorio y, en tableta y móvil, por grupos de columnas
 * con pestañas (ID_EMPLEADO y NOMBRE en todos). Nunca fichas por empleado ni «Ver registro
 * completo».
 */

const panel = (page: Page) => page.getByRole('region', { name: 'Resultado' });

async function analyze(page: Page, sql: string) {
  await page.goto(`/lab?${new URLSearchParams({ sql }).toString()}`);
  await page.getByRole('button', { name: 'Analizar' }).click();
  return panel(page).getByRole('table', { name: /^Vista previa/ });
}

for (const [width, height] of [
  [1920, 1080],
  [1600, 900],
  [1440, 900],
  [1366, 768],
  [1280, 720],
] as const) {
  test(`a ${width}×${height} SELECT * es una tabla de 12 columnas sin barra`, async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width, height });
    const table = await analyze(page, 'SELECT *\nFROM empleados;');
    await expect(table).toHaveCount(1);
    await expect(table.getByRole('columnheader')).toHaveCount(12);
    await expect(table.locator('tbody tr')).toHaveCount(20);
    // Ni fichas por empleado ni enlaces a registros completos.
    await expect(panel(page).locator('.dv-record:visible')).toHaveCount(0);
    await expect(panel(page).getByText('Ver registro completo')).toHaveCount(0);
    const scroll = await table.evaluate((node) => {
      const region = node.closest('.dv__table')!;
      return region.scrollWidth - region.clientWidth;
    });
    expect(scroll, 'barra horizontal de la tabla').toBeLessThanOrEqual(0);
    await expectNoHorizontalScroll(page, `SELECT * a ${width}`);
    // El editor ocupa el ancho de la página y el resultado va debajo, con el mismo ancho.
    const editor = await page.getByRole('region', { name: 'Editor SQL' }).boundingBox();
    const result = await panel(page).boundingBox();
    expect(result!.y).toBeGreaterThan(editor!.y + editor!.height - 1);
    expect(Math.abs(result!.width - editor!.width)).toBeLessThanOrEqual(1);
    expect(problems).toEqual([]);
  });
}

for (const [width, height, parts, perTab] of [
  [1024, 768, 2, 8],
  [768, 1024, 3, 6],
  [430, 932, 5, 4],
  [390, 844, 5, 4],
  [360, 800, 5, 4],
  [320, 568, 5, 4],
] as const) {
  test(`a ${width}×${height} las 12 columnas se reparten en ${parts} grupos con pestañas`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await analyze(page, 'SELECT *\nFROM empleados;');
    const groups = panel(page).locator('.dv__groups:visible');
    await expect(groups).toHaveCount(1);
    const tabs = groups.getByRole('tab');
    await expect(tabs).toHaveCount(parts);
    const seen = new Set<string>();
    for (let index = 0; index < parts; index += 1) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
      const table = groups.getByRole('tabpanel').getByRole('table');
      const headers = await table.getByRole('columnheader').allTextContents();
      // Cada grupo es una tabla con ID_EMPLEADO (y NOMBRE) y las 20 filas.
      expect(headers[0]).toBe('ID_EMPLEADO');
      expect(headers[1]).toBe('NOMBRE');
      expect(headers.length, `${width}: columnas a la vez`).toBeLessThanOrEqual(perTab);
      await expect(table.locator('tbody tr')).toHaveCount(20);
      for (const header of headers) seen.add(header);
    }
    expect(seen.size, `${width}: columnas entre todos los grupos`).toBe(12);
    await expect(panel(page).locator('.dv-record:visible')).toHaveCount(0);
    await expectNoHorizontalScroll(page, `grupos a ${width}`);
    const scroll = await groups
      .getByRole('tabpanel')
      .locator('.dv__table')
      .evaluate((node) => node.scrollWidth - node.clientWidth);
    expect(scroll, 'barra horizontal del grupo').toBeLessThanOrEqual(0);
  });
}

test('las pestañas de grupos se recorren con el teclado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await analyze(page, 'SELECT *\nFROM empleados;');
  const tabs = panel(page).locator('.dv__groups:visible').getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
});

test('SELECT nombre, ciudad muestra exactamente esas dos columnas', async ({ page }) => {
  const table = await analyze(page, 'SELECT nombre, ciudad\nFROM empleados;');
  await expect(table.getByRole('columnheader')).toHaveText(['NOMBRE', 'CIUDAD']);
  await expect(table.locator('tbody tr')).toHaveCount(20);
});

test('WHERE reduce las filas y conserva las columnas pedidas en su orden', async ({ page }) => {
  const table = await analyze(
    page,
    "SELECT nombre, salario, departamento\nFROM empleados\nWHERE ciudad = 'Cali';",
  );
  await expect(table.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO', 'DEPARTAMENTO']);
  await expect(table.locator('tbody tr')).toHaveCount(5);
  await expect(panel(page).getByText('5 filas · 3 columnas')).toBeVisible();
});

test('ORDER BY conserva los encabezados e indica el sentido', async ({ page }) => {
  const table = await analyze(
    page,
    'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;',
  );
  await expect(table.getByRole('columnheader')).toHaveText(['NOMBRE', /^SALARIO/]);
  await expect(table.getByRole('columnheader', { name: /SALARIO/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expect(table.locator('tbody tr').first()).toContainText('Ana');
});

test('NULL se distingue de 0 en el resultado', async ({ page }) => {
  const table = await analyze(page, 'SELECT nombre, bono\nFROM empleados;');
  await expect(table.locator('.dv-null')).toHaveCount(6);
  const mario = table.locator('tbody tr').nth(9);
  await expect(mario).toContainText('Mario');
  await expect(mario.locator('.dv-null')).toHaveCount(0);
  await expect(mario.getByRole('cell').last()).toHaveText('0');
});
