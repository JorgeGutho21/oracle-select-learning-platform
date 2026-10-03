import { z } from 'zod';
import { SECTION_IDS, type SectionId } from '@/features/sections/domain/sections';
import {
  AUDIENCES,
  FEEDBACK_MODES,
  LIMITS,
  SELECTION_MODES,
  type Audience,
  type FeedbackMode,
  type SelectionMode,
} from '../domain/assessment';
import {
  DIFFICULTIES,
  QUESTION_TYPES,
  questionProblems,
  RESPONSE_KINDS_BY_TYPE,
  type OptionDraft,
  type QuestionContent,
  type ResponseKind,
} from '../domain/question';
import { isTopicOf } from '../domain/topics';

import { localToIso, MAX_FORM_OPTIONS, parseExhibitTable } from './form-values';

export { ASSESSMENT_PROBLEM_MESSAGE, QUESTION_PROBLEM_MESSAGE } from './assessment-forms-messages';

/**
 * Formularios del profesor (solo servidor). Validan y traducen lo que llega del navegador al
 * formato que esperan las funciones de la base. La base vuelve a comprobarlo todo: estos
 * mensajes existen para que el profesor sepa qué corregir.
 */

export interface FormResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly errors: Readonly<Record<string, string>>;
}

function all(form: FormData, name: string): string[] {
  return form.getAll(name).filter((value): value is string => typeof value === 'string');
}

