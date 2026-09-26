import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const SCENE_TOTAL = 29;

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
    await expectScene(page, 2, 'Ruta de aprendizaje');

    await page.locator('body').press('ArrowRight');
    await expectScene(page, 3, 'Qué es SQL');
    await page.locator('body').press('PageDown');
    await expectScene(page, 4, 'Conoce EMPLEADOS');
    await page.locator('body').press('ArrowLeft');
    await expectScene(page, 3, 'Qué es SQL');
    await page.getByRole('button', { name: 'Escena anterior' }).click();
    await expectScene(page, 2, 'Ruta de aprendizaje');
    await page.locator('body').press('End');
    await expectScene(page, SCENE_TOTAL, '¿Preguntas?');
    await expect(page.getByRole('button', { name: 'Escena siguiente' })).toBeDisabled();
    await page.locator('body').press('Home');
    await expectScene(page, 1, 'SELECT en Oracle SQL');

    const selector = page.getByLabel('Ir a la escena');
    await expect(selector.locator('option')).toHaveCount(SCENE_TOTAL);
    await selector.selectOption('10');
    await expectScene(page, 10, 'DISTINCT');
    await expect(page.getByRole('status').filter({ hasText: 'Escena 10 de' })).toHaveText(
      `Escena 10 de ${SCENE_TOTAL}: DISTINCT`,
    );
    await selector.selectOption('19');
    await expectScene(page, 19, 'ORDER BY');
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

  test('cada escena de filtro u orden muestra la tabla, la consulta y el resultado', async ({
    page,
  }) => {
    // WHERE, AND y OR, BETWEEN, IN, LIKE, NULL y ORDER BY: evidencia visual del cambio.
    for (const scene of [11, 13, 15, 16, 17, 18, 19]) {
      await openDeck(page, `/presentation?scene=${scene}`);
      const node = page.locator(`[data-scene="${scene}"]`);
      await expect(node.locator('.scene-code, .sql-code').first(), `escena ${scene}`).toBeVisible();
      await expect(node.locator('table').first(), `escena ${scene}`).toBeVisible();
      expect(await node.locator('table').count(), `escena ${scene}`).toBeGreaterThanOrEqual(1);
    }
  });

  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [1280, 720],
  ] as const) {
    test(`las ${SCENE_TOTAL} escenas caben en el lienzo 16:9 a ${width}×${height}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height });
      await openDeck(page, '/presentation?scene=1');
      for (let scene = 1; scene <= SCENE_TOTAL; scene += 1) {
        await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible();
        const metrics = await page.evaluate(() => {
          const stage = document.querySelector('.deck__stage')!.getBoundingClientRect();
          const node = document.querySelector<HTMLElement>('.scene')!;
          // Texto más pequeño de tablas y código: debe leerse desde el fondo del aula.
          const sizes = [...node.querySelectorAll<HTMLElement>('td, th, pre, code')]
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
          const clipped = [...node.querySelectorAll<HTMLElement>('*')].filter((element) => {
            const box = element.getBoundingClientRect();
            return (
              box.width > 0 &&
              (box.right > stage.right + 1 ||
                box.bottom > stage.bottom + 1 ||
                box.left < stage.left - 1)
            );
          }).length;
          return {
            ratio: stage.width / stage.height,
            overflowY: node.scrollHeight - node.clientHeight,
            overflowX: node.scrollWidth - node.clientWidth,
            pageX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            // Proporción del lienzo: en pantalla completa a 1920 px, 0,9 % son unos 17 px.
            minFont: sizes.length ? Math.min(...sizes) / stage.width : null,
            clipped,
            // Tablas y código con desplazamiento propio: en el proyector se verían cortados.
            scrolled: [...node.querySelectorAll<HTMLElement>('[role="region"], pre')]
              .filter((element) => element.scrollWidth > element.clientWidth + 1)
              .map((element) => element.getAttribute('aria-label') ?? element.className),
          };
        });
        expect(metrics.scrolled, `escena ${scene}: contenido cortado`).toEqual([]);
        expect(metrics.ratio, `escena ${scene}`).toBeCloseTo(16 / 9, 1);
        expect(metrics.overflowY, `escena ${scene}`).toBeLessThanOrEqual(1);
        expect(metrics.overflowX, `escena ${scene}`).toBeLessThanOrEqual(1);
        expect(metrics.pageX, `escena ${scene}`).toBeLessThanOrEqual(0);
        expect(metrics.clipped, `escena ${scene}: elementos fuera del lienzo`).toBe(0);
        if (metrics.minFont !== null) {
          expect(
            metrics.minFont,
            `escena ${scene}: texto de tabla o código respecto del ancho del lienzo`,
          ).toBeGreaterThanOrEqual(0.009);
        }
        if (scene < SCENE_TOTAL) await page.locator('body').press('ArrowRight');
      }
    });
  }

  test('el laboratorio vuelve a la misma escena (U01)', async ({ page }) => {
    await openDeck(page, '/presentation?scene=23');
    await expect(await sceneTitle(page)).toHaveText('Laboratorio');
    await page.getByRole('link', { name: /Abrir en el laboratorio/ }).click();
    await expect(page).toHaveURL(/\/lab\?/);
    await page.getByRole('link', { name: /Volver a la escena/ }).click();
    await expectScene(page, 23, 'Laboratorio');
  });

  test('el reto revela su respuesta, el QR abre la práctica y enlaza la sala en vivo', async ({
    page,
  }) => {
    await openDeck(page, '/presentation?scene=27');
    await expect(await sceneTitle(page)).toHaveText('Reto en vivo');
    await page.getByRole('button', { name: 'Revelar respuesta' }).click();
    const answer = page.getByRole('status').filter({ hasText: '5 filas' });
    for (const department of ['Operaciones', 'TI', 'Recursos Humanos', 'Ventas', 'Finanzas']) {
      await expect(answer).toContainText(department);
    }
    await expect(
      page.getByRole('img', { name: /Código QR que abre .*\/challenge$/ }),
    ).toBeVisible();
    await expect(
      page.getByText('Para jugar todos juntos, crea una sala en', { exact: false }),
    ).toBeVisible();
    await expect(
      page.locator('.scene-qr').getByRole('link', { name: 'Sala en vivo' }),
    ).toHaveAttribute('href', '/presenter');
  });

  test('los próximos temas enlazan con la ruta y no se presentan como contenido actual', async ({
    page,
  }) => {
    await openDeck(page, '/presentation?scene=28');
    await expect(await sceneTitle(page)).toHaveText('Próximos temas');
    const scene = page.locator('[data-scene="28"]');
    await expect(scene).toContainText('JOIN');
    await expect(scene.getByRole('link', { name: 'la ruta de aprendizaje' })).toHaveAttribute(
      'href',
      '/modules',
    );
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
  for (const scene of [1, 5, 9, 10, 11, 13, 17, 18, 19, 21, 23, 27, 28, 29]) {
    test(`la escena ${scene} cumple WCAG 2 AA`, async ({ page }) => {
      await openDeck(page, `/presentation?scene=${scene}`);
      await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `escena ${scene}`).toEqual([]);
    });
  }

  test('en móvil la escena fluye sin desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const scene of [1, 5, 9, 10, 14, 17, 19, 21, 27]) {
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
