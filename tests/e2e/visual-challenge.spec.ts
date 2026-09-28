import { expect, test, type Page } from '@playwright/test';
import { addPiece, expectCorrect, openMission, startChallenge, submit } from './challenge-helpers';
import { attachShot, expectNoHorizontalScroll } from './support/layout';

/**
 * Regresión visual del Challenge: cada misión razona sobre una muestra de trabajo (hasta 8
 * registros y 3–4 columnas), siempre como tabla; nunca 20 × 12 por defecto, nunca una
 * columna interminable de fichas y nunca barra horizontal de página.
 */

const TITLES = [
  'Columnas a la vista',
  'El orden de SQL',
  '¿Qué trae el asterisco?',
  'Predice las filas',
  'Expresiones y precedencia',
  'Encabezados con AS',
  'Valores únicos con DISTINCT',
  'Detecta el error',
  'Del lenguaje al SQL',
  'Final Boss: Query Master',
];

/** Tablas visibles de la misión: filas y columnas máximas, y fichas por registro. */
async function visibleData(page: Page) {
  return page.locator('.ch-mission').evaluate((mission) => {
    const shown = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const tables = [...mission.querySelectorAll('table')].filter(shown);
    return {
      rows: Math.max(0, ...tables.map((table) => table.querySelectorAll('tbody tr').length)),
      columns: Math.max(0, ...tables.map((table) => table.querySelectorAll('thead th').length)),
      records: [...mission.querySelectorAll('.dv-record')].filter(shown).length,
      tiny: [...mission.querySelectorAll('td, th, p, label, button')]
        .filter(shown)
        .filter((element) => parseFloat(getComputedStyle(element).fontSize) < 12).length,
    };
  });
}

for (const [width, height] of [
  [1920, 1080],
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [820, 1180],
  [768, 1024],
  [430, 932],
  [390, 844],
  [360, 800],
  [320, 568],
] as const) {
  test(`las diez misiones a ${width}px: muestra de trabajo tabular y sin barra horizontal`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height });
    await startChallenge(page);
    for (const [index, title] of TITLES.entries()) {
      const order = index + 1;
      if (order > 1) await openMission(page, order, title);
      const label = `M${String(order).padStart(2, '0')} a ${width}`;
      await expectNoHorizontalScroll(page, label);
      const data = await visibleData(page);
      expect(data.rows, `${label}: registros de trabajo`).toBeLessThanOrEqual(8);
      // En la tabla de selección de M04 la primera columna es la casilla.
      const limit = width < 768 ? (order === 4 ? 5 : 4) : 5;
      expect(data.columns, `${label}: columnas a la vez`).toBeLessThanOrEqual(limit);
      expect(data.records, `${label}: fichas por registro`).toBe(0);
      expect(data.tiny, `${label}: texto de menos de 12 px`).toBe(0);
      // El dataset completo es secundario: un enlace, no una tabla abierta.
      await expect(
        page.getByRole('button', { name: 'Consultar dataset EMPLEADOS completo' }),
      ).toBeVisible();
      if (width === 1366 && order < 10) {
        // La tarea se resuelve en poco recorrido.
        const submitTop = await page
          .getByRole('button', { name: /^Comprobar/ })
          .evaluate((button) => button.getBoundingClientRect().top + window.scrollY);
        expect(submitTop, `${label}: recorrido hasta Comprobar`).toBeLessThanOrEqual(height * 2.2);
      }
      if ((order === 1 || order === 4 || order === 8) && (width === 1366 || width === 390)) {
        await attachShot(
          page,
          testInfo,
          `challenge-m${String(order).padStart(2, '0')}-${width}`,
          true,
        );
      }
    }
  });
}

test('el dataset completo sigue disponible con sus 20 registros, como tabla', async ({ page }) => {
  await startChallenge(page);
  await openMission(page, 10, 'Final Boss: Query Master');
  await page.getByRole('button', { name: 'Consultar dataset EMPLEADOS completo' }).click();
  const dialog = page.getByRole('dialog', { name: 'Dataset EMPLEADOS completo' });
  const table = dialog.locator('.dv__table:visible').first();
  await expect(table.locator('tbody tr')).toHaveCount(20);
  await expect(dialog.locator('.dv-record:visible')).toHaveCount(0);
});

test('en el móvil el dataset completo se consulta por grupos de como mucho cuatro columnas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startChallenge(page);
  await page.getByRole('button', { name: 'Consultar dataset EMPLEADOS completo' }).click();
  const dialog = page.getByRole('dialog', { name: 'Dataset EMPLEADOS completo' });
  const tabs = dialog.getByRole('tab');
  await expect(tabs).toHaveText([
    'Identidad',
    'Organización',
    'Compensación',
    'Empleo',
    'Contacto y jefe',
  ]);
  await tabs.nth(2).click();
  const panel = dialog.getByRole('tabpanel', { name: 'Compensación' });
  await expect(panel.getByRole('columnheader')).toHaveText([
    'ID_EMPLEADO',
    'NOMBRE',
    'SALARIO',
    'BONO',
  ]);
  await expect(panel.locator('tbody tr')).toHaveCount(20);
  await expectNoHorizontalScroll(page, 'dataset completo en el móvil');
});

test('M04: al acertar, las filas conservadas se resaltan y las descartadas se atenúan', async ({
  page,
}) => {
  await startChallenge(page);
  await openMission(page, 4, 'Predice las filas');
  await expect(page.getByText(/Muestra de trabajo: 8 registros · 4 columnas/)).toBeVisible();
  // Antes de responder no se revela qué filas cumplen.
  await expect(page.locator('.ch-pick__state')).toHaveCount(0);
  for (const name of ['Jorge (ID 4)', 'Valentina (ID 11)', 'Julián (ID 16)']) {
    await page.getByLabel(`Incluir a ${name}`).check();
  }
  for (const piece of ['WHERE', 'ciudad', '=', "'Cali'"]) await addPiece(page, piece);
  await submit(page);
  await expectCorrect(page);
  await expect(page.locator('.ch-pick__state--kept')).toHaveCount(3);
  await expect(page.locator('.ch-pick__state--discarded')).toHaveCount(5);
  await expect(page.getByRole('status').filter({ hasText: 'Correcto' }).first()).toContainText(
    'WHERE selecciona FILAS',
  );
});

test('un error se explica: tipo, qué está bien, qué revisar y una pista conceptual', async ({
  page,
}) => {
  await startChallenge(page);
  for (const piece of ['nombre', 'ciudad']) await addPiece(page, piece);
  await submit(page);
  const feedback = page.locator('.ch-outcome');
  await expect(feedback).toContainText('Tipo de error: Columnas');
  await expect(feedback).toContainText('Qué está bien');
  await expect(feedback).toContainText('Seleccionaste NOMBRE y CIUDAD correctamente.');
  await expect(feedback).toContainText('Qué debes revisar');
  await expect(feedback).toContainText('El pedido también necesita CORREO.');
  await expect(feedback).toContainText('Pista conceptual');
});
