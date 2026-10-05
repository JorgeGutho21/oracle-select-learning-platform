import { mkdirSync, readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  expectFlowRegionsDoNotOverlap,
  expectNoHorizontalScroll,
  watchConsole,
} from './support/layout';

const OUTLINE = JSON.parse(
  readFileSync(
    new URL('../../src/features/curriculum/application/outline.json', import.meta.url),
    'utf8',
  ),
) as {
  sections: { section: string; scenes: number; classLessonScenes: Record<string, number> }[];
};
const WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1536, 1600, 1920, 2560];
const SHOTS = [390, 768, 1366, 1440, 1920];
const PUBLIC = [
  ['home', '/'],
  ['sections', '/sections'],
  ['s1', '/sections/fundamentos-sql'],
  ['s2', '/sections/consultas-relacionales'],
  ['s3', '/sections/plsql'],
  ['s2-intro', '/sections/consultas-relacionales/study/claves-primarias-y-foraneas'],
  ['s3-intro', '/sections/plsql/study/sql-y-plsql'],
  ['s2-study', '/sections/consultas-relacionales/study'],
  ['s3-study', '/sections/plsql/study'],
  ['s2-practice', '/sections/consultas-relacionales/practice'],
  ['s3-practice', '/sections/plsql/practice'],
  ['s2-challenge', '/sections/consultas-relacionales/challenge'],
  ['s3-challenge', '/sections/plsql/challenge'],
  ['resources', '/resources'],
  ['s2-resources', '/sections/consultas-relacionales/resources'],
  ['s3-resources', '/sections/plsql/resources'],
  ['login', '/login'],
] as const;

for (const width of WIDTHS)
  test(`Pedagogy/UI: public routes @${width}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = watchConsole(page);
    for (const [name, path] of PUBLIC) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expectNoHorizontalScroll(page, `${path} @${width}`);
      await expectFlowRegionsDoNotOverlap(page, `${path} @${width}`);
      if (SHOTS.includes(width) && info.project.name === 'chromium') {
        mkdirSync('output/playwright/pedagogy-ui/screens', { recursive: true });
        await page.screenshot({
          path: `output/playwright/pedagogy-ui/screens/${name}-${width}-${info.project.name}.png`,
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
    expect(errors).toEqual([]);
  });

for (const width of SHOTS)
  for (const section of OUTLINE.sections) {
    test(`Pedagogy/UI: every ${section.section} scene @${width}`, async ({ page }, info) => {
      test.setTimeout(section.scenes * 3500);
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors = watchConsole(page);
      await page.goto(`/sections/${section.section}/class?scene=1`);
      await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
      const stepToggle = page.getByRole('button', { name: 'Paso a paso', exact: true });
      if ((await stepToggle.getAttribute('aria-pressed')) === 'true') await stepToggle.click();
      for (let number = 1; number <= section.scenes; number++) {
        const scene = page.locator(`.scene[data-scene="${number}"]`);
        await expect(scene).toBeVisible();
        await expectNoHorizontalScroll(
          page,
          `${section.section} scene ${number} @${width}`,
          '.deck',
        );
        await expectFlowRegionsDoNotOverlap(
          page,
          `${section.section} scene ${number} @${width}`,
          '.deck',
        );
        const collision = await scene.evaluate((element) => {
          const header = element.querySelector('.scene__header')!.getBoundingClientRect();
          const main = element.querySelector('.scene__main')!.getBoundingClientRect();
          const takeaway = element.querySelector('.scene-takeaway')?.getBoundingClientRect();
          return {
            titleIntoMain: Math.max(0, header.bottom - main.top),
            mainIntoTakeaway: takeaway ? Math.max(0, main.bottom - takeaway.top) : 0,
          };
        });
        expect(
          collision.titleIntoMain,
          `${section.section}/${number}: title collision`,
        ).toBeLessThanOrEqual(1);
        expect(
          collision.mainIntoTakeaway,
          `${section.section}/${number}: takeaway collision`,
        ).toBeLessThanOrEqual(1);
        // Un details cerrado mantiene geometría en Chromium, pero no está pintado.
        // También se comprueba su contenido abierto: no se oculta un desborde con el pliegue.
        for (const fold of await scene.locator('details').all()) {
          if ((await fold.getAttribute('open')) !== null) continue;
          const summary = fold.locator(':scope > summary');
          if (!(await summary.isVisible())) continue;
          await summary.click();
          await expectNoHorizontalScroll(
            page,
            `${section.section}/${number}: disclosure @${width}`,
            '.deck',
          );
          await expectFlowRegionsDoNotOverlap(
            page,
            `${section.section}/${number}: disclosure @${width}`,
            '.deck',
          );
          await summary.click();
        }
        if (number === 1 && info.project.name === 'chromium') {
          mkdirSync('output/playwright/pedagogy-ui/screens', { recursive: true });
          await page.screenshot({
            path: `output/playwright/pedagogy-ui/screens/${section.section}-class-${width}-${info.project.name}.png`,
            fullPage: true,
            animations: 'disabled',
          });
        }
        if (number < section.scenes)
          await page.getByRole('button', { name: 'Escena siguiente', exact: true }).click();
      }
      expect(errors).toEqual([]);
    });
  }

test('Pedagogy/UI: a beginner finds the definition, small example, result and practice', async ({
  page,
}) => {
  for (const path of [
    '/sections/consultas-relacionales/study/modelo-mental-del-join',
    '/sections/plsql/study/sql-y-plsql',
    '/sections/plsql/study/cursor-explicito',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path}: real route`).toBe(200);
    await expect(page.locator('.cu-definition').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Antes de empezar' })).toBeVisible();
    await expect(page.getByText('Primero, un ejemplo pequeño', { exact: true })).toBeVisible();
    await expect(page.locator('.cu-lesson__main .cu-example__reading')).toBeVisible();
    await expect(page.locator('.cu-activity')).toBeVisible();
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
});

