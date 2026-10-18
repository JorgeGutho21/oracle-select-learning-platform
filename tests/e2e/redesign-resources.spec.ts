import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support/layout';

for (const width of [390, 1440]) {
  test(`Chuleta S1: búsqueda, filtro y recuperación por teclado @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/resources');
    const finder = page.locator('.resource-finder');
    const search = page.getByRole('searchbox', { name: 'Buscar en la chuleta' });
    await search.fill('alias');
    await expect(finder.locator('.resource-finder__empty')).toHaveCount(0);
    await expect(finder.locator('[hidden]')).not.toHaveCount(0);
    await search.fill('');
    const filter = finder.getByRole('button', { name: 'Filtrar', exact: true });
    await filter.focus();
    await page.keyboard.press('Enter');
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(finder.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(finder.locator('.resource-finder__empty')).toHaveCount(0);
    await search.fill('zzzzxxx');
    await expect(finder.locator('.resource-finder__empty')).toBeVisible();
    const reset = finder.getByRole('button', { name: 'Restablecer filtros', exact: true });
    await reset.focus();
    await page.keyboard.press('Enter');
    await expect(search).toHaveValue('');
    await expect(finder.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(finder.locator('.resource-finder__empty')).toHaveCount(0);
    await expectNoHorizontalScroll(page, `Chuleta S1 @${width}`);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test(`Recursos rediseñados: búsqueda y categorías conservan la referencia @${width}`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/sections/plsql/resources');
    const search = page.getByRole('searchbox', { name: '¿Qué necesitas recordar?' });
    await expect(search).toBeVisible();
    const explorer = page.locator('.db-resource-explorer');
    const items = explorer.locator('.db-resource-item:visible');
    const allSearchItems = explorer.locator('.db-resource-item:not([hidden])');
    const initialCount = await allSearchItems.count();
    expect(initialCount).toBeGreaterThan(0);
    await expect(items.first()).toBeVisible();

    await search.fill('rowtype');
    await expect(items.first()).toBeVisible();
    await expect(explorer.locator('.db-resource-no-results')).toBeHidden();
    for (const item of await items.all()) await expect(item).toContainText(/rowtype/i);
    await expectNoHorizontalScroll(page, `Recursos: rowtype @${width}`);

    await search.fill('zzzzxxx');
    await expect(items).toHaveCount(0);
    await expect(explorer.locator('.db-resource-no-results')).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar búsqueda', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(explorer.locator('.db-resource-no-results')).toBeHidden();
    await expect(allSearchItems).toHaveCount(initialCount);

    const categories = page.getByRole('group', { name: 'Tipo de recurso' });
    await categories.getByRole('button', { name: 'Sintaxis', exact: true }).click();
    await expect(categories.getByRole('button', { name: 'Sintaxis', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(explorer).toHaveAttribute('data-category', 'syntax');
    await expect(explorer.locator('[data-resource-kind="syntax"]').first()).toBeVisible();
    await categories.getByRole('button', { name: 'Todo', exact: true }).click();
    await expect(allSearchItems).toHaveCount(initialCount);

    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
