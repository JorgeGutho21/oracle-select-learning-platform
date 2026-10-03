import { expect, test } from '@playwright/test';
import { attachShot, expectNoHorizontalScroll, watchConsole } from './support/layout';

/**
 * Regresión visual de Home, Secciones, Estudio, Laboratorio, Recursos y Ruta: ninguna tabla, código ni
 * región educativa necesita barra horizontal, en escritorio, tableta y móvil (incluido
 * 320 px). Las capturas completas se adjuntan al informe para la revisión humana.
 */

const PAGES = [
  ['home', '/'],
  ['sections', '/sections'],
  ['section-1', '/sections/fundamentos-sql'],
  ['section-3', '/sections/plsql'],
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
  // Los 20 registros no ocupan la pantalla: se abren solo si se piden, y son los datos de
  // origen (no el resultado): una sola tabla de 12 columnas en escritorio.
  await expect(page.getByText('Ver los 20 registros')).toBeVisible();
  await expect(page.getByRole('table', { name: /Tabla EMPLEADOS · 20 filas/ })).toBeHidden();
  // Con la página hidratada (el editor solo existe en el cliente): WebKit ignora el clic en
  // un <details> antes de hidratar.
  await expect(page.locator('.cm-content[contenteditable="true"]')).toBeVisible();
  await page.getByText('Ver los 20 registros').click();
  await expect(page.getByText('No es el resultado de tu consulta')).toBeVisible();
  const source = page.getByRole('table', { name: /Tabla EMPLEADOS · 20 filas/ });
  await expect(source.getByRole('columnheader')).toHaveCount(12);
  await expect(source.locator('tbody tr')).toHaveCount(20);
});

test('SELECT * en el laboratorio es una sola tabla de 12 columnas, sin barra ni fichas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/lab?sql=SELECT+*+FROM+empleados%3B');
  await expect(page.locator('.lab-page')).toBeVisible();
  await page.getByRole('button', { name: 'Analizar' }).click();
  const result = page.getByRole('region', { name: 'Resultado' });
  const table = result.getByRole('table', { name: /Vista previa: 20 filas, 12 columnas/ });
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(12);
  await expect(table.locator('tbody tr')).toHaveCount(20);
  await expect(result.locator('.dv-record:visible')).toHaveCount(0);
  await expect(result.getByText('Ver registro completo')).toHaveCount(0);
  await expect(result.getByText('20 filas · 12 columnas')).toBeVisible();
  await expectNoHorizontalScroll(page, 'resultado de SELECT *');
});
