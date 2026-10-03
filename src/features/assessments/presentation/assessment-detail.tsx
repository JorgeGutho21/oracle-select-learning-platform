import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Chip } from '@/presentation/components/ui';
import {
  FEEDBACK_LABEL,
  FEEDBACK_MODES,
  formatGrade,
  PHASE_LABEL,
  QUESTION_TYPE_LABEL,
  topicLabel,
  type AssessmentPhase,
  type FeedbackMode,
  type QuestionType,
} from '../application/assessment-api';
import type { FrozenQuestion } from '../application/results';
import { formatDateTime, minutesLabel, questionsLabel } from './format';
import { OptionBody, QuestionBody } from './question-content';

/**
 * Ficha de una evaluación para el profesor: configuración, acciones del estado actual,
 * preguntas (congeladas al publicar, con su clave) y trazabilidad.
 */

type Action = (formData: FormData) => Promise<void>;

export interface DetailRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sectionTitle: string;
  readonly sectionKey: string;
  readonly selectionMode: 'manual' | 'random';
  readonly topics: readonly string[];
  readonly questionCount: number;
  readonly durationMinutes: number;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly maxAttempts: number;
  readonly shuffleQuestions: boolean;
  readonly shuffleOptions: boolean;
  readonly feedbackMode: FeedbackMode;
  readonly audience: 'all' | 'selected';
  readonly institutionalOnly: boolean;
  readonly recordClipboard: boolean;
  readonly passGrade: number;
  readonly publishedAt: string | null;
  readonly entryClosedAt: string | null;
  readonly closedAt: string | null;
}

export interface DetailActions {
  readonly publish: Action;
  readonly closeEntries: Action;
  readonly finalize: Action;
  readonly setFeedback: Action;
  readonly duplicate: Action;
  readonly archive: Action;
  readonly deleteDraft: Action;
}

const AUDIT_LABEL: Readonly<Record<string, string>> = {
  assessment_created: 'Creada',
  assessment_saved: 'Borrador guardado',
  assessment_duplicated: 'Creada como copia',
  assessment_published: 'Publicada',
  entries_closed: 'Nuevos accesos cerrados',
  assessment_finalized: 'Finalizada',
  feedback_changed: 'Retroalimentación cambiada',
  assessment_archived: 'Archivada',
};

function Hidden({ id }: { readonly id: string }) {
  return <input type="hidden" name="id" value={id} />;
}

function Confirm({
  action,
  id,
  summary,
  text,
  confirm,
  danger = false,
}: {
  readonly action: Action;
  readonly id: string;
  readonly summary: string;
  readonly text: string;
  readonly confirm: string;
  readonly danger?: boolean;
}) {
  return (
    <details className={`teacher-confirm${danger ? ' teacher-confirm--danger' : ''}`}>
      <summary className="ds-button ds-button--secondary">{summary}</summary>
      <div className="teacher-confirm__body">
        <p>{text}</p>
        <form action={action}>
          <Hidden id={id} />
          <button type="submit" className="ds-button ds-button--primary">
            {confirm}
          </button>
        </form>
      </div>
    </details>
  );
}

