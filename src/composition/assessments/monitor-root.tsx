'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  subscribeToMonitor,
  type MonitorChannelStatus,
} from '@/features/assessments/infrastructure/monitor-subscription';

/**
 * Actualización del monitor. Con Realtime, cada aviso (sin datos) pide de nuevo la vista
 * al servidor, como mucho cada 3 s y con una repetición final para no perder cambios. Sin
 * Realtime, consulta cada 20 s con la pestaña visible. Nunca se transmite cada pulsación.
 */

const MIN_GAP_MS = 3_000;
const FALLBACK_MS = 20_000;
const SAFETY_MS = 60_000;

export function MonitorRefresher({
  realtime,
}: {
  readonly realtime: {
    readonly url: string;
    readonly anonKey: string;
    readonly topic: string;
  } | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MonitorChannelStatus>(
    realtime ? 'connecting' : 'disconnected',
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const last = useRef(0);
  const trailing = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      last.current = Date.now();
      router.refresh();
      setUpdatedAt(
        new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    const signal = () => {
      const wait = MIN_GAP_MS - (Date.now() - last.current);
      if (wait <= 0) refresh();
      if (trailing.current !== null) window.clearTimeout(trailing.current);
      trailing.current = window.setTimeout(refresh, Math.max(wait, MIN_GAP_MS));
    };
    let subscription: { close(): void } | null = null;
    let cancelled = false;
    if (realtime) {
      void subscribeToMonitor(realtime, realtime.topic, signal, setStatus).then((created) => {
        if (cancelled) created.close();
        else subscription = created;
      });
    }
    const poll = window.setInterval(
      () => {
        const quiet = Date.now() - last.current;
        if (!realtime || quiet > SAFETY_MS) refresh();
      },
      realtime ? SAFETY_MS : FALLBACK_MS,
    );
    return () => {
      cancelled = true;
      subscription?.close();
      window.clearInterval(poll);
      if (trailing.current !== null) window.clearTimeout(trailing.current);
    };
  }, [realtime, router]);

  const live = status === 'connected';
  return (
    <p className="monitor-status" role="status">
      <span className={`monitor-dot monitor-dot--${live ? 'on' : 'off'}`}>
        {live
          ? 'En vivo'
          : realtime
            ? 'Reconectando… (se actualiza cada minuto)'
            : 'Se actualiza cada 20 s'}
      </span>
      {updatedAt ? ` · última actualización ${updatedAt}` : ''}
    </p>
  );
}
