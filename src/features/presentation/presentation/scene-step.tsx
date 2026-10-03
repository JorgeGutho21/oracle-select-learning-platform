'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Modo «Paso a paso» de la exposición, compartido por la clase de la Sección 1 y por las de
 * la fuente curricular. Módulo pequeño a propósito: no arrastra las escenas de ninguna clase.
 */

export interface SceneStep {
  /** Paso visible; `Infinity` muestra la escena entera. */
  readonly step: number;
}

export const SceneStepContext = createContext<SceneStep>({ step: Number.POSITIVE_INFINITY });

export function useSceneStep(): number {
  return useContext(SceneStepContext).step;
}

/**
 * Contenido que aparece en el paso `at` del modo «Paso a paso». Mientras está oculto
 * conserva su espacio (sin saltos de diseño) y queda fuera del foco y del lector.
 */
export function Reveal({
  at,
  children,
  className = '',
}: {
  readonly at: number;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const hidden = useSceneStep() < at;
  return (
    <div
      className={`reveal ${className}`.trim()}
      data-hidden={hidden || undefined}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {children}
    </div>
  );
}
