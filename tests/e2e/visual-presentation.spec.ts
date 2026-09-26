import { expect, test } from '@playwright/test';
import { attachShot, expectNoHorizontalScroll, watchConsole } from './support/layout';

/**
 * Regresión visual de la Exposición: las escenas clave en tres tamaños de aula y en móvil.
 * Comprueba invariantes de diseño (nada se sale del lienzo, sin barras, sin texto
 * recortado ni diminuto) y adjunta la captura de cada escena para la revisión humana.
 */

const KEY_SCENES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 28];

for (const [width, height] of [
  [1920, 1080],
  [1366, 768],
  [390, 844],
] as const) {
  test(`escenas clave a ${width}×${height}`, async ({ page }, testInfo) => {
    test.setTimeout(KEY_SCENES.length * 6_000);
    const problems = watchConsole(page);
    await page.setViewportSize({ width, height });
    await page.goto(`/presentation?scene=${KEY_SCENES[0]}`);
    await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
    for (const scene of KEY_SCENES) {
      await page.goto(`/presentation?scene=${scene}`);
      const node = page.locator(`[data-scene="${scene}"]`);
      await expect(node).toBeVisible();
      await expectNoHorizontalScroll(page, `escena ${scene} a ${width}`, '.deck');
      if (width >= 768) {
        // En el lienzo 16:9 ningún bloque invade el título ni la idea clave.
        const spill = await page.evaluate(() => {
          const main = document.querySelector('.scene__main')!.getBoundingClientRect();
          let worst = 0;
          for (const element of document.querySelectorAll('.scene__main *')) {
            const box = element.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) continue;
            worst = Math.max(worst, box.bottom - main.bottom, main.top - box.top);
          }
          return worst;
        });
        expect(spill, `escena ${scene}: contenido fuera de su zona`).toBeLessThanOrEqual(1);
      }
      await attachShot(page, testInfo, `escena-${String(scene).padStart(2, '0')}-${width}`);
    }
    expect(problems).toEqual([]);
  });
}

test('la pantalla completa oculta la navegación del sitio y atenúa los controles', async ({
  page,
}) => {
  await page.goto('/presentation?scene=5');
  await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Pantalla completa' }).click();
  const entered = await page
    .waitForFunction(() => document.fullscreenElement?.classList.contains('deck'), null, {
      timeout: 3_000,
    })
    .then(() => true)
    .catch(() => false);
  test.skip(!entered, 'El navegador de pruebas no concede la pantalla completa.');
  // Solo el lienzo y sus controles: la exposición ocupa toda la pantalla (sin la cabecera
  // ni el pie del sitio, que quedan fuera del elemento en pantalla completa).
  const fills = await page.evaluate(() => {
    const deck = document.fullscreenElement!.getBoundingClientRect();
    const header = document.querySelector('.site-header')!;
    return {
      width: Math.round(deck.width) === innerWidth,
      height: Math.round(deck.height) === innerHeight,
      headerInside: document.fullscreenElement!.contains(header),
    };
  });
  expect(fills).toEqual({ width: true, height: true, headerInside: false });
  await expect(page.getByRole('button', { name: 'Escenas' })).toBeVisible();
  // Tras unos segundos sin actividad, los controles se atenúan y vuelven con el teclado.
  await expect(page.locator('.deck')).toHaveAttribute('data-idle', 'true', { timeout: 6_000 });
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.deck')).not.toHaveAttribute('data-idle', 'true');
  await expect(page).toHaveURL(/scene=6$/);
});
