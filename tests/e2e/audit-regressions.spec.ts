import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Regresiones de la auditoría preproducción (docs/FINAL_AUDIT.md). Axe con reglas acotadas
// para que cada comprobación sea rápida.

async function violations(page: Page, rules: string[]) {
  const result = await new AxeBuilder({ page }).withRules(rules).analyze();
  return result.violations.map(
    ({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test('las respuestas llevan las cabeceras de seguridad y la CSP no bloquea nada', async ({
  page,
}) => {
  const blocked: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) blocked.push(message.text());
  });
  const response = await page.goto('/');
  const headers = response!.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-powered-by']).toBeUndefined();
  for (const route of ['/lab', '/challenge', '/presentation?scene=15', '/presenter', '/live']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  }
  expect(blocked).toEqual([]);
});

test('las columnas atenuadas de la tabla didáctica mantienen el contraste AA', async ({ page }) => {
  // La tabla de origen atenúa las columnas que la consulta no muestra (NOMBRE, DEPARTAMENTO).
  await page.goto('/learn/distinct');
  await expect(page.locator('.hl-table .is-dim').first()).toBeVisible();
  expect(await violations(page, ['color-contrast'])).toEqual([]);
});

// Una prueba por ruta y por escena: con la suite completa en paralelo, varias páginas con
// axe en una sola prueba se acercaban al plazo.
for (const [width, height] of [
  [360, 800],
  [180, 400],
] as const) {
  for (const route of [
    '/',
    '/learn/alias',
    '/learn/distinct',
    '/learn/consulta-completa',
    '/learn/null',
    '/learn/errores-frecuentes',
    '/resources',
    '/modules',
  ]) {
    test(`a ${width} px ${route} no tiene regiones desplazables sin foco ni desborde`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      expect(await violations(page, ['scrollable-region-focusable'])).toEqual([]);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  for (const scene of [1, 2, 5, 8, 9, 10, 11, 13, 15, 17, 19, 20, 21, 27, 28]) {
    test(`a ${width} px la escena ${scene} se lee sin desplazamiento interno`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/presentation?scene=${scene}`);
      await expect(page.locator('.deck__stage .scene')).toBeVisible();
      expect(await violations(page, ['scrollable-region-focusable'])).toEqual([]);
    });
  }
}

test('al acertar con teclado el foco pasa a «Siguiente misión» y no se pierde', async ({
  page,
}) => {
  await page.goto('/challenge');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Comenzar práctica' }).click();
  for (const column of ['nombre', 'salario']) {
    await page.getByRole('button', { name: `Añadir ${column}`, exact: true }).focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Comprobar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Siguiente misión' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'El orden de SQL' })).toBeFocused();
});

test('tras un intento fallido, una pista u omitir, el foco queda en un control útil', async ({
  page,
}) => {
  await page.goto('/challenge');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Comenzar práctica' }).click();
  await page.getByRole('button', { name: 'Comprobar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Comprobar' })).toBeFocused();
  await page.getByRole('button', { name: /Pedir pista/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Ver pista' })).toBeFocused();
  await page.getByRole('button', { name: 'Omitir misión' }).focus();
  await page.keyboard.press('Enter');
  await page
    .getByRole('dialog')
    .getByRole('button')
    .filter({ hasText: /Omitir/ })
    .last()
    .click();
  await expect(page.getByRole('button', { name: 'Siguiente misión' })).toBeFocused();
});
