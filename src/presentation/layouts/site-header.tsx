'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { PRODUCT_IDENTITY as product } from '@/application/academic-identity';
import { isNavigationItemActive } from '@/features/search/application/search-index';
import { SearchPalette } from '@/features/search/presentation/search-palette';
import { platformRoutes } from '@/presentation/navigation/routes';

export function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const lastPathname = useRef(pathname);

  // Al cambiar de ruta el menú móvil se cierra, también con los botones del navegador. No
  // actúa al montar: un toque temprano, antes de hidratar, dejaría el menú cerrado de golpe.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  const renderLinks = () =>
    platformRoutes.map((item) => (
      <Link
        key={item.href}
        href={item.href as Route}
        aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
        onClick={() => {
          if (menuRef.current) menuRef.current.open = false;
        }}
      >
        {item.label}
      </Link>
    ));

  return (
    <header className="site-header">
      <div className="site-container site-header__bar">
        <Link href="/" className="site-brand" aria-label={`${product.name} — Inicio`}>
          <span className="site-brand__mark" aria-hidden="true">
            &gt;_
          </span>
          <span className="site-brand__text" aria-hidden="true">
            <span className="site-brand__name">
              DB <strong>LAB</strong>
            </span>
            <span className="site-brand__tagline">Bases de Datos con Oracle</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {renderLinks()}
        </nav>
        <div className="site-header__actions">
          <SearchPalette />
          <details
            ref={menuRef}
            className="mobile-menu"
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !menuRef.current?.open) return;
              menuRef.current.open = false;
              menuRef.current.querySelector('summary')?.focus();
            }}
          >
            <summary aria-label="Menú de navegación">
              <span className="mobile-menu__icon" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="mobile-menu__label">Menú</span>
            </summary>
            <nav aria-label="Navegación móvil">{renderLinks()}</nav>
          </details>
        </div>
      </div>
    </header>
  );
}
