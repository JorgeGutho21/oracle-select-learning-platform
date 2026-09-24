import { expect, test, type Locator } from '@playwright/test';

async function expectPlaceholder(video: Locator, duration: string) {
  await expect(video).toContainText('Video en preparación');
  await expect(video).toContainText(`Duración prevista: ${duration}`);
  await expect(video.locator('iframe, video')).toHaveCount(0);
  const ratio = await video
    .locator('.video-player__frame')
    .evaluate(
      (frame) => frame.getBoundingClientRect().width / frame.getBoundingClientRect().height,
    );
  expect(ratio).toBeCloseTo(16 / 9, 1);
}

test.describe('Videos de la unidad', () => {
  test('el video introductorio está en la Home y al inicio del recorrido', async ({ page }) => {
    await page.goto('/');
    await expectPlaceholder(
      page.locator('.video-player').filter({ hasText: 'Video introductorio' }),
      '1:30–2:00',
    );
    await page.goto('/learn');
    const start = page.getByRole('region', { name: 'Antes de la primera lección' });
    await expectPlaceholder(start.locator('.video-player'), '1:30–2:00');
  });

  test('el video resumen está al final del recorrido y en la escena 14', async ({ page }) => {
    await page.goto('/learn/consulta-completa');
    const closing = page.getByRole('region', { name: 'Repasa toda la unidad' });
    await expectPlaceholder(closing.locator('.video-player'), '3:00–4:00');
    await page.goto('/learn/distinct');
    await expect(page.getByRole('region', { name: 'Repasa toda la unidad' })).toHaveCount(0);

    await page.goto('/presentation?scene=14');
    await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
    await expectPlaceholder(page.locator('[data-scene="14"] .video-player'), '3:00–4:00');
  });

  test('en móvil el reproductor conserva 16:9 sin desbordar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/resources');
    await expectPlaceholder(page.locator('#video-resumen'), '3:00–4:00');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
