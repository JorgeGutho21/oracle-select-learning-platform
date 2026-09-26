import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
      ['Modo Estudio', '/learn'],
      ['Laboratorio SQL', '/lab'],
      ['SQL Challenge', '/challenge'],
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
    await expect(demo.getByRole('link', { name: /Abrir en el laboratorio/ })).toHaveAttribute(
      'href',
      /\/lab\?sql=SELECT\+nombre%2C\+ciudad%2C\+salario/,
    );
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
