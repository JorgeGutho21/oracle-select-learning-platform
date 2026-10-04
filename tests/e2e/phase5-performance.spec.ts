import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('Fase 5: medición reproducible de carga y presupuesto de efectos', async ({ browser }) => {
  test.setTimeout(60_000);
  const measurements = [];
  for (const path of ['/', '/lab', '/sections/plsql']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        const values = {
          lcp: 0,
          cls: 0,
          lcpSupported: PerformanceObserver.supportedEntryTypes.includes(
            'largest-contentful-paint',
          ),
          clsSupported: PerformanceObserver.supportedEntryTypes.includes('layout-shift'),
        };
        Object.assign(window, { phase5Vitals: values });
        if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
          new PerformanceObserver((list) => {
            values.lcp = list.getEntries().at(-1)?.startTime ?? 0;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }
        if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
          new PerformanceObserver((list) => {
            for (const item of list.getEntries()) {
              const shift = item as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) values.cls += shift.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
        }
      });
      await page.goto(path);
      // Realtime and prefetch are not a page-readiness contract. Wait for rendered
      // content/fonts and two painted frames, rather than global network silence.
      await expect(page.locator('main h1').first()).toBeVisible();
      // Include the dynamically loaded editor in the Lab's measured resources.
      if (path === '/lab')
        await expect(page.getByRole('textbox', { name: 'Consulta SQL' })).toHaveAttribute(
          'contenteditable',
          'true',
        );
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const scripts = resources.filter((entry) =>
          /\/_next\/static\/.*\.js(?:\?|$)/.test(entry.name),
        );
        const navigation = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming;
        const vitals = (
          window as unknown as {
            phase5Vitals: {
              lcp: number;
              cls: number;
              lcpSupported: boolean;
              clsSupported: boolean;
            };
          }
        ).phase5Vitals;
        return {
          ...vitals,
          lcp: vitals.lcpSupported ? vitals.lcp : null,
          cls: vitals.clsSupported ? vitals.cls : null,
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
          jsResources: scripts.length,
          jsEncodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
          canvasCount: document.querySelectorAll('canvas').length,
          activeAnimations: document
            .getAnimations()
            .filter((animation) => animation.playState === 'running').length,
        };
      });
      expect(metrics.jsResources).toBeGreaterThan(0);
      expect(metrics.activeAnimations, 'Reduced motion must stop decorative animation').toBe(0);
      measurements.push({ path, ...metrics });
    } finally {
      // WebKit/Windows can stall context teardown while its native media session
      // owns the home video. Unload the document after recording the measurements.
      for (const page of context.pages()) await page.goto('about:blank');
      await context.close();
    }
  }
  mkdirSync('output/playwright/phase5', { recursive: true });
  writeFileSync(
    `output/playwright/phase5/performance-${test.info().project.name}.json`,
    JSON.stringify(
      {
        environment: 'local production build, 390px, reduced motion, no CPU/network throttling',
        measurements,
      },
      null,
      2,
    ),
  );
});
