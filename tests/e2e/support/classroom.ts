import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

/** Clave de profesor del servidor de pruebas (playwright.config.ts, `webServer.env`). */
export const E2E_PRESENTER_ACCESS_CODE = 'clave-e2e-profesor';

/** Móvil de referencia para el estudiante (UX_FLOWS: el ingreso se prioriza en móvil). */
export const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true } as const;

/** Crea una sala desde /presenter y devuelve su código. */
export async function createRoom(page: Page): Promise<string> {
  await page.goto('/presenter');
  await page.getByLabel('Clave del profesor').fill(E2E_PRESENTER_ACCESS_CODE);
  await page.getByRole('button', { name: 'Crear sala' }).click();
  await expect(page).toHaveURL(/\/presenter\/[A-Z2-9]{6}$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Entrar a la sala' })).toBeVisible();
  const code = new URL(page.url()).pathname.split('/').at(-1)!;
  await expect(page.locator('.classroom-code')).toHaveText(code);
  return code;
}

/** Abre un contexto de estudiante independiente (sus propias cookies) y entra con un alias. */
export async function joinAs(
  browser: Browser,
  code: string,
  nickname: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto(`/join/${code}`);
  await page.getByLabel('Tu alias').fill(nickname);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: `Estás dentro, ${nickname}` }),
  ).toBeVisible();
  return { context, page };
}
