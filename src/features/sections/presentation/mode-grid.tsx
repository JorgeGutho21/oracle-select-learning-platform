import type { Route } from 'next';
import Link from 'next/link';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StatusBadge } from '@/presentation/components/ui';
import type { SectionMode } from '../application/sections-api';
import { ModeIcon } from './mode-icon';

export interface ModeGridProps {
  readonly modes: readonly SectionMode[];
  readonly sectionTitle: string;
}

/**
 * Modos de trabajo de una sección. Un modo con destino es un enlace a la funcionalidad
 * existente; uno sin destino se muestra como «Próximamente» y no es interactivo.
 */
export function ModeGrid({ modes, sectionTitle }: ModeGridProps) {
  return (
    <ul className="mode-grid" aria-label={`Modos de trabajo de ${sectionTitle}`}>
      {modes.map((mode) => (
        <li key={mode.id}>
          {mode.href ? (
            <SpotlightCard className="mode-card mode-card--available">
              <Link href={mode.href as Route} className="mode-card__link" prefetch={false}>
                <span className="mode-card__icon">
                  <ModeIcon mode={mode.id} />
                </span>
                <span className="mode-card__label">{mode.label}</span>
                <span className="mode-card__description">{mode.description}</span>
                <span className="mode-card__action">
                  {mode.action}
                  <span aria-hidden="true"> →</span>
                </span>
              </Link>
            </SpotlightCard>
          ) : (
            <div className="mode-card mode-card--pending">
              <span className="mode-card__icon">
                <ModeIcon mode={mode.id} />
              </span>
              <span className="mode-card__label">{mode.label}</span>
              <span className="mode-card__description">{mode.description}</span>
              <StatusBadge tone="planned">Próximamente</StatusBadge>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