function one(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

const uuid = z.string().uuid();

export interface AssessmentPayload {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly section_key: SectionId;
  readonly topics: readonly string[];
  readonly selection_mode: SelectionMode;
  readonly question_ids: readonly string[];
  readonly question_count: number;
  readonly duration_minutes: number;
  readonly opens_at: string | null;
  readonly closes_at: string | null;
  readonly max_attempts: number;
  readonly shuffle_questions: boolean;
  readonly shuffle_options: boolean;
  readonly feedback_mode: FeedbackMode;
  readonly audience: Audience;
  readonly student_ids: readonly string[];
  readonly institutional_only: boolean;
  readonly record_clipboard: boolean;
  readonly pass_grade: number;
}

function integer(raw: string, min: number, max: number): number | null {
  if (!/^\d{1,4}$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}

export function parseAssessmentForm(form: FormData): FormResult<AssessmentPayload> {
  const errors: Record<string, string> = {};
  const id = one(form, 'id');
  const title = one(form, 'title');
  const description = one(form, 'description');
  const section = one(form, 'section_key');
  const mode = one(form, 'selection_mode');
  const feedback = one(form, 'feedback_mode') || 'hidden';
  const audience = one(form, 'audience') || 'all';
  if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
    errors.title = `Escribe un nombre de ${LIMITS.title.min} a ${LIMITS.title.max} caracteres.`;
  }
  if (description.length > LIMITS.description) {
    errors.description = `La descripción admite hasta ${LIMITS.description} caracteres.`;
  }
  if (!(SECTION_IDS as readonly string[]).includes(section))
    errors.section_key = 'Elige una sección.';
  if (!(SELECTION_MODES as readonly string[]).includes(mode)) {
    errors.selection_mode = 'Elige cómo se seleccionan las preguntas.';
  }
  const sectionId = section as SectionId;
  const topics = all(form, 'topics').filter((topic) =>
    errors.section_key ? false : isTopicOf(sectionId, topic),
  );
  const questionIds = [
    ...new Set(all(form, 'question_ids').filter((value) => uuid.safeParse(value).success)),
  ];
  const count = integer(
    one(form, 'question_count'),
    LIMITS.questionCount.min,
    LIMITS.questionCount.max,
  );
  if (count === null) {
    errors.question_count = `Indica entre ${LIMITS.questionCount.min} y ${LIMITS.questionCount.max} preguntas.`;
  }
  if (mode === 'manual') {
    if (questionIds.length === 0) errors.question_ids = 'Elige al menos una pregunta del banco.';
    else if (count !== null && count > questionIds.length) {
      errors.question_count = `Elegiste ${questionIds.length} preguntas; la cantidad no puede ser mayor.`;
    }
  }
  const duration = integer(one(form, 'duration_minutes'), LIMITS.duration.min, LIMITS.duration.max);
  if (duration === null) {
    errors.duration_minutes = `La duración va de ${LIMITS.duration.min} a ${LIMITS.duration.max} minutos.`;
  }
  const attempts = integer(
    one(form, 'max_attempts') || '1',
    LIMITS.attempts.min,
    LIMITS.attempts.max,
  );
  if (attempts === null) errors.max_attempts = 'Los intentos van de 1 a 5.';
  const opensRaw = one(form, 'opens_at');
  const closesRaw = one(form, 'closes_at');
  const opensAt = opensRaw ? localToIso(opensRaw) : null;
  const closesAt = closesRaw ? localToIso(closesRaw) : null;
  if (opensRaw && !opensAt) errors.opens_at = 'Fecha de apertura no válida.';
  if (closesRaw && !closesAt) errors.closes_at = 'Fecha de cierre no válida.';
  if (opensAt && closesAt && Date.parse(closesAt) <= Date.parse(opensAt)) {
    errors.closes_at = 'El cierre debe ser posterior a la apertura.';
  }
  if (!(FEEDBACK_MODES as readonly string[]).includes(feedback)) {
    errors.feedback_mode = 'Elige qué verá el estudiante al terminar.';
  }
  if (!(AUDIENCES as readonly string[]).includes(audience))
    errors.audience = 'Elige para quién es.';
  const studentIds = [
    ...new Set(all(form, 'student_ids').filter((value) => uuid.safeParse(value).success)),
  ];
  if (audience === 'selected' && studentIds.length === 0) {
    errors.student_ids = 'Elige al menos un estudiante.';
  }
  const passRaw = (one(form, 'pass_grade') || '3.0').replace(',', '.');
  const passGrade = /^[0-5](\.\d)?$/.test(passRaw) ? Number(passRaw) : null;
  if (passGrade === null) errors.pass_grade = 'La nota mínima va de 0.0 a 5.0, con un decimal.';
  if (id && !uuid.safeParse(id).success) errors.form = 'Evaluación no válida.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: {},
    value: {
      ...(id ? { id } : {}),
      title,
      description,
      section_key: sectionId,
      topics,
      selection_mode: mode as SelectionMode,
      question_ids: mode === 'manual' ? questionIds : [],
      question_count: count!,
      duration_minutes: duration!,
      opens_at: opensAt,
      closes_at: closesAt,
      max_attempts: attempts!,
      shuffle_questions: form.get('shuffle_questions') === 'on',
      shuffle_options: form.get('shuffle_options') === 'on',
      feedback_mode: feedback as FeedbackMode,
      audience: audience as Audience,
      student_ids: audience === 'selected' ? studentIds : [],
      institutional_only: form.get('institutional_only') === 'on',
      record_clipboard: form.get('record_clipboard') === 'on',
      pass_grade: passGrade!,
    },
  };
}

// ---------------------------------------------------------------------------
// Preguntas del profesor
// ---------------------------------------------------------------------------

export interface QuestionPayload extends Omit<QuestionContent, 'tags'> {
  readonly id?: string;
  readonly tags: readonly string[];
  readonly status: 'draft' | 'published';
}

