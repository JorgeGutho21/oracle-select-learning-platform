import type { CloudProgressGateway, CloudResult } from '../application/progress-sync';
import { MAX_UPLOAD_RECORDS, readProgressRecord } from '../application/progress-wire';
import type { ProgressRecord } from '../domain/progress';

/**
 * Progreso en la nube a través del servidor de DB LAB (`/api/progress`). El navegador no
 * habla con Supabase: la sesión viaja en cookies httpOnly y el servidor aplica RLS.
 */

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

function failure(status: number): CloudResult {
  if (status === 401) return { ok: false, reason: 'unauthenticated' };
  if (status === 503) return { ok: false, reason: 'unavailable' };
  return { ok: false, reason: 'error' };
}

/** Un registro que ya no está en el registro canónico (contenido retirado) se ignora. */
function readRecords(body: unknown): readonly ProgressRecord[] {
  const list = (body as { records?: unknown } | null)?.records;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const record = readProgressRecord(item);
    return record ? [record] : [];
  });
}

export class HttpProgressGateway implements CloudProgressGateway {
  constructor(
    private readonly endpoint = '/api/progress',
    private readonly fetcher: Fetcher = (input, init) => globalThis.fetch(input, init),
  ) {}

  private async request(init: RequestInit, url = this.endpoint): Promise<Response | null> {
    try {
      return await this.fetcher(url, { credentials: 'same-origin', cache: 'no-store', ...init });
    } catch {
      return null;
    }
  }

  async pull(): Promise<CloudResult> {
    const response = await this.request({ method: 'GET' });
    if (!response) return { ok: false, reason: 'offline' };
    if (!response.ok) return failure(response.status);
    return { ok: true, records: readRecords(await response.json().catch(() => null)) };
  }

  async push(records: readonly ProgressRecord[]): Promise<CloudResult> {
    const saved: ProgressRecord[] = [];
    for (let start = 0; start < records.length; start += MAX_UPLOAD_RECORDS) {
      const response = await this.request({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: records.slice(start, start + MAX_UPLOAD_RECORDS) }),
        keepalive: true,
      });
      if (!response) return { ok: false, reason: 'offline' };
      if (!response.ok) return failure(response.status);
      saved.push(...readRecords(await response.json().catch(() => null)));
    }
    return { ok: true, records: saved };
  }

  async reset(section: string, mode: string): Promise<boolean> {
    const query = new URLSearchParams({ section, mode });
    const response = await this.request({ method: 'DELETE' }, `${this.endpoint}?${query}`);
    return response?.ok ?? false;
  }
}

/** Señal de presencia: zona general, solo con la pestaña visible. */
export async function sendPresence(area: string): Promise<void> {
  try {
    await globalThis.fetch('/api/presence', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area }),
      keepalive: true,
    });
  } catch {
    // Sin conexión no hay presencia: el profesor verá «desconectado».
  }
}
