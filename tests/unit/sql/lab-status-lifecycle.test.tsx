import { cleanup, render, waitFor } from '@testing-library/react';
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
