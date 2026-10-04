import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';

/**
 * Fase 4 (PHASE4_QA.md): las secciones 2 y 3 y la ampliación «Funciones de una fila» de la
 * Sección 1. Accesibilidad WCAG 2.2 AA con axe, matriz de siete anchos sin desplazamiento
 * horizontal, e interacciones reales: comprobar una lección, practicar, cumplir una misión,
 * avanzar en la clase y en un recorrido paso a paso.
 */

const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PAGES = [
  '/sections/consultas-relacionales',
  '/sections/consultas-relacionales/study',
  '/sections/consultas-relacionales/study/left-outer-join',
  '/sections/consultas-relacionales/study/group-by',
  '/sections/consultas-relacionales/practice',
  '/sections/consultas-relacionales/challenge',
  '/sections/consultas-relacionales/resources',
  '/sections/plsql',
  '/sections/plsql/study',
  '/sections/plsql/study/old-y-new',
  '/sections/plsql/study/cursor-explicito',
  '/sections/plsql/practice',
  '/sections/plsql/challenge',
  '/sections/plsql/resources',
  '/sections/fundamentos-sql/study/funciones-de-texto',
  '/learn',
  '/modules',
] as const;

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
] as const;

const RESPONSIVE_PAGES = [
  '/sections/consultas-relacionales/study/left-outer-join',
  '/sections/consultas-relacionales/study/join-group-by-having',
  '/sections/consultas-relacionales/practice',
  '/sections/plsql/study/old-y-new',
  '/sections/plsql/study/variables-y-constantes',
  '/sections/plsql/challenge',
  '/sections/fundamentos-sql/study/fechas-y-nvl',
] as const;

test.describe('Fase 4 · accesibilidad', () => {
  for (const path of PAGES) {
    test(`${path} no tiene infracciones WCAG 2.2 AA`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
      expect(results.violations, path).toEqual([]);
    });
  }

  for (const section of ['consultas-relacionales', 'plsql']) {
    test(`la clase de ${section} no tiene infracciones WCAG 2.2 AA`, async ({ page }) => {
      await page.goto(`/sections/${section}/class?scene=5`);
      await expect(page.locator('.scene').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Fase 4 · matriz responsive', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.width} × ${viewport.height}: sin desplazamiento horizontal`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      for (const path of RESPONSIVE_PAGES) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expectNoHorizontalScroll(page, `${path} @${viewport.width}`);
      }
    });
  }
});

// Todas las rutas publicadas, leídas del índice ligero (el cargador de Playwright no importa
// JSON sin atributo). El barrido de 320 px encontró identificadores largos que desbordaban.
const OUTLINE = JSON.parse(
  readFileSync(
    new URL('../../src/features/curriculum/application/outline.json', import.meta.url),
    'utf8',
  ),
) as {
  sections: { section: string; lessons: { slug: string }[] }[];
  extensions: { section: string; lessons: { slug: string }[] }[];
};
const ALL_ROUTES = [
  ...OUTLINE.sections.flatMap(({ section, lessons }) => [
    `/sections/${section}`,
    ...['study', 'practice', 'challenge', 'resources'].map(
      (mode) => `/sections/${section}/${mode}`,
    ),
    ...lessons.map((lesson) => `/sections/${section}/study/${lesson.slug}`),
  ]),
  ...OUTLINE.extensions.flatMap(({ section, lessons }) =>
    lessons.map((lesson) => `/sections/${section}/study/${lesson.slug}`),
  ),
];

test('a 320 × 640 ninguna ruta de la Fase 4 desborda ni tiene barras horizontales', async ({
  page,
}) => {
  test.setTimeout(ALL_ROUTES.length * 4_000);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ALL_ROUTES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page, `${path} @320`);
  }
});

