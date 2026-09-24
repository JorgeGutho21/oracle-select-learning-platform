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

    await expect(page.getByRole('link', { name: /^0?\d.*¿Qué es SQL\?/ })).toHaveAttribute(
      'href',
      '/learn/introduccion',
    );
    const future = page.locator('#proximos-modulos li');
    await expect(future).toHaveCount(7);
    await expect(future.filter({ hasText: 'Próximamente' })).toHaveCount(7);
    await expect(page.getByText('En preparación: 90–120 segundos', { exact: false })).toBeVisible();
  });

  test('la demostración escribe la consulta y conserva las seis filas', async ({ page }) => {
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
    await expect(table.locator('tbody tr')).toHaveCount(6);
    await expect(demo.getByRole('link', { name: /Abrir en el laboratorio/ })).toHaveAttribute(
      'href',
      /\/lab\?sql=SELECT\+nombre%2C\+ciudad%2C\+salario/,
    );
  });

  test('cumple WCAG 2 AA en escritorio y móvil', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