export function parseQuestionForm(form: FormData): FormResult<QuestionPayload> {
  const errors: Record<string, string> = {};
  const id = one(form, 'id');
  const section = one(form, 'section');
  const topic = one(form, 'topic');
  const type = one(form, 'type');
  const prompt = one(form, 'prompt');
  const code = one(form, 'code');
  const difficultyRaw = Number(one(form, 'difficulty'));
  const weightRaw = one(form, 'weight').replace(',', '.');
  if (!(SECTION_IDS as readonly string[]).includes(section)) errors.section = 'Elige una sección.';
  else if (!isTopicOf(section as SectionId, topic)) errors.topic = 'Elige un tema de la sección.';
  if (!(QUESTION_TYPES as readonly string[]).includes(type))
    errors.type = 'Elige un tipo de pregunta.';
  const allowed = RESPONSE_KINDS_BY_TYPE[type as keyof typeof RESPONSE_KINDS_BY_TYPE] ?? [];
  const requested = one(form, 'response') as ResponseKind;
  const response: ResponseKind = allowed.includes(requested) ? requested : (allowed[0] ?? 'single');
  if (prompt.length < 5 || prompt.length > 2000)
    errors.prompt = 'Escribe el enunciado (5 a 2000 caracteres).';
  if (code.length > 4000) errors.code = 'El código admite hasta 4000 caracteres.';
  if (!(DIFFICULTIES as readonly number[]).includes(difficultyRaw))
    errors.difficulty = 'Elige la dificultad.';
  let weight: number | undefined;
  if (weightRaw) {
    const parsed = Number(weightRaw);
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(weightRaw) || parsed < 0.25 || parsed > 10) {
      errors.weight = 'El peso va de 0.25 a 10.';
    } else weight = parsed;
  }
  const table = parseExhibitTable(form.get('exhibit_table')?.toString() ?? '');
  if (table === 'invalid') {
    errors.exhibit_table =
      'La tabla debe tener columnas en la primera línea y el mismo número de valores por fila.';
  }
  const options: OptionDraft[] = [];
  for (let index = 0; index < MAX_FORM_OPTIONS; index += 1) {
    const body = one(form, `option_${index}_body`);
    if (!body) continue;
    const order = Number(one(form, `option_${index}_order`));
    options.push({
      body,
      kind: one(form, `option_${index}_kind`) === 'code' ? 'code' : 'text',
      correct: response !== 'order' && form.get(`option_${index}_correct`) === 'on',
      ...(response === 'order' ? { order: Number.isInteger(order) ? order : 0 } : {}),
      feedback: one(form, `option_${index}_feedback`).slice(0, 1000),
    });
  }
  const problems = questionProblems({ response, options });
  if (problems.includes('options-count')) errors.options = 'Escribe entre 2 y 8 opciones.';
  else if (problems.includes('single-correct'))
    errors.options = 'Marca exactamente una opción correcta.';
  else if (problems.includes('multiple-correct')) {
    errors.options = 'Marca al menos una correcta y deja al menos una incorrecta.';
  } else if (problems.includes('order-permutation')) {
    errors.options = 'Numera los fragmentos del 1 al total, sin repetir.';
  }
  const status = one(form, 'status') === 'published' ? 'published' : 'draft';
  if (id && !uuid.safeParse(id).success) errors.form = 'Pregunta no válida.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: {},
    value: {
      ...(id ? { id } : {}),
      section: section as SectionId,
      topic,
      subtopic: one(form, 'subtopic').slice(0, 80),
      type: type as QuestionPayload['type'],
      response,
      difficulty: difficultyRaw as QuestionPayload['difficulty'],
      ...(weight !== undefined ? { weight } : {}),
      prompt,
      ...(code ? { code } : {}),
      ...(table && table !== 'invalid' ? { exhibit: { tables: [table] } } : {}),
      options,
      explanation: one(form, 'explanation').slice(0, 2000),
      concept: one(form, 'concept').slice(0, 200),
      review: one(form, 'review').slice(0, 500),
      reference: one(form, 'reference').slice(0, 500),
      tags: one(form, 'tags')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
      status,
    },
  };
}

/** Pregunta del banco tal como la recibe `save_question` / `sync_official_questions`. */
export function questionRpcPayload(
  content: QuestionContent & {
    readonly id?: string;
    readonly key?: string;
    readonly status?: string;
  },
): Record<string, unknown> {
  return {
    ...(content.id ? { id: content.id } : {}),
    ...(content.key ? { external_key: content.key } : {}),
    section: content.section,
    topic: content.topic,
    subtopic: content.subtopic,
    type: content.type,
    response: content.response,
    prompt: content.prompt,
    code: content.code ?? null,
    exhibit: content.exhibit ?? null,
    explanation: content.explanation,
    concept: content.concept,
    review: content.review,
    reference: content.reference,
    difficulty: content.difficulty,
    ...(content.weight !== undefined ? { weight: content.weight } : {}),
    tags: content.tags ?? [],
    ...(content.status ? { status: content.status } : {}),
    options: content.options.map((option) => ({
      body: option.body,
      kind: option.kind ?? 'text',
      result: option.result ?? null,
      correct: Boolean(option.correct),
      order: option.order ?? null,
      feedback: option.feedback ?? '',
    })),
  };
}
