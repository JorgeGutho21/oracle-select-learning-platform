import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';

vi.mock('@/presentation/components/editor/sql-editor', () => ({ SqlEditor: () => null }));
afterEach(cleanup);

it('abandonar el laboratorio cancela su lectura de estado pendiente y maneja el rechazo', async () => {
  let statusSignal: AbortSignal | undefined;
  const loadStatus = vi.fn(
    (signal?: AbortSignal) =>
      new Promise<never>((_, reject) => {
        statusSignal = signal;
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
  );
  const { unmount } = render(
    <LaboratoryWorkspace
      loadStatus={loadStatus}
      execute={vi.fn()}
      repository={{
        load: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      }}
      incomingSql={null}
      returnTo={null}
    />,
  );
  await waitFor(() => expect(loadStatus).toHaveBeenCalledOnce());
  expect(statusSignal?.aborted).toBe(false);
  unmount();
  expect(statusSignal?.aborted).toBe(true);
  // Vitest conserva su detector de promesas sin manejar; no se intercepta globalmente.
});

it('salir del documento cancela el estado antes de desmontar React y volver desde caché lo consulta de nuevo', async () => {
  const signals: AbortSignal[] = [];
  let firstReply!: (status: { available: boolean; reason: null; message: string }) => void;
  const loadStatus = vi.fn((signal?: AbortSignal) => {
    if (signal) signals.push(signal);
    if (signals.length === 1)
      return new Promise<{ available: boolean; reason: null; message: string }>((resolve) => {
        firstReply = resolve;
      });
    return Promise.resolve({ available: true, reason: null, message: 'Conexión nueva verificada' });
  });
  render(
    <LaboratoryWorkspace
      loadStatus={loadStatus}
      execute={vi.fn()}
      repository={{
        load: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      }}
      incomingSql={null}
      returnTo={null}
    />,
  );
  await waitFor(() => expect(loadStatus).toHaveBeenCalledOnce());
  act(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  expect(signals[0]?.aborted).toBe(true);
  act(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await waitFor(() => expect(loadStatus).toHaveBeenCalledTimes(2));
  expect(signals[1]?.aborted).toBe(false);
  await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
  // Un puerto que entrega tarde no puede reemplazar la verificación de la página restaurada.
  await act(async () =>
    firstReply({ available: false, reason: null, message: 'Respuesta anterior' }),
  );
  expect(screen.queryByText('Respuesta anterior')).not.toBeInTheDocument();
  expect(screen.getByText('Conectado')).toBeInTheDocument();
});
