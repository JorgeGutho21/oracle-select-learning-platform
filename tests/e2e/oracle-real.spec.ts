import { expect, test, type Page } from '@playwright/test';
import {
  expectCorrect,
  expectFeedback,
  fillEditor,
  mapScore,
  openMission,
  startChallenge,
} from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

// Recorridos que solo existen con Oracle real (docs/ORACLE_SETUP.md). Sin la cuenta lectora
// se omiten; las demás pruebas comprueban entonces que nada se simula.
test.skip(!ORACLE_CONFIGURED, 'Requiere la cuenta lectora de Oracle (docs/ORACLE_SETUP.md).');

const panel = (page: Page, name: string) => page.getByRole('region', { name });

test('laboratorio: LAB03 se ejecuta en Oracle, un error ORA es real y lo rechazado no se envía', async ({
  page,
}) => {
  await page.goto('/lab');
  const result = panel(page, 'Resultado');
  await expect(result).toContainText('Conectado');
  const editor = page.getByRole('textbox', { name: 'Consulta SQL' });
  await fillEditor(editor, 'SELECT nombre, salario * 12 AS salario_anual FROM empleados;');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  const real = result.getByRole('table', { name: /^Oracle \(Oracle Database \d+.*6 filas/ });
  await expect(real).toContainText('36.000.000');
  await expect(real).toContainText('60.000.000');
  await expect(real.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO_ANUAL']);

  await fillEditor(editor, 'SELECT salario / 0 FROM empleados');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(result.getByText('Oracle devolvió ORA-01476')).toBeVisible();
  await expect(result).toContainText('No se puede dividir entre cero');

  await fillEditor(editor, 'SELECT nombre FROM empleados WHERE edad > 20');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(result.getByText('No se envió a Oracle')).toBeVisible();
});

test('M10: una salida distinta falla y una expresión equivalente acierta en Oracle', async ({
  page,
}) => {
  await startChallenge(page);
  await openMission(page, 10, 'Final Boss: Query Master');
  const editor = page.getByRole('textbox', { name: 'Tu consulta para el reto final' });
  await fillEditor(
    editor,
    'SELECT nombre, ciudad, salario * 12 AS proyeccion_anual FROM empleados;',
  );
  await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
  await expectFeedback(page, 'valores');
  await expect(page.getByText('Intento 2 de 2')).toBeVisible();

  await fillEditor(
    editor,
    'select NOMBRE, ciudad, 12 * (100000 + salario) as Proyeccion_Anual from EMPLEADOS',
  );
  await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
  await expectCorrect(page);
  await expect(page.getByText('Resuelta', { exact: true }).first()).toBeVisible();
  await expect(mapScore(page)).toContainText('80');
});
