import type { DataTable, OptionKind, QuestionType, ResponseKind } from '../domain/question';
import type { AttemptStatus, FeedbackMode, SubmittedBy } from '../domain/assessment';

/**
 * Lo que viaja entre el examen (navegador) y el servidor. Sin zod para no cargarlo en el
 * navegador: la validación estricta está en la base (`save_answers`) y en las rutas de API.
 * Nada de esto contiene la clave de respuestas mientras el intento está abierto.
 */

export type Answer =
  | { readonly choice: string }
  | { readonly choices: readonly string[] }
  | { readonly order: readonly string[] };

export interface ExamOption {
  readonly id: string;
  readonly body: string;
  readonly kind: OptionKind;
  readonly result: DataTable | null;
}

export interface ExamExhibit {
  readonly tables?: readonly DataTable[];
  readonly queries?: readonly { readonly label: string; readonly sql: string }[];
}

export interface ExamItem {
  readonly position: number;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly prompt: string;
  readonly code: string | null;
  readonly exhibit: ExamExhibit | null;
  readonly options: readonly ExamOption[];
  readonly answer: Answer | null;
  readonly flagged: boolean;
  readonly revision: number;
}

export interface ReviewedOption extends ExamOption {
  readonly correct: boolean;
  readonly order: number | null;
  readonly feedback: string | null;
}

export interface ReviewedItem {
  readonly position: number;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly prompt: string;
  readonly code: string | null;
  readonly exhibit: ExamExhibit | null;
  readonly options: readonly ReviewedOption[];
  readonly answer: Answer | null;
  readonly credit: number | null;
  readonly explanation?: string;
  readonly concept?: string;
  readonly review?: string;
  readonly reference?: string;
}

interface AttemptBase {
  readonly attemptId: string;
  readonly attemptStatus: AttemptStatus;
  readonly submittedBy: SubmittedBy | null;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly serverNow: string;
  readonly currentPosition: number;
  readonly questionTotal: number;
  readonly assessment: {
    readonly id: string;
    readonly title: string;
    readonly sectionKey: string;
    readonly recordClipboard: boolean;
    readonly feedbackMode: FeedbackMode;
    readonly passGrade: number;
  };
}

export type AttemptView =
  | (AttemptBase & { readonly status: 'in_progress'; readonly items: readonly ExamItem[] })
  | (AttemptBase & {
      readonly status: 'finished';
      readonly release: FeedbackMode;
      readonly grade: number | null;
      readonly scorePercent: number | null;
      readonly correctCount: number | null;
      readonly items: readonly ReviewedItem[] | null;
    });

// ---------------------------------------------------------------------------
// Lectura tolerante
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? (value as string[])
    : null;
}

export function readAnswer(value: unknown): Answer | null {
  if (!isRecord(value)) return null;
  if (typeof value.choice === 'string') return { choice: value.choice };
  const choices = stringList(value.choices);
  if (choices) return { choices };
  const order = stringList(value.order);
  if (order) return { order };
  return null;
}

function readTable(value: unknown): DataTable | null {
  if (!isRecord(value)) return null;
  const columns = stringList(value.columns);
  if (!columns || !Array.isArray(value.rows)) return null;
  const rows = value.rows
    .filter(Array.isArray)
    .map((row: unknown[]) =>
      row.map((cell) => (typeof cell === 'string' || typeof cell === 'number' ? cell : null)),
    );
  const caption = text(value.caption);
  return caption ? { caption, columns, rows } : { columns, rows };
}

function readExhibit(value: unknown): ExamExhibit | null {
  if (!isRecord(value)) return null;
  const tables = Array.isArray(value.tables)
    ? value.tables.map(readTable).filter((table): table is DataTable => table !== null)
    : undefined;
  const queries = Array.isArray(value.queries)
    ? value.queries
        .filter(isRecord)
        .map((query) => ({ label: text(query.label) ?? '', sql: text(query.sql) ?? '' }))
    : undefined;
  return { ...(tables ? { tables } : {}), ...(queries ? { queries } : {}) };
}

function readOption(value: unknown): ExamOption | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const body = text(value.body);
  if (!id || body === null) return null;
  const kind = value.kind === 'code' || value.kind === 'table' ? value.kind : 'text';
  return { id, body, kind, result: readTable(value.result) };
}

function readItemBase(value: Raw) {
  return {
    position: numberOrNull(value.position) ?? 0,
    type: (text(value.type) ?? 'single_choice') as QuestionType,
    response: (text(value.response) ?? 'single') as ResponseKind,
    prompt: text(value.prompt) ?? '',
    code: text(value.code),
    exhibit: readExhibit(value.exhibit),
    answer: readAnswer(value.answer),
  };
}

