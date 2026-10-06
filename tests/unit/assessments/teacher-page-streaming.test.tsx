import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loaders = vi.hoisted(() => ({
  detail: vi.fn(),
  editor: vi.fn(),
  bank: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('@/composition/assessments/teacher-pages', () => ({
  loadAssessmentDetail: loaders.detail,
  loadAssessmentEditor: loaders.editor,
  loadQuestionBank: loaders.bank,
}));
vi.mock('@/composition/accounts/auth-server', () => ({ requireTeacher: loaders.auth }));
vi.mock('@/composition/assessments/teacher-actions', () => ({
  archiveAssessmentAction: vi.fn(),
  closeEntriesAction: vi.fn(),
  deleteDraftAction: vi.fn(),
  duplicateAssessmentAction: vi.fn(),
  finalizeAssessmentAction: vi.fn(),
  publishAssessmentAction: vi.fn(),
  saveAssessmentAction: vi.fn(),
  setFeedbackModeAction: vi.fn(),
  syncOfficialBankAction: vi.fn(),
}));
vi.mock('@/composition/assessments/teacher-view-models', () => ({
  toDetailRecord: () => ({ title: 'Borrador autorizado', sectionTitle: 'SQL', sectionKey: 'sql' }),
  toFormValues: vi.fn(),
}));
vi.mock('@/features/assessments/presentation/assessment-detail', () => ({
  AssessmentActions: () => <div>Acciones autorizadas</div>,
  AssessmentSettings: () => <div>Configuración cargada</div>,
  AuditList: () => <div>Auditoría cargada</div>,
  DraftQuestionList: () => <div>Selección cargada</div>,
  FrozenQuestionList: () => <div>Selección congelada</div>,
}));
vi.mock('@/features/assessments/presentation/assessment-form', () => ({
  AssessmentForm: () => <div>Editor cargado</div>,
}));
vi.mock('@/features/assessments/presentation/question-bank-view', () => ({
  OfficialBankPanel: () => <div>Banco oficial cargado</div>,
  QuestionBankView: () => <div>Preguntas cargadas</div>,
}));
import DetailPage from '@/app/teacher/assessments/[id]/page';
import BankPage from '@/app/teacher/questions/page';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function settledBeforeData<T>(promise: Promise<T>) {
  let settled = false;
  void promise.then(
    () => {
      settled = true;
    },
    () => {},
  );
  await new Promise((done) => setTimeout(done, 0));
  return settled;
}
const id = '00000000-0000-0000-0000-000000000001';
const detail = {
  status: 'ready',
  record: {},
  phase: 'draft',
  audienceSize: 0,
  assigned: [],
  counts: {},
  draftQuestions: [],
  frozen: [],
  audit: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  loaders.auth.mockResolvedValue({ profile: { role: 'teacher' } });
});
describe('Authenticated teacher pages stream independent reads', () => {
  it('shows the saved record and notice while the editor is still pending', async () => {
    const editor = deferred<{ status: 'error' }>();
    loaders.detail.mockResolvedValue({ ...detail, detail: Promise.resolve(detail) });
    loaders.editor.mockReturnValue(editor.promise);
    const page = DetailPage({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve({ aviso: 'guardada' }),
    });
    const early = await settledBeforeData(page);
    if (!early) editor.resolve({ status: 'error' });
    expect(early).toBe(true);
    await act(async () => {
      render(await page);
    });
    expect(screen.getByRole('heading', { name: 'Borrador autorizado' })).toBeVisible();
    expect(screen.getByText('Cambios guardados.')).toBeVisible();
    expect(screen.getByText('Cargando editor del borrador…')).toBeVisible();
    await act(async () => {
      editor.resolve({ status: 'error' });
    });
    expect(screen.getByText('Cambios guardados.')).toBeVisible();
    expect(await screen.findByText('No pudimos cargar el editor.')).toBeVisible();
  });
  it('shows bank confirmation before the bank read finishes and retains it on read failure', async () => {
    const bank = deferred<{ status: 'error' }>();
    loaders.bank.mockReturnValue(bank.promise);
    const page = BankPage({
      searchParams: Promise.resolve({
        aviso: 'sincronizado',
        nuevas: '1',
        actualizadas: '2',
        iguales: '3',
      }),
    });
    const early = await settledBeforeData(page);
    if (!early) bank.resolve({ status: 'error' });
    expect(early).toBe(true);
    await act(async () => {
      render(await page);
    });
    expect(screen.getByRole('heading', { name: 'Banco de preguntas' })).toBeVisible();
    expect(
      screen.getByText('Banco oficial sincronizado: 1 nuevas, 2 actualizadas y 3 sin cambios.'),
    ).toBeVisible();
    expect(screen.getByText('Cargando banco de preguntas…')).toBeVisible();
    await act(async () => {
      bank.resolve({ status: 'error' });
    });
    expect(await screen.findByText('No pudimos leer el banco.')).toBeVisible();
    expect(
      screen.getByText('Banco oficial sincronizado: 1 nuevas, 2 actualizadas y 3 sin cambios.'),
    ).toBeVisible();
  });
  it('keeps the saved confirmation when secondary detail reads fail', async () => {
    const content = deferred<{ status: 'error' }>();
    loaders.detail.mockResolvedValue({ ...detail, phase: 'published', detail: content.promise });
    await act(async () => {
      render(
        await DetailPage({
          params: Promise.resolve({ id }),
          searchParams: Promise.resolve({ aviso: 'guardada' }),
        }),
      );
    });
    expect(screen.getByText('Cambios guardados.')).toBeVisible();
    expect(screen.getByText('Cargando detalles de la evaluación…')).toBeVisible();
    await act(async () => {
      content.resolve({ status: 'error' });
    });
    expect(await screen.findByText('No pudimos leer los detalles de la evaluación.')).toBeVisible();
    expect(screen.getByText('Cambios guardados.')).toBeVisible();
    expect(loaders.editor).not.toHaveBeenCalled();
  });
  it('does not start bank reads or render a shell before teacher authorization resolves', async () => {
    const auth = deferred<never>();
    loaders.auth.mockReturnValue(auth.promise);
    const page = BankPage({ searchParams: Promise.resolve({}) });
    expect(await settledBeforeData(page)).toBe(false);
    expect(loaders.bank).not.toHaveBeenCalled();
    // Settle without leaking a pending task across tests, using the actual denied boundary.
    auth.resolve(Promise.reject(new Error('403')) as never);
    await expect(page).rejects.toThrow('403');
  });
  it('propagates a missing/denied assessment before rendering its shell', async () => {
    loaders.detail.mockRejectedValue(new Error('404'));
    await expect(
      DetailPage({
        params: Promise.resolve({ id }),
        searchParams: Promise.resolve({ aviso: 'guardada' }),
      }),
    ).rejects.toThrow('404');
    expect(loaders.editor).not.toHaveBeenCalled();
  });
  it('replaces the bank loading state with the actual bank content', async () => {
    const bank = deferred<object>();
    loaders.bank.mockReturnValue(bank.promise);
    await act(async () => {
      render(await BankPage({ searchParams: Promise.resolve({}) }));
    });
    expect(screen.getByText('Cargando banco de preguntas…')).toBeVisible();
    await act(async () => {
      bank.resolve({ status: 'ready', official: [], rows: [], total: 0, pages: 1 });
    });
    expect(await screen.findByText('Banco oficial cargado')).toBeVisible();
    expect(screen.getByText('Preguntas cargadas')).toBeVisible();
    expect(screen.queryByText('Cargando banco de preguntas…')).not.toBeInTheDocument();
  });
});
