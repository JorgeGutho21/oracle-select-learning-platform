import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';
import { OracleConnectionStatus } from '@/features/laboratory/presentation/oracle-connection-status';
import { DEFAULT_LAB_SQL } from '@/features/laboratory/application/lab-api';

vi.mock('@/presentation/components/editor/sql-editor', () => ({ SqlEditor: () => null }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('el editor y la ejecución siguen disponibles mientras el estado del servidor está pendiente, sin otra lectura HTTP', async () => {
  const fetchStatus = vi.fn();
  vi.stubGlobal('fetch', fetchStatus);
  const execute = vi.fn().mockResolvedValue({
    status: 'unavailable',
    reason: 'unreachable',
    message: 'Servicio temporalmente no disponible',
  });
  const { unmount } = render(
    <LaboratoryWorkspace
      oracleStatus={<OracleConnectionStatus status={null} />}
      execute={execute}
      repository={{
        load: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      }}
      incomingSql={null}
      returnTo={null}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Ejecutar en Oracle' })).toBeEnabled(),
  );
  expect(screen.getByText('Comprobando…')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Ejecutar en Oracle' }));
  expect(execute).toHaveBeenCalledWith(DEFAULT_LAB_SQL);
  await waitFor(() =>
    expect(screen.getByText('Servicio temporalmente no disponible')).toBeInTheDocument(),
  );
  act(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  unmount();
  expect(fetchStatus).not.toHaveBeenCalled();
});

it('un estado nuevo del servidor no vuelve a cargar ni reemplaza el borrador del estudiante', async () => {
  const repository = {
    load: vi.fn().mockResolvedValue('SELECT nombre FROM empleados'),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const execute = vi.fn();
  const props = { execute, repository, incomingSql: null, returnTo: null };
  const view = render(
    <LaboratoryWorkspace
      {...props}
      oracleStatus={
        <OracleConnectionStatus
          status={{
            available: false,
            reason: 'unreachable',
            message: 'No se pudo comprobar la conexión con Oracle.',
          }}
        />
      }
    />,
  );
  await waitFor(() => expect(screen.getByRole('button', { name: 'Analizar' })).toBeEnabled());
  view.rerender(
    <LaboratoryWorkspace
      {...props}
      oracleStatus={
        <OracleConnectionStatus status={{ available: true, reason: null, message: 'Conectado' }} />
      }
    />,
  );
  expect(repository.load).toHaveBeenCalledOnce();
  expect(screen.getByText('Conectado')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Analizar' }));
  expect(repository.save).toHaveBeenLastCalledWith('SELECT nombre FROM empleados');
});
