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

// Empleados de Cali en el dataset empleados-select-v2.
const cali = ['Jorge', 'Oscar', 'Valentina', 'Camila', 'Julián'];

test.describe('Challenge M04–M07', () => {
  test('M04: WHERE conserva las filas que cumplen y SELECT elige las columnas', async ({
    page,
  }) => {
    await startChallenge(page);
    await openMission(page, 4, 'Predice las filas');
    await addPiece(page, 'NOMBRE');
    await addPiece(page, 'SALARIO');
    for (const name of [...cali.slice(0, 3), 'Ana']) {
      await page.getByLabel(`Incluir a ${name}`).check();
    }
    await submit(page);
    await expectFeedback(page, 'Sobran filas: Ana no trabaja en Cali');
    await expect(page.getByText('Intento 2 de 2')).toBeVisible();
    await page.getByLabel('Incluir a Ana').uncheck();
    for (const name of cali.slice(3)) await page.getByLabel(`Incluir a ${name}`).check();
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
  });

  test('M05: la expresión calculada y sus valores por empleado', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 5, 'Columnas calculadas');
    await addPiece(page, 'salario');
    await addPiece(page, '*');
    await addPiece(page, '12');
    await page.getByLabel('Valor calculado para Ana').fill('108000000');
    await page.getByLabel('Valor calculado para Sofía').fill('3000000');
    await page.getByLabel('Valor calculado para Felipe').fill('25.200.000');
    await submit(page);
    await expectFeedback(page, 'revisa el valor calculado para Sofía');
    await page.getByLabel('Valor calculado para Sofía').fill('36000000');
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText(/La columna SALARIO de la tabla no cambia/)).toBeVisible();
  });

  test('M06: AS cambia el encabezado del resultado, no la tabla', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 6, 'Encabezados con AS');
    for (const piece of ['SELECT', 'nombre', ',', 'salario * 12', 'FROM', 'empleados']) {
      await addPiece(page, piece);
    }
    const result = page.getByRole('list', { name: 'Encabezados del resultado' });
    await expect(result).toContainText('SALARIO*12');
    await addPiece(page, 'AS salario_anual');
    await page.getByRole('button', { name: 'AS salario_anual, posición 7' }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    await expect(result).toContainText('SALARIO_ANUAL');
    await expect(page.getByRole('list', { name: 'Columnas de la tabla' })).toContainText('SALARIO');
    await submit(page);
    await expectCorrect(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('M07: DISTINCT deja un ejemplar de cada departamento de Bogotá', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 7, 'Valores únicos con DISTINCT');
    // Resultado sin DISTINCT: los 7 empleados de Bogotá.
    await expect(page.getByText('tu resultado (7 filas)')).toBeVisible();
    for (const row of ['Fila 3, Recursos Humanos', 'Fila 4, TI']) {
      await page.getByRole('button', { name: new RegExp(`^${row}`) }).click();
    }
    await submit(page);
    await expectFeedback(page, 'Retiraste todas las filas de Recursos Humanos');
    await page.getByRole('button', { name: /^Fila 3, Recursos Humanos/ }).click();
    await page.getByRole('button', { name: /^Fila 7, Operaciones/ }).click();
    await expect(page.getByText('tu resultado (5 filas)')).toBeVisible();
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText(/Con DISTINCT quedan 5/)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
