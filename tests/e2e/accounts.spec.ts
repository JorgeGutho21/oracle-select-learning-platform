import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { LESSON_COUNT } from '../../src/features/study/application/lesson-index';
import {
  ACCOUNTS_ENABLED,
  MAILPIT_URL,
  PASSWORD,
  accountMenu,
  completeDistinctLesson,
  createUser,
  emailLink,
  setRole,
  signIn,
  uniqueEmail,
} from './support/accounts';

/**
 * Fase 2: invitado, registro, acceso, perfil, progreso sincronizado, fusión y roles, contra
 * un Supabase de pruebas real (Auth, API y RLS). Microsoft no se automatiza: necesita una
 * cuenta real (lista de comprobación manual en docs/AUTH_ARCHITECTURE.md).
 */

async function cloudLessons(page: Page): Promise<string[]> {
  const response = await page.request.get('/api/progress');
  if (!response.ok()) return [];
  const body = (await response.json()) as {
    records: { mode: string; item: string; status: string }[];
  };
  return body.records
    .filter((record) => record.mode === 'study' && record.status === 'completed')
    .map((record) => record.item)
    .sort();
}

async function openMenu(page: Page) {
  await accountMenu(page).locator('summary').click();
  return accountMenu(page).locator('.account-menu__panel');
}

