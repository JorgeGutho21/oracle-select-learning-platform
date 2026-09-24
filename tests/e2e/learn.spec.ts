import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const LESSONS = [
  ['introduccion', '¿Qué es SQL?'],
  ['select', 'SELECT'],
  ['from', 'FROM'],
  ['asterisco', 'SELECT *'],
  ['columnas', 'Columnas específicas'],
  ['expresiones', 'Expresiones y cálculos'],
  ['alias', 'Alias AS'],
  ['distinct', 'DISTINCT'],
  ['consulta-completa', 'Consulta completa'],
] as const;

test.describe('Modo Estudio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('el temario sigue la ruta de nueve pasos', async ({ page }) => {
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aprende SELECT paso a paso');
    const cards = page.getByRole('list', { name: 'Temario del Modo Estudio' }).getByRole('link');
    await expect(cards).toHaveCount(9);
    for (const [index, [slug, title]] of LESSONS.entries()) {
      await expect(cards.nth(index)).toHaveAttribute('href', `/learn/${slug}`);
      await expect(cards.nth(index).locator('strong')).toHaveText(title);
    }
    await expect(page.getByRole('link', { name: /¿Vas a explicarlo en clase\?/ })).toHaveAttribute(
      'href',
      '/presentation',
    );
  });

  test('visitar las nueve lecciones no las completa (U02)', async ({ page }) => {
    for (const [index, [slug]] of LESSONS.entries()) {
      await page.goto(`/learn/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Espera a que la visita quede guardada antes de pasar a la siguiente lección.
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(window.localStorage.getItem('sql-select-lab:study:progress') ?? '{}')
                .lastLesson,
          ),
        )
        .toBe(`L0${index}`);
    }
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: '0 de 9 lecciones' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continuar en Consulta completa' })).toBeVisible();
  });

  test('una lección muestra idea, sintaxis, ejemplo, efecto visual, error y actividad', async ({
    page,
  }) => {
    await page.goto('/learn/distinct');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'DISTINCT: sin filas repetidas',
    );
    for (const heading of [
      'La idea',
      'El patrón',
      'La consulta',
      'De la tabla al resultado',
      'Error frecuente',
      'Comprueba lo aprendido',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.locator('.ds-code').first()).toContainText('SELECT DISTINCT ciudad');

    const visual = page.locator('.study-visual');
    await expect(visual.locator('.study-visual__caption')).toContainText('Paso 1 de 3:');
    await expect(visual.locator('tbody tr')).toHaveCount(6);
    await expect(visual.getByText('repetida')).toHaveCount(3);
    await visual.getByRole('button', { name: 'Paso siguiente →' }).click();
    await expect(visual.locator('.study-visual__caption')).toContainText('Paso 2 de 3:');
    await expect(visual.locator('tbody tr')).toHaveCount(3);
    await visual.getByRole('button', { name: /Dos columnas/ }).click();
    await expect(visual.locator('tbody tr')).toHaveCount(5);
    await expect(visual.getByRole('button', { name: /Dos columnas/ })).toHaveAttribute(
      'aria-current',
      'step',
    );

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('resolver la actividad completa la lección y se conserva al recargar', async ({ page }) => {
    await page.goto('/learn/expresiones');
    await page.getByLabel('Sin paréntesis: 4.200.000; con paréntesis: 37.200.000').check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Lección completada' })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Ya resolviste esta actividad en este navegador.')).toBeVisible();
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: '1 de 9 lecciones' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Continuar en Expresiones y cálculos' }),
    ).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Temario del Modo Estudio' }).getByText('✓ Completada'),
    ).toHaveCount(1);
  });

  test('una respuesta incorrecta orienta sin completar la lección', async ({ page }) => {
    await page.goto('/learn/from');
    await page.getByRole('radio', { name: 'AS', exact: true }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Aún no' })).toBeVisible();
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: '0 de 9 lecciones' })).toBeVisible();
  });

  test('el ejemplo se abre en el laboratorio con el camino de vuelta', async ({ page }) => {
    await page.goto('/learn/alias');
    const link = page.getByRole('link', { name: /Abrir en laboratorio/ }).first();
    await expect(link).toHaveAttribute('href', /returnTo=%2Flearn%2Falias/);
  });

  test('en móvil el temario se pliega y no hay desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/learn/select');
    await expect(page.getByRole('complementary', { name: 'Temario' })).toBeHidden();
    await page.locator('.study-mobile-toc summary').click();
    await expect(
      page.locator('.study-mobile-toc').getByRole('link', { name: /FROM/ }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
