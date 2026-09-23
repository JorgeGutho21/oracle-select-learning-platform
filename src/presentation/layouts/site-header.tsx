'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { platformRoutes } from '@/presentation/navigation/routes';

export function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const links = platformRoutes.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname === href ? 'page' : undefined}
      onClick={() => {
        if (menuRef.current) menuRef.current.open = false;
      }}
    >
      {label}
    </Link>
  ));

  return (
    <header className="site-header">
      <div className="site-container header-top">
        <Link href="/" className="site-brand" aria-label="SQL SELECT LAB — Inicio">
          <span className="brand-symbol" aria-hidden="true">
            [s]
          </span>
          <span>
            SQL SELECT <strong>LAB</strong>
          </span>
        </Link>
        <div className="header-search">
          <span aria-hidden="true">⌕</span>
          <button
            type="button"
            disabled
            title="La búsqueda de contenido se integrará en una fase posterior"
          >
            Buscar tema o recurso
          </button>
          <span className="header-search-state">Próximamente</span>
        </div>
        <Link
          href="/dev/design-system"
          className="header-design-link"
          aria-current={pathname === '/dev/design-system' ? 'page' : undefined}
        >
          Sistema de diseño <span aria-hidden="true">↗</span>
        </Link>
        <details ref={menuRef} className="mobile-menu">
          <summary>
            Menú <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Navegación móvil">{links}</nav>
        </details>
      </div>
      <nav className="site-container desktop-nav" aria-label="Navegación principal">
        {links}
      </nav>
    </header>
  );
}
