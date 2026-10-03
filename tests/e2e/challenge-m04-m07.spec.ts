import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  expectFeedback,
  mapScore,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';

test.describe('Challenge M04–M07', () => {
  test('M04: marcar filas, construir WHERE y comparar antes y después', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 4, 'Predice las filas');
    const picker = page.getByRole('table', { name: /¿Qué filas cumplirán la condición\?/ });
    await expect(picker.locator('tbody tr')).toHaveCount(8);
    // Toda la fila se puede tocar; la casilla sigue siendo el control accesible.
    await picker.locator('tbody tr').filter({ hasText: 'Valentina' }).click();
    await expect(page.getByLabel('Incluir a Valentina (ID 11)')).toBeChecked();
    for (const name of ['Jorge (ID 4)', 'Ana (ID 1)'])
      await page.getByLabel(`Incluir a ${name}`).check();
    for (const piece of ['WHERE', 'ciudad', '=', "'Cali'"]) await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'Sobran filas: Ana no trabaja en Cali');
    await expect(page.locator('.ch-outcome')).toContainText('La condición de WHERE es correcta.');
    await page.getByLabel('Incluir a Ana (ID 1)').uncheck();
    await page.getByLabel('Incluir a Julián (ID 16)').check();
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
    // Al cerrar: filas conservadas y descartadas, y el resultado con menos filas.
    await expect(page.locator('tr.is-kept')).toHaveCount(3);
    await expect(page.locator('tr.is-discarded')).toHaveCount(5);
    await expect(page.locator('.change-summary')).toContainText(/Filas 8 →\s*pasan a 3 filas/);
    const after = page.getByRole('table', { name: 'Resultado de la consulta sobre la muestra' });
    await expect(after.getByRole('columnheader')).toHaveText(['NOMBRE', 'CIUDAD', 'SALARIO']);
    await expect(after.locator('tbody tr')).toHaveCount(3);
  });

  test('M04: el texto sin comillas se explica', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 4, 'Predice las filas');
    for (const name of ['Jorge (ID 4)', 'Valentina (ID 11)', 'Julián (ID 16)'])
      await page.getByLabel(`Incluir a ${name}`).check();
    for (const piece of ['WHERE', 'ciudad', '=', 'Cali']) await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'va entre comillas simples');
    await expect(page.locator('.ch-outcome')).toContainText(
      'Marcaste exactamente las 3 filas de Cali',
    );
  });

  test('M05: predecir con y sin paréntesis y construir la expresión pedida', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 5, 'Expresiones y precedencia');
    await page.getByLabel('Valor de salario + bono * 12 para Ana').fill('118800000');
    await page.getByLabel('Valor de (salario + bono) * 12 para Ana').fill('118.800.000');
    for (const piece of ['salario', '+', 'bono', '*', '12']) await addPiece(page, piece);
    // El orden de cálculo se ve sin valores: primero la multiplicación.
    await expect(page.locator('.ch-steps li')).toHaveText(['bono * 12', 'salario + ①']);
    await submit(page);
    await expectFeedback(page, 'sin paréntesis, ¿qué operación hace Oracle primero?');
    await page.getByLabel('Valor de salario + bono * 12 para Ana').fill('19800000');
    for (let index = 0; index < 5; index++) {
      await page.locator('.ch-zone--target .ch-piece').first().click();
      await page.getByRole('button', { name: 'Quitar' }).click();
    }
    for (const piece of ['(', 'salario', '+', 'bono', ')', '*', '12']) await addPiece(page, piece);
    await expect(page.locator('.ch-steps li')).toHaveText(['salario + bono', '① * 12']);
    await submit(page);
    await expectCorrect(page);
    const compared = page.getByRole('table', { name: 'Las dos expresiones sobre la muestra' });
    await expect(compared.locator('tbody tr')).toHaveCount(4);
  });

  test('M06: AS cambia solo el encabezado; las comillas simples no nombran', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 6, 'Encabezados con AS');
    const before = page.getByRole('table', { name: 'Resultado sin alias sobre la muestra' });
    await expect(before.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO*12']);
    for (const piece of [
      'SELECT',
      'nombre',
      ',',
      'salario * 12',
      'AS',
      "'salario_anual'",
      'FROM',
      'empleados',
    ])
      await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'comillas simples es un texto, no un nombre');
    await page.getByRole('button', { name: "'salario_anual', posición 6" }).click();
    await page.getByRole('button', { name: 'Quitar' }).click();
    await addPiece(page, 'salario_anual');
    await page.getByRole('button', { name: 'salario_anual, posición 8' }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    const after = page.getByRole('table', { name: 'Resultado de tu consulta sobre la muestra' });
    await expect(after.getByRole('columnheader')).toHaveText(['NOMBRE', /SALARIO_ANUAL/]);
    // Mismos valores antes y después: solo cambia el encabezado.
    await expect(after.locator('tbody tr').first()).toHaveText(
      (await before.locator('tbody tr').first().textContent())!,
    );
    await submit(page);
    await expectCorrect(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('M07: DISTINCT con una columna y con el par completo', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 7, 'Valores únicos con DISTINCT');
    const sample = page.getByRole('table', { name: /Analistas de EMPLEADOS/ });
    await expect(sample.locator('tbody tr')).toHaveCount(6);
    for (const city of ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'])
      await page.getByRole('button', { name: city, exact: true }).click();
    await page.getByLabel(/Mini reto/).fill('3');
    await submit(page);
    await expectFeedback(page, 'Barranquilla no aparece entre los analistas');
    await page.getByRole('button', { name: 'Barranquilla', exact: true }).click();
    await page.getByLabel(/Mini reto/).fill('6');
    await submit(page);
    await expectCorrect(page);
    // Antes (con las repetidas marcadas) y después, con una columna y con el par.
    await expect(
      page
        .getByRole('table', { name: 'Ciudades de los analistas, sin DISTINCT' })
        .getByText('repetida'),
    ).toHaveCount(3);
    await expect(
      page
        .getByRole('table', { name: 'Ciudades de los analistas, con DISTINCT' })
        .locator('tbody tr'),
    ).toHaveCount(3);
    await expect(
      page.getByRole('table', { name: 'Pares con DISTINCT' }).locator('tbody tr'),
    ).toHaveCount(6);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
