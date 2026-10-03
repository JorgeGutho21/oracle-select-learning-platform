import { Alert } from '@/presentation/components/ui';
import type { Answer, AttemptView, ReviewedItem, ReviewedOption } from '../application/exam-wire';
import { formatGrade, passes } from '../application/assessment-api';
import { OptionBody, QuestionBody } from './question-content';

/**
 * Resultado y retroalimentación de un intento entregado, según lo que liberó el profesor:
 * nada, solo la nota, la nota con las respuestas, o además la explicación completa.
 */

type Finished = Extract<AttemptView, { status: 'finished' }>;

function chosenOptions(item: ReviewedItem): readonly ReviewedOption[] {
  const answer: Answer | null = item.answer;
  if (!answer) return [];
  const byId = new Map(item.options.map((option) => [option.id, option]));
  const ids =
    'choice' in answer ? [answer.choice] : 'choices' in answer ? answer.choices : answer.order;
  return ids.flatMap((id) => {
    const option = byId.get(id);
    return option ? [option] : [];
  });
}

function correctOptions(item: ReviewedItem): readonly ReviewedOption[] {
  if (item.response === 'order') {
    return [...item.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return item.options.filter((option) => option.correct);
}

function OptionList({
  options,
  ordered,
}: {
  readonly options: readonly ReviewedOption[];
  readonly ordered: boolean;
}) {
  if (options.length === 0) return <p className="review-empty">Sin respuesta.</p>;
  const List = ordered ? 'ol' : 'ul';
  return (
    <List className="review-options">
      {options.map((option) => (
        <li key={option.id}>
          <OptionBody body={option.body} kind={option.kind} result={option.result} />
        </li>
      ))}
    </List>
  );
}

function verdict(credit: number | null): {
  readonly label: string;
  readonly tone: 'right' | 'partial' | 'wrong';
} {
  if (credit === 1) return { label: 'Correcta', tone: 'right' };
  if (credit !== null && credit > 0)
    return { label: `Parcial (${Math.round(credit * 100)} %)`, tone: 'partial' };
  return { label: 'Incorrecta o sin responder', tone: 'wrong' };
}

export function ReviewItem({
  item,
  full,
}: {
  readonly item: ReviewedItem;
  readonly full: boolean;
}) {
  const mine = chosenOptions(item);
  const wrongPicks = mine.filter((option) => !option.correct && option.feedback);
  const result = verdict(item.credit);
  return (
    <article className={`review-item review-item--${result.tone}`}>
      <header className="review-item__head">
        <h3>Pregunta {item.position}</h3>
        <span className={`review-verdict review-verdict--${result.tone}`}>{result.label}</span>
      </header>
      <QuestionBody prompt={item.prompt} code={item.code} exhibit={item.exhibit} />
      <div className="review-columns">
        <div>
          <h4>Tu respuesta</h4>
          <OptionList options={mine} ordered={item.response === 'order'} />
        </div>
        <div>
          <h4>Respuesta correcta</h4>
          <OptionList options={correctOptions(item)} ordered={item.response === 'order'} />
        </div>
      </div>
      {full && (
        <dl className="review-feedback">
          {item.explanation && (
            <div>
              <dt>Por qué</dt>
              <dd>{item.explanation}</dd>
            </div>
          )}
          {wrongPicks.length > 0 && (
            <div>
              <dt>Sobre tu elección</dt>
              <dd>
                <ul>
                  {wrongPicks.map((option) => (
                    <li key={option.id}>{option.feedback}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {item.concept && (
            <div>
              <dt>Concepto</dt>
              <dd>{item.concept}</dd>
            </div>
          )}
          {item.review && (
            <div>
              <dt>Qué debes revisar</dt>
              <dd>{item.review}</dd>
            </div>
          )}
          {item.reference && (
            <div>
              <dt>Referencia</dt>
              <dd>{item.reference}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

export function AttemptResult({ view }: { readonly view: Finished }) {
  if (view.release === 'hidden' || view.grade === null) {
    return (
      <Alert tone="info" title="Tu evaluación quedó entregada.">
        El profesor publicará la nota y la retroalimentación cuando termine de revisar.
      </Alert>
    );
  }
  const approved = passes(view.grade, view.assessment.passGrade);
  return (
    <div className="attempt-result">
      <div className={`grade-card${approved ? ' grade-card--pass' : ''}`}>
        <p className="grade-card__label">Nota final</p>
        <p className="grade-card__value">
          {formatGrade(view.grade)} <span>/ 5.0</span>
        </p>
        <p className="grade-card__detail">
          {view.correctCount ?? 0} de {view.questionTotal} correctas ·{' '}
          {Math.round(view.scorePercent ?? 0)} % del puntaje ponderado ·{' '}
          {approved ? 'Aprobada' : `No alcanza el ${formatGrade(view.assessment.passGrade)} mínimo`}
        </p>
      </div>
      {view.items && view.items.length > 0 ? (
        <section aria-labelledby="review-title" className="review-list">
          <h3 id="review-title">Retroalimentación por pregunta</h3>
          {view.items.map((item) => (
            <ReviewItem key={item.position} item={item} full={view.release === 'full_feedback'} />
          ))}
        </section>
      ) : (
        <p className="review-pending">
          El profesor aún no publicó las respuestas de esta evaluación.
        </p>
      )}
    </div>
  );
}
