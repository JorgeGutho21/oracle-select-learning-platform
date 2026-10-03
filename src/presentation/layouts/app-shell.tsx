import type { ReactNode } from 'react';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * Estructura común de DB LAB: salto al contenido, cabecera con navegación, contenido de la
 * ruta y pie académico. Las variantes de cada modo (estudio, exposición, laboratorio) las
 * pone `ModuleLayout` dentro del contenido; ninguna página repite cabecera ni pie.
 */
export function AppShell({
  children,
  account,
}: {
  readonly children: ReactNode;
  /** Menú de cuenta (lo resuelve la raíz de composición). */
  readonly account?: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <SiteHeader account={account} />
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
