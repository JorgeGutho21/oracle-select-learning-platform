import { expect, type Page } from '@playwright/test';

/**
 * Apoyo de las E2E de cuentas. Necesitan un Supabase de prueba (local con `supabase start`
 * o un proyecto de pruebas) y la app arrancada con sus variables públicas:
 * - E2E_SUPABASE_URL y E2E_SUPABASE_PUBLISHABLE_KEY: el servidor de pruebas las usa como
 *   NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (playwright.config.ts);
 * - E2E_SUPABASE_SECRET_KEY: clave secreta del proyecto de PRUEBA, solo para preparar datos
 *   (crear cuentas confirmadas y asignar el rol de profesor sin pasar por la interfaz);
 * - E2E_MAILPIT_URL (opcional): buzón local, para seguir el enlace de confirmación.
 * Sin ellas las pruebas se omiten: nunca se usan contraseñas ni cuentas reales.
 */

export const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.E2E_SUPABASE_SECRET_KEY ?? '';
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? '';
export const ACCOUNTS_ENABLED = Boolean(SUPABASE_URL && SECRET_KEY);
export const PASSWORD = 'Prueba2026x';

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${process.pid}-${counter}@example.com`;
}

async function admin(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SECRET_KEY, 'Content-Type': 'application/json', ...init.headers },
  });
}

export interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
}

/** Cuenta confirmada creada por la API administrativa del proyecto de pruebas. */
export async function createUser(
  prefix: string,
  names: { firstName?: string; lastName?: string } = {},
): Promise<TestUser> {
  const email = uniqueEmail(prefix);
  const firstName = names.firstName ?? 'Ana';
  const lastName = names.lastName ?? 'Prueba';
  const response = await admin('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    }),
  });
  expect(response.ok, await response.clone().text()).toBe(true);
  const body = (await response.json()) as { id: string };
  return { id: body.id, email, password: PASSWORD, firstName, lastName };
}

/** El rol de profesor solo se asigna así: con la clave secreta, nunca desde la interfaz. */
export async function setRole(email: string, role: 'student' | 'teacher'): Promise<void> {
  const response = await admin('/rest/v1/rpc/admin_set_role', {
    method: 'POST',
    body: JSON.stringify({ p_email: email, p_role: role }),
  });
  expect(await response.json()).toEqual({ status: 'updated' });
}

/** Inicia sesión; con credenciales válidas espera a llegar a la cuenta. */
export async function signIn(
  page: Page,
  user: Pick<TestUser, 'email' | 'password'>,
  options: { readonly expectSuccess?: boolean } = {},
) {
  await page.goto('/login');
  await page.getByLabel('Correo', { exact: true }).fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  if (options.expectSuccess ?? true) await expect(page).toHaveURL(/\/dashboard$/);
}

/** Enlace del último correo recibido por `email` en el buzón local. */
export async function emailLink(email: string): Promise<string> {
  let link = '';
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
        );
        const found = (await search.json()) as { messages?: { ID: string }[] };
        const id = found.messages?.[0]?.ID;
        if (!id) return '';
        const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${id}`)).json()) as {
          HTML?: string;
        };
        link =
          /href="([^"]*token_hash[^"]*)"/.exec(message.HTML ?? '')?.[1]?.replaceAll('&amp;', '&') ??
          '';
        return link;
      },
      { timeout: 15_000 },
    )
    .not.toBe('');
  return link;
}

/** Completa la mini comprobación de DISTINCT (respuesta: 5 filas). */
export async function completeDistinctLesson(page: Page): Promise<void> {
  await page.goto('/learn/distinct');
  const check = page.locator('.mini-check');
  await check.getByLabel('Número de filas').fill('5');
  await check.getByRole('button', { name: 'Comprobar' }).click();
  await expect(check.getByRole('status')).toContainText('Correcto.');
}

export function accountMenu(page: Page) {
  return page.locator('.account-menu');
}
