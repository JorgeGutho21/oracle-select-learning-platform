// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { oracleStatusResponse, publicOracleStatus } from '@/composition/lab/oracle-status-api';

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

  it('SSR y HTTP solo reciben los campos públicos aunque el adaptador añada información interna', async () => {
    const executor = {
      status: vi.fn().mockResolvedValue({
        available: true,
        reason: null,
        message: 'Conectado',
        internalConfiguration: 'private adapter metadata',
      }),
      execute: vi.fn(),
    };
    const expected = { available: true, reason: null, message: 'Conectado' };
    await expect(publicOracleStatus(executor)).resolves.toEqual({
      status: expected,
      httpStatus: 200,
    });
    const response = await oracleStatusResponse(executor);
    await expect(response.json()).resolves.toEqual(expected);
  });

  it('el estado no disponible del motor se conserva tanto en el fragmento SSR como en la API', async () => {
    const status = {
      available: false,
      reason: 'unreachable',
      message: 'No se pudo comprobar la conexión con Oracle.',
    } as const;
    const executor = { status: vi.fn().mockResolvedValue(status), execute: vi.fn() };
    await expect(publicOracleStatus(executor)).resolves.toEqual({ status, httpStatus: 200 });
    const response = await oracleStatusResponse(executor);
    await expect(response.json()).resolves.toEqual(status);
  });
});
