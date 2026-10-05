import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  ACCOUNTS_ENABLED,
  createUser,
  setRole,
  signIn,
  SUPABASE_URL,
  type TestUser,
} from './support/accounts';

/**
 * Evaluaciones de punta a punta contra un Supabase de prueba (`supabase start`): el profesor
 * crea y publica; el estudiante comienza, responde, recarga, continúa y entrega; el profesor
 * supervisa, revisa, libera la retroalimentación y exporta; el estudiante ve lo autorizado.
 */

const SECRET_KEY = process.env.E2E_SUPABASE_SECRET_KEY ?? '';
const run = `${Date.now()}`.slice(-6);
const TITLE = `E2E Parcial NULL ${run}`;

let teacher: TestUser;
let student: TestUser;
let other: TestUser;
let assessmentUrl = '';
let attemptReviewUrl = '';

async function as(browser: Browser, user: TestUser): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, user);
  return page;
}

/** Responde la pregunta visible con la primera opción (o guarda el orden mostrado). */
async function answerCurrent(page: Page) {
  const question = page.locator('.exam-question');
  const order = question.getByRole('button', { name: 'Guardar este orden' });
  if (await order.count()) {
    await order.click();
    return;
  }
  const first = question.locator('.exam-options input').first();
  await first.check();
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expireAttemptSoon(attemptId: string, seconds: number) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/assessment_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    headers: {
      apikey: SECRET_KEY,
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expires_at: new Date(Date.now() + seconds * 1000).toISOString() }),
  });
  expect(response.ok, await response.text()).toBe(true);
}

test.describe.configure({ mode: 'serial' });

