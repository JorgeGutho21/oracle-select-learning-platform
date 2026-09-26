import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const FUTURE_LEVELS = [
  [2, 'Funciones SQL', 'Siguiente nivel'],
  [3, 'Resumen y agrupación', 'Siguiente nivel'],
  [4, 'Relacionar tablas (JOIN)', 'Más adelante'],
  [5, 'Subconsultas', 'Más adelante'],
  [6, 'Modificar datos', 'Más adelante'],
  [7, 'Estructura de datos (DDL)', 'Más adelante'],
] as const;

test.describe('Ruta de aprendizaje', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modules');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('el nivel 1 es el actual y los niveles 2 a 7 son Próximamente con 46 fichas', async ({
    page,
  }) => {
    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'De SELECT a una base de datos completa' }),
    ).toBeVisible();

    const current = page.locator('#nivel-1');
    await expect(current.getByRole('heading', { level: 2 })).toHaveText(
      'Nivel 1: SELECT fundamental',
    );
    await expect(current).toContainText('Ahora');
    await expect(current).toContainText('22 lecciones · 29 escenas de exposición');
    await expect(current.locator('.level__blocks > li')).toHaveCount(8);
    await expect(current.locator('.level__blocks a')).toHaveCount(22);
    await expect(current.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(current.getByRole('link', { name: 'Empezar el Modo Estudio' })).toHaveAttribute(
      'href',
      '/learn',
    );
    await expect(
      current.getByRole('link', { name: /Iniciar clase en Modo Exposición/ }),
    ).toHaveAttribute('href', '/presentation');

    for (const [number, title, stage] of FUTURE_LEVELS) {
      const level = page.locator(`#nivel-${number}`);
      await expect(level.getByRole('heading', { level: 2 })).toHaveText(
        `Nivel ${number}: ${title}`,
      );
      await expect(level).toContainText(stage);
      await expect(level).toContainText('Próximamente');
      // Un tema futuro no ofrece lecciones ni progreso que aparenten contenido disponible.
      await expect(level.locator('a[href^="/learn/"]')).toHaveCount(0);
      await expect(level.getByRole('progressbar')).toHaveCount(0);
    }
    const topics = page.locator('.topic-card');
    await expect(topics).toHaveCount(46);
    await expect(page.locator('.topic-card', { hasNotText: 'Próximamente' })).toHaveCount(0);
  });

  test('cada ficha tiene definición, utilidad, sintaxis, ejemplo, nivel y requisito', async ({
    page,
  }) => {
    const upper = page.locator('#tema-upper');
    await expect(upper.locator('h4')).toHaveText('UPPER');
    await expect(upper.locator('.topic-card__definition')).not.toBeEmpty();
    await expect(upper).toContainText('Para qué sirve:');
    await expect(upper).toContainText('Nivel 2');
    await expect(upper).toContainText('Requiere:');
    await upper.getByText('Sintaxis y ejemplo').click();
    await expect(upper.getByText('Sintaxis mínima')).toBeVisible();
    await expect(upper.locator('.sql-code').nth(1)).toContainText('UPPER');

    const deletion = page.locator('#tema-delete');
    await deletion.getByText('Sintaxis y ejemplo').click();
    await expect(deletion).toContainText('Advertencia:');
    await expect(deletion).toContainText('sin WHERE');
    await expect(deletion).toContainText('Antes');
    await expect(deletion).toContainText('Después');
    await expect(page.locator('#nivel-6')).toContainText(
      'el laboratorio actual nunca modifica EMPLEADOS',
    );
  });

  test('el progreso del nivel actual refleja las lecciones completadas', async ({ page }) => {
    await page.goto('/learn/distinct');
    const check = page.locator('.mini-check');
    await check.getByLabel('Número de filas').fill('5');
    await check.getByRole('button', { name: 'Comprobar' }).click();
    await expect(check.getByRole('status')).toContainText('Correcto.');
    await page.goto('/modules');
    const current = page.locator('#nivel-1');
    await expect(current.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await current.getByRole('link', { name: 'Continuar en DISTINCT' }).click();
    await expect(page).toHaveURL('/learn/distinct');
  });

  // Un análisis axe por prueba: dos seguidos rozaban el plazo de 30 s en Edge con la CPU
  // del equipo saturada (FINAL_AUDIT, Fase 10).
  for (const width of [1440, 390]) {
    test(`cumple WCAG 2 AA y no desborda a ${width} px`, async ({ page }) => {
      // Con 46 fichas (y sus bloques SQL) el análisis completo de axe tarda más de 30 s en Edge
      // con la CPU del equipo ocupada; en Chromium tarda unos 10 s.
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/modules');
      await expect(page.locator('#nivel-1')).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
