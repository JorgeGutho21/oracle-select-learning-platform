import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';

/**
 * Arquitectura de secciones de DB LAB: la Sección 1 envuelve las funcionalidades
 * existentes; las secciones 2 y 3 publican su plan sin enlaces muertos.
 */

const SECTION_PAGES = [
  '/sections',
  '/sections/fundamentos-sql',
  '/sections/consultas-relacionales',
  '/sections/plsql',
] as const;

test.describe('Secciones', () => {
  test('la portada de secciones muestra la ruta y el avance real del navegador', async ({
    page,
  }) => {
    await page.goto('/sections');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Secciones de DB LAB' }),
    ).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: 'Ruta de navegación' });
    await expect(crumbs.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Secciones');

    const cards = page.locator('.section-grid > li');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole('heading')).toHaveText('Fundamentos SQL');
    await expect(cards.nth(1).getByRole('heading')).toHaveText('Consultas relacionales y análisis');
    await expect(cards.nth(2).getByRole('heading')).toHaveText('PL/SQL y automatización');

    // Sin progreso: estado neutro, nada inventado. Fase 4: un medidor por sección publicada,
    // con los mismos totales que el catálogo de progreso.
    const overview = page.getByRole('region', { name: 'Tu avance' });
    for (const total of [25, 25, 28]) {
      await expect(
        overview.getByRole('progressbar', { name: `Tu avance: 0 de ${total} lecciones` }).first(),
      ).toHaveAttribute('aria-valuenow', '0');
    }
    await expect(overview.getByRole('progressbar')).toHaveCount(3);
    await expect(overview).toContainText('No hay evaluaciones publicadas');
    await expect(overview.getByRole('link', { name: /Empezar por/ })).toHaveAttribute(
      'href',
      '/learn/introduccion',
    );
  });

  test('el avance guardado del Modo Estudio aparece en la sección y en «Continuar»', async ({
    page,
  }) => {
    await page.goto('/sections');
    await page.evaluate(() =>
      localStorage.setItem(
        'sql-select-lab:study:progress',
        JSON.stringify({
          releaseId: 'select-study-v2',
          version: 1,
          completed: ['L00', 'L01'],
          lessonVersions: { L00: 1, L01: 1 },
          lastLesson: 'L11',
          updatedAt: 1,
        }),
      ),
    );
    await page.goto('/sections/fundamentos-sql');
    await expect(
      page.getByRole('progressbar', { name: 'Tu avance: 2 de 25 lecciones' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Continuar con Fundamentos SQL/ })).toHaveAttribute(
      'href',
      '/learn/where',
    );
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: 'Accesos principales' }).getByRole('link', {
        name: /Continuar aprendiendo/,
      }),
    ).toHaveAttribute('href', '/learn/where');
  });

  test('la Sección 1 abre las funcionalidades existentes desde sus modos', async ({ page }) => {
    await page.goto('/sections/fundamentos-sql');
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos SQL' })).toBeVisible();
    const modes = page.getByRole('list', { name: 'Modos de trabajo de Fundamentos SQL' });
    for (const [name, href] of [
      [/Iniciar clase/, '/presentation'],
      [/Estudiar/, '/learn'],
      [/Practicar SQL/, '/lab'],
      [/Challenge/, '/challenge'],
      [/Recursos/, '/resources'],
      [/Evaluación/, '/evaluations?seccion=fundamentos-sql'],
    ] as const) {
      await expect(modes.getByRole('link', { name })).toHaveAttribute('href', href);
    }
    // El temario enlaza las 22 lecciones del Modo Estudio y las 3 de «Funciones de una fila».
    await expect(page.locator('.topic-group--available a')).toHaveCount(25);
    await modes.getByRole('link', { name: /Practicar SQL/ }).click();
    await expect(page).toHaveURL('/lab');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  // Fase 4: las secciones 2 y 3 dejaron de ser «Próximamente» y abren sus seis modos.
  for (const [id, title, topic] of [
    ['consultas-relacionales', 'Consultas relacionales y análisis', 'RIGHT y FULL'],
    ['plsql', 'PL/SQL y automatización', ':OLD y :NEW'],
  ] as const) {
    test(`${title}: disponible con sus seis modos, temario y posición`, async ({ page }) => {
      await page.goto(`/sections/${id}`);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.locator('.coming-soon-panel')).toHaveCount(0);
      await expect(page.locator('.topic-groups')).toContainText(topic);
      const modes = page.getByRole('list', { name: `Modos de trabajo de ${title}` });
      for (const [name, href] of [
        [/Iniciar clase/, `/sections/${id}/class`],
        [/Estudiar/, `/sections/${id}/study`],
        [/Practicar/, `/sections/${id}/practice`],
        [/Challenge/, `/sections/${id}/challenge`],
        [/Recursos/, `/sections/${id}/resources`],
        [/Evaluación/, `/evaluations?seccion=${id}`],
      ] as const) {
        await expect(modes.getByRole('link', { name })).toHaveAttribute('href', href);
      }
      await expect(page.locator('.section-route [aria-current="step"]')).toContainText(title);
    });
  }

  test('ningún enlace de las secciones lleva a una página inexistente', async ({
    page,
    request,
  }) => {
    const hrefs = new Set<string>();
    for (const path of SECTION_PAGES) {
      await page.goto(path);
      for (const href of await page
        .locator('main a[href^="/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')!))) {
        hrefs.add(href.split('#')[0]!);
      }
    }
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
    expect((await request.get('/sections/no-existe')).status()).toBe(404);
  });

  test('los destellos decorativos se detienen con movimiento reducido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sections');
    await expect(page.locator('.fx-star-border__glow').first()).toBeHidden();
  });

  for (const [label, width] of [
    ['escritorio', 1440],
    ['móvil', 390],
  ] as const) {
    test(`cumplen WCAG 2 AA y no desbordan en ${label}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of SECTION_PAGES) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expectNoHorizontalScroll(page, `${path} a ${width}`);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(results.violations, path).toEqual([]);
      }
    });
  }

  test('las páginas de sección caben a 320 px sin desplazamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    for (const path of SECTION_PAGES) {
      await page.goto(path);
      await expectNoHorizontalScroll(page, `${path} a 320`);
    }
  });
});
