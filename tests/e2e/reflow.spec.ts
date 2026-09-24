import { expect, test, type Page } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  fillEditor,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';
import { ORACLE_CONFIGURED } from './support/oracle';

/**
 * Reflujo con zoom del 200 % (DESIGN_SYSTEM, D05; WCAG 1.4.10): un teléfono de 360 px
 * equivale a 180 px CSS y un portátil de 1440 × 900, a 720 × 450. La página no debe
 * desplazarse en horizontal; solo tablas y código pueden hacerlo dentro de su marco.
 */
const ZOOMED = [
  { width: 180, height: 400 },
  { width: 720, height: 450 },
] as const;

const ROUTES = [
  '/',
  '/learn',
  '/learn/alias',
  '/presentation?scene=9',
  '/lab',
  '/challenge',
  '/resources',
] as const;

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const viewport of ZOOMED) {
  test(`con zoom 200 % (${viewport.width}×${viewport.height}) ninguna ruta desborda`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await horizontalOverflow(page), route).toBeLessThanOrEqual(0);
    }
  });
}

test('con zoom 200 % el laboratorio sigue siendo usable', async ({ page }) => {
  await page.setViewportSize({ width: 180, height: 400 });
  await page.goto('/lab');
  const editor = page.getByRole('textbox', { name: /consulta/i }).first();
  await fillEditor(editor, 'SELECT nombre, salario * 12 AS salario_anual FROM empleados;');

  // El editor ajusta las líneas: la consulta se lee sin desplazar el editor en horizontal.
  const wrap = await page.evaluate(() => {
    const scroller = document.querySelector('.cm-scroller')!;
    return scroller.scrollWidth - scroller.clientWidth;
  });
  expect(wrap).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: 'Analizar' }).click();
  await expect(page.getByRole('table').filter({ hasText: 'SALARIO_ANUAL' }).first()).toBeAttached();
  await page.getByRole('button', { name: 'Ejecutar en Oracle' }).click();
  await expect(
    ORACLE_CONFIGURED
      ? page.getByRole('table', { name: /^Oracle \(Oracle Database/ })
      : page.getByText('Servicio Oracle no disponible'),
  ).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test('con zoom 200 % las diez misiones del Challenge caben y se juegan', async ({ page }) => {
  await page.setViewportSize({ width: 180, height: 400 });
  await startChallenge(page);
  await addPiece(page, 'nombre');
  await addPiece(page, 'salario');
  await submit(page);
  await expectCorrect(page);
  expect(await horizontalOverflow(page), 'M01').toBeLessThanOrEqual(0);

  const titles = [
    'El orden de SQL',
    '¿Qué trae el asterisco?',
    'Predice el resultado',
    'Columnas calculadas',
    'Encabezados con AS',
    'Valores únicos con DISTINCT',
    'Detecta el error',
    'Del lenguaje al SQL',
    'Final Boss: Query Master',
  ];
  for (const [index, title] of titles.entries()) {
    await openMission(page, index + 2, title);
    if (index + 2 === 10) {
      await expect(
        page.getByRole('textbox', { name: 'Tu consulta para el reto final' }),
      ).toBeVisible();
    }
    expect(await horizontalOverflow(page), `M${index + 2}`).toBeLessThanOrEqual(0);
  }
});

test('a 360 px los controles táctiles principales miden al menos 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/lab');
  await expect(page.getByRole('button', { name: 'Analizar' })).toBeEnabled();
  for (const control of [
    page.getByRole('button', { name: 'Analizar' }),
    page.getByRole('button', { name: 'Ejecutar en Oracle' }),
    page.getByLabel('Cargar un ejemplo'),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/presentation?scene=2');
  await expect(page.locator('.deck')).toHaveAttribute('data-ready', 'true');
  for (const name of ['Escena anterior', 'Escena siguiente', 'Pantalla completa']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.height, name).toBeGreaterThanOrEqual(44);
    expect(box?.width, name).toBeGreaterThanOrEqual(44);
  }
});

test('con zoom 200 % la paleta de búsqueda cabe y permite abrir un resultado', async ({ page }) => {
  await page.setViewportSize({ width: 180, height: 400 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Buscar' }).click();
  const palette = page.getByRole('dialog', { name: 'Buscar en SQL SELECT LAB' });
  await palette.getByRole('combobox').fill('distinct');
  const box = await palette.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(180);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  await palette.getByRole('option', { name: /DISTINCT: sin filas repetidas/ }).click();
  await expect(page).toHaveURL('/learn/distinct');
});
