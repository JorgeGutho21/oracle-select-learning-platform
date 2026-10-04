import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  ACCOUNTS_ENABLED,
  SUPABASE_URL,
  createUser,
  setRole,
  signIn,
  type TestUser,
} from './support/accounts';
import { expectNoHorizontalScroll } from './support/layout';

const run = `${Date.now()}-${process.pid}`;
const sections = ['fundamentos-sql', 'consultas-relacionales', 'plsql'] as const;
let teacher: TestUser;
let student: TestUser;
const ownedAssessments: string[] = [];
const preview = process.env.PHASE5_REMOTE_QA === 'preview';
const state = preview ? 'output/playwright/phase5/remote-state.json' : undefined;

async function admin(path: string, method: string) {
  return fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { apikey: process.env.E2E_SUPABASE_SECRET_KEY ?? '' },
  });
}
async function capture(page: Page, name: string) {
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoHorizontalScroll(page, `${name} @${width}`);
    const records = page.locator('.record-table');
    for (const record of await records.all()) {
      await expect(record.getByRole('table')).toBeVisible();
      await expect(record.getByRole('rowheader').first()).toBeVisible();
      if (width <= 1024) {
        const tabs = record.getByRole('tab');
        await expect(tabs.first()).toBeVisible();
        expect(
          await tabs.evaluateAll((buttons) =>
            buttons.every((button) => button.getBoundingClientRect().height >= 44),
          ),
        ).toBe(true);
        await tabs.first().focus();
        await page.keyboard.press('End');
        await expect(tabs.last()).toBeFocused();
        await expect(record.getByRole('rowheader').first()).toBeVisible();
        await tabs.first().click();
      }
    }
    if ([1440, 390].includes(width)) {
      mkdirSync('output/playwright/phase5/screens', { recursive: true });
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.screenshot({
        path: `output/playwright/phase5/screens/${name}-${width}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}
async function answer(page: Page) {
  const order = page.getByRole('button', { name: 'Guardar este orden' });
  if (await order.count()) await order.click();
  else await page.locator('.exam-options input').first().check();
}

test.describe('Fase 5: cuentas y evaluación por sección', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!ACCOUNTS_ENABLED, 'Requires isolated local Supabase.');
  test.beforeAll(async () => {
    if (preview) {
      expect(process.env.REMOTE_BASE_URL).toMatch(
        /^https:\/\/sql-select-[a-z0-9]+-jorge-gutierrez1\.vercel\.app\/?$/,
      );
    } else {
      expect(['127.0.0.1', 'localhost']).toContain(new URL(SUPABASE_URL).hostname);
    }
    teacher = await createUser('phase5-teacher', { firstName: 'Lucía', lastName: 'Docente QA' });
    student = await createUser('phase5-student', { firstName: 'Alba', lastName: 'Estudiante QA' });
    await setRole(teacher.email, 'teacher');
  });
  test.afterAll(async () => {
    for (const id of ownedAssessments) {
      expect((await admin(`/rest/v1/assessment_audit?assessment_id=eq.${id}`, 'DELETE')).ok).toBe(
        true,
      );
      expect((await admin(`/rest/v1/assessments?id=eq.${id}`, 'DELETE')).ok).toBe(true);
    }
    for (const user of [teacher, student].filter(Boolean))
      expect((await admin(`/auth/v1/admin/users/${user.id}`, 'DELETE')).ok).toBe(true);
  });

  test('el avance de invitado de las tres secciones se sincroniza y llega a otra sesión', async ({
    page,
    browser,
  }) => {
    await page.goto('/learn/alias');
    await page.getByRole('radio', { name: /Sigue llamándose SALARIO/ }).check();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('.mini-check').getByRole('status')).toContainText('Correcto.');
    await page.goto('/sections/consultas-relacionales/study/left-outer-join');
    await page
      .getByRole('radio', {
        name: 'FROM departamentos d LEFT JOIN empleados e ON d.id_departamento = e.id_departamento',
        exact: true,
      })
      .check();
    await page.locator('.mini-check').getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('.mini-check__message--correct')).toBeVisible();
    await page.goto('/sections/plsql/study/old-y-new');
    await page.locator('.mini-check').getByRole('radio', { name: 'NULL', exact: true }).check();
    await page.locator('.mini-check').getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('.mini-check__message--correct')).toBeVisible();
    await signIn(page, student);
    const cloud = async (target: Page) => {
      const response = await target.request.get('/api/progress');
      const body = (await response.json()) as { records: { section: string; status: string }[] };
      return [
        ...new Set(
          body.records.filter((item) => item.status === 'completed').map((item) => item.section),
        ),
      ].sort();
    };
    await expect.poll(() => cloud(page), { timeout: 15_000 }).toEqual([...sections].sort());
    await page.goto('/');
    await expect(page.locator('.home-progress h2')).toHaveText('3 de 78 lecciones');
    await page.goto('/dashboard');
    await capture(page, 'student-dashboard');
    const context = await browser.newContext(state ? { storageState: state } : {});
    try {
      const other = await context.newPage();
      await signIn(other, student);
      await expect.poll(() => cloud(other)).toEqual([...sections].sort());
    } finally {
      await context.close();
    }
  });

  for (const section of sections) {
    test(`${section}: crear, publicar, responder sin conexión, entregar y liberar retroalimentación`, async ({
      page,
      browser,
    }) => {
      test.setTimeout(90_000);
      await signIn(page, teacher);
      await page.goto('/teacher/questions');
      await page.getByRole('button', { name: 'Sincronizar banco oficial de DB LAB' }).click();
      await expect(page.getByText(/Banco oficial sincronizado/)).toBeVisible();
      if (section === sections[0]) await capture(page, 'teacher-question-bank');
      await page.goto('/teacher/assessments/new');
      await page.getByLabel('Nombre de la evaluación').fill(`QA Fase 5 ${section} ${run}`);
      await page.getByLabel('Sección', { exact: true }).selectOption(section);
      await page.getByLabel('Selección automática').check();
      await page.getByLabel('Cantidad de preguntas por estudiante').fill('1');
      await page.getByLabel('Duración (minutos)').fill('5');
      await page.getByLabel('Solo los estudiantes que elija', { exact: true }).check();
      await page.getByRole('checkbox', { name: new RegExp(student.email) }).check();
      if (section === sections[0]) await capture(page, 'teacher-create-assessment');
      await page.getByRole('button', { name: 'Guardar borrador' }).click();
      await expect(page).toHaveURL(/\/teacher\/assessments\/[0-9a-f-]{36}/);
      const path = new URL(page.url()).pathname;
      ownedAssessments.push(path.split('/').at(-1)!);
      await page.locator('summary', { hasText: 'Publicar…' }).click();
      await page.getByRole('button', { name: 'Publicar evaluación', exact: true }).click();
      const context = await browser.newContext(state ? { storageState: state } : {});
      try {
        const exam = await context.newPage();
        await signIn(exam, student);
        await exam.goto(path.replace('/teacher/assessments/', '/evaluations/'));
        await exam.getByRole('button', { name: 'Comenzar evaluación' }).click();
        await expect(exam.getByRole('timer')).toBeVisible();
        expect(await exam.content()).not.toMatch(/is_correct|"correct":|"explanation":/);
        if (section === sections[0]) await capture(exam, 'student-exam');
        await context.setOffline(true);
        await answer(exam);
        await expect(exam.locator('.exam-save')).toContainText(/Sin conexión|pendientes/);
        await context.setOffline(false);
        await expect(exam.locator('.exam-save')).toHaveText('Guardado', { timeout: 15_000 });
        await exam.reload();
        await expect(exam.locator('.exam-header__progress')).toContainText('1/1');
        await page.goto(`${path}/monitor`);
        await expect(page.getByRole('row', { name: new RegExp(student.email) })).toContainText(
          'En curso',
        );
        if (section === sections[0]) await capture(page, 'teacher-monitor');
        await exam.getByRole('button', { name: 'Entregar evaluación' }).click();
        await exam.getByRole('dialog').getByRole('button', { name: 'Entregar evaluación' }).click();
        await expect(exam).toHaveURL(/aviso=entregada/);
        await page.goto(path);
        await page.locator('.teacher-feedback input[value="full_feedback"]').check();
        await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
        await expect(
          page.getByText('Retroalimentación actualizada para los estudiantes.'),
        ).toBeVisible();
        await exam.reload();
        await expect(exam.getByText('Nota final')).toBeVisible();
        await expect(
          exam.getByRole('heading', { name: 'Retroalimentación por pregunta' }),
        ).toBeVisible();
        await page.goto(`${path}/results`);
        if (section === sections[0]) {
          await capture(page, 'teacher-results');
          await page.goto('/teacher');
          await capture(page, 'teacher-dashboard');
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(results.violations).toEqual([]);
        }
      } finally {
        await context.close();
      }
    });
  }
});
