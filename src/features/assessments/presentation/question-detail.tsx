import type { Route } from 'next';
import Link from 'next/link';
import { Chip } from '@/presentation/components/ui';
import {
  QUESTION_STATUS_LABEL,
  QUESTION_TYPE_LABEL,
  topicLabel,
  type DataTable,
  type QuestionStatus,
  type QuestionType,
  type ResponseKind,
} from '../application/assessment-api';
import { formatDateTime } from './format';
import { OptionBody, QuestionBody, type QuestionExhibit } from './question-content';

/** Ficha de una pregunta del banco con su clave (solo profesor) y sus acciones. */

type Action = (formData: FormData) => Promise<void>;

export interface QuestionDetailData {
  readonly id: string;
  readonly externalKey: string | null;
  readonly origin: 'dblab' | 'teacher';
  readonly section: string;
  readonly topic: string;
  readonly subtopic: string;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly prompt: string;
  readonly code: string | null;
  readonly exhibit: QuestionExhibit | null;
  readonly difficulty: number;
  readonly weight: number;
  readonly status: QuestionStatus;
  readonly version: number;
  readonly updatedAt: string;
  readonly explanation: string;
  readonly concept: string;
  readonly review: string;
  readonly reference: string;
  readonly tags: readonly string[];
  readonly options: readonly {
    readonly id: string;
    readonly body: string;
    readonly kind: 'text' | 'code' | 'table';
    readonly result: DataTable | null;
    readonly correct: boolean;
    readonly order: number | null;
    readonly feedback: string;
  }[];
}

function StatusForm({
  action,
  id,
  status,
  label,
}: {
  readonly action: Action;
  readonly id: string;
  readonly status: QuestionStatus;
  readonly label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="ds-button ds-button--text">
        {label}
      </button>
    </form>
  );
}

export function QuestionDetail({
  question,
  sectionTitle,
  actions,
}: {
  readonly question: QuestionDetailData;
  readonly sectionTitle: string;
  readonly actions: { readonly setStatus: Action; readonly duplicate: Action };
}) {
  const options =
    question.response === 'order'
      ? [...question.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : question.options;
  return (
    <div className="question-detail">
      <section className="teacher-block" aria-labelledby="question-meta-title">
        <h2 id="question-meta-title" className="visually-hidden">
          Datos de la pregunta
        </h2>
        <div className="bank-item__meta">
          <Chip
            tone={
              question.status === 'published'
                ? 'success'
                : question.status === 'retired'
                  ? 'neutral'
                  : 'warning'
            }
          >
            {QUESTION_STATUS_LABEL[question.status]}
          </Chip>
          <span>
            {question.origin === 'dblab'
              ? `Oficial DB LAB · ${question.externalKey}`
              : 'Pregunta propia'}
          </span>
          <span>versión {question.version}</span>
          <span>{sectionTitle}</span>
          <span>{topicLabel(question.section as never, question.topic)}</span>
          {question.subtopic && <span>{question.subtopic}</span>}
          <span>{QUESTION_TYPE_LABEL[question.type]}</span>
          <span>dificultad {question.difficulty}</span>
          <span>peso {question.weight}</span>
          <span>actualizada {formatDateTime(question.updatedAt)}</span>
        </div>
        <div className="teacher-actions">
          {question.origin === 'teacher' && (
            <Link
              className="ds-button ds-button--primary"
              href={`/teacher/questions/${question.id}/edit` as Route}
            >
              Editar
            </Link>
          )}
          <form action={actions.duplicate}>
            <input type="hidden" name="id" value={question.id} />
            <button type="submit" className="ds-button ds-button--secondary">
              Duplicar como borrador propio
            </button>
          </form>
          {question.status !== 'published' && (
            <StatusForm
              action={actions.setStatus}
              id={question.id}
              status="published"
              label="Publicar"
            />
          )}
          {question.status !== 'retired' && (
            <StatusForm
              action={actions.setStatus}
              id={question.id}
              status="retired"
              label="Retirar"
            />
          )}
          {question.status === 'published' && question.origin === 'teacher' && (
            <StatusForm
              action={actions.setStatus}
              id={question.id}
              status="draft"
              label="Pasar a borrador"
            />
          )}
        </div>
        <p className="ds-field__hint">
          Retirar no borra: la pregunta deja de estar disponible para nuevas evaluaciones y las ya
          publicadas conservan su copia.
        </p>
      </section>

      <section className="teacher-block" aria-labelledby="question-preview-title">
        <h2 id="question-preview-title">Vista previa con clave</h2>
        <QuestionBody prompt={question.prompt} code={question.code} exhibit={question.exhibit} />
        <ol className="frozen-item__options">
          {options.map((option) => (
            <li
              key={option.id}
              className={option.correct || question.response === 'order' ? 'is-correct' : undefined}
            >
              <OptionBody body={option.body} kind={option.kind} result={option.result} />
              {option.correct && <span className="frozen-item__key"> · correcta</span>}
              {option.feedback && <p className="frozen-item__feedback">{option.feedback}</p>}
            </li>
          ))}
        </ol>
        <dl className="review-feedback">
          <div>
            <dt>Por qué</dt>
            <dd>{question.explanation || '—'}</dd>
          </div>
          <div>
            <dt>Concepto</dt>
            <dd>{question.concept || '—'}</dd>
          </div>
          <div>
            <dt>Qué revisar</dt>
            <dd>{question.review || '—'}</dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd>{question.reference || '—'}</dd>
          </div>
          {question.tags.length > 0 && (
            <div>
              <dt>Etiquetas</dt>
              <dd>{question.tags.join(', ')}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
