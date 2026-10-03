'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { cookieHasSessionHint } from '@/features/accounts/application/session-hint';

const subscribe = () => () => {};
const clientSnapshot = () => cookieHasSessionHint(document.cookie);
const serverSnapshot = () => null;

/**
 * Dónde se guarda el avance. Invitado: en este dispositivo, con la invitación a crear una
 * cuenta. Con sesión: además se sincroniza. Nunca bloquea el estudio.
 */
export function ProgressStorageNote() {
  const signedIn = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (signedIn) {
    return <>Tu progreso se guarda en este dispositivo y se sincroniza con tu cuenta.</>;
  }
  return (
    <>
      Tu progreso se está guardando en este dispositivo.{' '}
      <Link href="/register">Crear cuenta para sincronizar tu progreso</Link>.
    </>
  );
}
