import { expect, test, type Page } from '@playwright/test';
import { addPiece, expectCorrect, openMission, startChallenge, submit } from './challenge-helpers';
import { attachShot, expectNoHorizontalScroll } from './support/layout';

/**
 * Regresión visual del Challenge (addendum pedagógico): cada misión muestra solo los datos
 * que necesita, sin tablas enormes ni barra horizontal, y la tarea cabe en poco recorrido.
 */

const TITLES = [
  'Columnas a la vista',
  'El orden de SQL',
  '¿Qué trae el asterisco?',
  'Predice las filas',
  'Columnas calculadas',
  'Encabezados con AS',
  'Valores únicos con DISTINCT',
  'Detecta el error',
  'Del lenguaje al SQL',
  'Final Boss: Query Master',
];

/** Celdas de datos visibles (tabla o fichas) y columnas de la tabla visible más ancha. */
async function visibleData(page: Page) {
  return page.locator('.ch-mission').evaluate((mission) => {
    const shown = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && !element.closest('details:not([open])');
    };
    const cells = [...mission.querySelectorAll('td, .dv-field')].filter(shown).length;
    const widest = Math.max(
      0,
      ...[...mission.querySelectorAll('table')]
        .filter(shown)
        .map((table) => table.querySelectorAll('thead th').length),
    );
    return { cells, widest };
  });
}

for (const [width, height] of [
  [1366, 768],
  [390, 844],
  [320, 568],
] as const) {
  test(`las diez misiones a ${width}px: datos relevantes y sin barra horizontal`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await startChallenge(page);
    for (const [index, title] of TITLES.entries()) {
      const order = index + 1;
      if (order > 1) await openMission(page, order, title);
      const label = `M${String(order).padStart(2, '0')} a ${width}`;
      await expectNoHorizontalScroll(page, label);
      const data = await visibleData(page);
      // Nunca 20 × 12 por defecto: como mucho una vista previa de 8 filas × 5 columnas.
      expect(data.cells, `${label}: celdas visibles`).toBeLessThanOrEqual(60);
      expect(data.widest, `${label}: columnas de la tabla visible`).toBeLessThanOrEqual(7);
      // La tabla completa es consulta secundaria y está plegada.
      await expect(page.locator('.ch-data__more').first()).not.toHaveAttribute('open', '');
      await expect(page.getByText('Desplaza la tabla horizontalmente')).toHaveCount(0);
      if (width === 1366 && order < 10) {
        // La tarea se resuelve en una pantalla y media como mucho.
        const submitTop = await page
          .getByRole('button', { name: /^Comprobar/ })
          .evaluate((button) => button.getBoundingClientRect().top + window.scrollY);
        expect(submitTop, `${label}: recorrido hasta Comprobar`).toBeLessThanOrEqual(height * 2);
      }
      if (order === 1 || order === 4 || order === 10) {
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

test('la tabla completa sigue disponible con sus 20 registros', async ({ page }) => {
  await startChallenge(page);
  await openMission(page, 10, 'Final Boss: Query Master');
  const more = page.locator('.ch-data__more');
  await more.getByText('Ver tabla completa').click();
  // Una tabla (o sus bandas, cada una con las 20 filas y ID_EMPLEADO), nunca fichas.
  const first = more.locator('.dv__table:visible').first();
  await expect(first.locator('tbody tr')).toHaveCount(20);
  await expect(more.locator('.dv-record:visible')).toHaveCount(0);
});

test('M04: al acertar, cada fila de la muestra explica si cumple la condición', async ({
  page,
}) => {
  await startChallenge(page);
  await openMission(page, 4, 'Predice las filas');
  await expect(page.getByText('Muestra de 10 de 20 registros')).toBeVisible();
  // Antes de responder no se revela qué filas cumplen.
  await expect(page.locator('.ch-pick__state')).toHaveCount(0);
  await addPiece(page, 'NOMBRE');
  await addPiece(page, 'SALARIO');
  for (const name of ['Jorge', 'Oscar', 'Valentina', 'Camila', 'Julián']) {
    await page.getByLabel(`Incluir a ${name}`).check();
  }
  await submit(page);
  await expectCorrect(page);
  await expect(page.locator('.ch-pick__state--kept')).toHaveCount(5);
  await expect(page.locator('.ch-pick__state--discarded')).toHaveCount(5);
  await expect(page.getByRole('status').filter({ hasText: 'Correcto' }).first()).toContainText(
    "WHERE ciudad = 'Cali'",
  );
});

test('un error se explica: tipo, qué está bien, qué ajustar y una pista', async ({ page }) => {
  await startChallenge(page);
  await addPiece(page, 'salario');
  await addPiece(page, 'nombre');
  await submit(page);
  const feedback = page.getByRole('alert').filter({ hasText: 'Revisa tu respuesta' });
  await expect(feedback).toContainText('Columnas');
  await expect(feedback).toContainText('Qué está bien');
  await expect(feedback).toContainText('Qué necesita ajuste');
  await expect(feedback).toContainText('Pista');
  await expect(feedback).toContainText('¿qué quiero mostrar?');
});
