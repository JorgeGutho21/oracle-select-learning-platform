import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/learn',
  '/presentation',
  '/lab',
  '/challenge',
  '/live',
  '/results',
  '/resources',
] as const;

for (const route of routes) {
  test(`la ruta base ${route} responde y mantiene la estructura accesible`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));

    const response = await page.goto(route);

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(browserErrors).toEqual([]);
  });
}

for (const width of [390, 1440]) {
  test(`la navegación permite recorrer las rutas y volver a Inicio a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    for (const route of routes.filter((path) => path !== '/')) {
      if (width === 390) await page.locator('.mobile-menu summary').click();
      const navigation = page.getByRole('navigation', {
        name: width === 390 ? 'Navegación móvil' : 'Navegación principal',
      });
      await navigation.locator(`a[href="${route}"]`).click();
      await expect(page).toHaveURL(route);
      if (width === 390) {
        await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
      } else {
        await expect(navigation.locator('a[aria-current="page"]')).toHaveAttribute('href', route);
      }
    }

    await page.getByRole('link', { name: 'SQL SELECT LAB — Inicio' }).click();
    await expect(page).toHaveURL('/');
  });
}
