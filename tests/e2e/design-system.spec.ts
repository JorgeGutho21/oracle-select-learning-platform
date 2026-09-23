import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const showcasePath = '/dev/design-system';
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  // Reflow equivalente a zoom 200 % en ventanas de 360 y 1440 píxeles.
  { width: 180, height: 400 },
  { width: 720, height: 450 },
] as const;

for (const viewport of viewports) {
  test(`los componentes se adaptan a ${viewport.width} × ${viewport.height} sin scroll global`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(showcasePath);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      overflow: Array.from(document.querySelectorAll('body *'))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.right > innerWidth + 1 &&
            !element.closest('.ds-table-scroll, .ds-code__pre')
          );
        })
        .map((element) => ({ tag: element.tagName, class: element.className })),
    }));
    expect(dimensions.document, JSON.stringify(dimensions.overflow)).toBeLessThanOrEqual(
      dimensions.viewport + 1,
    );
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);

    const controls = await page
      .getByRole('main')
      .locator('button, input[type="search"]')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.getClientRects().length > 0)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label: element.getAttribute('aria-label') ?? element.textContent,
              width: rect.width,
              height: rect.height,
              fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
            };
          }),
      );
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.width, String(control.label)).toBeGreaterThanOrEqual(44);
      expect(control.height, String(control.label)).toBeGreaterThanOrEqual(44);
      expect(control.fontSize, String(control.label)).toBeGreaterThanOrEqual(16);
    }

    if (testInfo.project.name === 'chromium') {
      await page.screenshot({
        path: testInfo.outputPath(`design-system-${viewport.width}.png`),
        fullPage: true,
      });
    }
  });
}

for (const width of [360, 1440]) {
  test(`la muestra cumple las comprobaciones automáticas WCAG AA a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(showcasePath);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('las pestañas conservan selección, foco y panel asociado al navegar con teclado', async ({
  page,
}) => {
  await page.goto(showcasePath);
  const tabs = page.getByRole('main').getByRole('tab');
  const count = await tabs.count();
  expect(count).toBeGreaterThan(1);

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);

  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
});

test('la preferencia de movimiento reducido detiene animaciones no esenciales', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(showcasePath);

  const animatedElements = await page.getByRole('main').evaluate((main) =>
    Array.from(main.querySelectorAll('*'))
      .filter((element) => element.getClientRects().length > 0)
      .filter((element) => {
        const style = getComputedStyle(element);
        const durations = [style.animationDuration, style.transitionDuration]
          .join(',')
          .split(',')
          .map((duration) => Number.parseFloat(duration));
        return durations.some((duration) => duration > 0.01);
      })
      .map((element) => element.tagName),
  );

  expect(animatedElements).toEqual([]);
});
