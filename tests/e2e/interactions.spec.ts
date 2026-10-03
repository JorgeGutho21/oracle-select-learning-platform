import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('el diálogo contiene el foco, cierra con Escape y restaura su activador', async ({ page }) => {
  await page.goto('/dev/design-system');
  const trigger = page.getByRole('button', { name: 'Abrir diálogo', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Un espacio para decidir' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cerrar diálogo' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Entendido' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cerrar diálogo' })).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: 'Entendido' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('la ayuda se abre con foco, se puede descartar y permanece dentro del móvil', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/dev/design-system');
  const trigger = page.getByRole('button', { name: 'Ayuda del componente' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription(
    'Ayuda contextual disponible con teclado y toque.',
  );
  const box = await tooltip.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(tooltip).not.toBeVisible();
});

test('la ayuda se abre aunque el foco llegue antes de que la página termine de cargar', async ({
  page,
}) => {
  // Solo los scripts: si también llegara tarde el CSS, el desplazamiento de la página
  // cerraría la ayuda (se cierra al hacer scroll, a propósito).
  await page.route(/\/_next\/static\/.+\.js(\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('/dev/design-system', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Ayuda del componente' }).focus();
  await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 15_000 });
});

test('la búsqueda de muestra conserva texto y muestra un estado vacío explícito', async ({
  page,
}) => {
  await page.goto('/dev/design-system');
  const field = page.getByRole('searchbox', { name: 'Buscar tema o recurso', exact: true });
  await field.fill('alias');
  await expect(
    page.getByText('No hay resultados para esta búsqueda', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Abrir diálogo', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(field).toHaveValue('alias');
});
