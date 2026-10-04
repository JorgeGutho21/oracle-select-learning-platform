import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, watchConsole } from './support/layout';

const PAGES = [
  ['home', '/'],
  ['sections', '/sections'],
  ['section-1', '/sections/fundamentos-sql'],
  ['section-2', '/sections/consultas-relacionales'],
  ['section-3', '/sections/plsql'],
  ['login', '/login'],
  ['presentation', '/presentation'],
  ['lab', '/lab'],
  ['challenge', '/challenge'],
] as const;
const WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1536, 1600, 1920, 2560];

for (const width of WIDTHS) {
  test(`Fase 5: páginas públicas y tablas a ${width}px`, async ({ page }) => {
    test.setTimeout(PAGES.length * 10_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    const errors = watchConsole(page);
    const failedRequests: { path: string; error: string | undefined }[] = [];
    page.on('requestfailed', (request) => {
      failedRequests.push({
        path: new URL(request.url()).pathname,
        error: request.failure()?.errorText,
      });
    });
    for (const [name, path] of PAGES) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.locator('img[src*="universidad-popular-del-cesar"]')).toHaveCount(0);
      await expectNoHorizontalScroll(page, `${path} @${width}`);
      if ([390, 1440].includes(width)) {
        mkdirSync('output/playwright/phase5/screens', { recursive: true });
        await page.screenshot({
          path: `output/playwright/phase5/screens/${name}-${width}.png`,
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
    expect(errors, JSON.stringify(failedRequests)).toEqual([]);
  });
}

for (const scale of [1.25, 1.5, 2]) {
  test(`Fase 5: reflujo equivalente a zoom ${scale * 100}%`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({
      width: Math.floor(1280 / scale),
      height: Math.floor(900 / scale),
    });
    for (const path of ['/sections', '/login', '/sections/plsql/study/old-y-new', '/lab']) {
      await page.goto(path);
      await expectNoHorizontalScroll(page, `${path}: reflujo ${scale}`);
    }
  });
}

test('Fase 5: acceso y secciones cumplen axe WCAG 2.2 AA', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/sections',
    '/sections/fundamentos-sql',
    '/sections/consultas-relacionales',
    '/sections/plsql',
    '/lab',
    '/challenge',
    '/resources',
  ]) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations, path).toEqual([]);
    test.info().annotations.push({ type: 'axe WCAG 2.2 AA', description: path });
  }
});
