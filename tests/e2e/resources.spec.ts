import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const CONCEPTS = [
  ['select', 'SELECT'],
  ['from', 'FROM'],
  ['asterisco', 'SELECT *'],
  ['columnas', 'Lista de columnas'],
  ['expresiones', 'Expresiones aritméticas'],
  ['alias', 'AS · alias de columna'],
  ['distinct', 'DISTINCT'],
] as const;

test.describe('Recursos', () => {
  test('ofrece accesos directos a los cuatro recorridos', async ({ page }) => {
    await page.goto('/resources');
    const shortcuts = page.getByRole('navigation', { name: 'Accesos directos' });
    for (const [name, href] of [
      ['Modo Estudio', '/learn'],
      ['Modo Exposición', '/presentation'],
      ['Laboratorio SQL', '/lab'],
      ['SQL Challenge', '/challenge'],
    ] as const) {
      await expect(shortcuts.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute(
        'href',
        href,
      );
    }
    await expect(
      page
        .getByRole('navigation', { name: 'Secciones de recursos' })
        .getByRole('link', { name: 'Catálogo de módulos' }),
    ).toHaveAttribute('href', '/modules');
  });

  test('la chuleta cubre las siete piezas con patrón, ejemplo y advertencias', async ({ page }) => {
    await page.goto('/resources');
    for (const [slug, title] of CONCEPTS) {
      const card = page.locator(`#chuleta-${slug}`);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(title);
      await expect(card.locator('.resource-syntax')).toContainText('FROM');
      await expect(card.getByRole('link', { name: /Abrir en laboratorio/ })).toHaveAttribute(
        'href',
        new RegExp(`returnTo=%2Flearn%2F${slug}`),
      );
    }
    const warnings = page.getByRole('complementary', { name: 'Para recordar' });
    await expect(warnings.getByRole('listitem')).toHaveCount(4);
    await expect(warnings).toContainText(
      'Sin ORDER BY, Oracle no garantiza el orden de las filas.',
    );
  });

  test('la tabla de referencia calcula el tamaño de cada resultado', async ({ page }) => {
    await page.goto('/resources');
    const table = page.locator('#referencia table');
    await expect(table.locator('tbody tr')).toHaveCount(7);
    await expect(table.locator('tbody tr').filter({ hasText: 'DISTINCT' })).toContainText(
      '3 filas × 1 columna',
    );
    await expect(table.locator('tbody tr').filter({ hasText: 'SELECT *' })).toContainText(
      '6 filas × 6 columnas',
    );
  });

  test('los ejemplos SQL se abren en el laboratorio', async ({ page }) => {
    await page.goto('/resources');
    const examples = page.locator('#ejemplos .resource-example');
    await expect(examples).toHaveCount(9);
    await examples
      .filter({ hasText: 'Ciudades sin repetir' })
      .getByRole('link', { name: /Abrir en laboratorio/ })
      .click();
    await expect(page).toHaveURL(/\/lab\?sql=SELECT\+DISTINCT\+ciudad/);
  });

  test('los dos videos están publicados con su duración real', async ({ page }) => {
    await page.goto('/resources');
    for (const id of ['video-introduccion', 'video-resumen']) {
      const video = page.locator(`#${id}`);
      await expect(video).not.toContainText('Video en preparación');
      await expect(video.locator('video, [role="alert"]')).toHaveCount(1);
    }
    await expect(page.locator('#video-introduccion')).toContainText('Duración: 1:13');
    await expect(page.locator('#video-resumen')).toContainText('Duración: 4:51');
  });

  test('las fuentes solo citan la referencia oficial y el material del curso', async ({ page }) => {
    await page.goto('/resources');
    const sources = page.locator('#fuentes');
    const external = sources.locator('a[href^="http"]');
    await expect(external).toHaveCount(1);
    await expect(external).toHaveAttribute(
      'href',
      'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html',
    );
    await expect(sources).toContainText('Material del curso');
  });

  test('al imprimir solo quedan la chuleta y la referencia rápida', async ({ page }) => {
    await page.goto('/resources');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#chuleta')).toBeVisible();
    await expect(page.locator('#referencia')).toBeVisible();
    for (const hidden of ['#videos', '#ejemplos', '#fuentes', '.site-header', '.site-footer']) {
      await expect(page.locator(hidden)).toBeHidden();
    }
  });

  test('cumple WCAG 2 AA', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('#chuleta-select')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
