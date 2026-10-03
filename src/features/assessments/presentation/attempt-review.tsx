import {
  EVENT_LABEL,
  formatGrade,
  SUBMITTED_BY_LABEL,
  type EventType,
} from '../application/assessment-api';
import type { ReviewedItem } from '../application/exam-wire';
import type { AnswerRow, AttemptRow, FrozenQuestion } from '../application/results';
import { ReviewItem } from './attempt-result';
import { formatDateTime, formatDuration, formatTime } from './format';

/**
 * Un intento visto por el profesor: respuestas frente a la clave congelada y la línea de
 * tiempo de eventos del navegador (hechos, sin interpretación).
 */

export function toReviewedItem(question: FrozenQuestion, answer: AnswerRow): ReviewedItem {
  const byId = new Map(question.options.map((option) => [option.id, option]));
  const ordered = answer.optionOrder.flatMap((id) => {
    const option = byId.get(id);
    return option ? [option] : [];
  });
  return {
    position: answer.position,
    type: question.type,
    response: question.response,
    prompt: question.prompt,
    code: question.code,
    exhibit: (question.exhibit ?? null) as ReviewedItem['exhibit'],
    options: (ordered.length > 0 ? ordered : question.options).map((option) => ({
      id: option.id,
      body: option.body,
      kind: option.kind,
      result: option.result,
      correct: option.correct,
      order: option.order,
      feedback: option.feedback,
    })),
    answer: answer.answer,
    credit: answer.credit,
    explanation: question.explanation,
    concept: question.concept,
    review: question.review,
    reference: question.reference,
  };
}

export function AttemptSummary({ attempt }: { readonly attempt: AttemptRow }) {
  const finished = attempt.status !== 'in_progress';
  return (
    <dl className="teacher-settings">
      <div>
        <dt>Intento</dt>
        <dd>
          N.º {attempt.attemptNumber} ·{' '}
          {finished
            ? `entregado ${SUBMITTED_BY_LABEL[attempt.submittedBy ?? 'student']}`
            : 'en curso'}
        </dd>
      </div>
      <div>
        <dt>Inicio y entrega</dt>
        <dd>
          {formatDateTime(attempt.startedAt)} →{' '}
          {finished ? formatDateTime(attempt.submittedAt) : '—'} (
          {formatDuration(attempt.durationSeconds)})
        </dd>
      </div>
      <div>
        <dt>Nota</dt>
        <dd className="results-table__grade">
          {finished ? `${formatGrade(attempt.grade)} / 5.0` : '—'} · {attempt.correctCount ?? 0}/
          {attempt.questionTotal} correctas · {attempt.scorePercent ?? 0} % ponderado
        </dd>
      </div>
    </dl>
  );
}

export function EventTimeline({
  events,
}: {
  readonly events: readonly {
    readonly type: string;
    readonly at: string;
    readonly position: number | null;
    readonly durationMs: number | null;
  }[];
}) {
  if (events.length === 0) return <p className="assessment-empty">Sin eventos registrados.</p>;
  return (
    <>
      <p className="ds-field__hint">
        Señales del navegador: una pérdida de foco puede ser una notificación del sistema o un
        cambio de ventana. No interpretar automáticamente como fraude.
      </p>
      <ol className="event-timeline">
        {events.map((event, index) => (
          <li key={index}>
            <time dateTime={event.at}>{formatTime(event.at)}</time>
            <span>{EVENT_LABEL[event.type as EventType] ?? event.type}</span>
            {event.position !== null && (
              <span className="event-timeline__meta">pregunta {event.position}</span>
            )}
            {event.durationMs !== null && (
              <span className="event-timeline__meta">
                duró {formatDuration(Math.round(event.durationMs / 1000))}
              </span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

export function AttemptAnswers({
  items,
}: {
  readonly items: readonly { readonly question: FrozenQuestion; readonly answer: AnswerRow }[];
}) {
  return (
    <div className="review-list">
      {items.map(({ question, answer }) => (
        <ReviewItem key={answer.position} item={toReviewedItem(question, answer)} full />
      ))}
    </div>
  );
}
