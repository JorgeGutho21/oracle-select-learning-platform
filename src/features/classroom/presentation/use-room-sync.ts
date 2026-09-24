'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Failure } from '../application/classroom-service';

const REALTIME_MIN_GAP_MS = 1000;

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected' | 'off';

export type RoomSubscriber = (
  roomId: string,
  onRevision: (revision: number) => void,
  onStatus: (status: Exclude<RealtimeStatus, 'off'>) => void,
) => Promise<{ close(): void }>;

interface SyncOptions<V> {
  readonly load: () => Promise<V | Failure>;
  readonly subscribe?: RoomSubscriber | undefined;
  /** Sin tiempo real, la sala se consulta con esta frecuencia (REALTIME_SPEC: 3 s). */
  readonly pollMs?: number;
  /** Con tiempo real conectado, consulta de seguridad menos frecuente. */
  readonly safetyPollMs?: number;
}

function isFailure(value: unknown): value is Failure {
  return typeof value === 'object' && value !== null && (value as Failure).ok === false;
}

/**
 * Mantiene la vista de la sala al día. Los avisos en tiempo real solo traen la revisión;
 * la vista siempre se pide al servidor y nunca se reconstruye a partir de mensajes.
 */
export function useRoomSync<
  V extends { room: { id: string; revision: number; serverNow: number } },
>({ load, subscribe, pollMs = 2500, safetyPollMs = 10_000 }: SyncOptions<V>) {
  const [view, setView] = useState<V | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [offline, setOffline] = useState(false);
  const [realtime, setRealtime] = useState<RealtimeStatus>(subscribe ? 'connecting' : 'off');
  /** Diferencia entre la hora del servidor y la del navegador al recibir la última vista. */
  const [clockOffset, setClockOffset] = useState(0);
  const sequence = useRef(0);
  const applied = useRef(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  const refresh = useCallback((): Promise<void> => {
    const request = (sequence.current += 1);
    return loadRef.current().then(
      (result) => {
        // Una respuesta que llega tarde no pisa otra más reciente.
        if (request < applied.current) return;
        applied.current = request;
        setOffline(false);
        if (isFailure(result)) {
          setFailure(result);
          return;
        }
        setFailure(null);
        setClockOffset(result.room.serverNow - Date.now());
        setView((current) =>
          current &&
          current.room.id === result.room.id &&
          current.room.revision > result.room.revision
            ? current
            : result,
        );
      },
      () => {
        // Sin conexión: se conserva la última vista y se reintenta en la próxima consulta.
        setOffline(true);
      },
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const roomId = view?.room.id ?? null;
  const revisionRef = useRef(0);
  useEffect(() => {
    revisionRef.current = view?.room.revision ?? 0;
  }, [view]);

  useEffect(() => {
    if (!subscribe || !roomId) return;
    let closed = false;
    let subscription: { close(): void } | null = null;
    // Los avisos se agrupan: como mucho una consulta por segundo aunque lleguen en ráfaga.
    let lastAt = 0;
    let timer: number | undefined;
    subscribe(
      roomId,
      (revision) => {
        if (revision <= revisionRef.current || timer !== undefined) return;
        timer = window.setTimeout(
          () => {
            timer = undefined;
            lastAt = Date.now();
            if (!closed) void refresh();
          },
          Math.max(0, lastAt + REALTIME_MIN_GAP_MS - Date.now()),
        );
      },
      (status) => {
        if (!closed) setRealtime(status);
        // Al reconectar se pide la vista: pudieron perderse avisos.
        if (status === 'connected') void refresh();
      },
    )
      .then((created) => {
        if (closed) created.close();
        else subscription = created;
      })
      .catch(() => {
        if (!closed) setRealtime('disconnected');
      });
    return () => {
      closed = true;
      window.clearTimeout(timer);
      subscription?.close();
    };
  }, [subscribe, roomId, refresh]);

  useEffect(() => {
    const every = realtime === 'connected' ? safetyPollMs : pollMs;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, every);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [realtime, pollMs, safetyPollMs, refresh]);

  return { view, failure, offline, realtime, clockOffset, refresh };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPercent(value: number | null): string {
  return value === null ? 'Sin datos' : `${Math.round(value * 100)} %`;
}
