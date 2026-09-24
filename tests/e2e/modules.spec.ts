import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const UPCOMING = [
  'WHERE y comparaciones',
  'BETWEEN: rangos',
  'IN: listas de valores',
  'LIKE: patrones de texto',
  'JOIN: varias tablas',
  'GROUP BY: agrupar',
  'Funciones',
];

test.describe('Catálogo de módulos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modules');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('muestra SELECT como unidad actual y siete módulos futuros numerados', async ({ page }) => {
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Módulos de SQL' })).toBeVisible();
    const cards = page.getByRole('list', { name: 'Módulos del curso' }).locator(':scope > li');
    await expect(cards).toHaveCount(8);

    const current = page.locator('#modulo-select');
    await expect(current.getByRole('heading', { level: 2 })).toHaveText(
      'Módulo 1: SELECT en Oracle SQL',
    );
    await expect(current).toContainText('Unidad actual');
    await expect(current).toContainText('9 lecciones · 16 escenas de exposición');
    await expect(current.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(current.getByRole('link', { name: 'Empezar el Modo Estudio' })).toHaveAttribute(
      'href',
      '/learn',
    );
    await expect(
      current.getByRole('link', { name: /Iniciar clase en Modo Exposición/ }),
    ).toHaveAttribute('href', '/presentation');

    for (const [index, title] of UPCOMING.entries()) {
      const card = cards.nth(index + 1);
      await expect(card.getByRole('heading', { level: 2 })).toHaveText(
        `Módulo ${index + 2}: ${title}`,
      );
      await expect(card).toContainText('Próximamente');
      await expect(card).toContainText('Requiere');
      // Un módulo futuro no ofrece enlaces que aparenten contenido disponible.
      await expect(card.getByRole('link')).toHaveCount(0);
      await expect(card.getByRole('progressbar')).toHaveCount(0);
    }
  });

  test('el progreso de SELECT refleja las lecciones completadas', async ({ page }) => {
    await page.goto('/learn/from');
    await page.getByRole('radio', { name: 'FROM', exact: true }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Lección completada' })).toBeVisible();
    await page.goto('/modules');
    const current = page.locator('#modulo-select');
    await expect(current.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await current.getByRole('link', { name: 'Continuar en FROM' }).click();
    await expect(page).toHaveURL('/learn/from');
  });

  test('cumple WCAG 2 AA y no desborda en móvil', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/modules');
      await expect(page.locator('#modulo-select')).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `${width}px`).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
    }
  });
});