test.describe('Fase 4 · interacciones', () => {
  test('una lección de triggers se comprueba y queda completada en el temario', async ({
    page,
  }) => {
    await page.goto('/sections/plsql/study/old-y-new');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(':OLD y :NEW');
    // El ejemplo muestra la auditoría con datos obtenidos en Oracle, sin presentarse en vivo.
    await expect(page.getByText('No es una ejecución en vivo').first()).toBeVisible();
    const check = page.locator('.mini-check', {
      hasText: '¿qué vale :NEW.salario?',
    });
    await check.getByRole('radio', { name: 'NULL', exact: true }).check();
    await check.getByRole('button', { name: 'Comprobar' }).click();
    await expect(check.locator('.mini-check__message--correct')).toBeVisible();

    await page.goto('/sections/plsql/study');
    const card = page.locator('li.cu-lesson-link', { hasText: ':OLD y :NEW' });
    await expect(card).toContainText('Completada');
  });

  test('una práctica de PL/SQL da retroalimentación al responder', async ({ page }) => {
    await page.goto('/sections/plsql/practice');
    const activity = page.locator('.mini-check', {
      hasText: '¿Qué tarea necesita PL/SQL y no se resuelve con una sola consulta SQL?',
    });
    await activity.getByRole('radio', { name: /Listar las personas de TI/ }).check();
    await activity.getByRole('button', { name: 'Comprobar' }).click();
    await expect(activity.locator('.mini-check__message--wrong')).toBeVisible();
    await activity.getByRole('radio', { name: /Recorrer a las personas de un área/ }).check();
    await activity.getByRole('button', { name: 'Comprobar' }).click();
    await expect(activity.locator('.mini-check__message--correct')).toBeVisible();
  });

  test('una misión del Challenge de PL/SQL se cumple con 100 puntos', async ({ page }) => {
    await page.goto('/sections/plsql/challenge');
    await page
      .locator('li', { hasText: 'Variables con ancla' })
      .getByRole('button', { name: 'Empezar' })
      .click();
    await expect(page.getByRole('heading', { name: 'Variables con ancla' })).toBeVisible();
    await page.getByLabel('Número de líneas').fill('3');
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Siguiente paso →' }).click();
    await page.getByRole('radio', { name: 'v_fila empleados%ROWTYPE;' }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Misión cumplida' })).toContainText(
      '100',
    );
  });

  test('la clase de la Sección 2 avanza de escena y conserva la posición en la URL', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/sections/consultas-relacionales/class');
    await expect(page.locator('.scene').first()).toHaveAttribute('data-scene', '1');
    await page.getByRole('button', { name: 'Escena siguiente' }).click();
    await expect(page).toHaveURL(/scene=2/);
    await expect(page.locator('.scene').first()).toHaveAttribute('data-scene', '2');
  });

  test('el recorrido paso a paso de PL/SQL avanza línea a línea', async ({ page }) => {
    await page.goto('/sections/plsql/study/variables-y-constantes');
    const stepper = page.locator('.stepper').first();
    await expect(stepper).toContainText('Paso 1 de');
    await stepper.getByRole('button', { name: 'Paso siguiente →' }).click();
    await expect(stepper).toContainText('Paso 2 de');
  });

  test('la ampliación de funciones aparece en el temario de la Sección 1', async ({ page }) => {
    await page.goto('/learn');
    const block = page.getByRole('region', { name: 'Funciones de una fila' });
    await expect(block.getByRole('link')).toHaveCount(3);
    await block.getByRole('link', { name: /Funciones de texto/ }).click();
    await expect(page).toHaveURL(/\/sections\/fundamentos-sql\/study\/funciones-de-texto$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Funciones de texto');
  });

  test('el script del dataset relacional se descarga desde la aplicación', async ({ request }) => {
    const response = await request.get('/datasets/dblab-empresa-v1.sql');
    expect(response.ok()).toBe(true);
    const script = await response.text();
    expect(script).toContain('CREATE TABLE DEPARTAMENTOS');
    expect(script).toContain('CREATE TABLE AUDITORIA_SALARIOS');
  });
});
