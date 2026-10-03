import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';

test.describe('Home', () => {
  test('presenta la unidad, la identidad académica y los cuatro recorridos', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'SELECT en Oracle SQL' }),
    ).toBeVisible();
    await expect(page.getByText('Oracle Database · SQL Fundamentals')).toBeVisible();

    const identity = page.getByRole('region', { name: 'Identidad académica' });
    for (const text of [
      'Universidad Popular del Cesar',
      'Ingeniería de Sistemas',
      'Base de Datos',
      'SELECT en Oracle SQL',
      'Jorge Gutierrez Thomas',
      'Amilkar Sierra',
    ]) {
      await expect(identity.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(
      identity.getByRole('img', { name: 'Universidad Popular del Cesar' }),
    ).toBeVisible();

    const actions = page.getByRole('navigation', { name: 'Recorridos principales' });
    for (const [name, href] of [
      ['Iniciar clase', '/presentation'],
      ['Estudiar', '/learn'],
      ['Practicar SQL', '/lab'],
      ['Iniciar Challenge', '/challenge'],
    ] as const) {
      await expect(actions.getByRole('link', { name })).toHaveAttribute('href', href);
    }

    // La consulta del hero ya usa WHERE y ORDER BY, con su resultado real del motor.
    const terminal = page.getByRole('figure', { name: 'Ejemplo de consulta y su resultado' });
    await expect(terminal).toContainText("ciudad = 'Bogotá'");
    await expect(terminal).toContainText('ORDER BY salario_anual DESC');
    await expect(terminal.getByRole('region', { name: 'Vista educativa · 7 filas' })).toBeVisible();

    const path = page.locator('.home-path > li');
    await expect(path).toHaveCount(8);
    await expect(path.first().getByRole('link')).toHaveAttribute('href', '/learn/introduccion');
    const future = page.locator('#proximos-modulos li');
    await expect(future).toHaveCount(6);
    await expect(future.filter({ hasText: 'Próximamente' })).toHaveCount(6);
    const intro = page.locator('.video-player').filter({ hasText: 'Video introductorio' });
    await expect(intro).not.toContainText('Video en preparación');
    await expect(intro.locator('video, [role="alert"]')).toHaveCount(1);
    // Sin rótulos de duración de los videos.
    await expect(page.locator('main')).not.toContainText('Duración');
    await expect(page.getByRole('link', { name: /Ver la ruta de aprendizaje/ })).toHaveAttribute(
      'href',
      '/modules',
    );
  });

  test('la demostración escribe la consulta y muestra 8 de las 20 filas', async ({ page }) => {
    await page.goto('/');
    const demo = page.locator('.home-demo');
    await expect(demo.locator('pre')).toContainText('SELECT nombre, ciudad');
    await demo.getByRole('button', { name: /SALARIO/ }).click();
    await expect(demo.getByRole('button', { name: /SALARIO/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(demo.locator('pre')).toContainText('SELECT nombre, ciudad, salario');
    const table = demo.getByRole('region', { name: 'Resultado de la demostración' });
    await expect(table.locator('thead th')).toHaveText(['NOMBRE', 'CIUDAD', 'SALARIO']);
    await expect(table.locator('tbody tr')).toHaveCount(8);
    await expect(demo).toContainText('8 de 20 filas');
    await expect(demo.getByRole('link', { name: /Abrir en Lab/ })).toHaveAttribute(
      'href',
      /\/lab\?sql=SELECT\+nombre%2C\+ciudad%2C\+salario/,
    );
  });

  test('con muchas columnas el resultado ocupa todo el ancho y se reparte en bandas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const demo = page.locator('.home-demo');
    await expect(demo).toHaveClass(/home-demo--few/);
    const order = [
      'ID_EMPLEADO',
      'SALARIO',
      'APELLIDO',
      'CARGO',
      'DEPARTAMENTO',
      'BONO',
      'FECHA_INGRESO',
      'ESTADO',
      'CORREO',
      'ID_JEFE',
    ];
    for (const name of order) {
      await demo.getByRole('button', { name: new RegExp(`^\d*${name}$`) }).click();
    }
    await expect(demo).toHaveClass(/home-demo--many/);
    // La consulta respeta el orden en que se eligieron las columnas.
    await expect(demo.locator('pre')).toContainText(
      'SELECT nombre, ciudad, id_empleado, salario, apellido, cargo',
    );
    await expect(demo).toContainText('8 de 20 filas · 12 columnas');
    const result = demo.locator('.home-demo__result');
    const controls = await demo.locator('.home-demo__controls').boundingBox();
    const box = await result.boundingBox();
    expect(Math.abs(box!.width - controls!.width)).toBeLessThanOrEqual(1);
    // Dos bandas con las mismas 8 filas y el número de empleado, sin fichas por registro.
    const bands = result.locator('.dv__bands:visible');
    await expect(bands).toHaveCount(1);
    const tables = bands.getByRole('table');
    await expect(tables).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      await expect(tables.nth(index).locator('thead th').first()).toHaveText('ID_EMPLEADO');
      await expect(tables.nth(index).locator('tbody tr')).toHaveCount(8);
    }
    await expect(result.locator('.dv-record:visible')).toHaveCount(0);
    await expectNoHorizontalScroll(page, 'Home con 12 columnas');
  });

  // Un análisis por tamaño: la Home es larga y dos análisis completos en una sola prueba
  // superaban el plazo en Edge con la suite completa.
  for (const [label, width] of [
    ['escritorio', 1440],
    ['móvil', 390],
  ] as const) {
    test(`cumple WCAG 2 AA en ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
