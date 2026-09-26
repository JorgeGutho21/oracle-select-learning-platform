import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function palette(page: Page) {
  return page.getByRole('dialog', { name: 'Buscar en SQL SELECT LAB' });
}

function field(page: Page) {
  return palette(page).getByRole('combobox');
}

async function openWithShortcut(page: Page, shortcut = 'Control+k') {
  await expect(page.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  await page.keyboard.press(shortcut);
  await expect(palette(page)).toBeVisible();
  await expect(field(page)).toBeFocused();
}

// Términos del encargo: los actuales llevan a una lección; los futuros, a su ficha.
const CURRENT = [
  ['alias', 'Alias de columna con AS'],
  ['as', 'Alias de columna con AS'],
  ['distinct', 'DISTINCT: sin filas repetidas'],
  ['where', 'WHERE: filtrar filas'],
  ['between', 'BETWEEN: rangos'],
  ['in', 'IN: listas de valores'],
  ['like', 'LIKE: patrones de texto'],
  ['null', 'NULL, IS NULL e IS NOT NULL'],
  ['order by', 'ORDER BY: ordenar el resultado'],
] as const;
const FUTURE = [
  ['upper', 'UPPER', 'tema-upper'],
  ['round', 'ROUND', 'tema-round'],
  ['group by', 'GROUP BY', 'tema-group-by'],
  ['join', 'INNER JOIN', 'tema-inner-join'],
  ['insert', 'INSERT INTO', 'tema-insert'],
  ['update', 'UPDATE', 'tema-update'],
  ['delete', 'DELETE', 'tema-delete'],
] as const;

test.describe('Buscador global', () => {
  test('Ctrl+K abre la paleta, Enter navega y enfoca el título del destino', async ({ page }) => {
    await page.goto('/');
    await openWithShortcut(page);
    await field(page).fill('alias');
    const options = palette(page).getByRole('option');
    // Conceptos se muestra primero; la flecha baja lleva a la lección.
    await expect(options.first()).toContainText('Alias con AS');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await expect(palette(page).getByRole('group', { name: 'Lecciones' })).toContainText(
      'Alias de columna con AS',
    );
    await page.keyboard.press('ArrowDown');
    await expect(palette(page).locator('[aria-selected="true"]')).toContainText(
      'Alias de columna con AS',
    );
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/learn/alias');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Alias de columna con AS' }),
    ).toBeFocused();
  });

  test('Cmd+K también abre la paleta y las flechas recorren los resultados', async ({ page }) => {
    await page.goto('/learn');
    await openWithShortcut(page, 'Meta+k');
    await field(page).fill('select');
    const first = await field(page).getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    await expect(field(page)).not.toHaveAttribute('aria-activedescendant', first ?? '');
    await expect(palette(page).locator('[aria-selected="true"]')).toHaveCount(1);
  });

  test('Escape cierra y devuelve el foco al disparador', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Buscar' });
    await expect(trigger).toBeEnabled();
    // Activación por teclado: Safari no enfoca los botones al hacer clic con el ratón.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(palette(page)).toBeVisible();
    await palette(page).getByRole('button', { name: 'Cerrar diálogo' }).click();
    await expect(palette(page)).toBeHidden();
  });

  test('cada tema actual del encargo lleva a su lección', async ({ page }) => {
    await page.goto('/');
    await openWithShortcut(page);
    for (const [query, lesson] of CURRENT) {
      await field(page).fill(query);
      const group = palette(page).getByRole('group', { name: 'Lecciones' });
      await expect(group, query).toContainText(lesson);
      await expect(group.getByRole('option', { name: new RegExp(lesson) }), query).toContainText(
        'Abrir',
      );
    }
  });

  test('cada tema futuro aparece como Próximamente y abre su ficha de la ruta', async ({
    page,
  }) => {
    // Siete aperturas de /modules (46 fichas): unos 6 s cada una en WebKit con la CPU ocupada.
    test.setTimeout(FUTURE.length * 8_000);
    await page.goto('/');
    for (const [query, title, anchor] of FUTURE) {
      await openWithShortcut(page);
      await field(page).fill(query);
      const group = palette(page).getByRole('group', { name: 'Próximamente' });
      const option = group.getByRole('option', { name: new RegExp(`^${title}\\b`) }).first();
      await expect(option, query).toContainText('Próximamente');
      await expect(palette(page).getByRole('group', { name: 'Lecciones' })).toHaveCount(0);
      await option.click();
      await expect(page).toHaveURL(new RegExp(`/modules#${anchor}$`));
      await expect(page.locator(`#${anchor}`)).toBeVisible();
      await expect(page.locator(`#${anchor} h4`)).toBeFocused();
      await expect(page.locator(`#${anchor}`)).toContainText('Próximamente');
    }
  });

  test('agrupa conceptos, lecciones, práctica y recursos sin tildes ni mayúsculas', async ({
    page,
  }) => {
    await page.goto('/');
    await openWithShortcut(page);
    await field(page).fill('DISTINCT');
    await expect(palette(page).getByRole('group', { name: 'Conceptos' })).toBeVisible();
    await expect(palette(page).getByRole('group', { name: 'Lecciones' })).toContainText(
      'DISTINCT: sin filas repetidas',
    );
    await field(page).fill('exposicion');
    await expect(palette(page).getByRole('option').first()).toContainText('Modo Exposición');
    await field(page).fill('laboratorio');
    await expect(palette(page).getByRole('group', { name: 'Práctica' })).toContainText(
      'Laboratorio SQL',
    );
    await field(page).fill('vídeo');
    await expect(palette(page).getByRole('group', { name: 'Recursos' })).toContainText(
      'Video introductorio',
    );
  });

  test('un concepto lleva a su ficha de la chuleta', async ({ page }) => {
    await page.goto('/');
    await openWithShortcut(page);
    await field(page).fill('select *');
    await palette(page)
      .getByRole('option', { name: /^SELECT \*/ })
      .first()
      .click();
    await expect(page).toHaveURL('/resources#chuleta-asterisco');
    await expect(page.locator('#chuleta-asterisco h3')).toBeFocused();
  });

  test('sin coincidencias ofrece limpiar la búsqueda', async ({ page }) => {
    await page.goto('/');
    await openWithShortcut(page);
    await field(page).fill('procedimiento inexistente');
    await expect(palette(page).getByText('No hay resultados para esta búsqueda.')).toBeVisible();
    await palette(page).getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await expect(field(page)).toHaveValue('');
  });

  test('el atajo funciona con el foco en el editor del laboratorio (U03)', async ({ page }) => {
    await page.goto('/lab');
    const editor = page.getByRole('textbox', { name: /consulta/i }).first();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
    await editor.click();
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toBeVisible();
    await expect(field(page)).toBeFocused();
  });

  test('en móvil la lupa táctil abre la paleta y un toque navega', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(palette(page)).toBeVisible();
    await field(page).fill('quiz');
    await palette(page)
      .getByRole('option', { name: /SQL Oracle Challenge/ })
      .click();
    await expect(page).toHaveURL('/challenge');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('la paleta abierta cumple WCAG 2 AA', async ({ page }) => {
    await page.goto('/');
    await openWithShortcut(page);
    await field(page).fill('join');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
