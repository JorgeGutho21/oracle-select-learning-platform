import { expect, type Locator, type Page } from '@playwright/test';

/** Abre el Challenge con el almacenamiento local vacío y comienza una práctica nueva. */
export async function startChallenge(page: Page) {
  await page.goto('/challenge');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Comenzar práctica' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Columnas a la vista' })).toBeVisible();
}

export async function openMission(page: Page, order: number, title: string) {
  await page
    .getByRole('navigation', { name: 'Mapa de misiones' })
    .getByRole('button', { name: new RegExp(`^Misión ${order}:`) })
    .click();
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
}

export async function addPiece(page: Page, text: string, nth = 0) {
  await page
    .getByRole('button', { name: `Añadir ${text}`, exact: true })
    .nth(nth)
    .click();
}

export async function submit(page: Page) {
  await page.getByRole('button', { name: /^Comprobar/ }).click();
}

export async function expectCorrect(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: 'Correcto' }).first()).toBeVisible();
}

export async function expectFeedback(page: Page, text: string | RegExp) {
  await expect(page.getByRole('alert').filter({ hasText: text })).toBeVisible();
}

export function mapScore(page: Page) {
  return page.getByRole('navigation', { name: 'Mapa de misiones' }).locator('.ch-map__points');
}

/** Arrastre real con ratón en varios pasos, como lo percibe el sensor de dnd-kit. */
export async function mouseDrag(page: Page, source: Locator, target: Locator) {
  // Centra el tramo entre origen y destino: cerca de los bordes, el auto-scroll de
  // dnd-kit desplazaría la página durante el arrastre.
  const before = [await source.boundingBox(), await target.boundingBox()];
  if (!before[0] || !before[1]) throw new Error('Elemento sin caja visible');
  const middle = (before[0].y + before[0].height / 2 + before[1].y + before[1].height / 2) / 2;
  await page.evaluate((y) => window.scrollBy(0, y - window.innerHeight / 2), middle);
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Elemento sin caja visible');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 12, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.move(to.x + to.width / 2 + 2, to.y + to.height / 2 + 2, { steps: 2 });
  await page.mouse.up();
}

/** Sustituye el contenido de un editor CodeMirror como lo haría una persona al teclado. */
export async function fillEditor(editor: Locator, text: string) {
  await editor.click();
  await editor.press('ControlOrMeta+a');
  await editor.press('Delete');
  await editor.page().keyboard.insertText(text);
  await expect(editor).toContainText(text.split('\n')[0]!);
}