test.describe('Invitado', () => {
  test('estudia sin cuenta: el avance queda en el dispositivo y lo privado pide sesión', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Explorar plataforma/ }).click();
    await expect(page).toHaveURL(/\/sections$/);
    await expect(accountMenu(page).locator('summary')).toHaveAttribute(
      'aria-label',
      'Cuenta: invitado',
    );
    const menu = await openMenu(page);
    await expect(menu).toContainText('Tu progreso se está guardando en este dispositivo.');
    await expect(menu.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();

    await completeDistinctLesson(page);
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: `1 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
    await expect(page.locator('.study-progress__note')).toContainText(
      'Tu progreso se está guardando en este dispositivo.',
    );
    await expect(
      page.getByRole('link', { name: 'Crear cuenta para sincronizar tu progreso' }).first(),
    ).toBeVisible();

    for (const path of ['/dashboard', '/profile', '/teacher']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
  });
});

test.describe('Cuentas', () => {
  test.skip(!ACCOUNTS_ENABLED, 'Requiere un Supabase de prueba (E2E_SUPABASE_URL y clave).');

  test('registro con confirmación de correo hasta el panel', async ({ page }) => {
    test.skip(!MAILPIT_URL, 'Requiere el buzón local (E2E_MAILPIT_URL).');
    const email = uniqueEmail('registro');
    await page.goto('/register');
    await page.getByLabel('Nombre', { exact: true }).fill('Lucía');
    await page.getByLabel('Apellido', { exact: true }).fill('Martínez');
    await page.getByLabel('Correo', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText(/Revisa tu correo/)).toBeVisible();

    const link = new URL(await emailLink(email));
    await page.goto(`${link.pathname}${link.search}`);
    await page.getByRole('button', { name: 'Confirmar mi correo' }).click();
    await expect(page).toHaveURL(/\/dashboard\?aviso=correo-confirmado$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Lucía' })).toBeVisible();
    await expect(page.getByText('Correo confirmado.')).toBeVisible();
  });

  test('recuperación de contraseña por correo hasta entrar con la nueva', async ({ page }) => {
    test.skip(!MAILPIT_URL, 'Requiere el buzón local (E2E_MAILPIT_URL).');
    const user = await createUser('recupera', { firstName: 'Elena' });
    await page.goto('/login');
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel('Correo de tu cuenta').fill(user.email);
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.getByText(/Si existe una cuenta con ese correo/)).toBeVisible();

    const link = new URL(await emailLink(user.email));
    await page.goto(`${link.pathname}${link.search}`);
    await page.getByRole('button', { name: 'Continuar y elegir contraseña' }).click();
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByLabel('Contraseña nueva', { exact: true }).fill('NuevaClave2027');
    await page.getByLabel('Confirmar contraseña nueva', { exact: true }).fill('NuevaClave2027');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page).toHaveURL(/\/dashboard\?aviso=contrasena-actualizada$/);

    await page.context().clearCookies();
    await signIn(page, { email: user.email, password: 'NuevaClave2027' });
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Elena' })).toBeVisible();
  });

  test('cerrar sesión deja el dispositivo limpio para la siguiente persona', async ({ page }) => {
    const user = await createUser('compartido');
    await signIn(page, user);
    await completeDistinctLesson(page);
    await expect.poll(() => cloudLessons(page), { timeout: 15_000 }).toEqual(['L10']);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: `0 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
  });

  test('el registro valida en el servidor, conserva los datos y no revela cuentas', async ({
    page,
  }) => {
    const existing = await createUser('existente');
    await page.goto('/register');
    await page.getByLabel('Nombre', { exact: true }).fill('Pedro');
    await page.getByLabel('Apellido', { exact: true }).fill('Gómez');
    await page.getByLabel('Correo', { exact: true }).fill(uniqueEmail('valida'));
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('OtraClave99');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.locator('.auth-summary').getByRole('alert')).toContainText(
      'Revisa los campos marcados.',
    );
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Pedro');
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');

    // Un correo ya registrado recibe la misma respuesta que uno nuevo.
    await page.getByLabel('Correo', { exact: true }).fill(existing.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText(/Revisa tu correo/)).toBeVisible();
  });

  test('acceso, perfil y cierre de sesión', async ({ page }) => {
    const user = await createUser('acceso', { firstName: 'Mateo', lastName: 'Ríos' });
    await signIn(page, { email: user.email, password: 'ClaveErrada1' }, { expectSuccess: false });
    await expect(page.locator('.auth-summary').getByRole('alert')).toContainText(
      'Correo o contraseña incorrectos.',
    );
    await signIn(
      page,
      { email: uniqueEmail('nadie'), password: PASSWORD },
      { expectSuccess: false },
    );
    await expect(page.locator('.auth-summary').getByRole('alert')).toContainText(
      'Correo o contraseña incorrectos.',
    );

    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Mateo' })).toBeVisible();
    await expect(accountMenu(page).locator('summary')).toHaveAttribute(
      'aria-label',
      'Cuenta de Mateo Ríos',
    );
    const menu = await openMenu(page);
    await expect(menu.getByRole('link', { name: 'Panel docente' })).toHaveCount(0);
    await menu.getByRole('link', { name: 'Mi perfil' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Mateo Ríos' })).toBeVisible();
    await expect(page.getByText('Correo y contraseña')).toBeVisible();
    await expect(page.getByText('Estudiante')).toBeVisible();

    await page.getByLabel('Apellido', { exact: true }).fill('Ríos Peña');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Datos guardados.')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Mateo Ríos Peña' })).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(accountMenu(page).locator('summary')).toHaveAttribute(
      'aria-label',
      'Cuenta: invitado',
    );
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile$/);
  });

  test('el avance se guarda en la cuenta, sobrevive a la recarga y llega a otro dispositivo', async ({
    page,
    browser,
  }) => {
    const user = await createUser('progreso', { firstName: 'Sara' });
    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
    await completeDistinctLesson(page);
    await expect.poll(() => cloudLessons(page), { timeout: 15_000 }).toEqual(['L10']);
    await page.reload();
    await expect(page.getByText('Ya la resolviste. Puedes repetirla.')).toBeVisible();

    const other = await browser.newContext();
    const phone = await other.newPage();
    await signIn(phone, user);
    await expect(phone.getByRole('heading', { level: 1, name: 'Hola, Sara' })).toBeVisible();
    await expect(phone.getByText('Completaste la lección «DISTINCT»')).toBeVisible();
    await expect(phone.getByText(`1 de ${LESSON_COUNT} lecciones publicadas`)).toBeVisible();
    await phone.goto('/learn');
    await expect(
      phone.getByRole('heading', { name: `1 de ${LESSON_COUNT} lecciones` }),
    ).toBeVisible();
    await other.close();
  });

  test('el avance de invitado se suma a la cuenta al iniciar sesión, sin perder nada', async ({
    page,
    browser,
  }) => {
    const user = await createUser('fusion', { firstName: 'Iván' });
    // Nube: DISTINCT (L10), completado desde otro dispositivo.
    const first = await browser.newContext();
    const laptop = await first.newPage();
    await signIn(laptop, user);
    await completeDistinctLesson(laptop);
    await expect.poll(() => cloudLessons(laptop), { timeout: 15_000 }).toEqual(['L10']);
    await first.close();

    // Este dispositivo, como invitado: Alias (L08) completado.
    await page.goto('/learn/alias');
    await page.getByRole('radio', { name: /Sigue llamándose SALARIO/ }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('.mini-check').getByRole('status')).toContainText('Correcto.');

    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect.poll(() => cloudLessons(page), { timeout: 15_000 }).toEqual(['L08', 'L10']);
    await expect(page.getByText(`2 de ${LESSON_COUNT} lecciones publicadas`)).toBeVisible();
    // Una sincronización antigua no devuelve una lección completada a «en curso».
    const stale = await page.request.post('/api/progress', {
      headers: { Origin: new URL(page.url()).origin },
      data: {
        records: [
          {
            section: 'fundamentos-sql',
            mode: 'study',
            item: 'L10',
            status: 'in_progress',
            percent: 0,
            contentVersion: null,
            state: {},
            lastActivityAt: 1,
          },
        ],
      },
    });
    expect(stale.ok()).toBe(true);
    await expect.poll(() => cloudLessons(page)).toEqual(['L08', 'L10']);
  });

  test('un estudiante no entra al panel docente ni puede escribir progreso inventado', async ({
    page,
  }) => {
    const user = await createUser('estudiante');
    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/teacher');
    await expect(page).toHaveURL(/\/teacher$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
    await expect(page.getByText('Seguimiento del grupo')).toHaveCount(0);

    const origin = new URL(page.url()).origin;
    const invented = await page.request.post('/api/progress', {
      headers: { Origin: origin },
      data: {
        records: [
          {
            section: 'plsql',
            mode: 'study',
            item: 'L99',
            status: 'completed',
            percent: 100,
            contentVersion: 1,
            state: {},
            lastActivityAt: Date.now(),
          },
        ],
      },
    });
    expect(invented.status()).toBe(400);
    const crossSite = await page.request.post('/api/progress', {
      headers: { Origin: 'https://otro-sitio.example' },
      data: { records: [] },
    });
    expect(crossSite.status()).toBe(403);
  });

  test('el profesor ve el grupo con su avance, conexión y búsqueda', async ({ page, browser }) => {
    const student = await createUser('alumno', { firstName: 'Valentina', lastName: 'Zuleta' });
    const teacher = await createUser('docente', { firstName: 'Amílcar', lastName: 'Sierra' });
    await setRole(teacher.email, 'teacher');

    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await signIn(studentPage, student);
    await completeDistinctLesson(studentPage);
    await expect.poll(() => cloudLessons(studentPage), { timeout: 15_000 }).toEqual(['L10']);

    await signIn(page, teacher);
    const menu = await openMenu(page);
    await menu.getByRole('link', { name: 'Panel docente' }).click();
    await expect(page).toHaveURL(/\/teacher$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Seguimiento del grupo' }),
    ).toBeVisible();
    await page.getByLabel('Buscar por nombre, apellido o correo').fill(student.email);
    await page.locator('.teacher-search').getByRole('button', { name: 'Buscar' }).click();
    const row = page.getByRole('row', { name: /Valentina Zuleta/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText(`5 %`);
    await expect(row).toContainText('Conectado');
    await expect(page.getByRole('status').filter({ hasText: 'coinciden' })).toContainText('1 de');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
    await studentContext.close();
  });

  test('pantallas de cuenta sin desbordes ni barreras de accesibilidad', async ({ page }) => {
    const user = await createUser('vistas');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/login', '/register', '/forgot-password']) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} a ${width}px`).toBeLessThanOrEqual(0);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const path of ['/dashboard', '/profile']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, path).toEqual([]);
    }
  });
});
