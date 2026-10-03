import type { Route } from 'next';
import Link from 'next/link';
import type { SectionDto, SectionId } from '../application/sections-api';

export interface SectionRouteProps {
  readonly sections: readonly SectionDto[];
  /** Sección actual; sin ella, la ruta se muestra completa sin marcar ninguna. */
  readonly current?: SectionId;
  readonly label?: string;
}

/** Posición de cada sección en la ruta: 01 → 02 → 03, con su estado en texto. */
export function SectionRoute({ sections, current, label = 'Ruta de DB LAB' }: SectionRouteProps) {
  return (
    <ol className="section-route" aria-label={label}>
      {sections.map((section) => {
        const isCurrent = section.id === current;
        const body = (
          <>
            <span className="section-route__code" aria-hidden="true">
              {section.code}
            </span>
            <span className="section-route__copy">
              <span className="section-route__title">
                {section.kicker} · {section.title}
              </span>
              <span className="section-route__status">
                {isCurrent ? `Estás aquí · ${section.statusLabel}` : section.statusLabel}
              </span>
            </span>
          </>
        );
        return (
          <li
            key={section.id}
            className={`section-route__step section-route__step--${section.status}${isCurrent ? ' is-current' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {isCurrent ? (
              <div className="section-route__item">{body}</div>
            ) : (
              <Link href={section.href as Route} className="section-route__item">
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
