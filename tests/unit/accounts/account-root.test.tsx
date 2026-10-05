import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountRoot } from '@/composition/accounts/account-root';

const pathname = vi.hoisted(() => ({ value: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));
vi.mock('@/composition/accounts/auth-actions', () => ({ signOutAction: vi.fn() }));

const account = {
  id: 'qa-session',
  firstName: 'QA',
  lastName: 'Sesión',
  displayName: 'QA Sesión',
  initials: 'QS',
  email: 'qa-session@example.com',
  role: 'teacher',
};
const sessionResponse = () => new Response(JSON.stringify({ status: 'authenticated', account }));
const engine = () => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  cancelExpectation: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  flush: vi.fn().mockResolvedValue(true),
  retryNow: vi.fn(),
  signOut: vi.fn().mockResolvedValue(true),
});

beforeEach(() => {
  pathname.value = '/dashboard';
  document.cookie = 'dblab-session=1; Path=/';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sessionResponse()));
});
afterEach(() => {
  cleanup();
  document.cookie = 'dblab-session=; Path=/; Max-Age=0';
  vi.unstubAllGlobals();
});

describe('ciclo de sesión y cargas diferidas de la cabecera', () => {
  it('no anuncia la cuenta lista mientras la carga de presencia sigue pendiente', async () => {
    const sync = engine();
    const loadSync = vi.fn().mockResolvedValue({ progressSync: () => sync });
    let resolvePresence!: (module: { sendPresence: () => Promise<void> }) => void;
    const loadPresence = vi.fn(
      () =>
        new Promise<{ sendPresence: () => Promise<void> }>((resolve) => {
          resolvePresence = resolve;
        }),
    );
    const { container } = render(<AccountRoot loadSync={loadSync} loadPresence={loadPresence} />);
    await waitFor(() => expect(loadPresence).toHaveBeenCalledOnce());
    expect(container.querySelector('.account-menu')).toHaveAttribute('data-state', 'loading');
    expect(sync.start).not.toHaveBeenCalled();
    await act(async () => resolvePresence({ sendPresence: vi.fn().mockResolvedValue(undefined) }));
    await waitFor(() =>
      expect(container.querySelector('.account-menu')).toHaveAttribute(
        'data-state',
        'authenticated',
      ),
    );
    expect(sync.start).toHaveBeenCalledWith(account.id);
  });

  it('una carga de presencia fallida conserva el aviso sin conexión sin iniciar sincronización', async () => {
    const sync = engine();
    const loadSync = vi.fn().mockResolvedValue({ progressSync: () => sync });
    const loadPresence = vi.fn().mockRejectedValue(new Error('ChunkLoadError: presence'));
    const { container } = render(<AccountRoot loadSync={loadSync} loadPresence={loadPresence} />);
    await waitFor(() =>
      expect(container.querySelector('.account-menu')).toHaveAttribute('data-state', 'offline'),
    );
    expect(sync.start).not.toHaveBeenCalled();
    expect(sync.cancelExpectation).toHaveBeenCalledOnce();
  });

  it('un chunk rechazado muestra el estado sin conexión y no deja una promesa sin manejar', async () => {
    const loadSync = vi.fn().mockRejectedValue(new Error('ChunkLoadError: cancelled download'));
    const { container } = render(<AccountRoot loadSync={loadSync} />);
    await waitFor(() =>
      expect(container.querySelector('.account-menu')).toHaveAttribute('data-state', 'offline'),
    );
    expect(screen.getByText('No pudimos comprobar tu sesión')).toBeInTheDocument();
    expect(loadSync).toHaveBeenCalledOnce();
  });

  it('una respuesta de la sesión anterior no reactiva Docente después de pasar a invitado', async () => {
    let resolveSession!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveSession = resolve;
          }),
      ),
    );
    const sync = engine();
    const loadSync = vi.fn().mockResolvedValue({ progressSync: () => sync });
    const { container, rerender } = render(<AccountRoot loadSync={loadSync} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    document.cookie = 'dblab-session=; Path=/; Max-Age=0';
    pathname.value = '/';
    rerender(<AccountRoot loadSync={loadSync} />);
    await waitFor(() =>
      expect(container.querySelector('.account-menu')).toHaveAttribute('data-state', 'guest'),
    );
    await act(async () => {
      resolveSession(sessionResponse());
    });
    expect(container.querySelector('.account-menu')).toHaveAttribute('data-state', 'guest');
    expect(screen.queryByText('Panel docente')).not.toBeInTheDocument();
    expect(loadSync).not.toHaveBeenCalled();
    expect(sync.start).not.toHaveBeenCalled();
  });

  it('maneja el rechazo de una carga pendiente también después de desmontar la cabecera', async () => {
    let rejectModule!: (error: Error) => void;
    const loadSync = vi.fn(
      () =>
        new Promise<never>((_, reject) => {
          rejectModule = reject;
        }),
    );
    const { unmount } = render(<AccountRoot loadSync={loadSync} />);
    await waitFor(() => expect(loadSync).toHaveBeenCalledOnce());
    unmount();
    await act(async () => {
      rejectModule(new Error('ChunkLoadError: navigation cancelled'));
    });
    // Vitest rechaza la ejecución si la promesa queda sin manejar; no se filtra el error.
    expect(loadSync).toHaveBeenCalledOnce();
  });
});
