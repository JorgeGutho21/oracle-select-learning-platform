import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll, watchConsole } from './support/layout';

/**
 * El resultado del laboratorio es una tabla SQL reconocible: las columnas y filas reales del
 * resultado, en una sola tabla en escritorio y en bandas con el número de empleado en
 * tableta y móvil. Nunca fichas por empleado ni «Ver registro completo».
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

test('en tableta y móvil las 12 columnas se reparten en bandas con la misma identidad de fila', async ({
  page,
}) => {
  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    await analyze(page, 'SELECT *\nFROM empleados;');
    const bands = panel(page).locator('.dv__bands:visible');
    await expect(bands, `${width}`).toHaveCount(1);
    const tables = bands.getByRole('table');
    const count = await tables.count();
    expect(count, `${width}: bandas`).toBeGreaterThanOrEqual(2);
    let columns = 0;
    for (let index = 0; index < count; index += 1) {
      const headers = tables.nth(index).getByRole('columnheader');
      // Cada banda empieza por ID_EMPLEADO y tiene las 20 filas.
      await expect(headers.first()).toHaveText('ID_EMPLEADO');
      await expect(tables.nth(index).locator('tbody tr')).toHaveCount(20);
      columns += (await headers.count()) - 1;
    }
    expect(columns + 1, `${width}: columnas`).toBe(12);
    await expect(panel(page).locator('.dv-record:visible')).toHaveCount(0);
    await expectNoHorizontalScroll(page, `bandas a ${width}`);
  }
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
