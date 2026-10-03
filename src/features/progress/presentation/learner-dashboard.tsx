import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SectionDto } from '@/features/sections/application/sections-api';
import { ModeGrid } from '@/features/sections/presentation/mode-grid';
import { PixelCard } from '@/presentation/components/effects/pixel-card';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StarBorder } from '@/presentation/components/effects/star-border';
import { Progress, StatusBadge } from '@/presentation/components/ui';
import type { SyncStatus } from '../application/progress-sync';
import type { LearnerProgress, ModeProgress, SectionProgress } from '../application/summary';

/**
 * Panel del estudiante. Responde cuatro preguntas: dónde estoy, cuánto llevo, qué sigue y
 * cómo continúo. Solo muestra datos reales del progreso; lo que no existe todavía se dice.
 */

const MODE_LABEL: Readonly<Record<string, string>> = {
  study: 'Estudio',
  challenge: 'Challenge',
  class: 'Clase',
  practice: 'Práctica',
  resources: 'Recursos',
  evaluation: 'Evaluación',
};

export const SYNC_TEXT: Readonly<Record<SyncStatus, string>> = {
  idle: 'Preparando la sincronización…',
  syncing: 'Sincronizando tu avance…',
  synced: 'Tu avance está sincronizado con tu cuenta.',
  pending: 'Hay avance pendiente de sincronizar; lo intentaremos de nuevo en breve.',
  offline:
    'Tu avance está guardado en este dispositivo y se sincronizará cuando vuelva la conexión.',
  error: 'No pudimos sincronizar ahora. Tu avance sigue guardado en este dispositivo.',
};

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function timeAgo(at: number, now: number): string {
  const seconds = Math.round((at - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'hace un momento';
}

function ModeList({ modes }: { readonly modes: readonly ModeProgress[] }) {
  return (
    <ul className="mode-progress">
      {modes.map((mode) => (
        <li key={mode.mode}>
          <span className="mode-progress__label">{MODE_LABEL[mode.mode] ?? mode.mode}</span>
          <span className="mode-progress__value">
            {mode.kind === 'position'
              ? `${mode.percent} % de las ${mode.unit}`
              : `${mode.done} de ${mode.total} ${mode.unit}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionProgressCard({
  section,
  progress,
}: {
  readonly section: SectionDto;
  readonly progress: SectionProgress;
}) {
  const titleId = `dashboard-section-${section.id}`;
  const body = (
    <article className="dash-section__body" aria-labelledby={titleId}>
      <div className="dash-section__top">
        <span className="dash-section__code" aria-hidden="true">
          {section.code}
        </span>
        <StatusBadge tone={section.status === 'available' ? 'available' : 'coming-soon'}>
          {section.statusLabel}
        </StatusBadge>
      </div>
      <h3 id={titleId} className="dash-section__title">
        {section.title}
      </h3>
      {progress.lessons ? (
        <>
          <Progress
            label={`${progress.lessons.done} de ${progress.lessons.total} lecciones`}
            value={progress.lessons.done}
            max={progress.lessons.total}
          />
          <ModeList modes={progress.modes} />
          {progress.resume && (
            <Link href={progress.resume.href as Route} className="dash-section__link">
              {progress.resume.label}
              <span aria-hidden="true"> →</span>
            </Link>
          )}
        </>
      ) : (
        <>
          <p className="dash-section__note">
            Tu avance aparecerá aquí cuando la sección se publique.
          </p>
          <Link href={section.href as Route} className="dash-section__link">
            Ver el plan de la {section.kicker}
            <span aria-hidden="true"> →</span>
          </Link>
        </>
      )}
    </article>
  );
  return section.status === 'available' ? (
    <SpotlightCard className="dash-section dash-section--available">{body}</SpotlightCard>
  ) : (
    <PixelCard className="dash-section dash-section--coming-soon">{body}</PixelCard>
  );
}

export interface LearnerDashboardProps {
  readonly firstName: string;
  readonly progress: LearnerProgress;
  readonly sections: readonly SectionDto[];
  readonly syncStatus: SyncStatus;
  readonly now: number;
  readonly notice?: ReactNode;
}

export function LearnerDashboard({
  firstName,
  progress,
  sections,
  syncStatus,
  now,
  notice,
}: LearnerDashboardProps) {
  const primary = sections.find((section) => section.status === 'available');
  return (
    <div className="dashboard">
      <header className="ds-page-header ds-page-header--night dashboard__header">
        <div className="site-container ds-page-header__inner">
          <div className="ds-page-header__grid ds-page-header__grid--aside">
            <div className="ds-page-header__copy">
              <p className="ds-page-header__eyebrow">Mi progreso</p>
              <h1>Hola, {firstName || 'estudiante'}</h1>
              <p className="ds-page-header__lead">Tu progreso en DB LAB.</p>
              {progress.resume && (
                <div className="ds-page-header__actions">
                  <StarBorder className="dashboard__continue-frame">
                    <Link
                      href={progress.resume.href as Route}
                      className="hero-action hero-action--primary"
                    >
                      {progress.resume.label} <span aria-hidden="true">→</span>
                    </Link>
                  </StarBorder>
                  <Link href="/sections" className="hero-action">
                    Ver las secciones
                  </Link>
                </div>
              )}
            </div>
            <div className="ds-page-header__aside dashboard__overall">
              <p className="dashboard__percent">
                <strong>{`${progress.overall.percent}\u202f%`}</strong>
                <span>
                  {progress.overall.done} de {progress.overall.total} lecciones publicadas
                </span>
              </p>
              <Progress
                label="Progreso general"
                value={progress.overall.done}
                max={Math.max(progress.overall.total, 1)}
              />
              <p className="dashboard__sync" role="status">
                {SYNC_TEXT[syncStatus]}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="site-container dashboard__content">
        {notice}
        <section aria-labelledby="dashboard-sections-title" className="dashboard__block">
          <h2 id="dashboard-sections-title">Tus secciones</h2>
          <ul className="dash-section-grid">
            {sections.map((section) => {
              const item = progress.sections.find((entry) => entry.section === section.id);
              return item ? (
                <li key={section.id}>
                  <SectionProgressCard section={section} progress={item} />
                </li>
              ) : null;
            })}
          </ul>
        </section>

        <div className="dashboard__split">
          {primary && (
            <section aria-labelledby="dashboard-modes-title" className="dashboard__block">
              <h2 id="dashboard-modes-title">Accesos rápidos · {primary.title}</h2>
              <ModeGrid modes={primary.modes} sectionTitle={primary.title} />
            </section>
          )}
          <section aria-labelledby="dashboard-activity-title" className="dashboard__block">
            <h2 id="dashboard-activity-title">Actividad reciente</h2>
            {progress.recent.length > 0 ? (
              <ol className="activity-list">
                {progress.recent.map((item) => (
                  <li key={item.key}>
                    {item.href ? (
                      <Link href={item.href as Route}>{item.text}</Link>
                    ) : (
                      <span>{item.text}</span>
                    )}
                    <time dateTime={new Date(item.at).toISOString()}>{timeAgo(item.at, now)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="activity-empty">
                <p>Todavía no hay actividad. Tu primera lección te espera.</p>
                {progress.resume && (
                  <Link
                    href={progress.resume.href as Route}
                    className="ds-button ds-button--primary"
                  >
                    {progress.resume.label}
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
