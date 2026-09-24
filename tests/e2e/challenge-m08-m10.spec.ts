import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  expectFeedback,
  mapScore,
  mouseDrag,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';

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
    await expect(page.getByText(/Oracle interpreta SELECT nombre salario/)).toBeVisible();
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

  test('M10 queda bloqueada sin Oracle y no simula la corrección', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 10, 'Final Boss: Query Master');
    await expect(page.getByText('Misión pendiente del servicio Oracle')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Comprobar/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Omitir por ahora' }).click();
    await page.getByRole('button', { name: 'Omitir con cero puntos' }).click();
    await expect(page.getByText('Omitida', { exact: true }).first()).toBeVisible();
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
      'Oracle interpreta SELECT nombre salario',
      'Cada dato mencionado en el pedido es una columna',
    ];
    for (const source of sources) {
      const body = await (await request.get(source)).text();
      for (const secret of secrets) expect(body, source).not.toContain(secret);
    }
  });
});
