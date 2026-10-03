'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Secciones del panel docente: pocas y siempre en el mismo lugar. */
const LINKS: readonly {
  readonly href: Route;
  readonly label: string;
  readonly match: (path: string) => boolean;
}[] = [
  {
    href: '/teacher' as Route,
    label: 'Resumen y estudiantes',
    match: (path) => path === '/teacher',
  },
  {
    href: '/teacher/assessments' as Route,
    label: 'Evaluaciones',
    match: (path) => path.startsWith('/teacher/assessments'),
  },
  {
    href: '/teacher/questions' as Route,
    label: 'Banco de preguntas',
    match: (path) => path.startsWith('/teacher/questions'),
  },
];

export function TeacherNav() {
  const pathname = usePathname();
  return (
    <nav className="teacher-nav" aria-label="Panel docente">
      <div className="site-container teacher-nav__inner">
        <span className="teacher-nav__label">Panel docente</span>
        <ul>
          {LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className="teacher-nav__link"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
