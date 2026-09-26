import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillEditor } from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

const editorOf = (page: Page) => page.getByRole('textbox', { name: 'Consulta SQL' });
const panel = (page: Page, name: string) => page.getByRole('region', { name });
const card = (page: Page, group: string) =>
  panel(page, 'Diagnóstico').getByRole('article', { name: new RegExp(`^${group}:`) });

test.describe('Laboratorio SQL', () => {
  test('la consulta inicial con WHERE: analiza, resalta, muestra el resultado y traduce', async ({
    page,
  }) => {
    await page.goto('/lab');
    await expect(page.getByRole('heading', { level: 1, name: 'Laboratorio SQL' })).toBeVisible();
    await expect(editorOf(page)).toContainText("WHERE ciudad = 'Bogotá'");
    await expect(panel(page, 'Resultado')).toContainText(
      ORACLE_CONFIGURED ? 'Conectado' : 'No conectado',
    );

    await page.getByRole('button', { name: 'Analizar' }).click();

    const feedback = panel(page, 'Diagnóstico');
    await expect(feedback).toContainText('Consulta válida dentro del subconjunto SELECT');
    await expect(feedback).toContainText('7 de 20 filas');
    await expect(feedback).toContainText('Columnas que lee: NOMBRE, SALARIO, CIUDAD');
    const schema = panel(page, 'Esquema disponible');
    await expect(schema.locator('.lab-schema__used code')).toHaveText([
      'NOMBRE',
      'CIUDAD',
      'SALARIO',
    ]);
    const result = panel(page, 'Resultado');
    await expect(result).toContainText('No es una ejecución en Oracle');
    await expect(
      result.getByRole('table', { name: /Vista previa: 7 filas, 2 columnas/ }),
    ).toContainText('9.000.000');
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText(
      'Muéstrame el nombre y el salario de los empleados cuya ciudad es Bogotá.',
    );
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText('Quedan 7 de 20');
    const anatomy = panel(page, 'Anatomía de la consulta');
    for (const label of ['SELECT', 'Columna', 'FROM', 'Tabla de origen', 'WHERE', 'Condición']) {
      await expect(anatomy.locator('.lab-legend__label', { hasText: label }).first()).toBeVisible();
    }

    await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
    if (ORACLE_CONFIGURED) {
      // Resultado real del motor, identificado como tal y distinto de la vista previa.
      const real = result.getByRole('table', { name: /^Oracle \(Oracle Database \d+/ });
      await expect(real).toContainText('9.000.000');
      await expect(real.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO']);
      await expect(real.getByRole('row')).toHaveCount(8);
    } else {
      await expect(result.getByText('Servicio Oracle no disponible')).toBeVisible();
      await expect(result.locator('.lab-result__block--oracle table')).toHaveCount(0);
    }
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations).toEqual([]);
  });

  test('salario * 12 AS salario_anual con Ctrl+Enter: expresión, alias y encabezado', async ({
    page,
  }) => {
    await page.goto('/lab');
    const editor = editorOf(page);
    await fillEditor(
      editor,
      'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    );
    await editor.press('ControlOrMeta+Enter');
    const preview = panel(page, 'Resultado').getByRole('table', { name: /Vista previa/ });
    await expect(preview.getByRole('columnheader')).toHaveText(['NOMBRE', 'SALARIO_ANUAL']);
    await expect(preview).toContainText('108.000.000');
    await expect(panel(page, 'En lenguaje cotidiano')).toContainText('como SALARIO_ANUAL');
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

  test('un error muestra grupo, posición, lo encontrado y una pista; la corrección se pide', async ({
    page,
  }) => {
    await page.goto('/lab');
    const editor = editorOf(page);
    await fillEditor(editor, 'SELECT nombre,\nFROM empleados');
    await page.getByRole('button', { name: 'Analizar' }).click();
    const syntax = card(page, 'SINTAXIS');
    await expect(syntax).toContainText('Línea 1, columna 14');
    await expect(syntax).toContainText('Falta una columna o expresión después de la coma.');
    await expect(syntax).toContainText('Encontrado');
    await expect(syntax).toContainText('Cada coma anuncia otro elemento');
    await expect(page.locator('.cm-lintRange-error')).toHaveCount(1);
    await expect(panel(page, 'Resultado')).toContainText('Sin vista previa');
    // La corrección no se regala: está plegada hasta que se pide.
    const apply = syntax.getByRole('button', { name: 'Aplicar la corrección' });
    await expect(apply).toBeHidden();
    await syntax.getByText('Ver la posible corrección').click();
    await apply.click();
    await expect(editor).toContainText('SELECT nombre');
    await expect(panel(page, 'Diagnóstico')).toContainText(
      'Consulta válida dentro del subconjunto SELECT',
    );

    await fillEditor(editor, 'SELECT salarios FROM empleados');
    await expect(panel(page, 'Diagnóstico')).toContainText(
      'La consulta cambió desde el último análisis',
    );
    await page.getByRole('button', { name: 'Analizar' }).click();
    const semantic = card(page, 'SEMÁNTICA');
    await expect(semantic).toContainText('SALARIOS no pertenece a la tabla EMPLEADOS.');
    await expect(semantic).toContainText('¿Quisiste decir SALARIO?');
  });

  test('errores frecuentes de WHERE: texto sin comillas, = NULL y SELECT faltante', async ({
    page,
  }) => {
    await page.goto('/lab');
    const examples = page.getByLabel('Cargar un ejemplo');
    await expect(examples.locator('optgroup')).toHaveCount(5);
    await expect(examples.locator('option:not([disabled])')).toHaveCount(24);

    await examples.selectOption('LAB20');
    await page.getByRole('button', { name: 'Analizar' }).click();
    const unquoted = card(page, 'SINTAXIS');
    await expect(unquoted).toContainText('Línea 3, columna 16');
    await expect(unquoted).toContainText('va entre comillas simples');
    await unquoted.getByText('Ver la posible corrección').click();
    await expect(unquoted).toContainText("WHERE ciudad = 'Bogotá';");
    await unquoted.getByRole('button', { name: 'Aplicar la corrección' }).click();
    await expect(
      panel(page, 'Resultado').getByRole('table', { name: /Vista previa: 7 filas/ }),
    ).toBeVisible();

    // El borrador ya no es el inicial: el laboratorio pide confirmar antes de sustituirlo.
    await examples.selectOption('LAB21');
    await page
      .getByRole('dialog', { name: '¿Sustituir tu consulta por este ejemplo?' })
      .getByRole('button', { name: 'Cargar ejemplo' })
      .click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(card(page, 'ADVERTENCIA')).toContainText('NULL no se compara con =');
    await expect(panel(page, 'Resultado')).toContainText('0 filas');

    await fillEditor(editorOf(page), 'nombre, salario FROM empleados;');
    await page.getByRole('button', { name: 'Analizar' }).click();
    const missing = card(page, 'SINTAXIS');
    await expect(missing).toContainText('La consulta debe comenzar con SELECT');
    await missing.getByText('Ver la posible corrección').click();
    await expect(missing).toContainText('SELECT nombre, salario FROM empleados;');
  });

  test('una sentencia de un nivel futuro no se envía a Oracle y enlaza con su ficha', async ({
    page,
  }) => {
    await page.goto('/lab');
    await fillEditor(editorOf(page), 'DELETE FROM empleados');
    await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
    await expect(panel(page, 'Resultado').getByText('No se envió a Oracle')).toBeVisible();
    const scope = card(page, 'ALCANCE EDUCATIVO');
    await expect(scope).toContainText('DELETE es SQL válido en Oracle');
    const link = scope.getByRole('link', { name: /Ver en Próximamente: DELETE · Nivel 6/ });
    await expect(link).toHaveAttribute('href', '/modules#tema-delete');
    await link.click();
    await expect(page).toHaveURL(/\/modules#tema-delete$/);
    await expect(page.locator('#tema-delete')).toBeVisible();
  });

  test('LAB19 explica la coma olvidada como alias implícito', async ({ page }) => {
    await page.goto('/lab');
    await page.getByLabel('Cargar un ejemplo').selectOption('LAB19');
    await expect(editorOf(page)).toContainText('SELECT nombre salario');
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(card(page, 'ADVERTENCIA')).toContainText(
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
