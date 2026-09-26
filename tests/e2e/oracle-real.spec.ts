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

test('laboratorio: filtros, orden y NULL se ejecutan en Oracle; un error ORA es real', async ({
  page,
}) => {
  await page.goto('/lab');
  const result = panel(page, 'Resultado');
  await expect(result).toContainText('Conectado');
  const editor = page.getByRole('textbox', { name: 'Consulta SQL' });
  const oracleTable = (rows: number) =>
    result.getByRole('table', {
      name: new RegExp(`^Oracle \\(Oracle Database \\d+.* ${rows} filas`),
    });

  await fillEditor(editor, 'SELECT nombre, salario * 12 AS salario_anual FROM empleados;');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(oracleTable(20)).toContainText('108.000.000');
  await expect(oracleTable(20).getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO_ANUAL']);

  await fillEditor(
    editor,
    'SELECT nombre, salario FROM empleados WHERE salario BETWEEN 3000000 AND 6000000 ORDER BY salario DESC',
  );
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(oracleTable(12)).toBeVisible();
  await expect(oracleTable(12).getByRole('row').nth(1)).toContainText('6.000.000');

  await fillEditor(editor, 'SELECT nombre, bono FROM empleados WHERE bono IS NULL');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(oracleTable(6)).toContainText('NULL');

  await fillEditor(editor, "SELECT nombre FROM empleados WHERE nombre LIKE '%ar%'");
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(oracleTable(6)).toContainText('Carlos');

  await fillEditor(editor, 'SELECT salario / 0 FROM empleados');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(result.getByText('Oracle devolvió ORA-01476')).toBeVisible();
  await expect(result).toContainText('No se puede dividir entre cero');

  await fillEditor(editor, 'SELECT nombre FROM empleados WHERE edad > 20');
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(result.getByText('No se envió a Oracle')).toBeVisible();
});

test('M10: una salida distinta falla y una forma equivalente acierta en Oracle', async ({
  page,
}) => {
  await startChallenge(page);
  await openMission(page, 10, 'Final Boss: Query Master');
  const editor = page.getByRole('textbox', { name: 'Tu consulta para el reto final' });
  await fillEditor(
    editor,
    "SELECT nombre, cargo, salario * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY proyeccion_anual DESC;",
  );
  await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
  await expectFeedback(page, 'valores');
  await expect(page.getByText('Intento 2 de 2')).toBeVisible();

  await fillEditor(
    editor,
    "select NOMBRE, cargo, 12 * (100000 + salario) as Proyeccion_Anual from EMPLEADOS where ciudad = 'Bogotá' and estado = 'ACTIVO' order by 3 desc",
  );
  await page.getByRole('button', { name: 'Enviar para evaluar' }).click();
  await expectCorrect(page);
  await expect(page.getByText('Resuelta', { exact: true }).first()).toBeVisible();
  await expect(mapScore(page)).toContainText('80');
});
