import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  expectFeedback,
  fillEditor,
  mapScore,
  mouseDrag,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

async function solveM01(page: Page) {
  for (const name of ['nombre', 'ciudad', 'correo']) await addPiece(page, name);
  await submit(page);
  await expectCorrect(page);
}

/** Respuesta de cada variante de M08: tipo, pieza con el error y consulta corregida. */
const M08: Record<string, { kind: RegExp; token: number; fix: string; request: RegExp }> = {
  coma: {
    kind: /^Concepto/,
    token: 2,
    fix: 'SELECT nombre, salario FROM empleados;',
    request: /nombre y el salario/,
  },
  from: {
    kind: /^Sintaxis/,
    token: 4,
    fix: 'SELECT nombre, ciudad FROM empleados;',
    request: /nombre y la ciudad/,
  },
  comillas: {
    kind: /^Semántica/,
    token: 7,
    fix: "SELECT nombre FROM empleados WHERE ciudad = 'Cali';",
    request: /empleados de Cali\./,
  },
  'doble-coma': {
    kind: /^Sintaxis/,
    token: 3,
    fix: 'SELECT nombre, cargo, ciudad FROM empleados;',
    request: /el cargo y la ciudad/,
  },
  parentesis: {
    kind: /^Sintaxis/,
    token: 6,
    fix: 'SELECT nombre, (salario + bono) * 12 FROM empleados;',
    request: /ingreso anual/,
  },
  'igual-null': {
    kind: /^Concepto/,
    token: 7,
    fix: 'SELECT nombre FROM empleados WHERE bono IS NULL;',
    request: /bono registrado/,
  },
  in: {
    kind: /^Sintaxis/,
    token: 6,
    fix: "SELECT nombre FROM empleados WHERE ciudad IN ('Cali', 'Medellín');",
    request: /Cali o de Medellín/,
  },
  distinct: {
    kind: /^Sintaxis/,
    token: 2,
    fix: 'SELECT DISTINCT ciudad FROM empleados;',
    request: /una sola vez/,
  },
};

