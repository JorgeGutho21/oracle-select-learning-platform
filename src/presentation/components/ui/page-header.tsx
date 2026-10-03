import type { ReactNode } from 'react';

export interface PageHeaderProps {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Ruta de navegación encima del título. */
  readonly breadcrumb?: ReactNode;
  /** Acciones principales bajo la entrada. */
  readonly actions?: ReactNode;
  /** Bloque lateral en pantallas anchas (estado, cifras). */
  readonly aside?: ReactNode;
  readonly tone?: 'light' | 'night';
  readonly titleId?: string;
}

/** Cabecera común de las páginas de DB LAB: dónde estoy, qué es y qué puedo hacer. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  breadcrumb,
  actions,
  aside,
  tone = 'light',
  titleId,
}: PageHeaderProps) {
  return (
    <header className={`ds-page-header ds-page-header--${tone}`}>
      <div className="site-container ds-page-header__inner">
        {breadcrumb}
        <div className={`ds-page-header__grid${aside ? ' ds-page-header__grid--aside' : ''}`}>
          <div className="ds-page-header__copy">
            {eyebrow && <p className="ds-page-header__eyebrow">{eyebrow}</p>}
            <h1 id={titleId}>{title}</h1>
            {lead && <p className="ds-page-header__lead">{lead}</p>}
            {actions && <div className="ds-page-header__actions">{actions}</div>}
          </div>
          {aside && <div className="ds-page-header__aside">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
