import type { Route } from 'next';
import Link from 'next/link';

export interface BreadcrumbItem {
  readonly label: string;
  /** Sin enlace en el último elemento: es la página actual. */
  readonly href?: string;
}

export interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
  readonly tone?: 'light' | 'dark';
}

export function Breadcrumb({ items, tone = 'light' }: BreadcrumbProps) {
  return (
    <nav className={`ds-breadcrumb ds-breadcrumb--${tone}`} aria-label="Ruta de navegación">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !current ? (
                <Link href={item.href as Route}>{item.label}</Link>
              ) : (
                <span aria-current={current ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
