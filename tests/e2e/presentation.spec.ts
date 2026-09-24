import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function sceneTitle(page: Page) {
  return page.locator('.scene__title');
}

/** Abre la exposición y espera a que React atienda teclado y controles. */
async function openDeck(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
}

async function expectScene(page: Page, number: number, title: string | RegExp) {
  await expect(page).toHaveURL(new RegExp(`/presentation\\?scene=${number}$`));
  await expect(await sceneTitle(page)).toHaveText(title);
  await expect(page.locator('.deck-progress')).toHaveAttribute('aria-valuenow', String(number));
  await expect(page.locator('.deck-counter strong')).toHaveText(String(number).padStart(2, '0'));
}

test.describe('Modo Exposición', () => {
  test.beforeEach(async ({ page }) => {
    await openDeck(page, '/presentation');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('se navega con botones, teclado y selector de escena', async ({ page }) => {
    await openDeck(page, '/presentation?scene=1');
    await expect(await sceneTitle(page)).toHaveText('SELECT en Oracle SQL');
    await expect(page.getByRole('button', { name: 'Escena anterior' })).toBeDisabled();

    await page.getByRole('button', { name: 'Escena siguiente' }).click();
    await expectScene(page, 2, 'Qué aprenderemos');

    await page.locator('body').press('ArrowRight');
    await expectScene(page, 3, 'Qué es SQL');
    await page.locator('body').press('PageDown');
    await expectScene(page, 4, 'La tabla EMPLEADOS');
    await page.locator('body').press('ArrowLeft');
    await expectScene(page, 3, 'Qué es SQL');
    await page.locator('body').press('End');
    await expectScene(page, 16, '¿Preguntas?');
    await expect(page.getByRole('button', { name: 'Escena siguiente' })).toBeDisabled();
    await page.locator('body').press('Home');
    await expectScene(page, 1, 'SELECT en Oracle SQL');

    await page.getByLabel('Ir a la escena').selectOption('10');
    await expectScene(page, 10, 'DISTINCT');
    await expect(page.getByRole('status').filter({ hasText: 'Escena 10 de 16' })).toHaveText(
      'Escena 10 de 16: DISTINCT',
    );
  });

  test('las flechas no cambian de escena con el buscador abierto', async ({ page }) => {
    await openDeck(page, '/presentation?scene=5');
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeEnabled();
    await page.keyboard.press('Control+k');
    const search = page.getByRole('dialog', { name: 'Buscar en SQL SELECT LAB' });
    await expect(search).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('PageDown');
    await expect(page).toHaveURL(/scene=5$/);
    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    await page.locator('body').press('ArrowRight');
    await expect(page).toHaveURL(/scene=6$/);
  });

  test('ofrece reanudar la última escena proyectada', async ({ page }) => {
    await openDeck(page, '/presentation?scene=7');
    await expect(await sceneTitle(page)).toHaveText('Columnas específicas');
    await openDeck(page, '/presentation');
    const resume = page.getByRole('region', { name: 'Reanudar la exposición' });
    await expect(resume).toContainText('7 · Columnas específicas');
    await resume.getByRole('button', { name: 'Continuar en la escena 7' }).click();
    await expectScene(page, 7, 'Columnas específicas');

    await openDeck(page, '/presentation');
    await page
      .getByRole('region', { name: 'Reanudar la exposición' })
      .getByRole('button', { name: 'Empezar desde la portada' })
      .click();
    await expect(page.getByRole('region', { name: 'Reanudar la exposición' })).toHaveCount(0);
    await expect(await sceneTitle(page)).toHaveText('SELECT en Oracle SQL');
  });

  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
  ] as const) {
    test(`las 16 escenas caben en el lienzo 16:9 a ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openDeck(page, '/presentation?scene=1');
      for (let scene = 1; scene <= 16; scene += 1) {
        await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible();
        const metrics = await page.evaluate(() => {
          const stage = document.querySelector('.deck__stage')!.getBoundingClientRect();
          const node = document.querySelector<HTMLElement>('.scene')!;
          return {
            ratio: stage.width / stage.height,
            overflowY: node.scrollHeight - node.clientHeight,
            overflowX: node.scrollWidth - node.clientWidth,
            pageX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        expect(metrics.ratio, `escena ${scene}`).toBeCloseTo(16 / 9, 1);
        expect(metrics.overflowY, `escena ${scene}`).toBeLessThanOrEqual(1);
        expect(metrics.overflowX, `escena ${scene}`).toBeLessThanOrEqual(1);
        expect(metrics.pageX, `escena ${scene}`).toBeLessThanOrEqual(0);
        if (scene < 16) await page.locator('body').press('ArrowRight');
      }
    });
  }

  test('el laboratorio vuelve a la misma escena (U01)', async ({ page }) => {
    await openDeck(page, '/presentation?scene=12');
    await page.getByRole('link', { name: /Abrir en el laboratorio/ }).click();
    await expect(page).toHaveURL(/\/lab\?/);
    await page.getByRole('link', { name: /Volver a la escena/ }).click();
    await expectScene(page, 12, 'Laboratorio');
  });

  test('el reto revela su respuesta y el QR abre la práctica individual', async ({ page }) => {
    await openDeck(page, '/presentation?scene=15');
    await page.getByRole('button', { name: 'Revelar respuesta' }).click();
    await expect(page.getByRole('status').filter({ hasText: '3 filas' })).toContainText(
      'Ventas, Sistemas, Contabilidad',
    );
    await expect(
      page.getByRole('img', { name: /Código QR que abre .*\/challenge$/ }),
    ).toBeVisible();
    await expect(
      page.getByText('La sala en vivo con código y ranking aún no está disponible.', {
        exact: false,
      }),
    ).toBeVisible();
  });

  test('la pantalla completa se activa por acción del usuario o avisa si se rechaza', async ({
    page,
  }) => {
    await openDeck(page, '/presentation?scene=3');
    const button = page.getByRole('button', { name: 'Pantalla completa' });
    await button.click();
    await expect
      .poll(
        async () =>
          (await button.getAttribute('aria-pressed')) === 'true' ||
          (await page.locator('.deck-notice').count()) > 0,
      )
      .toBe(true);
    await expect(await sceneTitle(page)).toHaveText('Qué es SQL');
  });

  // Una prueba por escena: cada análisis axe tiene su propio presupuesto de tiempo.
  for (const scene of [1, 5, 10, 11, 13, 14, 15]) {
    test(`la escena ${scene} cumple WCAG 2 AA`, async ({ page }) => {
      await openDeck(page, `/presentation?scene=${scene}`);
      await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `escena ${scene}`).toEqual([]);
    });
  }

  test('en móvil la escena fluye sin desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const scene of [1, 9, 10, 15]) {
      await openDeck(page, `/presentation?scene=${scene}`);
      await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `escena ${scene}`).toBeLessThanOrEqual(0);
    }
    await expect(page.getByRole('button', { name: 'Escena siguiente' })).toBeVisible();
  });
});
