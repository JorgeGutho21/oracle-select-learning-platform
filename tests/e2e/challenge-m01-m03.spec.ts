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
  test('M01 con toques: el resultado se ve junto a la consulta y el orden importa', async ({
    page,
  }) => {
    await startChallenge(page);
    await expect(
      page.getByText(/Recursos Humanos necesita una lista para contactar/),
    ).toBeVisible();
    // Muestra de trabajo: una tabla real de 6 registros y 4 columnas, no el dataset completo.
    const sample = page.getByRole('table', { name: /^Muestra de trabajo/ });
    await expect(sample.locator('tbody tr')).toHaveCount(6);
    await expect(sample.getByRole('columnheader')).toHaveCount(4);
    await expect(page.getByText('Dataset completo: 20 registros · 12 columnas')).toBeVisible();

    await addPiece(page, 'ciudad');
    await addPiece(page, 'nombre');
    await addPiece(page, 'correo');
    const result = page.getByRole('table', { name: /^Resultado de tu consulta/ });
    await expect(result.getByRole('columnheader')).toHaveText(['CIUDAD', 'NOMBRE', 'CORREO']);
    await expect(result.locator('tbody tr')).toHaveCount(6);
    await expect(page.locator('.change-summary')).toContainText('Filas 6 sin cambios');
    await submit(page);
    await expectFeedback(page, 'El orden de las columnas importa');
    await expect(page.locator('.ch-outcome')).toContainText('Tipo de error: Orden');
    await expect(page.locator('.ch-outcome')).toContainText('Pista conceptual');
    await expect(page.getByText('Intento 2 de 2')).toBeVisible();

    await page.getByRole('button', { name: 'nombre, posición 2' }).click();
    await page.getByRole('button', { name: /Mover antes/ }).click();
    await submit(page);
    await expectCorrect(page);
    await expect(page.getByText('Resuelta', { exact: true }).first()).toBeVisible();
    await expect(mapScore(page)).toContainText('80');
    await expect(page.getByText(/SALARIO y BONO siguen en la tabla/)).toBeVisible();
  });

  test('M01: la información salarial se explica como error de columnas', async ({ page }) => {
    await startChallenge(page);
    for (const piece of ['nombre', 'ciudad', 'salario']) await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'El pedido excluye la información salarial');
    await expect(page.locator('.ch-outcome')).toContainText(
      'Seleccionaste NOMBRE y CIUDAD correctamente.',
    );
  });

  test('M01 con arrastre de ratón produce la misma respuesta evaluada', async ({ page }) => {
    await startChallenge(page);
    const target = page.locator('.ch-zone--target');
    for (const [index, name] of ['nombre', 'ciudad', 'correo'].entries()) {
      await mouseDrag(
        page,
        page.getByRole('button', { name: `Añadir ${name}`, exact: true }),
        target,
      );
      await expect(
        page.getByRole('button', { name: `${name}, posición ${index + 1}` }),
      ).toBeVisible();
    }
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('100');
  });

  test('M01 solo con teclado', async ({ page }) => {
    await startChallenge(page);
    for (const name of ['nombre', 'ciudad', 'correo']) {
      await page.getByRole('button', { name: `Añadir ${name}`, exact: true }).focus();
      await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: 'Comprobar' }).focus();
    await page.keyboard.press('Enter');
    await expectCorrect(page);
  });

  test('la pista descuenta 20 puntos una sola vez', async ({ page }) => {
    await startChallenge(page);
    await page.getByRole('button', { name: /Pedir pista/ }).click();
    await expect(
      page.getByText('El pedido nombra tres datos, en un orden.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ver pista' }).click();
    for (const name of ['nombre', 'ciudad', 'correo']) await addPiece(page, name);
    await submit(page);
    await expectCorrect(page);
    await expect(mapScore(page)).toContainText('80');
  });

  test('el dataset completo es una consulta secundaria en un diálogo', async ({ page }) => {
    await startChallenge(page);
    await page.getByRole('button', { name: 'Consultar dataset EMPLEADOS completo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Dataset EMPLEADOS completo' });
    await expect(
      dialog.getByRole('table', { name: 'Tabla EMPLEADOS completa' }).locator('tbody tr'),
    ).toHaveCount(20);
    await expect(dialog.locator('.dv-record')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Cerrar diálogo' }).click();
    await expect(dialog).toBeHidden();
  });

  test('M02: solo las piezas necesarias; WHERE sobra y se explica por qué', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 2, 'El orden de SQL');
    for (const piece of ['SELECT', 'nombre', ',', 'ciudad', 'FROM', 'empleados', 'WHERE'])
      await addPiece(page, piece);
    await submit(page);
    await expectFeedback(page, 'esta consulta no necesita WHERE');
    await expect(page.locator('.ch-outcome')).toContainText('Tipo de error: Concepto');
    await expect(page.locator('.ch-outcome')).toContainText(
      'SELECT y FROM están en el orden de SQL.',
    );
    await page.getByRole('button', { name: 'WHERE, posición 7' }).click();
    await page.getByRole('button', { name: 'Quitar' }).click();
    // El resultado de la consulta se ve sobre la muestra: mismas filas, dos columnas.
    const result = page.getByRole('table', { name: /^Resultado de tu consulta/ });
    await expect(result.getByRole('columnheader')).toHaveText(['NOMBRE', 'CIUDAD']);
    await submit(page);
    await expectCorrect(page);
  });

  test('M03: columnas, filas y qué hace y qué no hace el asterisco', async ({ page }) => {
    await startChallenge(page);
    await openMission(page, 3, '¿Qué trae el asterisco?');
    const schema = page.getByRole('list', { name: 'Columnas de EMPLEADOS, en orden' });
    await expect(schema.getByRole('listitem')).toHaveCount(12);
    await page.getByLabel('Columnas del resultado').fill('12');
    await page.getByLabel('Filas del resultado').fill('20');
    const claim = (text: string) => page.locator('.ch-claim').filter({ hasText: text });
    await claim('Aparece una columna llamada *').getByRole('radio', { name: 'No lo hace' }).check();
    await claim('mismo orden que en la tabla')
      .getByRole('radio', { name: 'Lo hace', exact: true })
      .check();
    await claim('BONO en NULL').getByRole('radio', { name: 'Lo hace', exact: true }).check();
    await claim('alfabéticamente').getByRole('radio', { name: 'No lo hace' }).check();
    await claim('se cambia el *').getByRole('radio', { name: 'Lo hace', exact: true }).check();
    await submit(page);
    await expectFeedback(page, '¿Hay alguna condición WHERE que descarte filas?');
    await claim('BONO en NULL').getByRole('radio', { name: 'No lo hace' }).check();
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
    for (const name of ['nombre', 'ciudad', 'correo'])
      await page.getByRole('button', { name: `Añadir ${name}`, exact: true }).tap();
    await page.getByRole('button', { name: 'Comprobar' }).tap();
    await expectCorrect(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('.dv-record:visible')).toHaveCount(0);
    await page.screenshot({ path: 'output/playwright/challenge-m01-mobile.png', fullPage: true });
    await context.close();
  });
});
