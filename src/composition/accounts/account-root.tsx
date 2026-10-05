'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cookieHasSessionHint } from '@/features/accounts/application/session-hint';
import { AccountMenu, type AccountMenuState } from '@/features/accounts/presentation/account-menu';
import type { SessionDto } from './account-api';
import { signOutAction } from './auth-actions';

/**
 * Raíz cliente de la cuenta en la cabecera. Un invitado no hace ninguna petición: sin la
 * marca de sesión, el menú se resuelve al instante. Con sesión, pregunta al servidor por
 * la cuenta y arranca (con carga diferida) la sincronización del progreso y la presencia.
 */

const PRESENCE_INTERVAL_MS = 2 * 60 * 1000;
const PRESENCE_MIN_GAP_MS = 60 * 1000;
const REFRESH_AFTER_MS = 2 * 60 * 1000;

type SyncModule = typeof import('../progress/progress-sync-client');
type PresenceModule = typeof import('@/features/progress/infrastructure/http-progress-gateway');
type SyncService = Pick<
  ReturnType<SyncModule['progressSync']>,
  'start' | 'stop' | 'cancelExpectation' | 'refresh' | 'flush' | 'retryNow' | 'signOut'
>;
type SyncServices = { readonly progressSync: () => SyncService };
type PresenceServices = Pick<PresenceModule, 'sendPresence'>;

const loadSyncServices = () => import('../progress/progress-sync-client');
const loadPresenceServices = () =>
  import('@/features/progress/infrastructure/http-progress-gateway');

export interface AccountRootProps {
  readonly loadSync?: () => Promise<SyncServices>;
  readonly loadPresence?: () => Promise<PresenceServices>;
}

function hinted(): boolean {
  return cookieHasSessionHint(document.cookie);
}

async function fetchSession(): Promise<SessionDto> {
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    return (await response.json()) as SessionDto;
  } catch {
    return { status: 'error' };
  }
}

export function AccountRoot({
  loadSync = loadSyncServices,
  loadPresence = loadPresenceServices,
}: AccountRootProps = {}) {
  const pathname = usePathname();
  const [state, setState] = useState<AccountMenuState>({ status: 'loading' });
  const sync = useRef<SyncServices | null>(null);
  const presence = useRef<{ module: PresenceServices; lastSent: number } | null>(null);
  const checkedHint = useRef<boolean | null>(null);
  const pathRef = useRef(pathname);
  const mounted = useRef(false);
  const resolution = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      resolution.current += 1;
    };
  }, []);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const reportPresence = useCallback((force = false) => {
    const current = presence.current;
    if (!current || document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (!force && now - current.lastSent < PRESENCE_MIN_GAP_MS) return;
    current.lastSent = now;
    void import('@/features/progress/application/progress-wire')
      .then(({ presenceArea }) => {
        if (mounted.current && presence.current === current)
          return current.module.sendPresence(presenceArea(pathRef.current));
      })
      .catch(() => {
        // La carga puede cancelarse al salir. La próxima señal visible podrá reintentar.
        if (presence.current === current) current.lastSent = 0;
      });
  }, []);

  const resolve = useCallback(async () => {
    const currentResolution = ++resolution.current;
    const isCurrent = () => mounted.current && resolution.current === currentResolution;
    const failedDependency = () => {
      if (!isCurrent()) return;
      presence.current = null;
      setState({ status: 'offline' });
      sync.current?.progressSync().cancelExpectation();
    };
    const hasHint = hinted();
    checkedHint.current = hasHint;
    if (!hasHint) {
      setState({ status: 'guest' });
      sync.current?.progressSync().stop();
      presence.current = null;
      return;
    }
    const session = await fetchSession();
    if (!isCurrent()) return;
    if (session.status === 'authenticated') {
      try {
        const loadedSync = sync.current ?? (await loadSync());
        if (!isCurrent()) return;
        sync.current = loadedSync;
        const loadedPresence = presence.current?.module ?? (await loadPresence());
        if (!isCurrent()) return;
        presence.current ??= { module: loadedPresence, lastSent: 0 };
        setState({ status: 'authenticated', account: session.account });
        void loadedSync.progressSync().start(session.account.id).catch(failedDependency);
        reportPresence(true);
      } catch {
        failedDependency();
      }
      return;
    }
    if (session.status === 'guest' || session.status === 'unavailable') {
      setState({ status: 'guest' });
      try {
        const loaded = sync.current ?? (await loadSync());
        if (isCurrent()) loaded.progressSync().cancelExpectation();
      } catch {
        // La sesión ya es de invitado; un chunk no disponible no debe rechazar la tarea.
      }
      return;
    }
    setState({ status: 'offline' });
    try {
      const loaded = sync.current ?? (await loadSync());
      if (isCurrent()) loaded.progressSync().cancelExpectation();
    } catch {
      // Se mantiene el aviso de sesión sin conexión y el progreso local intacto.
    }
  }, [reportPresence, loadSync, loadPresence]);

  // Primera comprobación y cada vez que cambia la marca (entrar o salir sin recargar).
  useEffect(() => {
    if (checkedHint.current === null || checkedHint.current !== hinted()) void resolve();
    else reportPresence();
  }, [pathname, resolve, reportPresence]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      reportPresence();
      void sync.current?.progressSync().refresh(REFRESH_AFTER_MS);
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void sync.current?.progressSync().flush();
    };
    const onOnline = () => sync.current?.progressSync().retryNow();
    const timer = window.setInterval(() => reportPresence(true), PRESENCE_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('online', onOnline);
    };
  }, [reportPresence]);

  const signOut = useCallback(async () => {
    // Una respuesta o carga anterior no puede reactivar esta cuenta durante la salida.
    resolution.current += 1;
    // Sube lo pendiente y deja el dispositivo limpio para la siguiente persona.
    await sync.current?.progressSync().signOut();
    presence.current = null;
    await signOutAction();
  }, []);

  return <AccountMenu state={state} signOut={signOut} />;
}