export function AssessmentActions({
  record,
  phase,
  actions,
  editor,
}: {
  readonly record: DetailRecord;
  readonly phase: AssessmentPhase;
  readonly actions: DetailActions;
  readonly editor?: ReactNode;
}) {
  const href = (suffix: string) => `/teacher/assessments/${record.id}${suffix}` as Route;
  return (
    <section className="teacher-block" aria-labelledby="assessment-actions-title">
      <h2 id="assessment-actions-title">Acciones</h2>
      <div className="teacher-actions">
        {phase === 'draft' && (
          <Confirm
            action={actions.publish}
            id={record.id}
            summary="Publicar…"
            text="Al publicar, las preguntas se congelan (copia con versión) y los estudiantes la verán según las fechas. Después no se puede editar: solo duplicar."
            confirm="Publicar evaluación"
          />
        )}
        {(phase === 'active' || phase === 'ending' || phase === 'scheduled') && (
          <Link className="ds-button ds-button--primary" href={href('/monitor')}>
            Supervisar
          </Link>
        )}
        {phase !== 'draft' && (
          <>
            <Link className="ds-button ds-button--secondary" href={href('/results')}>
              Resultados
            </Link>
            <a className="ds-button ds-button--secondary" href={href('/export')} download>
              Exportar CSV
            </a>
          </>
        )}
        {(phase === 'active' || phase === 'scheduled') && (
          <Confirm
            action={actions.closeEntries}
            id={record.id}
            summary="Cerrar nuevos accesos…"
            text="Nadie más podrá comenzar. Quienes ya empezaron siguen hasta terminar su tiempo."
            confirm="Cerrar nuevos accesos"
          />
        )}
        {(phase === 'active' ||
          phase === 'ending' ||
          phase === 'scheduled' ||
          phase === 'closed') &&
          !record.closedAt && (
            <Confirm
              action={actions.finalize}
              id={record.id}
              summary="Finalizar evaluación…"
              text="Cierra la evaluación ahora: los intentos abiertos se entregan con lo guardado y se califican. No se puede deshacer."
              confirm="Finalizar ahora"
              danger
            />
          )}
        <form action={actions.duplicate}>
          <Hidden id={record.id} />
          <button type="submit" className="ds-button ds-button--text">
            Duplicar
          </button>
        </form>
        {phase === 'closed' && record.closedAt && (
          <form action={actions.archive}>
            <Hidden id={record.id} />
            <button type="submit" className="ds-button ds-button--text">
              Archivar
            </button>
          </form>
        )}
        {phase === 'draft' && (
          <Confirm
            action={actions.deleteDraft}
            id={record.id}
            summary="Eliminar borrador…"
            text="El borrador se elimina. Las preguntas del banco no se tocan."
            confirm="Eliminar borrador"
            danger
          />
        )}
      </div>
      {phase !== 'draft' && (
        <form action={actions.setFeedback} className="teacher-feedback">
          <Hidden id={record.id} />
          <fieldset>
            <legend>Retroalimentación para los estudiantes</legend>
            {FEEDBACK_MODES.map((mode) => (
              <label className="teacher-check" key={mode}>
                <input
                  type="radio"
                  name="feedback_mode"
                  value={mode}
                  defaultChecked={record.feedbackMode === mode}
                />
                {FEEDBACK_LABEL[mode]}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="ds-button ds-button--primary">
            Aplicar
          </button>
        </form>
      )}
      {editor}
    </section>
  );
}

export function AssessmentSettings({
  record,
  phase,
  audienceSize,
  assignedNames,
  counts,
}: {
  readonly record: DetailRecord;
  readonly phase: AssessmentPhase;
  readonly audienceSize: number;
  readonly assignedNames: readonly string[];
  readonly counts: { readonly started: number; readonly finished: number; readonly open: number };
}) {
  return (
    <section className="teacher-block" aria-labelledby="assessment-settings-title">
      <h2 id="assessment-settings-title">Configuración</h2>
      <dl className="teacher-settings">
        <div>
          <dt>Estado</dt>
          <dd>
            <Chip tone={phase === 'active' ? 'success' : phase === 'draft' ? 'neutral' : 'cyan'}>
              {PHASE_LABEL[phase]}
            </Chip>
          </dd>
        </div>
        <div>
          <dt>Sección</dt>
          <dd>{record.sectionTitle}</dd>
        </div>
        <div>
          <dt>Preguntas</dt>
          <dd>
            {questionsLabel(record.questionCount)} por estudiante ·{' '}
            {record.selectionMode === 'random' ? 'selección automática' : 'selección manual'}
            {record.topics.length > 0 &&
              ` · temas: ${record.topics.map((topic) => topicLabel(record.sectionKey as never, topic)).join(', ')}`}
          </dd>
        </div>
        <div>
          <dt>Duración e intentos</dt>
          <dd>
            {minutesLabel(record.durationMinutes)} ·{' '}
            {record.maxAttempts === 1 ? 'un intento' : `${record.maxAttempts} intentos`}
          </dd>
        </div>
        <div>
          <dt>Disponibilidad</dt>
          <dd>
            {record.opensAt ? `Abre ${formatDateTime(record.opensAt)}` : 'Abre al publicar'} ·{' '}
            {record.closesAt ? `cierra ${formatDateTime(record.closesAt)}` : 'sin fecha de cierre'}
          </dd>
        </div>
        <div>
          <dt>Orden</dt>
          <dd>
            Preguntas {record.shuffleQuestions ? 'en orden aleatorio' : 'en orden fijo'} · opciones{' '}
            {record.shuffleOptions ? 'en orden aleatorio' : 'en orden fijo'}
          </dd>
        </div>
        <div>
          <dt>Participantes</dt>
          <dd>
            {record.audience === 'all'
              ? 'Todos los estudiantes'
              : `Elegidos: ${assignedNames.join(', ') || '—'}`}
            {record.institutionalOnly ? ' · solo institucionales' : ''} ({audienceSize})
          </dd>
        </div>
        <div>
          <dt>Retroalimentación</dt>
          <dd>{FEEDBACK_LABEL[record.feedbackMode]}</dd>
        </div>
        <div>
          <dt>Supervisión</dt>
          <dd>
            Foco, conexión y pantalla completa
            {record.recordClipboard ? '; también copiar, pegar y menú contextual' : ''}
          </dd>
        </div>
        <div>
          <dt>Aprobación</dt>
          <dd>Desde {formatGrade(record.passGrade)} / 5.0</dd>
        </div>
        {phase !== 'draft' && (
          <div>
            <dt>Participación</dt>
            <dd>
              {counts.finished} entregaron · {counts.open} en curso · publicada{' '}
              {formatDateTime(record.publishedAt)}
            </dd>
          </div>
        )}
      </dl>
      {record.description && <p className="teacher-settings__description">{record.description}</p>}
    </section>
  );
}

export interface DraftQuestionRow {
  readonly id: string;
  readonly externalKey: string | null;
  readonly topic: string;
  readonly type: QuestionType;
  readonly prompt: string;
  readonly difficulty: number;
  readonly weight: number;
}

/** Preguntas congeladas con su clave (solo profesor). */
export function FrozenQuestionList({
  questions,
  sectionKey,
}: {
  readonly questions: readonly FrozenQuestion[];
  readonly sectionKey: string;
}) {
  return (
    <ol className="frozen-list">
      {questions.map((question) => (
        <li key={question.questionId}>
          <details className="frozen-item">
            <summary>
              <span className="frozen-item__meta">
                {question.externalKey ?? 'Propia'} · v{question.version} ·{' '}
                {topicLabel(sectionKey as never, question.topic)} ·{' '}
                {QUESTION_TYPE_LABEL[question.type]} · peso {question.weight}
              </span>
              <span className="frozen-item__prompt">{question.prompt}</span>
            </summary>
            <QuestionBody
              prompt={question.prompt}
              code={question.code}
              exhibit={question.exhibit as never}
            />
            <ol className="frozen-item__options">
              {(question.response === 'order'
                ? [...question.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                : question.options
              ).map((option) => (
                <li
                  key={option.id}
                  className={
                    option.correct || question.response === 'order' ? 'is-correct' : undefined
                  }
                >
                  <OptionBody body={option.body} kind={option.kind} result={option.result} />
                  {option.correct && <span className="frozen-item__key"> · correcta</span>}
                </li>
              ))}
            </ol>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function DraftQuestionList({
  questions,
  sectionKey,
}: {
  readonly questions: readonly DraftQuestionRow[];
  readonly sectionKey: string;
}) {
  if (questions.length === 0)
    return (
      <p className="assessment-empty">Sin preguntas elegidas (selección automática al publicar).</p>
    );
  return (
    <ol className="frozen-list">
      {questions.map((question) => (
        <li key={question.id} className="frozen-item frozen-item--flat">
          <span className="frozen-item__meta">
            {question.externalKey ?? 'Propia'} · {topicLabel(sectionKey as never, question.topic)} ·{' '}
            {QUESTION_TYPE_LABEL[question.type]} · dificultad {question.difficulty} · peso{' '}
            {question.weight}
          </span>
          <span className="frozen-item__prompt">{question.prompt}</span>
        </li>
      ))}
    </ol>
  );
}

export function AuditList({
  entries,
}: {
  readonly entries: readonly {
    readonly action: string;
    readonly at: string;
    readonly details: Readonly<Record<string, unknown>>;
  }[];
}) {
  if (entries.length === 0) return null;
  return (
    <section className="teacher-block" aria-labelledby="assessment-audit-title">
      <h2 id="assessment-audit-title">Historial</h2>
      <ul className="audit-list">
        {entries.map((entry, index) => (
          <li key={index}>
            <span>{AUDIT_LABEL[entry.action] ?? entry.action}</span>
            {entry.action === 'feedback_changed' && typeof entry.details.mode === 'string' && (
              <span> · {FEEDBACK_LABEL[entry.details.mode as FeedbackMode]}</span>
            )}
            <time dateTime={entry.at}> · {formatDateTime(entry.at)}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
