'use client';

import { useHydrated } from '@/presentation/hooks/use-hydrated';
import { useOnline } from '@/presentation/hooks/use-online';

/** Estado de la conexión antes de comenzar (el examen funciona sin conexión por momentos). */
export function ConnectionStatus() {
  const hydrated = useHydrated();
  const online = useOnline();
  if (!hydrated) return null;
  return (
    <p
      className={`assessment-connection assessment-connection--${online ? 'on' : 'off'}`}
      role="status"
    >
      <span className="assessment-connection__dot" aria-hidden="true" />
      {online
        ? 'Conexión disponible.'
        : 'Sin conexión. Conéctate antes de comenzar; durante el examen las respuestas se conservan si la conexión falla por momentos.'}
    </p>
  );
}
