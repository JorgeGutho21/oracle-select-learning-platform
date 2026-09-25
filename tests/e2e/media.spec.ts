import { expect, test, type Locator, type Page } from '@playwright/test';

const INTRO = '/media/introduccion-select-oracle-sql.mp4';
const SUMMARY = '/media/resumen-fundamentos-oracle-sql.mp4';

/** Chromium de Playwright no incluye H.264; Edge y Safari sí. */
async function playsH264(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.createElement('video').canPlayType('video/mp4; codecs="avc1.64001F, mp4a.40.2"') !==
      '',
  );
}

/**
 * Reproductor real: controles nativos, sin reproducción automática, portada y la
 * proporción del archivo. Si el navegador no decodifica H.264, debe mostrar el error y el
 * enlace alternativo en lugar de un marco vacío.
 */
async function expectVideo(
  page: Page,
  player: Locator,
  { url, ratio, duration }: { url: string; ratio: number; duration: string },
) {
  await expect(player).not.toContainText('Video en preparación');
  await expect(
    player.getByRole('link', { name: 'Abrir el video en una pestaña nueva' }),
  ).toHaveAttribute('href', url);
  if (await playsH264(page)) {
    const video = player.locator('video');
    await expect(video).toHaveAttribute('src', url);
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('poster', url.replace(/\.mp4$/, '.jpg'));
    await expect(video).not.toHaveAttribute('autoplay');
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBeGreaterThan(0);
    await expect(player.getByRole('status')).toHaveCount(0);
    await expect(player.getByRole('alert')).toHaveCount(0);
    await expect(player).toContainText(`Duración: ${duration}`);
  } else {
    await expect(player.getByRole('alert')).toContainText('No se pudo cargar el video');
  }
  const frame = await player.locator('.video-player__frame').boundingBox();
  expect(frame!.width / frame!.height).toBeCloseTo(ratio, 1);
}

test.describe('Videos de la unidad', () => {
  test('el video introductorio está en la Home y al inicio del recorrido', async ({ page }) => {
    await page.goto('/');
    const intro = { url: INTRO, ratio: 9 / 16, duration: '1:13' };
    await expectVideo(
      page,
      page.locator('.video-player').filter({ hasText: 'Video introductorio' }),
      intro,
    );
    await page.goto('/learn');
    const start = page.getByRole('region', { name: 'Antes de la primera lección' });
    await expectVideo(page, start.locator('.video-player'), intro);
  });

  test('el video resumen está al final del recorrido y en la escena 14', async ({ page }) => {
    const summary = { url: SUMMARY, ratio: 16 / 9, duration: '4:51' };
    await page.goto('/learn/consulta-completa');
    const closing = page.getByRole('region', { name: 'Repasa toda la unidad' });
    await expectVideo(page, closing.locator('.video-player'), summary);
    await page.goto('/learn/distinct');
    await expect(page.getByRole('region', { name: 'Repasa toda la unidad' })).toHaveCount(0);

    await page.goto('/presentation?scene=14');
    await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
    const scene = page.locator('[data-scene="14"] .video-player');
    await expect(scene.locator('video, [role="alert"]')).toHaveCount(1);
    const frame = await scene.locator('.video-player__frame').boundingBox();
    expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 1);
  });

  test('en móvil los reproductores conservan su proporción sin desbordar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/resources');
    await expectVideo(page, page.locator('#video-introduccion'), {
      url: INTRO,
      ratio: 9 / 16,
      duration: '1:13',
    });
    await expectVideo(page, page.locator('#video-resumen'), {
      url: SUMMARY,
      ratio: 16 / 9,
      duration: '4:51',
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('los archivos se sirven por rangos, como necesita Safari para avanzar', async ({
    request,
  }) => {
    for (const url of [INTRO, SUMMARY]) {
      const response = await request.get(url, { headers: { Range: 'bytes=0-1023' } });
      expect(response.status()).toBe(206);
      expect(response.headers()['content-type']).toBe('video/mp4');
      expect(response.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
      const poster = await request.get(url.replace(/\.mp4$/, '.jpg'));
      expect(poster.status()).toBe(200);
      expect(poster.headers()['content-type']).toBe('image/jpeg');
    }
  });
});
