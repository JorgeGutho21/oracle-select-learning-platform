import { describe, expect, it, vi } from 'vitest';
import { notifyConfirmedMonitorWrite } from '@/features/assessments/infrastructure/monitor-notifier';

const id = '95bab0dc-2223-4e7c-9832-1e40ed9cf95d';
const monitorKey = 'dc8f7a3e-c765-4730-a8ce-06bec61c66b8';
const config = { url: 'https://project.supabase.co', secretKey: 'server-only-test-key' };

describe('notificación del monitor después de una escritura autorizada', () => {
  it.each(['not-found', 'forbidden', 'invalid', 'error', 'not-expired', undefined])(
    'no consulta con privilegios ni emite una señal para %s',
    async (status) => {
      const fetcher = vi.fn<typeof fetch>();
      await notifyConfirmedMonitorWrite(config, { kind: 'attempt', id }, status, fetcher);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it('envía solo una señal vacía al canal de la evaluación, sin datos del estudiante', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([{ monitor_key: monitorKey }]))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    await notifyConfirmedMonitorWrite(config, { kind: 'assessment', id }, 'started', fetcher);
    expect(fetcher.mock.calls[0]![0]).toContain(`assessments?id=eq.${id}&select=monitor_key`);
    const [url, init] = fetcher.mock.calls[1]!;
    expect(url).toBe(`${config.url}/realtime/v1/api/broadcast`);
    expect(JSON.parse(String(init?.body))).toEqual({
      messages: [{ topic: `assessment-monitor:${monitorKey}`, event: 'changed', payload: {} }],
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('resuelve el canal del intento confirmado sin entregar la fila al navegador', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([{ assessment: { monitor_key: monitorKey } }]))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    await notifyConfirmedMonitorWrite(config, { kind: 'attempt', id }, 'saved', fetcher);
    expect(fetcher.mock.calls[0]![0]).toContain('select=assessment:assessments(monitor_key)');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    { rows: [] },
    { rows: [{ monitor_key: 'invalid' }] },
    { rows: [{ monitor_key: monitorKey }, { monitor_key: monitorKey }] },
  ])('no emite si la lectura administrativa es ambigua o inválida', async ({ rows }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(rows));
    await notifyConfirmedMonitorWrite(config, { kind: 'assessment', id }, 'started', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('un fallo de red no transforma una escritura confirmada en error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('unavailable'));
    await expect(
      notifyConfirmedMonitorWrite(config, { kind: 'attempt', id }, 'submitted', fetcher),
    ).resolves.toBeUndefined();
  });
});