test('Pedagogy/UI: resources filter, block disclosure and Oracle technical detail are usable', async ({
  page,
}) => {
  await page.goto('/sections/consultas-relacionales/resources');
  const filter = page.getByRole('group', { name: 'Tipo de recurso' });
  await filter.getByRole('button', { name: 'Oracle oficial', exact: true }).click();
  await expect(filter.getByRole('button', { name: 'Oracle oficial', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.cu-resource__facts').first()).not.toBeVisible();
  await expect(page.locator('[data-resource-kind="reference"]').first()).toBeVisible();
  await filter.getByRole('button', { name: 'Todo', exact: true }).click();
  await page.goto('/sections/consultas-relacionales/study/columnas-de-varias-tablas');
  await page
    .locator('summary', { hasText: 'Error esperado: una columna tiene dos orígenes posibles.' })
    .click();
  const error = page.locator('.cu-oracle-error');
  await expect(error.locator('.cu-oracle-error__title')).toContainText('Hay una columna ambigua');
  const detail = error.getByText('Detalle técnico de Oracle: ORA-00918', { exact: true });
  await detail.click();
  await expect(error.locator('.cu-oracle-error__message')).toContainText('ORA-00918');
});

test('Pedagogy/UI: JOIN and cursor search connect study, class, practice, Challenge and resources', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const palette = page.getByRole('dialog', { name: 'Buscar en DB LAB' });
  for (const term of ['JOIN', 'cursor']) {
    await palette.getByRole('combobox').fill(term);
    await expect(palette.getByRole('group', { name: 'Lecciones' })).toBeVisible();
    for (const label of ['· Clase', '· Práctica guiada', '· Bloques de retos', '· Referencia']) {
      await expect(
        palette.getByRole('option').filter({ hasText: label }).first(),
        `${term}: ${label}`,
      ).toBeVisible();
    }
  }
  await palette.getByRole('option').filter({ hasText: 'Cursor explícito · Clase' }).click();
  await expect(page).toHaveURL(/\/sections\/plsql\/class\?scene=\d+/);
  await expect(page.locator('.cu-scene--definition')).toBeVisible();
  await expect(page.locator('.scene__title')).toContainText(/cursor/i);
});

test('Pedagogy/UI: mobile class controls leave the lesson clear and return to its beginning', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sections/consultas-relacionales/class?scene=95');
  await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
  await expectFlowRegionsDoNotOverlap(page, 'Long mobile comparison and class controls', '.deck');
  const next = page.getByRole('button', { name: 'Escena siguiente', exact: true });
  await next.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await next.click();
  await expect(page.locator('.scene[data-scene="96"] .scene__title')).toBeInViewport();
  await expect(page.locator('.scene[data-scene="96"] .scene__title')).toBeFocused();
  await expectFlowRegionsDoNotOverlap(page, 'Next mobile class scene and controls', '.deck');
});

test('Pedagogy/UI: the decorative canvas rests after interaction and with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const grid = page.locator('canvas.fx-shape-grid').first();
  await expect(grid).toHaveAttribute('data-ready', 'true');
  await expect(grid).toHaveAttribute('data-effect-active', 'false');
  await page.locator('.home-hero').hover({ position: { x: 20, y: 20 } });
  await expect(grid).toHaveAttribute('data-effect-active', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(grid).toHaveAttribute('data-ready', 'true');
  await expect(grid).toHaveAttribute('data-effect-active', 'false');
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0);
});
