import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExamRoot } from '@/composition/assessments/exam-root';
import {
  HttpExamGateway,
  type HeartbeatOutcome,
} from '@/features/assessments/infrastructure/http-exam-gateway';
import type { AttemptView } from '@/features/assessments/application/exam-wire';
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/presentation/hooks/use-server-clock', () => ({
  useServerClock: () => Date.parse('2026-10-05T12:00:00Z'),
}));
vi.mock('@/presentation/hooks/use-online', () => ({
  useOnline: () => true,
  useFullscreenAvailable: () => false,
}));
// El contrato probado es la coordinación, no el marcado de los presentadores.
vi.mock('@/features/assessments/presentation/exam-parts', () => ({
  ExamHeader: () => null,
  ExamQuestion: () => null,
  QuestionNavigator: () => null,
  SubmitDialog: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
    open ? <button onClick={onConfirm}>Confirmar entrega</button> : null,
}));
const view: Extract<AttemptView, { status: 'in_progress' }> = {
  status: 'in_progress',
  attemptId: '00000000-0000-4000-8000-000000000001',
  attemptStatus: 'in_progress',
  submittedBy: null,
  startedAt: '2026-10-05T12:00:00Z',
  expiresAt: '2026-10-05T12:05:00Z',
  submittedAt: null,
  serverNow: '2026-10-05T12:00:00Z',
  currentPosition: 1,
  questionTotal: 1,
  assessment: {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Prueba de coordinación',
    sectionKey: 'plsql',
    recordClipboard: false,
    feedbackMode: 'hidden',
    passGrade: 3,
  },
  items: [
    {
      position: 1,
      type: 'single_choice',
      response: 'single',
      prompt: 'Prueba',
      code: null,
      exhibit: null,
      options: [],
      answer: null,
      flagged: false,
      revision: 0,
    },
  ],
};
function finished(
  by: 'student' | 'timer' | 'teacher',
): Extract<AttemptView, { status: 'finished' }> {
  return {
    ...view,
    status: 'finished',
    attemptStatus: by === 'student' ? 'submitted' : 'auto_submitted',
    submittedBy: by,
    submittedAt: '2026-10-05T12:01:00Z',
    release: 'hidden',
    grade: null,
    scorePercent: null,
    correctCount: null,
    items: null,
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}
beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.restoreAllMocks());
describe('finalización confirmada frente a señales periódicas atrasadas', () => {
  for (const [by, notice] of [
    ['student', 'entregada'],
    ['timer', 'tiempo'],
    ['teacher', 'cerrada'],
  ] as const) {
    it(`identifica ${by} desde el intento confirmado aunque la señal llegue antes de la respuesta de entrega`, async () => {
      const beat = deferred<HeartbeatOutcome>(),
        submission = deferred<'submitted'>();
      vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
      const submit = vi
        .spyOn(HttpExamGateway.prototype, 'submit')
        .mockReturnValue(submission.promise);
      vi.spyOn(HttpExamGateway.prototype, 'view').mockResolvedValue(finished(by));
      render(<ExamRoot view={view} />);
      fireEvent.click(screen.getByRole('button', { name: 'Entregar evaluación' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
      await act(async () => beat.resolve({ status: 'finished' }));
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith(
          `/evaluations/${view.assessment.id}?aviso=${notice}`,
        ),
      );
      await act(async () => submission.resolve('submitted'));
      expect(router.replace).toHaveBeenCalledOnce();
    });
  }
  it('no atribuye un cierre al profesor cuando la lectura de confirmación no tiene conexión', async () => {
    const beat = deferred<HeartbeatOutcome>();
    vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
    vi.spyOn(HttpExamGateway.prototype, 'view').mockResolvedValue('network');
    render(<ExamRoot view={view} />);
    await act(async () => beat.resolve({ status: 'finished' }));
    expect(router.replace).not.toHaveBeenCalled();
  });
  it('descarta una lectura de finalización que llega después de desmontar el examen', async () => {
    const beat = deferred<HeartbeatOutcome>(),
      read = deferred<AttemptView | 'network' | 'not-found'>();
    vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
    const fetchView = vi.spyOn(HttpExamGateway.prototype, 'view').mockReturnValue(read.promise);
    const { unmount } = render(<ExamRoot view={view} />);
    await act(async () => beat.resolve({ status: 'finished' }));
    await waitFor(() => expect(fetchView).toHaveBeenCalledOnce());
    unmount();
    await act(async () => read.resolve(finished('student')));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('no inicia una lectura si el heartbeat termina después de desmontar', async () => {
    const beat = deferred<HeartbeatOutcome>();
    vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
    const fetchView = vi
      .spyOn(HttpExamGateway.prototype, 'view')
      .mockResolvedValue(finished('student'));
    const { unmount } = render(<ExamRoot view={view} />);
    unmount();
    await act(async () => beat.resolve({ status: 'finished' }));
    expect(fetchView).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('no cambia de página si la entrega responde después de abandonar el examen', async () => {
    const submission = deferred<'submitted'>();
    vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockResolvedValue({ status: 'network' });
    const submit = vi
      .spyOn(HttpExamGateway.prototype, 'submit')
      .mockReturnValue(submission.promise);
    const { unmount } = render(<ExamRoot view={view} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entregar evaluación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    unmount();
    await act(async () => submission.resolve('submitted'));
    expect(router.replace).not.toHaveBeenCalled();
  });

  for (const [by, notice] of [
    ['student', 'entregada'],
    ['timer', 'tiempo'],
    ['teacher', 'cerrada'],
  ] as const) {
    it(`conserva el motivo confirmado ${by} si la respuesta idempotente de entrega llega primero`, async () => {
      const beat = deferred<HeartbeatOutcome>();
      vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
      vi.spyOn(HttpExamGateway.prototype, 'submit').mockResolvedValue('submitted');
      vi.spyOn(HttpExamGateway.prototype, 'view').mockResolvedValue(finished(by));
      render(<ExamRoot view={view} />);
      fireEvent.click(screen.getByRole('button', { name: 'Entregar evaluación' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith(
          `/evaluations/${view.assessment.id}?aviso=${notice}`,
        ),
      );
      expect(router.replace).toHaveBeenCalledOnce();
    });
  }

  it('tras una entrega confirmada usa la ficha sin inventar motivo si la lectura no responde', async () => {
    const beat = deferred<HeartbeatOutcome>();
    vi.spyOn(HttpExamGateway.prototype, 'heartbeat').mockReturnValue(beat.promise);
    vi.spyOn(HttpExamGateway.prototype, 'submit').mockResolvedValue('submitted');
    vi.spyOn(HttpExamGateway.prototype, 'view').mockResolvedValue('network');
    render(<ExamRoot view={view} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entregar evaluación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(`/evaluations/${view.assessment.id}`),
    );
    expect(router.replace).toHaveBeenCalledOnce();
  });
});
