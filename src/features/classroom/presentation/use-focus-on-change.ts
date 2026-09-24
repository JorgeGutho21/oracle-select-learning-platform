'use client';

import { useEffect, useRef } from 'react';

const RETRY_MS = 50;
const MAX_TRIES = 20;

/**
 * Cuando la sala cambia de estado la pantalla se sustituye (espera → Challenge → resultado)
 * y el control enfocado desaparece. El foco pasa al título de la nueva pantalla para que el
 * lector de pantalla la anuncie y el teclado continúe desde ahí. No actúa al montar ni
 * roba el foco si la persona ya está en otro control. La pantalla nueva puede tardar un
 * instante en tener título (el Challenge restaura su partida), así que se reintenta.
 */
export function useFocusHeadingOnChange(key: string | null): void {
  const previous = useRef(key);
  useEffect(() => {
    const changed = previous.current !== null && key !== null && previous.current !== key;
    previous.current = key;
    if (!changed) return;
    let tries = 0;
    let timer: number | undefined;
    const attempt = () => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      const heading = document.querySelector<HTMLElement>('#main-content h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus();
      } else if ((tries += 1) < MAX_TRIES) {
        timer = window.setTimeout(attempt, RETRY_MS);
      }
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [key]);
}
