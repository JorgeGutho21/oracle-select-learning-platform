import { useMemo, useSyncExternalStore } from 'react';

/** Reloj con tic de un segundo alineado con la última hora que envió el servidor. */
class ServerClock {
  private offset = 0;
  private readonly reference: number;

  constructor(serverNow: string) {
    const parsed = Date.parse(serverNow);
    this.reference = Number.isFinite(parsed) ? parsed : 0;
  }

  readonly subscribe = (callback: () => void): (() => void) => {
    // La diferencia con el reloj del dispositivo se mide al suscribirse, no en el render.
    this.offset = this.reference ? this.reference - Date.now() : 0;
    callback();
    const timer = window.setInterval(callback, 1000);
    return () => window.clearInterval(timer);
  };

  readonly snapshot = (): number => Math.floor((Date.now() + this.offset) / 1000) * 1000;

  readonly server = (): number => this.reference;
}

/**
 * Hora del servidor en el navegador. El render solo lee el valor; nunca llama a Date.now()
 * en el cuerpo del componente.
 */
export function useServerClock(serverNow: string): number {
  const clock = useMemo(() => new ServerClock(serverNow), [serverNow]);
  return useSyncExternalStore(clock.subscribe, clock.snapshot, clock.server);
}
