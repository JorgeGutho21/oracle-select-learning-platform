import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const LESSON_COUNT = 22;
const BLOCKS = [
  'Fundamentos',
  'Primera consulta',
  'Duplicados',
  'Filtrar filas',
  'Operadores de filtro',
  'NULL',
  'Ordenar resultados',
  'Integración',
];

async function lastLesson(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(window.localStorage.getItem('sql-select-lab:study:progress') ?? '{}').lastLesson,
  );
}

test.describe('Modo Estudio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('el temario tiene 22 lecciones en 8 bloques y la plantilla de 12 partes', async ({
    page,
  }) => {
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Aprende SELECT en Oracle SQL paso a paso',
    );
    for (const [index, block] of BLOCKS.entries()) {
      const list = page.getByRole('list', { name: `Lecciones del bloque ${block}` });
      await expect(list, block).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 2, name: new RegExp(`${block}$`) }).first(),
      ).toContainText(block);
      expect(await list.getByRole('link').count(), `bloque ${index + 1}`).toBeGreaterThan(0);
    }
    const cards = page.locator('.study-path').getByRole('link');
    await expect(cards).toHaveCount(LESSON_COUNT);
    await expect(cards.first()).toHaveAttribute('href', '/learn/introduccion');
    await expect(cards.last()).toHaveAttribute('href', '/learn/errores-frecuentes');
    await expect(page.locator('.study-template li')).toHaveCount(12);
    await expect(page.getByRole('link', { name: /¿Vas a explicarlo en clase\?/ })).toHaveAttribute(
      'href',
      '/presentation',
    );
    await expect(page.getByRole('link', { name: /Ver la ruta completa/ })).toHaveAttribute(
      'href',
      '/modules',
    );
  });

  test('visitar lecciones no las completa y el progreso recuerda la última', async ({ page }) => {
    for (const [slug, id] of [
      ['introduccion', 'L00'],
      ['select', 'L02'],
      ['where', 'L11'],
    ] as const) {
      await page.goto(`/learn/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect.poll(() => lastLesson(page)).toBe(id);
    }
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: `0 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continuar en WHERE' })).toBeVisible();
  });

  test('una lección responde qué es, qué hace, para qué sirve, cómo se escribe y se lee', async ({
    page,
  }) => {
    await page.goto('/learn/distinct');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'DISTINCT: sin filas repetidas',
    );
    const lesson = page.locator('.study-lesson');
    for (const part of [
      'En una frase',
      '¿Qué hace?',
      '¿Para qué sirve?',
      'Sintaxis',
      'Cómo leerla',
      'Ejemplo',
      'Qué cambió',
      'Qué no cambió',
      'Error frecuente',
      'Mini comprobación',
      'Abrir en el laboratorio',
    ]) {
      await expect(lesson.getByText(part, { exact: true }).first(), part).toBeVisible();
    }
    // Tabla de origen → consulta → qué hace → resultado, calculados por el motor.
    const flow = page.locator('.study-example .query-flow');
    for (const stage of ['Tabla original', 'Qué hace', 'Resultado']) {
      await expect(flow.locator('.query-flow__title', { hasText: stage })).toBeVisible();
    }
    await expect(flow).toContainText('SELECT DISTINCT ciudad');
    await expect(flow.getByText('Antes de DISTINCT: las repetidas se marcan')).toBeVisible();
    await expect(flow.getByRole('table', { name: 'Resultado de la consulta' })).toBeVisible();
    await expect(
      flow.getByRole('table', { name: 'Resultado de la consulta' }).locator('tbody tr'),
    ).toHaveCount(5);
    await expect(page.getByText('DISTINCT no borra registros de la tabla')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Con dos columnas' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('alias: AS no renombra la columna ni modifica la tabla', async ({ page }) => {
    await page.goto('/learn/alias');
    const lesson = page.locator('.study-lesson');
    await expect(lesson).toContainText('Alias: nombre temporal para una columna o expresión');
    await expect(lesson).toContainText('AS: palabra opcional');
    await expect(lesson).toContainText(
      'AS no renombra la columna, no modifica la tabla ni sus datos',
    );
    await expect(lesson.getByRole('columnheader', { name: 'SALARIO_ANUAL' }).first()).toBeVisible();
    await expect(lesson.getByRole('columnheader', { name: 'SALARIO*12' }).first()).toBeVisible();
  });

  test('la mini comprobación da pistas graduales y completa la lección', async ({ page }) => {
    await page.goto('/learn/distinct');
    const check = page.locator('.mini-check');
    const input = check.getByLabel('Número de filas');
    await input.fill('20');
    await check.getByRole('button', { name: 'Comprobar' }).click();
    await expect(check.getByRole('status')).toContainText('Todavía no');
    await expect(check.getByRole('status')).toContainText('Pista 1');
    await input.fill('4');
    await check.getByRole('button', { name: 'Comprobar' }).click();
    await expect(check.getByRole('status')).toContainText('Pista 2');
    await expect(check.getByRole('button', { name: 'Ver la respuesta' })).toBeVisible();
    await input.fill('5');
    await check.getByRole('button', { name: 'Comprobar' }).click();
    await expect(check.getByRole('status')).toContainText('Correcto.');
    await page.reload();
    await expect(page.getByText('Ya la resolviste. Puedes repetirla.')).toBeVisible();
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: `1 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
    await expect(page.locator('.study-path').getByText('✓ Completada')).toHaveCount(1);
  });

  test('una opción incorrecta orienta sin completar la lección', async ({ page }) => {
    await page.goto('/learn/alias');
    await page.getByRole('radio', { name: 'Pasa a llamarse SALARIO_ANUAL' }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('.mini-check').getByRole('status')).toContainText('Todavía no');
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: `0 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
  });

  test('se avanza de un bloque al siguiente con la navegación entre lecciones', async ({
    page,
  }) => {
    await page.goto('/learn/distinct');
    const pager = page.getByRole('navigation', { name: 'Navegación entre lecciones' });
    await pager.getByRole('link', { name: 'WHERE →' }).click();
    await expect(page).toHaveURL(/\/learn\/where$/);
    await expect(page.locator('.study-eyebrow').first()).toContainText('Bloque D');
    await page
      .getByRole('navigation', { name: 'Navegación entre lecciones' })
      .getByRole('link', { name: '← DISTINCT' })
      .click();
    await expect(page).toHaveURL(/\/learn\/distinct$/);
    await page.goto('/learn/errores-frecuentes');
    await expect(
      page
        .getByRole('navigation', { name: 'Navegación entre lecciones' })
        .getByRole('link', { name: 'Ir al SQL Challenge →' }),
    ).toHaveAttribute('href', '/challenge');
  });

  test('la consulta integradora se construye en seis pasos y el catálogo tiene 12 errores', async ({
    page,
  }) => {
    await page.goto('/learn/consulta-completa');
    await expect(page.locator('.study-step')).toHaveCount(6);
    await page.goto('/learn/errores-frecuentes');
    await expect(page.locator('.study-catalog__item')).toHaveCount(12);
    await expect(
      page.getByRole('link', { name: /Ver el diagnóstico en el laboratorio/ }).first(),
    ).toHaveAttribute('href', /\/lab\?/);
  });

  test('el ejemplo se abre en el laboratorio con el camino de vuelta', async ({ page }) => {
    await page.goto('/learn/alias');
    const link = page.getByRole('link', { name: /Abrir este ejemplo en el laboratorio/ });
    await expect(link).toHaveAttribute('href', /returnTo=%2Flearn%2Falias/);
    await link.click();
    await expect(page).toHaveURL(/\/lab\?/);
    await expect(page.locator('.cm-content')).toContainText('salario * 12 AS salario_anual');
  });

  test('en móvil el temario se pliega y no hay desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/learn/between');
    await expect(page.getByRole('complementary', { name: 'Temario' })).toBeHidden();
    await expect(page.locator('.study-mobile-toc summary')).toHaveText(
      `Temario · Lección 16 de ${LESSON_COUNT}`,
    );
    await page.locator('.study-mobile-toc summary').click();
    await expect(
      page.locator('.study-mobile-toc').getByRole('link', { name: /LIKE/ }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
