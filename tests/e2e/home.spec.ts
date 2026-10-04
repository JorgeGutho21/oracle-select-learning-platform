import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';

test.describe('Home', () => {
  test('presenta DB LAB, la identidad académica, la ruta de secciones y los accesos', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'DB LAB' })).toBeVisible();
    await expect(
      page.getByText('Plataforma interactiva de Bases de Datos con Oracle').first(),
    ).toBeVisible();
    const identity = page.getByRole('region', { name: 'Identidad académica' });
    for (const text of [
      'DB LAB',
      'Universidad Popular del Cesar',
      'Ingeniería de Sistemas',
      'Bases de Datos',
      'Jorge Gutiérrez Thomas',
      'Amílcar Sierra Romano',
    ]) {
      await expect(identity.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(
      identity.getByRole('img', { name: 'Universidad Popular del Cesar' }),
    ).toBeVisible();
    const actions = page.getByRole('navigation', { name: 'Accesos principales' });
    await expect(actions.getByRole('link', { name: /Explorar plataforma/ })).toHaveAttribute(
      'href',
      '/sections',
    );
    // Sin progreso guardado, «Continuar aprendiendo» lleva al temario.
    await expect(actions.getByRole('link', { name: /Continuar aprendiendo/ })).toHaveAttribute(
      'href',
      '/learn',
    );
    // La consulta del hero usa WHERE y ORDER BY, con su resultado real del motor.
    const terminal = page.getByRole('figure', { name: 'Ejemplo de consulta y su resultado' });
    await expect(terminal).toContainText("ciudad = 'Bogotá'");
    await expect(terminal.getByRole('region', { name: 'Vista educativa · 7 filas' })).toBeVisible();

    // Ruta: tres secciones con estado y enlaces que existen.
    const route = page.locator('.section-grid').first().locator(':scope > li');
    await expect(route).toHaveCount(3);
    await expect(route.nth(0)).toContainText('Fundamentos SQL');
    await expect(route.nth(0)).toContainText('Disponible');
    await expect(route.nth(1)).toContainText('Consultas relacionales y análisis');
    await expect(route.nth(2)).toContainText('PL/SQL y automatización');
    // Desde la Fase 4, las tres secciones están disponibles.
    for (const index of [1, 2]) await expect(route.nth(index)).toContainText('Disponible');
    await expect(
      route.nth(0).getByRole('link', { name: /Entrar a Fundamentos SQL/ }),
    ).toHaveAttribute('href', '/sections/fundamentos-sql');

    // Patrón pedagógico calculado por el motor: 20 filas y 12 columnas → 5 filas y 2 columnas.
    const pattern = page.getByRole('list', { name: 'De la tabla original al resultado' });
    await expect(pattern).toContainText('EMPLEADOS');
    await expect(pattern).toContainText('20 filas');
    await expect(pattern).toContainText('5 filas');
    await expect(pattern).toContainText('2 columnas');

    // Oracle real sin datos sensibles: se explica el recorrido, no la conexión.
    const oracle = page.getByRole('list', { name: 'Recorrido de una consulta' });
    await expect(oracle.locator(':scope > li')).toHaveCount(5);
    await expect(page.locator('main')).not.toContainText(/wallet|contraseña|password/i);

    const intro = page.locator('.video-player').filter({ hasText: 'Video introductorio' });
    await expect(intro).not.toContainText('Video en preparación');
    await expect(intro.locator('video, [role="alert"]')).toHaveCount(1);
    await expect(page.locator('main')).not.toContainText('Duración');
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
