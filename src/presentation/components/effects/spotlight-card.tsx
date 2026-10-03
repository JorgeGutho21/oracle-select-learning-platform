'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

/**
 * Tarjeta con un foco de luz que sigue al ratón.
 *
 * Adaptado de «Spotlight Card» de React Bits (https://github.com/DavidHDev/react-bits),
 * © 2026 David Haz, licencia MIT + Commons Clause (THIRD_PARTY_NOTICES.md). Cambios: solo
 * responde a un ratón (no a toques), colores de los tokens de DB LAB, foco también con el
 * teclado (`:focus-within`) y la capa de luz detrás del contenido sin tocar a los hijos.
 */

export interface SpotlightCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Superficie sobre la que brilla: clara (cian tenue) u oscura (cian más visible). */
  readonly tone?: 'light' | 'dark';
}

export function SpotlightCard({ children, className = '', tone = 'light' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element || event.pointerType !== 'mouse') return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      className={`fx-spotlight fx-spotlight--${tone} ${className}`.trim()}
      onPointerMove={follow}
    >
      {children}
    </div>
  );
}
