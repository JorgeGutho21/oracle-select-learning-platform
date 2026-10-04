import { useMemo, useSyncExternalStore } from 'react';

/** Reloj con tic de un segundo alineado con la última hora que envió el servidor. */
class ServerClock {
  private monotonicReference: number | undefined;
  private readonly reference: number;

  constructor(serverNow: string) {
    const parsed = Date.parse(serverNow);
    this.reference = Number.isFinite(parsed) ? parsed : 0;
  }

  readonly subscribe = (callback: () => void): (() => void) => {
    // El tiempo transcurrido no cambia cuando se ajusta la fecha del dispositivo.
    // Cada nueva hora recibida del servidor crea una nueva referencia.
    this.monotonicReference ??= performance.now();
    callback();
    const timer = window.setInterval(callback, 1000);
    return () => window.clearInterval(timer);
  };

  readonly snapshot = (): number => {
    const elapsed =
      this.monotonicReference === undefined
        ? 0
        : Math.max(0, performance.now() - this.monotonicReference);
    // Preserve the server's millisecond precision: flooring the reference itself
    // can add a displayed second to a newly started exam (ceil in formatClock).
    return this.reference + Math.floor(elapsed / 1000) * 1000;
  };

  readonly server = (): number => this.reference;
}

/**
 * Hora del servidor más tiempo monotónico transcurrido. El render solo lee el valor;
 * cambiar el reloj de calendario del dispositivo no amplía ni acorta el examen.
 */
export function useServerClock(serverNow: string): number {
  const clock = useMemo(() => new ServerClock(serverNow), [serverNow]);
  return useSyncExternalStore(clock.subscribe, clock.snapshot, clock.server);
}
