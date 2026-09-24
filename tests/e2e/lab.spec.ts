import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillEditor } from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

const editorOf = (page: Page) => page.getByRole('textbox', { name: 'Consulta SQL' });
const panel = (page: Page, name: string) => page.getByRole('region', { name });

test.describe('Laboratorio SQL', () => {
  test('SELECT nombre, salario: analiza, resalta, muestra resultado educativo y traduce', async ({
    page,
  }) => {
    await page.goto('/lab');
    await expect(page.getByRole('heading', { level: 1, name: 'Laboratorio SQL' })).toBeVisible();
    await expect(editorOf(page)).toContainText('SELECT nombre, salario');
    await expect(panel(page, 'Resultado')).toContainText(
      ORACLE_CONFIGURED ? 'Conectado' : 'No conectado',
    );

    await page.getByRole('button', { name: 'Analizar' }).click();

    await expect(panel(page, 'Diagnóstico')).toContainText(
      'Consulta válida dentro del subconjunto SELECT',
    );
    await expect(panel(page, 'Diagnóstico')).toContainText('Columnas fuente: NOMBRE, SALARIO');
    const schema = panel(page, 'Esquema disponible');
    await expect(schema.locator('.lab-schema__used code')).toHaveText(['NOMBRE', 'SALARIO']);
    await expect(schema.locator('th.ds-table__highlight')).toHaveCount(2);
    const result = panel(page, 'Resultado');
    await expect(result).toContainText('No es una ejecución en Oracle');
    await expect(
      result.getByRole('table', { name: /Vista previa: 6 filas, 2 columnas/ }),
    ).toContainText('3.000.000');
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText(
      'Para cada fila de la tabla EMPLEADOS, muestra la columna NOMBRE y la columna SALARIO.',
    );
    const anatomy = panel(page, 'Anatomía de la consulta');
    for (const label of ['SELECT', 'Columna', 'FROM', 'Tabla de origen', 'Punto y coma']) {
      await expect(anatomy.locator('.lab-legend__label', { hasText: label }).first()).toBeVisible();
    }

    await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
    if (ORACLE_CONFIGURED) {
      // Resultado real del motor, identificado como tal y distinto de la vista previa.
      const real = result.getByRole('table', { name: /^Oracle \(Oracle Database \d+/ });
      await expect(real).toContainText('3.000.000');
      await expect(real.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO']);
      await expect(real.getByRole('row')).toHaveCount(7);
    } else {
      await expect(result.getByText('Servicio Oracle no disponible')).toBeVisible();
      await expect(result.locator('.lab-result__block--oracle table')).toHaveCount(0);
    }
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations).toEqual([]);
  });

  test('salario * 12 AS salario_anual con Ctrl+Enter: expresión, alias y encabezado del resultado', async ({
    page,
  }) => {
    await page.goto('/lab');
    const editor = editorOf(page);
    await fillEditor(
      editor,
      'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    );
    await editor.press('ControlOrMeta+Enter');
    const result = panel(page, 'Resultado');
    const preview = result.getByRole('table', { name: /Vista previa/ });
    await expect(preview.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO_ANUAL']);
    await expect(preview).toContainText('36.000.000');
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText(
      'el cálculo SALARIO multiplicado por 12 con el encabezado SALARIO_ANUAL',
    );
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText(
      'AS solo cambia el encabezado',
    );
    const anatomy = panel(page, 'Anatomía de la consulta');
    await expect(anatomy.locator('.lab-legend', { hasText: 'Expresión calculada' })).toContainText(
      'salario * 12',
    );
    await expect(anatomy.locator('.lab-legend', { hasText: 'Alias (AS)' })).toContainText(
      'AS salario_anual',
    );
  });

  test('los errores muestran categoría, posición y marca en el editor, y el análisis caduca al editar', async ({
    page,
  }) => {
    await page.goto('/lab');
    const editor = editorOf(page);
    await fillEditor(editor, 'SELECT nombre,\nFROM empleados');
    await page.getByRole('button', { name: 'Analizar' }).click();
    const feedback = panel(page, 'Diagnóstico');
    await expect(feedback).toContainText('Sintaxis · línea 1, columna 14');
    await expect(feedback).toContainText('Falta una columna o expresión después de la coma.');
    await expect(page.locator('.cm-lintRange-error')).toHaveCount(1);
    await expect(panel(page, 'Resultado')).toContainText('Sin vista previa');

    await fillEditor(editor, 'SELECT salarios FROM empleados');
    await expect(feedback).toContainText('La consulta cambió desde el último análisis');
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(feedback).toContainText('SALARIOS no pertenece a la tabla EMPLEADOS.');
    await expect(feedback).toContainText('¿Quisiste decir SALARIO?');
  });

  test('una sentencia no permitida no se envía a Oracle', async ({ page }) => {
    await page.goto('/lab');
    await fillEditor(editorOf(page), 'DELETE FROM empleados');
    await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
    await expect(panel(page, 'Resultado').getByText('No se envió a Oracle')).toBeVisible();
    await expect(panel(page, 'Diagnóstico')).toContainText('Consulta no permitida');
  });

  test('el ejemplo LAB10 explica la coma ausente como alias implícito', async ({ page }) => {
    await page.goto('/lab');
    await page.getByLabel('Cargar un ejemplo').selectOption('LAB10');
    await expect(editorOf(page)).toContainText('SELECT nombre salario');
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(panel(page, 'Diagnóstico')).toContainText(
      'Oracle lee salario como un alias de NOMBRE',
    );
    await expect(panel(page, 'Resultado').getByRole('columnheader')).toHaveText(['SALARIO']);
  });

  test('en móvil los seis paneles se apilan sin desbordar la página', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('/lab');
    await page.getByRole('button', { name: 'Analizar' }).tap();
    await expect(
      panel(page, 'Resultado').getByRole('table', { name: /Vista previa/ }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: 'output/playwright/lab-mobile.png', fullPage: true });
    await context.close();
  });
});
