'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { SearchPalette } from '@/features/search/presentation/search-palette';
import { platformRoutes } from '@/presentation/navigation/routes';

export function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const renderLinks = () =>
    platformRoutes.map(({ href, label }) => {
      const active =
        href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

      return (
        <Link
          key={href}
          href={href as Route}
          aria-current={active ? 'page' : undefined}
          onClick={() => {
            if (menuRef.current) menuRef.current.open = false;
          }}
        >
          {label}
        </Link>
      );
    });

  return (
    <header className="site-header">
      <div className="site-container header-top">
        <Link href="/" className="site-brand" aria-label="SQL SELECT LAB — Inicio">
          <span>
            SQL SELECT <strong>LAB</strong>
          </span>
        </Link>
        <SearchPalette />
        <details ref={menuRef} className="mobile-menu">
          <summary>
            Menú <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Navegación móvil">{renderLinks()}</nav>
        </details>
      </div>
      <nav className="site-container desktop-nav" aria-label="Navegación principal">
        {renderLinks()}
      </nav>
    </header>
  );
}
