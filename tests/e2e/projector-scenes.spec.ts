import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * Clase proyectada de las secciones 2 y 3: en los cuatro tamaños de proyector, ninguna escena
 * necesita desplazamiento interno, tampoco en el último paso de un recorrido PL/SQL (la salida
 * de DBMS_OUTPUT y las variables crecen paso a paso). Si una escena no cabe, se divide o se
 * recompone; nunca se reduce la letra por debajo de los mínimos del sistema.
 */

const OUTLINE = JSON.parse(
  readFileSync(
    new URL('../../src/features/curriculum/application/outline.json', import.meta.url),
    'utf8',
  ),
) as { sections: { section: string; scenes: number }[] };

const PROJECTORS = [
  [1920, 1080],
  [1366, 768],
  [1280, 720],
  [1024, 768],
] as const;

/** Mayor desplazamiento vertical interno dentro del lienzo de la escena. */
function internalScroll(page: Page) {
  return page.evaluate(() => {
    let worst = 0;
    for (const element of document.querySelectorAll<HTMLElement>('.deck__stage, .deck__stage *')) {
      if (!/auto|scroll/.test(getComputedStyle(element).overflowY)) continue;
      worst = Math.max(worst, element.scrollHeight - element.clientHeight);
    }
    return worst;
  });
}

for (const [width, height] of PROJECTORS)
  for (const { section, scenes } of OUTLINE.sections) {
    test(`${section}: las ${scenes} escenas caben sin desplazamiento a ${width}×${height}`, async ({
      page,
    }) => {
      test.setTimeout(scenes * 2_500);
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/sections/${section}/class?scene=1`);
      await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
      for (let number = 1; number <= scenes; number++) {
        await expect(page.locator(`.scene[data-scene="${number}"]`)).toBeVisible();
        expect(await internalScroll(page), `escena ${number}`).toBeLessThanOrEqual(1);
        const next = page.locator('.deck__stage .stepper button', { hasText: 'Paso siguiente' });
        if ((await next.count()) > 0) {
          let step = 1;
          while (await next.isEnabled()) {
            await next.click();
            step += 1;
            expect(
              await internalScroll(page),
              `escena ${number}, paso ${step}`,
            ).toBeLessThanOrEqual(1);
          }
        }
        if (number < scenes) await page.locator('body').press('ArrowRight');
      }
    });
  }
