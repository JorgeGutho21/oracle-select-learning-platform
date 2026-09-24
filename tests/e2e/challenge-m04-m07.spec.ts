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

const names = ['Ana', 'Carlos', 'Laura', 'Pedro', 'María', 'Jorge'];

test.describe('Challenge M04–M07', () => {
  test('M04: proyectar columnas conserva a todos los empleados', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 4, 'Predice el resultado');
    await addPiece(page, 'NOMBRE');
    await addPiece(page, 'SALARIO');
    for (const name of names.slice(0, 3)) await page.getByLabel(`Incluir a ${name}`).check();
    await submit(page);
    await expectFeedback(page, 'Faltan 3 empleados');
    for (const name of names.slice(3)) await page.getByLabel(`Incluir a ${name}`).check();
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
    await page.getByLabel('Valor calculado para Ana').fill('36000000');
    await page.getByLabel('Valor calculado para Pedro').fill('1800000');
    await page.getByLabel('Valor calculado para María').fill('44.400.000');
    await submit(page);
    await expectFeedback(page, 'revisa el valor calculado para Pedro');
    await page.getByLabel('Valor calculado para Pedro').fill('21600000');
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

  test('M07: DISTINCT deja un ejemplar de cada ciudad', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 7, 'Valores únicos con DISTINCT');
    await expect(page.getByText('tu resultado (6 filas)')).toBeVisible();
    for (const row of ['Fila 3, Bogotá', 'Fila 4, Medellín', 'Fila 5, Cali', 'Fila 6, Bogotá']) {
      await page.getByRole('button', { name: new RegExp(`^${row}`) }).click();
    }
    await submit(page);
    await expectFeedback(page, 'Retiraste todas las filas de Medellín');
    await page.getByRole('button', { name: /^Fila 4, Medellín/ }).click();
    await expect(page.getByText('tu resultado (3 filas)')).toBeVisible();
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText(/Con DISTINCT quedan 3/)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
