import type { CSSProperties, ReactNode } from 'react';

/**
 * Borde con dos destellos que recorren los cantos superior e inferior. Marca un estado
 * importante (la sección disponible); no se usa en botones ni en contenido que se lee.
 *
 * Adaptado de «Star Border» de React Bits (https://github.com/DavidHDev/react-bits),
 * © 2026 David Haz, licencia MIT + Commons Clause (THIRD_PARTY_NOTICES.md). Cambios: sin
 * JavaScript (componente de servidor), tipado estricto sin `any`, colores de los tokens,
 * destellos decorativos ocultos a tecnologías de apoyo y quietos con movimiento reducido.
 */

export interface StarBorderProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Compatibilidad con consumidores previos; el sistema limita el destello a 300 ms al interactuar. */
  readonly speed?: `${number}s`;
}

export function StarBorder({ children, className = '', speed = '8s' }: StarBorderProps) {
  const style = { '--star-speed': speed } as CSSProperties;
  return (
    <div className={`fx-star-border ${className}`.trim()} style={style}>
      <span className="fx-star-border__glow fx-star-border__glow--bottom" aria-hidden="true" />
      <span className="fx-star-border__glow fx-star-border__glow--top" aria-hidden="true" />
      <div className="fx-star-border__inner">{children}</div>
    </div>
  );
}
