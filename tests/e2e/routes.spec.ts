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
  '/modules',
] as const;

const navigation = [
  ['/learn', 'Aprender'],
  ['/lab', 'Laboratorio'],
  ['/challenge', 'Challenge'],
  ['/live', 'En vivo'],
  ['/resources', 'Recursos'],
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

test('la barra principal muestra las entradas acordadas y la búsqueda', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link')).toHaveText([
    'Inicio',
    'Aprender',
    'Laboratorio',
    'Challenge',
    'En vivo',
    'Recursos',
  ]);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Buscar' })).toBeVisible();
  // La barra es una sola fila: marca, enlaces y búsqueda comparten línea.
  const brand = await page.getByRole('link', { name: 'SQL SELECT LAB — Inicio' }).boundingBox();
  const learn = await nav.getByRole('link', { name: 'Aprender' }).boundingBox();
  expect(
    Math.abs(
      (brand?.y ?? 0) + (brand?.height ?? 0) / 2 - ((learn?.y ?? 0) + (learn?.height ?? 0) / 2),
    ),
  ).toBeLessThan(8);
});

test('«Aprender» queda activo también en Exposición y en la ruta de aprendizaje', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/presentation', '/modules']) {
    await page.goto(route);
    await expect(
      page
        .getByRole('navigation', { name: 'Navegación principal' })
        .locator('[aria-current="page"]'),
    ).toHaveText('Aprender');
  }
});

test('el pie enlaza los recorridos, los recursos y la ruta de aprendizaje', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('navigation', { name: 'Enlaces del pie' });
  await footer.getByRole('link', { name: 'Ruta de aprendizaje' }).click();
  await expect(page).toHaveURL('/modules');
  await expect(
    page.getByRole('heading', { level: 1, name: 'De SELECT a una base de datos completa' }),
  ).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Recursos y chuleta' })).toHaveAttribute(
    'href',
    '/resources',
  );
});

for (const width of [390, 1440]) {
  test(`la navegación permite recorrer las rutas y volver a Inicio a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    for (const [route, label] of navigation) {
      if (width === 390) await page.locator('.mobile-menu summary').click();
      const nav = page.getByRole('navigation', {
        name: width === 390 ? 'Navegación móvil' : 'Navegación principal',
      });
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(route);
      if (width === 390) {
        await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
      } else {
        await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('href', route);
      }
    }

    await page.getByRole('link', { name: 'SQL SELECT LAB — Inicio' }).click();
    await expect(page).toHaveURL('/');
  });
}

test('el menú móvil se cierra con Escape y devuelve el foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const summary = page.locator('.mobile-menu summary');
  await summary.click();
  await expect(page.getByRole('navigation', { name: 'Navegación móvil' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Navegación móvil' })
    .getByRole('link')
    .first()
    .focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
});

test('los iconos, el título y la vista previa social identifican la unidad', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('SELECT en Oracle SQL | SQL SELECT LAB');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'SELECT en Oracle SQL | SQL SELECT LAB',
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    /Jorge Gutierrez Thomas.*Amilkar Sierra/,
  );
  for (const [path, type] of [
    ['/favicon.ico', 'image/x-icon'],
    ['/icon.svg', 'image/svg+xml'],
    ['/apple-icon.png', 'image/png'],
    ['/opengraph-image.png', 'image/png'],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain(type);
  }
});
