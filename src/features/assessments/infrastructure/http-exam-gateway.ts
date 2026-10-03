import type { ExamGateway } from '../application/answer-queue';
import type { WireEvent } from '../application/event-buffer';
import {
  readAttemptView,
  readSaveOutcome,
  type AnswerEntry,
  type AttemptView,
  type SaveOutcome,
} from '../application/exam-wire';

/**
 * El examen habla con el servidor de DB LAB (`/api/attempts/…`), nunca con Supabase: la
 * sesión viaja en cookies httpOnly y la base valida cada respuesta.
 */

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type HeartbeatOutcome =
  | { readonly status: 'ok'; readonly serverNow: string | null; readonly expiresAt: string | null }
  | { readonly status: 'finished' }
  | { readonly status: 'network' };

export class HttpExamGateway implements ExamGateway {
  constructor(private readonly fetcher: Fetcher = (input, init) => globalThis.fetch(input, init)) {}

  private url(attemptId: string, action = ''): string {
    return `/api/attempts/${encodeURIComponent(attemptId)}${action ? `/${action}` : ''}`;
  }

  private async post(url: string, body: unknown, keepalive = false): Promise<unknown> {
    const response = await this.fetcher(url, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === 401 || response.status >= 500) throw new Error('network');
    return response.json().catch(() => null);
  }

  async view(attemptId: string): Promise<AttemptView | 'network' | 'not-found'> {
    try {
      const response = await this.fetcher(this.url(attemptId), {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 404) return 'not-found';
      if (!response.ok) return 'network';
      return readAttemptView(await response.json()) ?? 'network';
    } catch {
      return 'network';
    }
  }

  async saveAnswers(
    attemptId: string,
    position: number,
    entries: readonly AnswerEntry[],
  ): Promise<SaveOutcome | 'network'> {
    try {
      const body = await this.post(this.url(attemptId, 'answers'), { position, answers: entries });
      return readSaveOutcome(body) ?? 'network';
    } catch {
      return 'network';
    }
  }

  async heartbeat(
    attemptId: string,
    position: number,
    events: readonly WireEvent[],
    keepalive = false,
  ): Promise<HeartbeatOutcome> {
    try {
      const body = (await this.post(
        this.url(attemptId, 'events'),
        { position, events },
        keepalive,
      )) as {
        status?: unknown;
        server_now?: unknown;
        expires_at?: unknown;
      } | null;
      if (body?.status === 'finished' || body?.status === 'not-found')
        return { status: 'finished' };
      if (body?.status !== 'ok') return { status: 'network' };
      return {
        status: 'ok',
        serverNow: typeof body.server_now === 'string' ? body.server_now : null,
        expiresAt: typeof body.expires_at === 'string' ? body.expires_at : null,
      };
    } catch {
      return { status: 'network' };
    }
  }

  async submit(
    attemptId: string,
    reason: 'student' | 'timer',
  ): Promise<'submitted' | 'not-expired' | 'network'> {
    try {
      const body = (await this.post(this.url(attemptId, 'submit'), { reason })) as {
        status?: unknown;
      } | null;
      if (body?.status === 'submitted' || body?.status === 'already-submitted') return 'submitted';
      if (body?.status === 'not-expired') return 'not-expired';
      return 'network';
    } catch {
      return 'network';
    }
  }
}
