import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PixelCard } from '@/presentation/components/effects/pixel-card';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StarBorder } from '@/presentation/components/effects/star-border';
import { StatusBadge } from '@/presentation/components/ui';
import type { SectionDto } from '../application/sections-api';

export interface SectionCardProps {
  readonly section: SectionDto;
  readonly headingLevel?: 2 | 3;
  /** Avance del estudiante (componente cliente) o un estado neutro. */
  readonly progress?: ReactNode;
}

/**
 * Tarjeta de una sección en la ruta: qué se aprende, qué práctica tiene, su estado y su
 * avance. La sección disponible lleva el borde con destellos; las próximas, los píxeles.
 */
export function SectionCard({ section, headingLevel = 3, progress }: SectionCardProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const available = section.status === 'available';
  const titleId = `section-card-${section.id}`;
  const content = (
    <article className="section-card__body" aria-labelledby={titleId}>
      <div className="section-card__top">
        <span className="section-card__code" aria-hidden="true">
          {section.code}
        </span>
        <StatusBadge tone={available ? 'available' : 'coming-soon'}>
          {section.statusLabel}
        </StatusBadge>
      </div>
      <p className="section-card__kicker">{section.kicker}</p>
      <Heading id={titleId} className="section-card__title">
        {section.title}
      </Heading>
      <p className="section-card__summary">{section.summary}</p>
      <ul className="section-card__topics" aria-label={`Temas principales de ${section.title}`}>
        {section.highlights.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <dl className="section-card__meta">
        <div>
          <dt>{available ? 'Práctica' : 'Práctica prevista'}</dt>
          <dd>{section.practice}</dd>
        </div>
      </dl>
      {progress && <div className="section-card__progress">{progress}</div>}
      <Link href={section.href as Route} className="section-card__link">
        {available ? `Entrar a ${section.title}` : `Ver el plan de la ${section.kicker}`}
        <span aria-hidden="true"> →</span>
      </Link>
    </article>
  );

  if (available) {
    return (
      <StarBorder className="section-card-frame">
        <SpotlightCard className="section-card section-card--available">{content}</SpotlightCard>
      </StarBorder>
    );
  }
  return <PixelCard className="section-card section-card--coming-soon">{content}</PixelCard>;
}
