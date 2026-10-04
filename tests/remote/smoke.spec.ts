import { expect, test } from '@playwright/test';
import { addPiece, expectCorrect, submit } from '../e2e/challenge-helpers';

test('Preview: sala real con QR, respuesta, ranking y cierre', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const secret = process.env.E2E_PREVIEW_PRESENTER_ACCESS_CODE;
  test.skip(!secret, 'Preview facilitator configuration is required.');
  const student = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: 'output/playwright/phase5/remote-state.json',
  });
  let code: string | undefined;
  try {
    await page.goto('/presenter');
    await page.getByLabel('Clave del profesor').fill(secret!);
    await page.getByRole('button', { name: 'Crear sala' }).click();
    await expect(page).toHaveURL(/\/presenter\/[A-Z2-9]{6}$/);
    code = new URL(page.url()).pathname.split('/').at(-1)!;
    await expect(
      page.getByRole('img', { name: `Código QR para entrar a la sala ${code}` }),
    ).toBeVisible();
    const participant = await student.newPage();
    await participant.goto(`/join/${code}`);
    await participant.getByLabel('Tu alias').fill('QA Preview Fase 5');
    await participant.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('list', { name: 'Participantes en la sala' })).toContainText(
      'QA Preview Fase 5',
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: 'Iniciar el Challenge' }).click();
    await participant
      .getByRole('button', { name: 'Comenzar el Challenge' })
      .click({ timeout: 15_000 });
    for (const column of ['nombre', 'ciudad', 'correo']) await addPiece(participant, column);
    await submit(participant);
    await expectCorrect(participant);
    await expect(page.getByRole('region', { name: 'Ranking', exact: true })).toContainText('100', {
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Finalizar la sala' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Finalizar y ver resultados' })
      .click();
    await expect(page.getByRole('heading', { name: 'Ranking final' })).toBeVisible();
    await expect(
      participant.getByRole('heading', { name: 'Tu resultado, QA Preview Fase 5' }),
    ).toBeVisible({ timeout: 15_000 });
  } finally {
    await student.close();
    if (code) {
      const response = await fetch(
        `${process.env.E2E_SUPABASE_URL}/rest/v1/rooms?code=eq.${code}`,
        {
          method: 'DELETE',
          headers: { apikey: process.env.E2E_SUPABASE_SECRET_KEY ?? '' },
        },
      );
      expect(response.ok, 'Only the room created by this test is removed.').toBe(true);
    }
  }
});

test('Preview: cabeceras de seguridad y archivos privados inaccesibles', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).not.toContain('unsafe-eval');
  for (const path of [
    '/.env.local',
    '/.env.qa.local',
    '/.git/config',
    '/PASSWORD.txt',
    '/.secrets/',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