function readExamItem(value: unknown): ExamItem | null {
  if (!isRecord(value)) return null;
  const options = Array.isArray(value.options)
    ? value.options.map(readOption).filter((option): option is ExamOption => option !== null)
    : [];
  return {
    ...readItemBase(value),
    options,
    flagged: value.flagged === true,
    revision: numberOrNull(value.revision) ?? 0,
  };
}

function readReviewedItem(value: unknown): ReviewedItem | null {
  if (!isRecord(value)) return null;
  const options = Array.isArray(value.options)
    ? value.options.filter(isRecord).flatMap((raw) => {
        const option = readOption(raw);
        if (!option) return [];
        return [
          {
            ...option,
            correct: raw.correct === true,
            order: numberOrNull(raw.order),
            feedback: text(raw.feedback),
          },
        ];
      })
    : [];
  const extra: Record<string, string> = {};
  for (const key of ['explanation', 'concept', 'review', 'reference'] as const) {
    const value_ = text(value[key]);
    if (value_ !== null) extra[key] = value_;
  }
  return { ...readItemBase(value), options, credit: numberOrNull(value.credit), ...extra };
}

/** Vista del intento devuelta por `attempt_view` (o `null` si no se reconoce). */
export function readAttemptView(value: unknown): AttemptView | null {
  if (!isRecord(value) || !isRecord(value.assessment)) return null;
  const attemptId = text(value.attempt_id);
  const startedAt = text(value.started_at);
  const expiresAt = text(value.expires_at);
  const serverNow = text(value.server_now);
  if (!attemptId || !startedAt || !expiresAt || !serverNow) return null;
  const assessment = value.assessment;
  const base: AttemptBase = {
    attemptId,
    attemptStatus: (text(value.attempt_status) ?? 'in_progress') as AttemptStatus,
    submittedBy: text(value.submitted_by) as SubmittedBy | null,
    startedAt,
    expiresAt,
    submittedAt: text(value.submitted_at),
    serverNow,
    currentPosition: numberOrNull(value.current_position) ?? 1,
    questionTotal: numberOrNull(value.question_total) ?? 0,
    assessment: {
      id: text(assessment.id) ?? '',
      title: text(assessment.title) ?? '',
      sectionKey: text(assessment.section_key) ?? '',
      recordClipboard: assessment.record_clipboard !== false,
      feedbackMode: (text(assessment.feedback_mode) ?? 'hidden') as FeedbackMode,
      passGrade: numberOrNull(assessment.pass_grade) ?? 3,
    },
  };
  if (value.status === 'in_progress') {
    const items = Array.isArray(value.items)
      ? value.items.map(readExamItem).filter((item): item is ExamItem => item !== null)
      : [];
    return { ...base, status: 'in_progress', items };
  }
  if (value.status === 'finished') {
    const items = Array.isArray(value.items)
      ? value.items.map(readReviewedItem).filter((item): item is ReviewedItem => item !== null)
      : null;
    return {
      ...base,
      status: 'finished',
      release: (text(value.release) ?? 'hidden') as FeedbackMode,
      grade: numberOrNull(value.grade),
      scorePercent: numberOrNull(value.score_percent),
      correctCount: numberOrNull(value.correct_count),
      items,
    };
  }
  return null;
}

export function isAnswered(answer: Answer | null): boolean {
  if (!answer) return false;
  if ('choice' in answer) return true;
  if ('choices' in answer) return answer.choices.length > 0;
  return answer.order.length > 0;
}

/** Entrada del autoguardado tal como la recibe `save_answers`. */
export interface AnswerEntry {
  readonly position: number;
  readonly answer: Answer | null;
  readonly flagged: boolean;
  readonly revision: number;
}

export type SaveOutcome =
  | {
      readonly status: 'saved';
      readonly saved: readonly { readonly position: number; readonly revision: number }[];
      readonly rejected: readonly number[];
      readonly serverNow: string | null;
      readonly expiresAt: string | null;
    }
  | { readonly status: 'finished' }
  | { readonly status: 'not-found' }
  | { readonly status: 'invalid' };

export function readSaveOutcome(value: unknown): SaveOutcome | null {
  if (!isRecord(value)) return null;
  if (value.status === 'saved') {
    const saved = Array.isArray(value.saved)
      ? value.saved.filter(isRecord).map((entry) => ({
          position: numberOrNull(entry.position) ?? 0,
          revision: numberOrNull(entry.revision) ?? 0,
        }))
      : [];
    const rejected = Array.isArray(value.rejected)
      ? value.rejected.map(numberOrNull).filter((entry): entry is number => entry !== null)
      : [];
    return {
      status: 'saved',
      saved,
      rejected,
      serverNow: text(value.server_now),
      expiresAt: text(value.expires_at),
    };
  }
  if (value.status === 'finished' || value.status === 'not-found' || value.status === 'invalid') {
    return { status: value.status };
  }
  return null;
}

export const MAX_EVENTS_PER_BATCH = 40;
export const MAX_ANSWERS_PER_BATCH = 100;
