import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StarBorder } from '@/presentation/components/effects/star-border';
import { Chip } from '@/presentation/components/ui';
import {
  bestReleasedGrade,
  isPending,
  STUDENT_STATE_LABEL,
  studentState,
  type StudentAssessment,
  type StudentState,
} from '../application/student-assessments';
import { formatGrade } from '../application/assessment-api';
import { minutesLabel, questionsLabel, windowLabel } from './format';

/**
 * Evaluaciones del estudiante: tarjetas con lo esencial (sección, fecha, duración, estado)
 * y una sola acción que dice adónde lleva.
 */

const STATE_TONE: Readonly<
  Record<StudentState, 'cyan' | 'success' | 'warning' | 'neutral' | 'primary'>
> = {
  in_progress: 'warning',
  available: 'cyan',
  upcoming: 'neutral',
  completed: 'success',
  missed: 'neutral',
};

const ACTION: Readonly<Record<StudentState, string>> = {
  in_progress: 'Continuar evaluación',
  available: 'Ver reglas y comenzar',
  upcoming: 'Ver detalles',
  completed: 'Ver resultado',
  missed: 'Ver detalles',
};

export function AssessmentCard({
  assessment,
  sectionTitle,
  now,
  headingLevel = 3,
}: {
  readonly assessment: StudentAssessment;
  readonly sectionTitle: string;
  readonly now: number;
  readonly headingLevel?: 2 | 3;
}) {
  const state = studentState(assessment);
  const grade = bestReleasedGrade(assessment);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const body: ReactNode = (
    <div className="assessment-card">
      <div className="assessment-card__top">
        <Chip tone={STATE_TONE[state]}>{STUDENT_STATE_LABEL[state]}</Chip>
        <span className="assessment-card__section">{sectionTitle}</span>
      </div>
      <Heading className="assessment-card__title">{assessment.title}</Heading>
      <dl className="assessment-card__facts">
        <div>
          <dt>Fecha</dt>
          <dd>{windowLabel(assessment.opensAt, assessment.closesAt, now)}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{minutesLabel(assessment.durationMinutes)}</dd>
        </div>
        <div>
          <dt>Preguntas</dt>
          <dd>{questionsLabel(assessment.questionCount)}</dd>
        </div>
        {grade !== null && (
          <div>
            <dt>Nota</dt>
            <dd className="assessment-card__grade">{formatGrade(grade)} / 5.0</dd>
          </div>
        )}
      </dl>
      <Link
        className={`ds-button ${state === 'available' || state === 'in_progress' ? 'ds-button--primary' : 'ds-button--secondary'} assessment-card__action`}
        href={`/evaluations/${assessment.id}` as Route}
      >
        {ACTION[state]}
        <span className="visually-hidden">: {assessment.title}</span>
      </Link>
    </div>
  );
  if (state === 'in_progress')
    return <StarBorder className="assessment-card__frame">{body}</StarBorder>;
  return <SpotlightCard className="assessment-card__frame">{body}</SpotlightCard>;
}

export function StudentAssessmentList({
  assessments,
  sectionTitles,
  now,
  emptyText,
}: {
  readonly assessments: readonly StudentAssessment[];
  readonly sectionTitles: Readonly<Record<string, string>>;
  readonly now: number;
  readonly emptyText: string;
}) {
  if (assessments.length === 0) return <p className="assessment-empty">{emptyText}</p>;
  return (
    <ul className="assessment-grid">
      {assessments.map((assessment) => (
        <li key={assessment.id}>
          <AssessmentCard
            assessment={assessment}
            sectionTitle={sectionTitles[assessment.sectionKey] ?? assessment.sectionKey}
            now={now}
          />
        </li>
      ))}
    </ul>
  );
}

/** Pendientes del panel del estudiante (lo que puede o podrá presentar). */
export function PendingAssessments({
  assessments,
  sectionTitles,
  now,
}: {
  readonly assessments: readonly StudentAssessment[] | null;
  readonly sectionTitles: Readonly<Record<string, string>>;
  readonly now: number;
}) {
  if (assessments === null) {
    return (
      <p className="assessment-empty">No pudimos leer tus evaluaciones. Inténtalo de nuevo.</p>
    );
  }
  const pending = assessments.filter(isPending);
  return (
    <>
      <StudentAssessmentList
        assessments={pending}
        sectionTitles={sectionTitles}
        now={now}
        emptyText="No tienes evaluaciones pendientes."
      />
      <p className="assessment-more">
        <Link href={'/evaluations' as Route}>Ver todas mis evaluaciones</Link>
      </p>
    </>
  );
}
