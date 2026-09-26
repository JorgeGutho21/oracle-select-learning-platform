import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Una ficha por concepto actual de la unidad, en el orden del Estudio.
const CONCEPTS = [
  ['select', 'SELECT'],
  ['from', 'FROM'],
  ['asterisco', 'SELECT *'],
  ['columnas', 'Lista de columnas'],
  ['expresiones', 'Expresiones'],
  ['precedencia', 'Precedencia aritmética'],
  ['alias', 'Alias con AS'],
  ['concatenacion', 'Concatenación ||'],
  ['distinct', 'DISTINCT'],
  ['where', 'WHERE'],
  ['comparaciones', 'Comparaciones'],
  ['and-or', 'AND y OR'],
  ['parentesis', 'Paréntesis en condiciones'],
  ['between', 'BETWEEN'],
  ['in', 'IN'],
  ['like', 'LIKE'],
  ['null', 'IS NULL'],
  ['order-by', 'ORDER BY'],
] as const;

test.describe('Recursos', () => {
  test('ofrece accesos directos a los cuatro recorridos y a la ruta', async ({ page }) => {
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
        .getByRole('link', { name: 'Ruta de aprendizaje' }),
    ).toHaveAttribute('href', '/modules');
  });

  test('la chuleta cubre los 18 conceptos con patrón, ejemplo y lección', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('#chuleta .resource-card')).toHaveCount(CONCEPTS.length);
    for (const [slug, title] of CONCEPTS) {
      const card = page.locator(`#chuleta-${slug}`);
      await expect(card.getByRole('heading', { level: 3 }), slug).toHaveText(title);
      await expect(card.locator('.resource-syntax'), slug).not.toBeEmpty();
      await expect(card.getByRole('link', { name: /Abrir en laboratorio/ })).toHaveAttribute(
        'href',
        new RegExp(`returnTo=%2Flearn%2F${slug}`),
      );
      await expect(card.getByRole('link', { name: /Repasar la lección/ })).toHaveAttribute(
        'href',
        `/learn/${slug}`,
      );
    }
    const warnings = page.getByRole('complementary', { name: 'Para recordar' });
    await expect(warnings.getByRole('listitem')).toHaveCount(8);
    await expect(warnings).toContainText(
      'NULL se pregunta con IS NULL; = NULL nunca es verdadero.',
    );
    await expect(warnings).toContainText(
      'Sin ORDER BY, Oracle no garantiza el orden de las filas.',
    );
  });

  test('la tabla de referencia calcula el tamaño de cada resultado', async ({ page }) => {
    await page.goto('/resources');
    const table = page.locator('#referencia table');
    await expect(table.locator('tbody tr')).toHaveCount(CONCEPTS.length);
    await expect(
      table.locator('tbody tr').filter({ has: page.getByRole('rowheader', { name: 'DISTINCT' }) }),
    ).toContainText('5 filas × 1 columna');
    await expect(
      table.locator('tbody tr').filter({ has: page.getByRole('rowheader', { name: 'SELECT *' }) }),
    ).toContainText('20 filas × 12 columnas');
  });

  test('los ejemplos SQL se abren en el laboratorio', async ({ page }) => {
    await page.goto('/resources');
    const examples = page.locator('#ejemplos .resource-example');
    await expect(examples).toHaveCount(18);
    await examples
      .filter({ hasText: 'Ciudades sin repetir' })
      .getByRole('link', { name: /Abrir en laboratorio/ })
      .click();
    await expect(page).toHaveURL(/\/lab\?sql=SELECT\+DISTINCT\+ciudad/);
  });

  test('los dos videos están publicados, sin rótulos de duración', async ({ page }) => {
    await page.goto('/resources');
    for (const id of ['video-introduccion', 'video-resumen']) {
      const video = page.locator(`#${id}`);
      await expect(video).not.toContainText('Video en preparación');
      await expect(video.locator('video, [role="alert"]')).toHaveCount(1);
      await expect(video).not.toContainText('Duración');
    }
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
