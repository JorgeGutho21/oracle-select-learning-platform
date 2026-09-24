import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  expectFeedback,
  mapScore,
  fillEditor,
  mouseDrag,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

async function solveM01(page: import('@playwright/test').Page) {
  await addPiece(page, 'nombre');
  await addPiece(page, 'salario');
  await submit(page);
  await expectCorrect(page);
}

test.describe('Challenge M08–M10 y resultados', () => {
  test('M08: localizar la coma ausente con un hueco interactivo', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 8, 'Detecta el error');
    await page.getByRole('button', { name: 'Hueco entre SELECT y nombre' }).click();
    await submit(page);
    await expectFeedback(page, 'sigue sin cumplir el pedido');
    await page.getByRole('button', { name: 'Hueco entre nombre y salario' }).click();
    await expect(page.getByText('Insertarás «,» entre nombre y salario.')).toBeVisible();
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText(/Oracle lee salario como un alias de NOMBRE/)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('M09: bloques con distractores, corregidos por resultado y no por texto', async ({
    page,
  }) => {
    await startChallenge(page);
    await openMission(page, 9, 'Del lenguaje al SQL');
    await mouseDrag(
      page,
      page.getByRole('button', { name: 'Añadir SELECT', exact: true }),
      page.locator('.ch-zone--target'),
    );
    await expect(page.getByRole('button', { name: 'SELECT, posición 1' })).toBeVisible();
    for (const piece of ['nombre', 'ciudad', ',', 'salario', 'FROM', 'empleados']) {
      await addPiece(page, piece);
    }
    await submit(page);
    await expectFeedback(page, 'Oracle lee ciudad como un alias');
    await addPiece(page, ',');
    await page.getByRole('button', { name: ', posición 8' }).click();
    for (let step = 0; step < 5; step++) {
      await page.getByRole('button', { name: /Mover antes/ }).click();
    }
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
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
      'SELECT nombre, ciudad,\n  (salario + 100000) * 12 AS proyeccion_anual\nFROM empleados;',
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

  test('G15: los recursos enviados al navegador no contienen pistas ni explicaciones', async ({
    page,
    request,
  }) => {
    await startChallenge(page);
    const sources = await page.$$eval('script[src]', (scripts) =>
      scripts.map((script) => (script as HTMLScriptElement).src),
    );
    expect(sources.length).toBeGreaterThan(0);
    const secrets = [
      'El pedido menciona dos datos de cada empleado',
      'se obtienen las dos columnas pedidas',
      'Calcula primero el nuevo salario mensual',
      'Cada dato mencionado en el pedido es una columna',
    ];
    for (const source of sources) {
      const body = await (await request.get(source)).text();
      for (const secret of secrets) expect(body, source).not.toContain(secret);
    }
  });
});
