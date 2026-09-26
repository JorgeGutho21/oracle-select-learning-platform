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
 * Reproductor real: controles nativos, sin reproducción automática ni descarga previa,
 * portada y la proporción del archivo, sin rótulos de duración. Con `play`, reproduce silenciado y
 * comprueba que avanza; si el navegador no decodifica H.264, debe mostrar el error y el
 * enlace alternativo en lugar de un marco vacío.
 */
async function expectVideo(
  page: Page,
  player: Locator,
  { url, ratio, play = false }: { url: string; ratio: number; play?: boolean },
) {
  await expect(player).not.toContainText('Video en preparación');
  await expect(
    player.getByRole('link', { name: 'Abrir el video en una pestaña nueva' }),
  ).toHaveAttribute('href', url);
  const video = player.locator('video');
  await expect(video).toHaveAttribute('src', url);
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('poster', url.replace(/\.mp4$/, '.jpg'));
  await expect(video).not.toHaveAttribute('autoplay');
  await expect(player.getByRole('status')).toHaveCount(0);
  // La duración no se muestra: el reproductor nativo ya la indica.
  await expect(player).not.toContainText('Duración');
  const frame = await player.locator('.video-player__frame').boundingBox();
  expect(frame!.width / frame!.height).toBeCloseTo(ratio, 1);
  if (!play) return;
  await video.evaluate((element: HTMLVideoElement) => {
    element.muted = true;
    void element.play().catch(() => undefined);
  });
  if (await playsH264(page)) {
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0.2);
    await video.evaluate((element: HTMLVideoElement) => element.pause());
    await expect(player.getByRole('status')).toHaveCount(0);
    await expect(player.getByRole('alert')).toHaveCount(0);
  } else {
    await expect(player.getByRole('alert')).toContainText('No se pudo cargar el video');
  }
}

test.describe('Videos de la unidad', () => {
  test('el video introductorio está en la Home y al inicio del recorrido', async ({ page }) => {
    await page.goto('/');
    const intro = { url: INTRO, ratio: 9 / 16 };
    await expectVideo(
      page,
      page.locator('.video-player').filter({ hasText: 'Video introductorio' }),
      { ...intro, play: true },
    );
    await page.goto('/learn');
    const start = page.getByRole('region', { name: 'La misma estructura, doce partes' });
    await expectVideo(page, start.locator('.video-player'), intro);
  });

  test('el video resumen está al final del recorrido y en la escena 26', async ({
    page,
    browserName,
  }) => {
    const summary = { url: SUMMARY, ratio: 16 / 9 };
    await page.goto('/learn/errores-frecuentes');
    const closing = page.getByRole('region', { name: 'Repasa y pon a prueba lo aprendido' });
    await expectVideo(page, closing.locator('.video-player'), { ...summary, play: true });

    // Subtítulos en español activos por defecto, sincronizados con el audio.
    const track = closing.locator('video track');
    await expect(track).toHaveAttribute('kind', 'captions');
    await expect(track).toHaveAttribute('srclang', 'es');
    await expect(track).toHaveAttribute('src', SUMMARY.replace(/\.mp4$/, '.es.vtt'));
    const video = closing.locator('video');
    // Chromium y Edge activan la pista marcada como predeterminada. Safari sigue la preferencia
    // de subtítulos del sistema y la ofrece en el menú del reproductor: se activa como allí.
    if (browserName === 'webkit') {
      await video.evaluate((element: HTMLVideoElement) => {
        element.textTracks[0]!.mode = 'showing';
      });
    }
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.textTracks[0]?.cues?.length ?? 0),
      )
      .toBeGreaterThan(80);
    const captions = await video.evaluate((element: HTMLVideoElement) => {
      const tracks = element.textTracks[0]!;
      const at = (time: number) =>
        [...(tracks.cues ?? [])]
          .filter((cue) => cue.startTime <= time && cue.endTime >= time)
          .map((cue) => (cue as VTTCue).text)
          .join(' ');
      return { mode: tracks.mode, goldenRule: at(50), distinct: at(225) };
    });
    expect(captions.mode).toBe('showing');
    expect(captions.goldenRule).toContain('regla de oro');
    expect(captions.distinct).toContain('DISTINCT');
    const transcript = closing.getByRole('link', { name: 'Leer la transcripción' });
    const response = await page.request.get((await transcript.getAttribute('href'))!);
    expect(response.headers()['content-type']).toContain('charset=utf-8');
    expect(await response.text()).toContain('SELECT elige las columnas y FROM elige la tabla.');

    await page.goto('/learn/distinct');
    await expect(
      page.getByRole('region', { name: 'Repasa y pon a prueba lo aprendido' }),
    ).toHaveCount(0);

    await page.goto('/presentation?scene=26');
    await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
    const scene = page.locator('[data-scene="26"] .video-player');
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
    });
    await expectVideo(page, page.locator('#video-resumen'), {
      url: SUMMARY,
      ratio: 16 / 9,
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