test.describe('Evaluaciones', () => {
  test.skip(!ACCOUNTS_ENABLED, 'Requiere un Supabase de prueba (E2E_SUPABASE_URL y clave).');

  test.beforeAll(async () => {
    teacher = await createUser('docente-eval', { firstName: 'Amparo', lastName: 'Docente' });
    await setRole(teacher.email, 'teacher');
    student = await createUser('estudiante-eval', { firstName: 'Jorge', lastName: 'Estudiante' });
    other = await createUser('otro-eval', { firstName: 'Luisa', lastName: 'Otra' });
  });

  test('el profesor sincroniza el banco, crea una evaluación y la publica', async ({ browser }) => {
    const page = await as(browser, teacher);
    await page.goto('/teacher/questions');
    await page.getByRole('button', { name: 'Sincronizar banco oficial de DB LAB' }).click();
    await expect(page.getByText(/Banco oficial sincronizado/)).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Preguntas', exact: true }).getByText(/^\d+ preguntas?$/),
    ).toBeVisible();

    await page.goto('/teacher/assessments/new');
    await page.getByLabel('Nombre de la evaluación').fill(TITLE);
    await page.getByLabel('Selección manual').check();
    await page.getByRole('checkbox', { name: /^NULL/ }).check();
    const picker = page.locator('.question-picker__list li:not([hidden]) input');
    await expect(picker.first()).toBeVisible();
    for (let index = 0; index < 3; index += 1) await picker.nth(index).check();
    await page.getByLabel('Cantidad de preguntas por estudiante').fill('3');
    await page.getByLabel('Duración (minutos)').fill('30');
    await page.getByRole('button', { name: 'Guardar borrador' }).click();
    await expect(page).toHaveURL(/\/teacher\/assessments\/[0-9a-f-]{36}\?aviso=guardada$/);
    assessmentUrl = new URL(page.url()).pathname;
    await expect(page.getByText('Cambios guardados.')).toBeVisible();

    await page.locator('summary', { hasText: 'Publicar…' }).click();
    await page.getByRole('button', { name: 'Publicar evaluación' }).click();
    await expect(page.getByText(/Evaluación publicada/)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Preguntas congeladas al publicar' }),
    ).toBeVisible();
    await page.context().close();
  });

  test('el monitor se actualiza en vivo (Realtime) cuando alguien comienza', async ({
    browser,
  }) => {
    const watcher = await as(browser, teacher);
    await watcher.goto(`${assessmentUrl}/monitor`);
    await expect(watcher.locator('.monitor-status')).toContainText('En vivo', { timeout: 20_000 });
    const live = await createUser('vivo-eval', { firstName: 'Vivo', lastName: 'Prueba' });
    const page = await as(browser, live);
    await page.goto(assessmentUrl.replace('/teacher/assessments/', '/evaluations/'));
    await page.getByRole('button', { name: 'Comenzar evaluación' }).click();
    await expect(page).toHaveURL(/\/attempt$/);
    // Sin recargar: el aviso de la base hace que el panel pida su vista de nuevo.
    await expect(watcher.getByRole('row', { name: new RegExp(live.email) })).toContainText(
      'En curso',
      { timeout: 15_000 },
    );
    await page.context().close();
    await watcher.context().close();
  });

  test('el estudiante comienza, responde, recarga, continúa y entrega', async ({ browser }) => {
    const page = await as(browser, student);
    const pending = page.locator('section', {
      has: page.getByRole('heading', { name: 'Evaluaciones pendientes' }),
    });
    await expect(pending.getByRole('heading', { name: TITLE })).toBeVisible();
    await pending
      .getByRole('link', { name: new RegExp(`Ver reglas y comenzar\\s*: ${TITLE}`) })
      .click();
    await expect(
      page.getByText(/Durante esta evaluación se registran eventos del navegador/),
    ).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations).toEqual([]);

    await page.getByRole('button', { name: 'Comenzar evaluación' }).click();
    await expect(page).toHaveURL(/\/attempt$/);
    await expect(page.getByRole('timer')).toBeVisible();
    // La clave de respuestas no viaja al navegador durante el intento.
    const html = await page.content();
    for (const leak of ['"correct"', 'is_correct', '"explanation"', '"feedback":"']) {
      expect(html).not.toContain(leak);
    }

    await answerCurrent(page);
    await expect(page.locator('.exam-save')).toHaveText('Guardado', { timeout: 10_000 });
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Marcar para revisar' }).click();
    await expect(page.locator('.exam-save')).toHaveText('Guardado', { timeout: 10_000 });

    // Recargar: el mismo examen, con lo guardado y la marca de revisión.
    await page.reload();
    await expect(page.locator('.exam-header__progress')).toContainText('1/3');
    await expect(
      page.getByRole('button', { name: /Pregunta 2: sin responder, marcada para revisar/ }),
    ).toBeVisible();
    const exam = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(exam.violations).toEqual([]);

    for (const position of [2, 3]) {
      await page.getByRole('button', { name: new RegExp(`^Pregunta ${position}:`) }).click();
      await answerCurrent(page);
    }
    await expect(page.locator('.exam-header__progress')).toContainText('3/3');
    await page.getByRole('button', { name: 'Entregar evaluación' }).click();
    const dialog = page.getByRole('dialog', { name: '¿Entregar la evaluación?' });
    await expect(dialog).toContainText('Respondiste todas las preguntas.');
    await expect(dialog).toContainText('1 pregunta marcada para revisar.');
    await dialog.getByRole('button', { name: 'Entregar evaluación' }).click();
    await expect(page).toHaveURL(/\?aviso=entregada$/);
    await expect(
      page.getByText('Evaluación entregada. Tus respuestas quedaron guardadas.'),
    ).toBeVisible();
    await expect(page.getByText('Tu evaluación quedó entregada.')).toBeVisible();
    await expect(page.getByText(/Nota final/)).toHaveCount(0);
    await page.context().close();
  });

  test('el profesor supervisa, revisa resultados, libera la retroalimentación y exporta', async ({
    browser,
  }) => {
    const page = await as(browser, teacher);
    await page.goto(`${assessmentUrl}/monitor`);
    const row = page.getByRole('row', { name: new RegExp(student.email) });
    await expect(row).toContainText('Entregada');
    await expect(row).toContainText('3/3 respondidas');
    await expect(
      page.getByText('Los eventos son señales del navegador, no pruebas de fraude.'),
    ).toBeVisible();

    await page.goto(`${assessmentUrl}/results`);
    const result = page.getByRole('row', { name: new RegExp(student.email) });
    await expect(result).toContainText('Entregada');
    await expect(result.locator('.results-table__grade')).toHaveText(/^[0-5]\.\d$/);
    await expect(page.getByRole('row', { name: new RegExp(other.email) })).toContainText(
      'Sin iniciar',
    );
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations).toEqual([]);
    const review = result.getByRole('link', { name: /Ver intento/ });
    attemptReviewUrl = (await review.getAttribute('href')) ?? '';
    await review.click();
    await expect(page.getByRole('heading', { name: 'Eventos del navegador' })).toBeVisible();
    await expect(page.getByText('Comenzó')).toBeVisible();

    const csv = await page.request.get(`${assessmentUrl}/export`);
    expect(csv.headers()['content-type']).toContain('text/csv');
    const text = await csv.text();
    expect(text.startsWith('﻿Nombre,Apellido,Correo,Evaluación,Sección,Fecha,Estado')).toBe(true);
    expect(text).toContain(student.email);
    expect(text).toContain(TITLE);
    const detail = await (await page.request.get(`${assessmentUrl}/export?detalle=1`)).text();
    expect(detail).toContain('S1-NUL');

    await page.goto(assessmentUrl);
    await page.getByLabel('Nota, respuestas y explicación completa').check();
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(
      page.getByText('Retroalimentación actualizada para los estudiantes.'),
    ).toBeVisible();
    await page.context().close();
  });

  test('el estudiante ve su nota y la retroalimentación autorizada', async ({ browser }) => {
    const page = await as(browser, student);
    await page.goto(assessmentUrl.replace('/teacher/assessments/', '/evaluations/'));
    await expect(page.getByText('Nota final')).toBeVisible();
    await expect(page.locator('.grade-card__value')).toHaveText(/^[0-5]\.\d \/ 5\.0$/);
    await expect(
      page.getByRole('heading', { name: 'Retroalimentación por pregunta' }),
    ).toBeVisible();
    await expect(page.getByText('Tu respuesta').first()).toBeVisible();
    await expect(page.getByText('Respuesta correcta').first()).toBeVisible();
    await expect(page.getByText('Por qué').first()).toBeVisible();
    await expect(page.getByText('Qué debes revisar').first()).toBeVisible();
    await page.context().close();
  });

  test('otro estudiante no lee el intento ajeno ni entra al panel docente', async ({ browser }) => {
    const page = await as(browser, other);
    const attemptId = attemptReviewUrl.split('/').at(-1) ?? '';
    expect(attemptId).toMatch(/^[0-9a-f-]{36}$/);
    const foreign = await page.request.get(`/api/attempts/${attemptId}`);
    expect(foreign.status()).toBe(404);
    const write = await page.request.post(`/api/attempts/${attemptId}/submit`, {
      data: { reason: 'student' },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect([404, 200]).toContain(write.status());
    expect(await write.json()).toEqual({ status: 'not-found' });
    await page.goto(`${assessmentUrl}/results`);
    await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible();
    await expect(page.getByText(student.email)).toHaveCount(0);
    await page.context().close();
  });

  test('en el móvil el examen cabe y, al terminar el tiempo, se entrega solo', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    await signIn(page, other);
    await page.goto(assessmentUrl.replace('/teacher/assessments/', '/evaluations/'));
    await noHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Comenzar evaluación' }).click();
    await expect(page).toHaveURL(/\/attempt$/);
    await noHorizontalOverflow(page);
    await answerCurrent(page);
    await expect(page.locator('.exam-save')).toHaveText('Guardado', { timeout: 10_000 });

    const attemptId = await page.evaluate(() =>
      Object.keys(window.localStorage)
        .concat(Object.keys(window.sessionStorage))
        .map((key) => key.match(/dblab:exam:(?:visit:)?([0-9a-f-]{36})/)?.[1])
        .find(Boolean),
    );
    expect(attemptId).toBeTruthy();
    await expireAttemptSoon(attemptId!, 8);
    await page.reload();
    await expect(page).toHaveURL(/\?aviso=tiempo$/, { timeout: 30_000 });
    await expect(page.getByText(/El tiempo terminó/)).toBeVisible();
    await context.close();
  });
});
