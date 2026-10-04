import 'server-only';
import { z } from 'zod';

export type MonitorTarget = {
  readonly kind: 'assessment' | 'attempt';
  readonly id: string;
};

const key = z.string().uuid();
const assessment = z.object({ monitor_key: key });
const accepted = new Set([
  'started',
  'resumed',
  'saved',
  'ok',
  'submitted',
  'already-submitted',
  'finished',
  'published',
  'updated',
]);

/**
 * Señal sin datos después de una RPC autorizada y confirmada. REST no depende del
 * consumidor de replicación de Broadcast desde Postgres. La clave del canal se lee
 * únicamente en servidor; ningún estudiante recibe esa clave ni filas administrativas.
 */
export async function notifyConfirmedMonitorWrite(
  config: { readonly url: string; readonly secretKey: string },
  target: MonitorTarget,
  status: unknown,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (typeof status !== 'string' || !accepted.has(status) || !key.safeParse(target.id).success)
    return;
  try {
    const base = config.url.replace(/\/$/, '');
    const headers = { apikey: config.secretKey, Authorization: `Bearer ${config.secretKey}` };
    const table = target.kind === 'assessment' ? 'assessments' : 'assessment_attempts';
    const select =
      target.kind === 'assessment' ? 'monitor_key' : 'assessment:assessments(monitor_key)';
    const response = await fetcher(
      `${base}/rest/v1/${table}?id=eq.${target.id}&select=${select}&limit=1`,
      { headers, cache: 'no-store', signal: AbortSignal.timeout(2000) },
    );
    if (!response.ok) return;
    const rows = z
      .array(target.kind === 'assessment' ? assessment : z.object({ assessment }))
      .safeParse(await response.json());
    if (!rows.success || rows.data.length !== 1) return;
    const row = rows.data[0]!;
    const monitorKey = 'monitor_key' in row ? row.monitor_key : row.assessment.monitor_key;
    await fetcher(`${base}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ topic: `assessment-monitor:${monitorKey}`, event: 'changed', payload: {} }],
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // El aviso nunca revierte ni impide una escritura confirmada. Sigue el poll de seguridad.
  }
}
