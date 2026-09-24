import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  addPiece,
  expectCorrect,
  expectFeedback,
  mapScore,
  mouseDrag,
  openMission,
  startChallenge,
  submit,
} from './challenge-helpers';

test.describe('Challenge M01–M03', () => {
  test('M01 con toques: el orden invertido consume un intento y se repara con los botones', async ({
    page,
  }) => {
    await startChallenge(page);
    await expect(page.getByText('«Muéstrame solamente nombre y salario.»')).toBeVisible();
    await addPiece(page, 'salario');
    await addPiece(page, 'nombre');
    await submit(page);
    await expectFeedback(page, 'el orden pedido es NOMBRE, SALARIO');
    await expect(page.getByText('Intento 2 de 2')).toBeVisible();

    await page.getByRole('button', { name: 'nombre, posición 2' }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText('Resuelta', { exact: true }).first()).toBeVisible();
    await expect(mapScore(page)).toContainText('80');
    await expect(page.getByText(/Las demás columnas siguen en la tabla/)).toBeVisible();
  });

  test('M01 con arrastre de ratón produce la misma respuesta evaluada', async ({ page }) => {
    await startChallenge(page);
    const target = page.locator('.ch-zone--target');
    await mouseDrag(page, page.getByRole('button', { name: 'Añadir nombre', exact: true }), target);
    await expect(page.getByRole('button', { name: 'nombre, posición 1' })).toBeVisible();
    await mouseDrag(
      page,
      page.getByRole('button', { name: 'Añadir salario', exact: true }),
      target,
    );
    await expect(page.getByRole('button', { name: 'salario, posición 2' })).toBeVisible();
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('100');
  });

  test('M01 solo con teclado', async ({ page }) => {
    await startChallenge(page);
    await page.getByRole('button', { name: 'Añadir nombre', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Añadir salario', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Comprobar' }).focus();
    await page.keyboard.press('Enter');
    await expectCorrect(page);
  });

  test('la pista descuenta 20 puntos una sola vez', async ({ page }) => {
    await startChallenge(page);
    await page.getByRole('button', { name: /Pedir pista/ }).click();
    await expect(
      page.getByText('El pedido menciona dos datos de cada empleado.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ver pista' }).click();
    await addPiece(page, 'nombre');
    await addPiece(page, 'salario');
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
  });

  test('M02: el orden de SQL, con retroalimentación de FROM', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 2, 'El orden de SQL');
    for (const piece of ['SELECT', 'nombre', ',', 'empleados', 'FROM', 'ciudad'])
      await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'FROM recibe el nombre de la tabla');
    for (let index = 0; index < 6; index++) {
      await page.locator('.ch-zone--target .ch-piece').first().click();
      await page.getByRole('button', { name: 'Quitar' }).click();
    }
    for (const piece of ['SELECT', 'nombre', ',', 'ciudad', 'FROM', 'empleados', ';'])
      await addPiece(page, piece);
    await submit(page);
    await expectCorrect(page);
  });

  test('M03: el asterisco se expande en las seis columnas del esquema', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 3, '¿Qué trae el asterisco?');
    await addPiece(page, '*');
    await page.getByLabel('¿Cuántas filas devuelve?').fill('6');
    await submit(page);
    await expectFeedback(page, 'El asterisco no es una columna del resultado');
    await page.getByRole('button', { name: '*, posición 1' }).click();
    await page.getByRole('button', { name: 'Quitar' }).click();
    for (const header of ['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO'])
      await addPiece(page, header);
    await submit(page);
    await expectCorrect(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('en móvil se resuelve con toques y sin desbordar la página', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await startChallenge(page);
    await page.getByRole('button', { name: 'Añadir nombre', exact: true }).tap();
    await page.getByRole('button', { name: 'Añadir salario', exact: true }).tap();
    await page.getByRole('button', { name: 'Comprobar' }).tap();
    await expectCorrect(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: 'output/playwright/challenge-m01-mobile.png', fullPage: true });
    await context.close();
  });
});
