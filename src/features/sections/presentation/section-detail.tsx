import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PixelCard } from '@/presentation/components/effects/pixel-card';
import { Breadcrumb, PageHeader, StatusBadge } from '@/presentation/components/ui';
import type { SectionDto } from '../application/sections-api';
import { ModeGrid } from './mode-grid';
import { SectionRoute } from './section-route';
import { LearningJourney } from './learning-journey';

export interface SectionDetailProps {
  readonly section: SectionDto;
  readonly sections: readonly SectionDto[];
  readonly previous: SectionDto | null;
  readonly next: SectionDto | null;
  /** Avance del estudiante (cliente) para la sección disponible. */
  readonly progress?: ReactNode;
  /** Acción principal de la sección disponible («Continuar con…»), resuelta en el cliente. */
  readonly primaryAction?: ReactNode;
}

function TopicGroups({ section }: { readonly section: SectionDto }) {
  return (
    <div className="topic-groups">
      {section.topicGroups.map((group) => (
        <section
          key={group.title}
          className={`topic-group topic-group--${group.status}`}
          aria-label={group.title}
        >
          <div className="topic-group__head">
            <h3>{group.title}</h3>
            {group.status === 'planned' && <StatusBadge tone="planned">Previsto</StatusBadge>}
          </div>
          <ul>
            {group.topics.map((topic) => (
              <li key={topic.label}>
                {topic.href ? (
                  <Link href={topic.href as Route}>{topic.label}</Link>
                ) : (
                  <span>{topic.label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SectionFacts({ section }: { readonly section: SectionDto }) {
  return (
    <dl className="section-facts" aria-label={`Contenido publicado de ${section.title}`}>
      {section.facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ComingSoonStatus({ section }: { readonly section: SectionDto }) {
  return (
    <PixelCard className="coming-soon-panel">
      <div className="coming-soon-panel__body">
        <StatusBadge tone="coming-soon">Próximamente</StatusBadge>
        <p className="coming-soon-panel__title">Sección en preparación</p>
        <p>
          Su ruta y sus modos ya están definidos. El contenido se publicará en una fase posterior,
          sin cambiar esta dirección.
        </p>
        <p className="coming-soon-panel__position">
          Posición en la ruta: <strong>{section.code}</strong> de 03
        </p>
      </div>
    </PixelCard>
  );
}

export function SectionDetail({
  section,
  sections,
  previous,
  next,
  progress,
  primaryAction,
}: SectionDetailProps) {
  const available = section.status === 'available';
  const classMode = section.modes.find((mode) => mode.id === 'class' && mode.href);
  const fundamentals = sections.find((item) => item.id === 'fundamentos-sql');

  const header = (
    <PageHeader
      tone="night"
      breadcrumb={
        <Breadcrumb
          tone="dark"
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Secciones', href: '/sections' },
            { label: section.title },
          ]}
        />
      }
      eyebrow={
        <>
          <span aria-hidden="true">{section.code} · </span>
          {section.kicker} · {section.statusLabel}
        </>
      }
      title={section.title}
      lead={section.summary}
      actions={
        available ? (
          <>
            {primaryAction}
            {classMode?.href && (
              <Link href={classMode.href as Route} className="hero-action">
                Iniciar clase <span aria-hidden="true">→</span>
              </Link>
            )}
          </>
        ) : (
          <>
            {fundamentals && (
              <Link href={fundamentals.href as Route} className="hero-action hero-action--primary">
                Repasar {fundamentals.title} <span aria-hidden="true">→</span>
              </Link>
            )}
            {section.roadmapHref && (
              <Link href={section.roadmapHref as Route} className="hero-action">
                Ver sus temas en la ruta de aprendizaje <span aria-hidden="true">→</span>
              </Link>
            )}
          </>
        )
      }
      aside={
        available ? (
          <div className="section-aside">
            <SectionFacts section={section} />
            {progress}
          </div>
        ) : (
          <ComingSoonStatus section={section} />
        )
      }
    />
  );

  const modes = (
    <section className="section-block" aria-labelledby="modes-title">
      <div className="section-block__head">
        <h2 id="modes-title">{available ? 'Modos de trabajo' : 'Modos previstos'}</h2>
        <p>
          {available
            ? 'Cada modo abre la herramienta que ya conoces; el contenido es el mismo en todos.'
            : 'La sección tendrá los mismos modos que Fundamentos SQL. Se activarán al publicarla.'}
        </p>
      </div>
      <ModeGrid modes={section.modes} sectionTitle={section.title} />
    </section>
  );

  const content = (
    <section className="section-block" aria-labelledby="content-title">
      <div className="section-block__head">
        <h2 id="content-title">{available ? 'Contenido' : 'Temas de la sección'}</h2>
        <p>
          {available
            ? 'Cada lección enlaza con su página del Modo Estudio. Lo previsto aparece marcado.'
            : 'Temario previsto. Ninguno de estos temas tiene todavía una lección publicada.'}
        </p>
      </div>
      <TopicGroups section={section} />
    </section>
  );

  const goals = (
    <section className="section-block" aria-labelledby="goals-title">
      <div className="section-block__head">
        <h2 id="goals-title">Objetivo, práctica y requisitos</h2>
      </div>
      <dl className="section-goals">
        <div>
          <dt>Objetivo</dt>
          <dd>{section.objective}</dd>
        </div>
        <div>
          <dt>{available ? 'Práctica' : 'Práctica prevista'}</dt>
          <dd>{section.practice}</dd>
        </div>
        <div>
          <dt>Conocimientos previos</dt>
          <dd>
            <ul>
              {section.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );

  return (
    <div className={`section-page section-page--${section.status}`}>
      {header}
      <div className="site-container section-page__body">
        {available && <LearningJourney section={section} />}
        {available ? (
          <>
            {goals}
            {modes}
            {content}
          </>
        ) : (
          <>
            {goals}
            {content}
            {modes}
          </>
        )}
        <section className="section-block" aria-labelledby="route-title">
          <div className="section-block__head">
            <h2 id="route-title">Posición en la ruta</h2>
          </div>
          <SectionRoute sections={sections} current={section.id} />
          <nav className="section-pager" aria-label="Secciones vecinas">
            {previous && (
              <Link href={previous.href as Route} className="section-pager__link">
                <span>Anterior</span>
                {previous.kicker} · {previous.title}
              </Link>
            )}
            {next && (
              <Link
                href={next.href as Route}
                className="section-pager__link section-pager__link--next"
              >
                <span>Siguiente · {next.statusLabel}</span>
                {next.kicker} · {next.title}
              </Link>
            )}
          </nav>
        </section>
      </div>
    </div>
  );
}
