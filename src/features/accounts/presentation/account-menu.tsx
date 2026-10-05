'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Menú de cuenta de la cabecera. Invitado: estado y accesos para entrar o crear cuenta.
 * Con sesión: iniciales, nombre y accesos personales; «Panel docente» solo aparece si el
 * servidor devolvió el rol de profesor (la página vuelve a comprobarlo en el servidor).
 */

export interface MenuAccount {
  readonly displayName: string;
  readonly firstName: string;
  readonly initials: string;
  readonly email: string;
  readonly role: 'student' | 'teacher';
}

export type AccountMenuState =
  | { readonly status: 'loading' }
  | { readonly status: 'guest' }
  /** Hay sesión pero no se pudo comprobar (sin conexión o servicio caído). */
  | { readonly status: 'offline' }
  | { readonly status: 'authenticated'; readonly account: MenuAccount };

export interface AccountMenuProps {
  readonly state: AccountMenuState;
  readonly signOut: () => Promise<void>;
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="account-menu__icon">
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function AccountMenu({ state, signOut }: AccountMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      const menu = ref.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const authenticated = state.status === 'authenticated' ? state.account : null;
  const label = authenticated ? `Cuenta de ${authenticated.displayName}` : 'Cuenta: invitado';

  return (
    <details
      ref={ref}
      className="account-menu"
      data-state={state.status}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !ref.current?.open) return;
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }}
    >
      <summary aria-label={label}>
        {authenticated ? (
          <span className="account-menu__avatar" aria-hidden="true">
            {authenticated.initials}
          </span>
        ) : (
          <span className="account-menu__avatar account-menu__avatar--guest" aria-hidden="true">
            <PersonIcon />
          </span>
        )}
        <span className="account-menu__label" aria-hidden="true">
          {authenticated
            ? authenticated.role === 'teacher'
              ? 'Docente'
              : authenticated.firstName || 'Mi cuenta'
            : 'Entrar'}
        </span>
      </summary>
      <div className="account-menu__panel">
        {authenticated ? (
          <>
            <div className="account-menu__identity">
              <strong>{authenticated.displayName}</strong>
              <span>{authenticated.email}</span>
              {authenticated.role === 'teacher' && (
                <span className="account-menu__role">Profesor</span>
              )}
            </div>
            <nav aria-label="Mi cuenta">
              <Link href="/dashboard">Mi progreso</Link>
              <Link href="/profile">Mi perfil</Link>
              <Link href="/sections">Secciones</Link>
              {authenticated.role === 'teacher' && (
                <>
                  <Link href={'/teacher' as Route}>Panel docente</Link>
                  <Link href={'/teacher/assessments' as Route}>Evaluaciones y supervisión</Link>
                  <Link href={'/teacher/questions' as Route}>Banco de preguntas</Link>
                </>
              )}
            </nav>
            <form action={signOut} className="account-menu__signout">
              <button type="submit">Cerrar sesión</button>
            </form>
          </>
        ) : state.status === 'offline' ? (
          <>
            <div className="account-menu__identity">
              <strong>No pudimos comprobar tu sesión</strong>
              <span>
                Tu avance está guardado en este dispositivo y se sincronizará cuando vuelva la
                conexión.
              </span>
            </div>
            <nav aria-label="Mi cuenta">
              <Link href="/dashboard">Mi progreso</Link>
              <Link href="/sections">Secciones</Link>
            </nav>
          </>
        ) : (
          <>
            <div className="account-menu__identity">
              <strong>Estás como invitado</strong>
              <span>Tu progreso se está guardando en este dispositivo.</span>
            </div>
            <nav aria-label="Acceso">
              <Link href="/login" className="account-menu__primary">
                Iniciar sesión
              </Link>
              <Link href="/register">Crear cuenta para sincronizar tu progreso</Link>
            </nav>
          </>
        )}
      </div>
    </details>
  );
}
