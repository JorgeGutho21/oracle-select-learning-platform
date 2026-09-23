import type { ReactNode } from 'react';

export interface ModuleLayoutProps {
  children: ReactNode;
  mode?: 'standard' | 'study' | 'presentation' | 'workspace';
}

/** Contenedor de presentación: no carga datos ni ejecuta casos de uso. */
export function ModuleLayout({ children, mode = 'standard' }: ModuleLayoutProps) {
  return <div className={`module-layout module-layout--${mode}`}>{children}</div>;
}
