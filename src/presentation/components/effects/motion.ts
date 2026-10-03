/**
 * Preferencias de movimiento del dispositivo. Los efectos decorativos solo se animan si el
 * usuario no pidió movimiento reducido, usa un puntero fino (ratón) y no activó el ahorro
 * de datos. En cualquier otro caso se dibujan estáticos o no se dibujan.
 */

interface NavigatorWithConnection extends Navigator {
  readonly connection?: { readonly saveData?: boolean };
}

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return matches('(prefers-reduced-motion: reduce)');
}

/** Verdadero cuando un efecto debe quedarse quieto: movimiento reducido, táctil o ahorro de datos. */
export function prefersStaticEffects(): boolean {
  if (prefersReducedMotion()) return true;
  const saveData =
    typeof navigator !== 'undefined' &&
    (navigator as NavigatorWithConnection).connection?.saveData === true;
  return saveData || matches('(pointer: coarse)');
}
