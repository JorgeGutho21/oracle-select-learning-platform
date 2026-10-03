import type { ClientEventType } from '../domain/assessment';
import { MAX_EVENTS_PER_BATCH } from './exam-wire';

/**
 * Eventos de supervisión del navegador. Se agrupan y se envían cada pocos segundos (o al
 * volver la conexión) junto con la señal de conexión; nunca uno por pulsación. Solo se
 * guarda el tipo, la pregunta actual y, al volver, cuánto duró la ausencia. Nada de teclas,
 * texto, capturas ni datos del dispositivo.
 */

export interface PendingEvent {
  readonly type: ClientEventType;
  readonly at: number;
  readonly position?: number;
  readonly durationMs?: number;
}

export interface WireEvent {
  readonly type: ClientEventType;
  readonly ago_ms: number;
  readonly position?: number;
  readonly duration_ms?: number;
}

/** Repeticiones del mismo evento en menos de este tiempo se cuentan una vez. */
const REPEAT_WINDOW_MS = 1_500;
/** Tope en memoria mientras no hay conexión. */
const MAX_BUFFERED = 200;

const RETURNS: Partial<Record<ClientEventType, ClientEventType>> = {
  focus_returned: 'focus_lost',
  visibility_visible: 'visibility_hidden',
  online: 'offline',
};

export class EventBuffer {
  private events: PendingEvent[] = [];
  private readonly openedAt = new Map<ClientEventType, number>();

  record(type: ClientEventType, at: number, position?: number): void {
    const last = this.events.at(-1);
    if (last && last.type === type && at - last.at < REPEAT_WINDOW_MS) return;
    const startedBy = RETURNS[type];
    let durationMs: number | undefined;
    if (startedBy) {
      const since = this.openedAt.get(startedBy);
      if (since !== undefined) durationMs = Math.max(0, at - since);
      this.openedAt.delete(startedBy);
    } else {
      this.openedAt.set(type, at);
    }
    if (this.events.length >= MAX_BUFFERED) this.events.shift();
    this.events.push({
      type,
      at,
      ...(position !== undefined ? { position } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
    });
  }

  size(): number {
    return this.events.length;
  }

  /** Saca un lote para enviar; si el envío falla, se devuelve con `restore`. */
  take(now: number): { readonly batch: WireEvent[]; readonly taken: PendingEvent[] } {
    const taken = this.events.slice(0, MAX_EVENTS_PER_BATCH);
    this.events = this.events.slice(taken.length);
    return {
      taken,
      batch: taken.map((event) => ({
        type: event.type,
        ago_ms: Math.max(0, Math.min(600_000, now - event.at)),
        ...(event.position !== undefined ? { position: event.position } : {}),
        ...(event.durationMs !== undefined ? { duration_ms: event.durationMs } : {}),
      })),
    };
  }

  restore(taken: readonly PendingEvent[]): void {
    this.events = [...taken, ...this.events].slice(-MAX_BUFFERED);
  }
}
