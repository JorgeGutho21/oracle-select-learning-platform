import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addPiece, expectCorrect, submit } from './challenge-helpers';
import { createRoom, joinAs, PHONE } from './support/classroom';

// Las esperas incluyen la consulta periódica (2,5 s) que sustituye al aviso en tiempo real.
const SYNC = { timeout: 15_000 };

async function axe(page: Page) {
  // Tras una Server Function que cambia cookies, Next refresca la ruta y el <title> se vuelve
  // a insertar: se analiza el documento ya asentado.
  await expect(page).toHaveTitle(/\S/);
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
}

test.describe('Sala en vivo', () => {
  test('flujo completo: sala, QR, ingreso móvil, Challenge, ranking, cierre y resultados', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    const code = await createRoom(page);
    await expect(
      page.getByRole('img', { name: `Código QR para entrar a la sala ${code}` }),
    ).toBeVisible();
    await expect(page.locator('.classroom-url')).toHaveText(new RegExp(`/join/${code}$`));
    // El QR del servidor de pruebas apunta a 127.0.0.1: la consola lo advierte.
    await expect(page.getByText('Dirección local')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar el Challenge' })).toBeDisabled();

    const ana = await joinAs(browser, code, 'Ana');
    const beto = await joinAs(browser, code, 'Beto');
    await expect(ana.page.getByText(/2 personas en la sala/)).toBeVisible(SYNC);

    const people = page.getByRole('list', { name: 'Participantes en la sala' });
    await expect(people.getByRole('listitem')).toHaveCount(2, SYNC);
    await expect(people).toContainText('Ana');
    await expect(people).toContainText('Beto');

    await page.getByRole('button', { name: 'Iniciar el Challenge' }).click();
    await expect(page.getByText('En curso', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Ranking en vivo' })).toBeVisible();

    // El estudiante pasa a la partida sin recargar.
    await ana.page.getByRole('button', { name: 'Comenzar el Challenge' }).click(SYNC);
    await expect(ana.page.getByText(`Sala en vivo · ${code}`)).toBeVisible();
    await expect(ana.page.getByRole('button', { name: 'Terminar y ver resultados' })).toHaveCount(
      0,
    );
    await addPiece(ana.page, 'nombre');
    await addPiece(ana.page, 'salario');
    await submit(ana.page);
    await expectCorrect(ana.page);
    await expect(ana.page.locator('.classroom-live-bar')).toContainText(
      'Puntos del servidor: 100',
      SYNC,
    );

    // Ranking y progreso del profesor reflejan el intento registrado por el servidor.
    const ranking = page.getByRole('region', { name: 'Ranking', exact: true });
    await expect(ranking.getByRole('row').nth(1)).toContainText('Ana', SYNC);
    await expect(ranking.getByRole('row').nth(1)).toContainText('100');
    await expect(page.locator('.classroom-counters')).toContainText('1 respondieron');
    await expect(page.locator('.classroom-missions li').first()).toContainText('1 resuelta');

    await page.getByRole('button', { name: 'Finalizar la sala' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Finalizar y ver resultados' })
      .click();
    await expect(page.getByRole('heading', { level: 2, name: 'Ranking final' })).toBeVisible();
    const stats = page.getByRole('region', { name: 'Estadísticas de la sala' });
    await expect(stats).toContainText('Participantes2');
    await expect(stats).toContainText('Promedio de puntos50');
    await expect(stats).toContainText('Precisión del grupo100 %');
    await expect(stats).toContainText('Misión más fácil01 · ');

    // Resultado personal en el móvil, calculado por el servidor.
    await expect(
      ana.page.getByRole('heading', { level: 1, name: 'Tu resultado, Ana' }),
    ).toBeVisible(SYNC);
    // La pantalla cambió sola: el foco pasa a su título para que se anuncie.
    await expect(
      ana.page.getByRole('heading', { level: 1, name: 'Tu resultado, Ana' }),
    ).toBeFocused();
    const summary = ana.page.getByRole('region', { name: 'Resumen de Ana' });
    await expect(summary).toContainText('Posición1 de 2');
    await expect(summary).toContainText('Puntos100');
    await expect(summary).toContainText('Intentos1');
    await expect(summary).toContainText('Pistas usadas0');
    await expect(
      beto.page.getByRole('heading', { level: 1, name: 'Tu resultado, Beto' }),
    ).toBeVisible(SYNC);
    await expect(beto.page.getByText('No registraste respuestas en esta sala.')).toBeVisible();

    // /results muestra a cada rol su propia vista.
    await page.goto(`/results?sala=${code}`);
    await expect(page.getByRole('region', { name: 'Estadísticas de la sala' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Ranking', exact: true })).toContainText('Ana');
    await ana.page.goto(`/results?sala=${code}`);
    await expect(ana.page.getByRole('region', { name: 'Resumen de Ana' })).toContainText(
      'Puntos100',
    );
    await expect(ana.page.getByRole('region', { name: 'Estadísticas de la sala' })).toHaveCount(0);

    await ana.context.close();
    await beto.context.close();
  });

  test('ingreso: alias repetido, recarga con la misma identidad, salida y llegada tardía', async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    const code = await createRoom(page);
    const ana = await joinAs(browser, code, 'Ana');

    const other = await browser.newContext(PHONE);
    const second = await other.newPage();
    await second.goto(`/join/${code}`);
    await second.getByLabel('Tu alias').fill('ana');
    await second.getByRole('button', { name: 'Entrar' }).click();
    await expect(second.locator('.ds-alert--danger')).toContainText('alias ya está en uso');
    await second.getByLabel('Tu alias').fill('ana@correo');
    await second.getByRole('button', { name: 'Entrar' }).click();
    await expect(second.locator('.ds-alert--danger')).toContainText(/letras, números|correos/);

    // Recargar conserva la inscripción (cookie de la sala).
    await ana.page.reload();
    await expect(
      ana.page.getByRole('heading', { level: 1, name: 'Estás dentro, Ana' }),
    ).toBeVisible();

    // Salir quita a la persona de la sala y vuelve al formulario.
    await ana.page.getByRole('button', { name: 'Salir de la sala' }).click();
    await ana.page.getByRole('dialog').getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(ana.page.getByLabel('Tu alias')).toBeVisible(SYNC);
    await expect(page.getByText('Aún no hay participantes.')).toBeVisible(SYNC);

    await ana.page.getByLabel('Tu alias').fill('Ana María');
    await ana.page.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      ana.page.getByRole('heading', { level: 1, name: 'Estás dentro, Ana María' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Iniciar el Challenge' }).click(SYNC);
    await expect(page.getByText('En curso', { exact: true })).toBeVisible();

    // Quien llega después del inicio no entra a mitad de partida.
    await second.reload();
    await expect(
      second.getByRole('heading', { level: 1, name: 'La actividad ya comenzó' }),
    ).toBeVisible();

    // La identidad sobrevive también a una recarga durante la partida.
    await ana.page.reload();
    await expect(ana.page.getByRole('button', { name: 'Comenzar el Challenge' })).toBeVisible(SYNC);

    await other.close();
    await ana.context.close();
  });

  test('lo escrito antes de que la página termine de cargar también se envía', async ({
    page,
    browser,
  }) => {
    // Un móvil lento hidrata tarde: se retrasan los scripts y se escribe antes.
    const delayScripts = (target: Page) =>
      target.route(/\/_next\/static\/.+\.js(\?|$)/, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
    const code = await createRoom(page);
    const context = await browser.newContext(PHONE);
    const phone = await context.newPage();
    await delayScripts(phone);
    await phone.goto(`/join/${code}`, { waitUntil: 'domcontentloaded' });
    await phone.getByLabel('Tu alias').fill('Temprano', { timeout: 15_000 });
    await phone.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      phone.getByRole('heading', { level: 1, name: 'Estás dentro, Temprano' }),
    ).toBeVisible(SYNC);

    await delayScripts(page);
    await page.goto('/live', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Código de la sala').fill(code.toLowerCase());
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(new RegExp(`/join/${code}$`), SYNC);
    await context.close();
  });

  test('códigos no válidos, salas inexistentes y clave de profesor incorrecta', async ({
    page,
  }) => {
    await page.goto('/live');
    await page.getByLabel('Código de la sala').fill('abc');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('.ds-alert--danger')).toContainText('6 letras o números');
    await page.getByLabel('Código de la sala').fill('zz zz zz');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/join\/ZZZZZZ$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'No encontramos la sala' }),
    ).toBeVisible();

    await page.goto('/join/0O1IL9');
    await expect(page.getByRole('heading', { level: 1, name: 'Código no válido' })).toBeVisible();

    await page.goto('/presenter/ZZZZZZ');
    await expect(
      page.getByText('Solo el navegador que creó la sala puede dirigirla.', { exact: false }),
    ).toBeVisible();

    await page.goto('/presenter');
    await page.getByLabel('Clave del profesor').fill('no-es-la-clave');
    await page.getByRole('button', { name: 'Crear sala' }).click();
    await expect(page.locator('.ds-alert--danger')).toContainText(
      'La clave del profesor no es correcta.',
    );
  });

  test('las pantallas de la sala no tienen infracciones de accesibilidad', async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    await createRoom(page);
    expect((await axe(page)).violations).toEqual([]);
    const code = new URL(page.url()).pathname.split('/').at(-1)!;

    const context = await browser.newContext(PHONE);
    const phone = await context.newPage();
    await phone.goto(`/join/${code}`);
    await expect(phone.getByLabel('Tu alias')).toBeVisible();
    expect((await axe(phone)).violations).toEqual([]);
    // Sin desplazamiento horizontal en el móvil.
    expect(await phone.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );

    await phone.getByLabel('Tu alias').fill('Carla');
    await phone.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      phone.getByRole('heading', { level: 1, name: 'Estás dentro, Carla' }),
    ).toBeVisible();
    expect((await axe(phone)).violations).toEqual([]);

    await page.goto('/live');
    expect((await axe(page)).violations).toEqual([]);
    await context.close();
  });
});
