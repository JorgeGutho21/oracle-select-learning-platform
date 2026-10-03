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

export function AccountRoot() {
  const pathname = usePathname();
  const [state, setState] = useState<AccountMenuState>({ status: 'loading' });
  const sync = useRef<SyncModule | null>(null);
  const presence = useRef<{ module: PresenceModule; lastSent: number } | null>(null);
  const checkedHint = useRef<boolean | null>(null);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const reportPresence = useCallback((force = false) => {
    const current = presence.current;
    if (!current || document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (!force && now - current.lastSent < PRESENCE_MIN_GAP_MS) return;
    current.lastSent = now;
    void import('@/features/progress/application/progress-wire').then(({ presenceArea }) =>
      current.module.sendPresence(presenceArea(pathRef.current)),
    );
  }, []);

  const resolve = useCallback(async () => {
    const hasHint = hinted();
    checkedHint.current = hasHint;
    if (!hasHint) {
      setState({ status: 'guest' });
      sync.current?.progressSync().stop();
      presence.current = null;
      return;
    }
    const session = await fetchSession();
    if (session.status === 'authenticated') {
      setState({ status: 'authenticated', account: session.account });
      sync.current ??= await import('../progress/progress-sync-client');
      void sync.current.progressSync().start(session.account.id);
      presence.current ??= {
        module: await import('@/features/progress/infrastructure/http-progress-gateway'),
        lastSent: 0,
      };
      reportPresence(true);
      return;
    }
    if (session.status === 'guest' || session.status === 'unavailable') {
      setState({ status: 'guest' });
      const loaded = sync.current ?? (await import('../progress/progress-sync-client'));
      loaded.progressSync().cancelExpectation();
      return;
    }
    setState({ status: 'offline' });
    const loaded = sync.current ?? (await import('../progress/progress-sync-client'));
    loaded.progressSync().cancelExpectation();
  }, [reportPresence]);

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
    // Sube lo pendiente y deja el dispositivo limpio para la siguiente persona.
    await sync.current?.progressSync().signOut();
    presence.current = null;
    await signOutAction();
  }, []);

  return <AccountMenu state={state} signOut={signOut} />;
}
