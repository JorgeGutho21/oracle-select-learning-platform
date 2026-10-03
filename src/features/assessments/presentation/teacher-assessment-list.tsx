import type { Route } from 'next';
import Link from 'next/link';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StarBorder } from '@/presentation/components/effects/star-border';
import { Chip } from '@/presentation/components/ui';
import { PHASE_LABEL, type AssessmentPhase } from '../application/assessment-api';
import { minutesLabel, questionsLabel, windowLabel } from './format';

/**
 * Evaluaciones del profesor agrupadas por estado: activas, programadas, borradores y
 * finalizadas. Cada tarjeta dice lo esencial y ofrece las acciones de ese estado.
 */

export interface TeacherAssessmentCardData {
  readonly id: string;
  readonly title: string;
  readonly sectionTitle: string;
  readonly phase: AssessmentPhase;
  readonly durationMinutes: number;
  readonly questionCount: number;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly updatedAt: string;
  readonly audienceSize: number;
  readonly finished: number;
  readonly open: number;
}

type Action = (formData: FormData) => Promise<void>;

const PHASE_TONE: Readonly<
  Record<AssessmentPhase, 'cyan' | 'success' | 'warning' | 'neutral' | 'primary'>
> = {
  active: 'success',
  ending: 'warning',
  scheduled: 'cyan',
  draft: 'neutral',
  closed: 'primary',
  archived: 'neutral',
};

function ActionButton({
  action,
  id,
  label,
}: {
  readonly action: Action;
  readonly id: string;
  readonly label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="ds-button ds-button--text">
        {label}
      </button>
    </form>
  );
}

function Card({
  card,
  now,
  actions,
}: {
  readonly card: TeacherAssessmentCardData;
  readonly now: number;
  readonly actions: {
    readonly duplicate: Action;
    readonly publish: Action;
    readonly closeEntries: Action;
  };
}) {
  const href = (suffix = '') => `/teacher/assessments/${card.id}${suffix}` as Route;
  const live = card.phase === 'active' || card.phase === 'ending';
  const body = (
    <div className="teacher-assessment">
      <div className="teacher-assessment__top">
        <Chip tone={PHASE_TONE[card.phase]}>{PHASE_LABEL[card.phase]}</Chip>
        <span className="teacher-assessment__section">{card.sectionTitle}</span>
      </div>
      <h3 className="teacher-assessment__title">
        <Link href={href()}>{card.title}</Link>
      </h3>
      <dl className="teacher-assessment__facts">
        <div>
          <dt>Estudiantes</dt>
          <dd>
            {card.phase === 'draft'
              ? `${card.audienceSize} en la audiencia`
              : `${card.finished} de ${card.audienceSize} entregaron${card.open > 0 ? ` · ${card.open} en curso` : ''}`}
          </dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>
            {minutesLabel(card.durationMinutes)} · {questionsLabel(card.questionCount)}
          </dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{windowLabel(card.opensAt, card.closesAt, now)}</dd>
        </div>
      </dl>
      <div className="teacher-assessment__actions">
        {card.phase === 'draft' ? (
          <>
            <Link className="ds-button ds-button--secondary" href={href()}>
              Editar
            </Link>
            <ActionButton action={actions.publish} id={card.id} label="Publicar" />
          </>
        ) : (
          <>
            {live && (
              <Link className="ds-button ds-button--primary" href={href('/monitor')}>
                Supervisar
              </Link>
            )}
            <Link
              className={`ds-button ${live ? 'ds-button--secondary' : 'ds-button--primary'}`}
              href={href('/results')}
            >
              Resultados
            </Link>
            <Link className="ds-button ds-button--text" href={href()}>
              Abrir
            </Link>
            <a className="ds-button ds-button--text" href={href('/export')} download>
              Exportar
            </a>
            {card.phase === 'active' && (
              <ActionButton action={actions.closeEntries} id={card.id} label="Cerrar accesos" />
            )}
          </>
        )}
        <ActionButton action={actions.duplicate} id={card.id} label="Duplicar" />
      </div>
    </div>
  );
  return live ? (
    <StarBorder className="teacher-assessment__frame">{body}</StarBorder>
  ) : (
    <SpotlightCard className="teacher-assessment__frame">{body}</SpotlightCard>
  );
}

const GROUPS: readonly {
  readonly id: string;
  readonly title: string;
  readonly phases: readonly AssessmentPhase[];
  readonly empty: string;
}[] = [
  {
    id: 'activas',
    title: 'Activas',
    phases: ['active', 'ending'],
    empty: 'No hay evaluaciones en curso.',
  },
  {
    id: 'programadas',
    title: 'Programadas',
    phases: ['scheduled'],
    empty: 'No hay evaluaciones programadas.',
  },
  { id: 'borradores', title: 'Borradores', phases: ['draft'], empty: 'No hay borradores.' },
  {
    id: 'finalizadas',
    title: 'Finalizadas',
    phases: ['closed'],
    empty: 'Todavía no hay evaluaciones finalizadas.',
  },
];

export function TeacherAssessmentList({
  cards,
  now,
  actions,
}: {
  readonly cards: readonly TeacherAssessmentCardData[];
  readonly now: number;
  readonly actions: {
    readonly duplicate: Action;
    readonly publish: Action;
    readonly closeEntries: Action;
  };
}) {
  const archived = cards.filter((card) => card.phase === 'archived');
  return (
    <>
      {GROUPS.map((group) => {
        const list = cards.filter((card) => group.phases.includes(card.phase));
        return (
          <section key={group.id} aria-labelledby={`group-${group.id}`} className="teacher-block">
            <h2 id={`group-${group.id}`}>
              {group.title} <span className="teacher-block__count">({list.length})</span>
            </h2>
            {list.length === 0 ? (
              <p className="assessment-empty">{group.empty}</p>
            ) : (
              <ul className="assessment-grid">
                {list.map((card) => (
                  <li key={card.id}>
                    <Card card={card} now={now} actions={actions} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {archived.length > 0 && (
        <details className="teacher-block teacher-archived">
          <summary>Archivadas ({archived.length})</summary>
          <ul className="assessment-grid">
            {archived.map((card) => (
              <li key={card.id}>
                <Card card={card} now={now} actions={actions} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
