// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { oracleStatusResponse } from '@/composition/lab/oracle-status-api';
import { loadOracleStatus } from '@/features/laboratory/infrastructure/http-oracle-status';

afterEach(() => vi.unstubAllGlobals());

describe('estado real de Oracle por HTTP', () => {
  it('un fallo del adaptador no revela el error privado ni afirma disponibilidad', async () => {
    const response = await oracleStatusResponse({
      status: vi.fn().mockRejectedValue(new Error('private connection configuration')),
      execute: vi.fn(),
    });
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body).toMatchObject({ available: false, reason: 'unreachable' });
    expect(JSON.stringify(body)).not.toContain('private connection configuration');
  });

  it('un HTTP fallido o un DTO incompleto nunca se transforma en Conectado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(loadOracleStatus()).rejects.toThrow('No se pudo comprobar');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ available: true })));
    await expect(loadOracleStatus()).rejects.toThrow('estado de Oracle válido');
  });

  it('propaga la cancelación de la lectura sin modificar el estado real del servicio', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      ),
    );
    const controller = new AbortController();
    const read = loadOracleStatus(controller.signal);
    controller.abort();
    await expect(read).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
