import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [430, 932],
  [390, 844],
  [360, 800],
] as const;

const ROUTES = [
  '/',
  '/learn',
  '/learn/expresiones',
  '/presentation?scene=8',
  '/lab',
  '/challenge',
  '/resources',
] as const;

for (const [width, height] of VIEWPORTS) {
  test(`a ${width}×${height} el contenido usa el ancho disponible sin desbordar`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        // Contenedores de contenido: deben quedar centrados y ocupar su ancho máximo.
        const containers = [...document.querySelectorAll<HTMLElement>('main .site-container')]
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0);
        return {
          overflow: root.scrollWidth - root.clientWidth,
          clientWidth: root.clientWidth,
          containers: containers.map((rect) => ({
            left: rect.left,
            right: root.clientWidth - rect.right,
            width: rect.width,
          })),
        };
      });
      expect(layout.overflow, `${route}: desplazamiento horizontal`).toBeLessThanOrEqual(0);
      for (const container of layout.containers) {
        expect(
          Math.abs(container.left - container.right),
          `${route}: centrado`,
        ).toBeLessThanOrEqual(2);
        expect(container.width, `${route}: ancho útil`).toBeGreaterThanOrEqual(
          Math.min(1320, layout.clientWidth) - 2,
        );
      }
    }
  });
}

test('la barra de navegación cabe en una fila desde 992 px y se compacta por debajo', async ({
  page,
}) => {
  for (const width of [1920, 1366, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
    const header = await page.getByRole('banner').boundingBox();
    expect(header?.height, `${width}px`).toBeLessThanOrEqual(80);
  }
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden();
    await expect(page.locator('.mobile-menu summary')).toBeVisible();
    const header = await page.getByRole('banner').boundingBox();
    expect(header?.height, `${width}px`).toBeLessThanOrEqual(72);
  }
});

test('los controles táctiles de la barra miden al menos 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  for (const control of [
    page.getByRole('button', { name: 'Buscar' }),
    page.locator('.mobile-menu summary'),
    page.getByRole('link', { name: 'SQL SELECT LAB — Inicio' }),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
});