test.describe('Challenge M08–M10 y resultados', () => {
  test('M08: clasificar el error, tocar dónde está y corregir la consulta', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 8, 'Detecta el error');
    const variant = await page.locator('[data-variant]').getAttribute('data-variant');
    const answer = M08[variant!]!;
    await expect(page.locator('.ch-request')).toContainText(answer.request);
    // Primer intento: tipo equivocado. La orientación no revela el tipo.
    const wrongKind = answer.kind.source.includes('Sintaxis') ? /^Concepto/ : /^Sintaxis/;
    await page.getByRole('radio', { name: wrongKind }).check();
    await page.locator('.ch-hotspot button').nth(answer.token).click();
    await page.getByLabel('Paso 3 · Escribe la consulta corregida').fill(answer.fix);
    await page.getByRole('button', { name: 'Probar la corrección (sin puntuar)' }).click();
    await expect(page.getByRole('table', { name: 'Qué devuelve tu corrección' })).toBeVisible();
    await submit(page);
    await expectFeedback(page, '¿Oracle podría leer esta consulta?');
    await expect(page.locator('.ch-outcome')).toContainText(
      'Localizaste bien la parte con el error.',
    );
    await page.getByRole('radio', { name: answer.kind }).check();
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('M08: una corrección sin cambios no consume intento', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 8, 'Detecta el error');
    await page.getByRole('radio', { name: /^Sintaxis/ }).check();
    await page.locator('.ch-hotspot button').first().click();
    await submit(page);
    await expect(
      page.getByRole('status').filter({ hasText: 'todavía es igual a la original' }),
    ).toBeVisible();
    await expect(page.getByText('Intento 1 de 2')).toBeVisible();
  });

  test('M09: bloques con distractores; AND frente a OR y el orden pedido', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 9, 'Del lenguaje al SQL');
    const sample = page.getByRole('table', { name: /^Muestra de trabajo/ });
    await expect(sample.locator('tbody tr')).toHaveCount(8);
    await mouseDrag(
      page,
      page.getByRole('button', { name: 'Añadir SELECT', exact: true }),
      page.locator('.ch-zone--target'),
    );
    await expect(page.getByRole('button', { name: 'SELECT, posición 1' })).toBeVisible();
    const select = [
      'nombre',
      ',',
      'ciudad',
      ',',
      'salario',
      'FROM',
      'empleados',
      'WHERE',
      'ciudad',
      'IN',
      "('Bogotá', 'Cali')",
    ];
    for (const piece of select) await addPiece(page, piece);
    for (const piece of ['OR', 'salario', '>=', '4200000', 'ORDER BY', 'salario', 'DESC'])
      await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'Sobran empleados de otras ciudades');
    await page.getByRole('button', { name: 'OR, posición 13' }).click();
    await page.getByRole('button', { name: 'Quitar' }).click();
    await addPiece(page, 'AND');
    // AND queda al final: se lleva a la posición de OR (13) con «Mover antes».
    await page.getByRole('button', { name: 'AND, posición 19' }).click();
    for (let index = 0; index < 6; index++) {
      await page.getByRole('button', { name: /Mover antes/ }).click();
    }
    await expect(page.getByRole('button', { name: 'AND, posición 13' })).toBeVisible();
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
    // Al cerrar se ve qué devuelve la consulta sobre la muestra.
    await expect(
      page.getByRole('table', { name: /^Resultado de tu consulta/ }).locator('tbody tr'),
    ).toHaveCount(4);
  });

  test('M10: revisión sin puntuar, intento por SQL que no cumple y corrección final en Oracle', async ({
    page,
  }) => {
    await startChallenge(page);
    await openMission(page, 10, 'Final Boss: Query Master');
    const editor = page.getByRole('textbox', { name: 'Tu consulta para el reto final' });
    await fillEditor(editor, 'SELECT nombre,\nFROM empleados');
    await page.getByRole('button', { name: 'Revisar sintaxis (sin puntuar)' }).click();
    await expect(page.getByText('Falta una columna o expresión después de la coma.')).toBeVisible();
    await expect(page.getByText('Intento 1 de 2')).toBeVisible();

    await fillEditor(editor, 'SELECT nombre FROM empleados');
    await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
    await expectFeedback(page, 'tres columnas');
    await expect(page.getByText('Intento 2 de 2')).toBeVisible();

    await fillEditor(
      editor,
      "SELECT nombre, ciudad,\n  (salario + 100000) * 12 AS proyeccion_anual\nFROM empleados\nWHERE estado = 'ACTIVO' AND ciudad IN ('Bogotá', 'Cali')\nORDER BY proyeccion_anual DESC;",
    );
    await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
    if (ORACLE_CONFIGURED) {
      // Corrección real: Oracle ejecuta la consulta y la salida se compara con la esperada.
      await expectCorrect(page);
      await expect(page.getByText('Resuelta', { exact: true }).first()).toBeVisible();
      await expect(mapScore(page)).toContainText('80');
    } else {
      // Sin Oracle no se simula: fallo técnico que no consume intento.
      await expect(
        page.getByRole('status').filter({ hasText: 'Servicio no disponible' }),
      ).toContainText('No se consumió ningún intento');
      await expect(page.getByText('Intento 2 de 2')).toBeVisible();
      await expect(page.getByText('Resuelta', { exact: true })).toHaveCount(0);
    }
  });

  test('la pantalla final resume puntuación, precisión, tiempo, intentos y pistas y permite reiniciar', async ({
    page,
  }) => {
    await startChallenge(page);
    await solveM01(page);
    await page.getByRole('button', { name: 'Terminar y ver resultados' }).click();
    await page
      .getByRole('dialog', { name: '¿Terminar la práctica?' })
      .getByRole('button', { name: 'Terminar y ver resultados' })
      .click();
    const summary = page.getByRole('region', { name: 'Resultado del Challenge' });
    await expect(summary).toBeVisible();
    for (const [label, value] of [
      ['Puntuación', '100 / 1000'],
      ['Precisión', '100 %'],
      ['Intentos puntuados', '1'],
      ['Pistas usadas', '0'],
      ['Misiones resueltas', '1 de 10'],
    ]) {
      await expect(summary.locator('.ch-stat').filter({ hasText: label! })).toContainText(value!);
    }
    await expect(summary.locator('.ch-stat').filter({ hasText: 'Tiempo activo' })).toContainText(
      /\d\d:\d\d/,
    );
    await expect(
      summary.getByRole('table', { name: 'Resumen por misión' }).locator('tbody tr'),
    ).toHaveCount(10);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({
      path: 'output/playwright/challenge-summary-desktop.png',
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Reiniciar práctica' }).click();
    await page.getByRole('button', { name: 'Reiniciar desde cero' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Columnas a la vista' }),
    ).toBeVisible();
    await expect(mapScore(page)).toContainText('0 / 1000');
  });

  test('la partida se recupera tras recargar sin puntos adicionales (U07)', async ({ page }) => {
    await startChallenge(page);
    await solveM01(page);
    await page.getByRole('button', { name: 'Siguiente misión' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'El orden de SQL' })).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('Recuperamos tu práctica guardada en este navegador.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'El orden de SQL' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Misión 1: .*Resuelta, 100 puntos/ }),
    ).toBeVisible();
    await expect(mapScore(page)).toContainText('100 / 1000');
  });

  test('G15: los recursos enviados al navegador no contienen pistas, explicaciones ni correcciones', async ({
    page,
    request,
  }) => {
    await startChallenge(page);
    const sources = await page.$$eval('script[src]', (scripts) =>
      scripts.map((script) => (script as HTMLScriptElement).src),
    );
    expect(sources.length).toBeGreaterThan(0);
    const secrets = [
      'El pedido nombra tres datos, en un orden',
      'SALARIO y BONO siguen en la tabla',
      'Filtra primero las filas: activos',
      'Cada dato mencionado es una columna, en ese orden',
      'SELECT nombre FROM empleados WHERE bono IS NULL',
      'Oracle la ejecuta, pero una comparación con = NULL',
    ];
    for (const source of sources) {
      const body = await (await request.get(source)).text();
      for (const secret of secrets) expect(body, source).not.toContain(secret);
    }
  });
});
