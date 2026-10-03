import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** Conexión del navegador (en el servidor se supone conectado). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

const never = () => () => undefined;

/** Pantalla completa disponible (no lo está en Safari de iPhone ni en el servidor). */
export function useFullscreenAvailable(): boolean {
  return useSyncExternalStore(
    never,
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );
}
