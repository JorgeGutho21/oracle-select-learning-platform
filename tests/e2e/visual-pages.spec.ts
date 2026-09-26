import { expect, test } from '@playwright/test';
import { attachShot, expectNoHorizontalScroll, watchConsole } from './support/layout';

/**
 * Regresión visual de Home, Estudio, Laboratorio, Recursos y Ruta: ninguna tabla, código ni
 * región educativa necesita barra horizontal, en escritorio, tableta y móvil (incluido
 * 320 px). Las capturas completas se adjuntan al informe para la revisión humana.
 */

const PAGES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['learn-select', '/learn/select'],
  ['learn-where', '/learn/where'],
  ['learn-empleados', '/learn/empleados'],
  ['learn-distinct', '/learn/distinct'],
  ['lab', '/lab'],
  ['resources', '/resources'],
  ['modules', '/modules'],
] as const;

for (const [width, height] of [
  [1366, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
] as const) {
  test(`páginas sin desplazamiento horizontal a ${width}×${height}`, async ({ page }, testInfo) => {
    test.setTimeout(PAGES.length * 12_000);
    const problems = watchConsole(page);
    await page.setViewportSize({ width, height });
    for (const [name, url] of PAGES) {
      await page.goto(url);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expectNoHorizontalScroll(page, `${url} a ${width}`);
      await attachShot(page, testInfo, `${name}-${width}`, true);
    }
    expect(problems).toEqual([]);
  });
}

test('el laboratorio muestra primero el editor y el resultado', async ({ page }) => {
  await page.goto('/lab');
  const headings = page.locator('.lab-panel__title');
  await expect(headings).toHaveText([
    /Editor SQL/,
    /Resultado/,
    /Diagnóstico/,
    /En lenguaje cotidiano/,
    /Anatomía de la consulta/,
    /Esquema disponible/,
  ]);
  // Los 20 registros no ocupan la pantalla: se abren solo si se piden.
  await expect(page.getByText('Ver los 20 registros')).toBeVisible();
  await expect(page.getByRole('table', { name: /Tabla EMPLEADOS · 20 filas/ })).toBeHidden();
  await page.getByText('Ver los 20 registros').click();
  await expect(page.getByRole('button', { name: 'Resumen' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('un resultado de 12 columnas se lee sin barra horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/lab?sql=SELECT+*+FROM+empleados%3B');
  await expect(page.locator('.deck, .lab-page').first()).toBeVisible();
  await page.getByRole('button', { name: 'Analizar' }).click();
  const result = page.getByRole('region', { name: 'Resultado' });
  // Sin espacio para 12 columnas, cada fila pasa a ser una ficha con sus campos agrupados.
  await expect(result.locator('.dv-record').first()).toBeVisible();
  await expect(result.locator('.dv-record').first()).toContainText('Ana Rojas');
  await expectNoHorizontalScroll(page, 'resultado de SELECT *');
});
