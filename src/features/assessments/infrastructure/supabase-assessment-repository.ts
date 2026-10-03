import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { AnswerRow, AttemptRow, FrozenQuestion } from '../application/results';
import type {
  StartOutcome,
  StudentAssessment,
  StudentAttemptSummary,
} from '../application/student-assessments';
import { readAnswer } from '../application/exam-wire';
import { ASSESSMENT_STATUSES, FEEDBACK_MODES, ASSESSMENT_PHASES } from '../domain/assessment';
import {
  QUESTION_STATUSES,
  QUESTION_TYPES,
  RESPONSE_KINDS,
  type DataTable,
  type Exhibit,
} from '../domain/question';

/**
 * Acceso a las evaluaciones con la sesión de la persona (nunca con la clave secreta). Los
 * estudiantes solo llaman funciones de la base; el profesor además lee las tablas, y es RLS
 * la que limita esas lecturas a su rol.
 */

type Client = SupabaseClient;
type Json = Record<string, unknown>;

export type RpcResult = { readonly ok: true; readonly data: Json } | { readonly ok: false };

/** Llamada a una función de la base. Un fallo de red o de permisos devuelve `ok: false`. */
export async function callRpc(client: Client, name: string, args: Json = {}): Promise<RpcResult> {
  const { data, error } = await client.rpc(name, args);
  if (error || typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false };
  }
  return { ok: true, data: data as Json };
}

// ---------------------------------------------------------------------------
// Estudiante
// ---------------------------------------------------------------------------

const timestamp = z.string().min(10);
const numeric = z.union([z.number(), z.string()]).transform(Number).pipe(z.number().finite());

const studentAttemptSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  status: z.enum(['in_progress', 'submitted', 'auto_submitted']),
  submitted_by: z.enum(['student', 'timer', 'teacher']).nullable(),
  started_at: timestamp,
  expires_at: timestamp,
  submitted_at: timestamp.nullable(),
  grade: numeric.nullable(),
  score_percent: numeric.nullable(),
  correct_count: z.number().int().nullable(),
  question_total: z.number().int(),
});

const studentAssessmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  section_key: z.string(),
  question_count: z.number().int(),
  duration_minutes: z.number().int(),
  opens_at: timestamp.nullable(),
  closes_at: timestamp.nullable(),
  max_attempts: z.number().int(),
  record_clipboard: z.boolean(),
  pass_grade: numeric,
  phase: z.enum(ASSESSMENT_PHASES),
  feedback_mode: z.enum(FEEDBACK_MODES),
  server_now: timestamp,
  attempts: z.array(studentAttemptSchema),
});

function toStudentAssessment(raw: z.infer<typeof studentAssessmentSchema>): StudentAssessment {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    sectionKey: raw.section_key,
    questionCount: raw.question_count,
    durationMinutes: raw.duration_minutes,
    opensAt: raw.opens_at,
    closesAt: raw.closes_at,
    maxAttempts: raw.max_attempts,
    recordClipboard: raw.record_clipboard,
    passGrade: raw.pass_grade,
    phase: raw.phase,
    feedbackMode: raw.feedback_mode,
    serverNow: raw.server_now,
    attempts: raw.attempts.map<StudentAttemptSummary>((attempt) => ({
      id: attempt.id,
      number: attempt.number,
      status: attempt.status,
      submittedBy: attempt.submitted_by,
      startedAt: attempt.started_at,
      expiresAt: attempt.expires_at,
      submittedAt: attempt.submitted_at,
      grade: attempt.grade,
      scorePercent: attempt.score_percent,
      correctCount: attempt.correct_count,
      questionTotal: attempt.question_total,
    })),
  };
}

export async function listStudentAssessments(
  client: Client,
): Promise<readonly StudentAssessment[] | null> {
  const { data, error } = await client.rpc('student_assessments');
  if (error) return null;
  const parsed = z.array(studentAssessmentSchema).safeParse(data);
  return parsed.success ? parsed.data.map(toStudentAssessment) : null;
}

export async function readStudentAssessment(
  client: Client,
  id: string,
): Promise<StudentAssessment | 'not-found' | null> {
  const result = await callRpc(client, 'student_assessment', { p_assessment: id });
  if (!result.ok) return null;
  if (result.data.status === 'not-found') return 'not-found';
  const parsed = studentAssessmentSchema.safeParse(result.data.assessment);
  return parsed.success ? toStudentAssessment(parsed.data) : null;
}

export async function startAttempt(
  client: Client,
  id: string,
): Promise<{ readonly status: StartOutcome; readonly attemptId?: string }> {
  const result = await callRpc(client, 'start_attempt', { p_assessment: id });
  if (!result.ok) return { status: 'error' };
  const status = result.data.status as StartOutcome;
  const attemptId = typeof result.data.attempt_id === 'string' ? result.data.attempt_id : undefined;
  return attemptId ? { status, attemptId } : { status };
}

export function attemptView(client: Client, attemptId: string): Promise<RpcResult> {
  return callRpc(client, 'attempt_view', { p_attempt: attemptId });
}

export function saveAnswers(
  client: Client,
  attemptId: string,
  position: number,
  answers: readonly unknown[],
): Promise<RpcResult> {
  return callRpc(client, 'save_answers', {
    p_attempt: attemptId,
    p_position: position,
    p_answers: answers,
  });
}

export function logAttemptEvents(
  client: Client,
  attemptId: string,
  position: number,
  events: readonly unknown[],
): Promise<RpcResult> {
  return callRpc(client, 'log_attempt_events', {
    p_attempt: attemptId,
    p_position: position,
    p_events: events,
  });
}

export function submitAttempt(
  client: Client,
  attemptId: string,
  reason: 'student' | 'timer',
): Promise<RpcResult> {
  return callRpc(client, 'submit_attempt', { p_attempt: attemptId, p_reason: reason });
}

// ---------------------------------------------------------------------------
// Profesor: banco de preguntas
// ---------------------------------------------------------------------------

const tableSchema = z
  .object({
    caption: z.string().optional(),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
  })
  .transform<DataTable>(({ caption, columns, rows }) =>
    caption === undefined ? { columns, rows } : { caption, columns, rows },
  );

const exhibitSchema = z
  .object({
    tables: z.array(tableSchema).optional(),
    queries: z.array(z.object({ label: z.string(), sql: z.string() })).optional(),
  })
  .nullable();

export interface QuestionSummary {
  readonly id: string;
  readonly externalKey: string | null;
  readonly origin: 'dblab' | 'teacher';
  readonly section: string;
  readonly topic: string;
  readonly subtopic: string;
  readonly type: (typeof QUESTION_TYPES)[number];
  readonly response: (typeof RESPONSE_KINDS)[number];
  readonly prompt: string;
  readonly difficulty: number;
  readonly weight: number;
  readonly status: (typeof QUESTION_STATUSES)[number];
  readonly version: number;
  readonly updatedAt: string;
}

const QUESTION_SUMMARY_COLUMNS =
  'id, external_key, origin, section_key, topic, subtopic, question_type, response_kind, prompt, difficulty, weight, status, version, updated_at';

const questionSummarySchema = z
  .object({
    id: z.string().uuid(),
    external_key: z.string().nullable(),
    origin: z.enum(['dblab', 'teacher']),
    section_key: z.string(),
    topic: z.string(),
    subtopic: z.string(),
    question_type: z.enum(QUESTION_TYPES),
    response_kind: z.enum(RESPONSE_KINDS),
    prompt: z.string(),
    difficulty: z.number().int(),
    weight: numeric,
    status: z.enum(QUESTION_STATUSES),
    version: z.number().int(),
    updated_at: timestamp,
  })
  .transform<QuestionSummary>((row) => ({
    id: row.id,
    externalKey: row.external_key,
    origin: row.origin,
    section: row.section_key,
    topic: row.topic,
    subtopic: row.subtopic,
    type: row.question_type,
    response: row.response_kind,
    prompt: row.prompt,
    difficulty: row.difficulty,
    weight: row.weight,
    status: row.status,
    version: row.version,
    updatedAt: row.updated_at,
  }));

export interface QuestionFilter {
  readonly section?: string | undefined;
  readonly topic?: string | undefined;
  readonly type?: string | undefined;
  readonly status?: string | undefined;
  readonly search?: string | undefined;
  readonly page: number;
  readonly pageSize: number;
}

/** Texto para ilike sin comodines del usuario. */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export async function listQuestions(
  client: Client,
  filter: QuestionFilter,
): Promise<{ readonly rows: readonly QuestionSummary[]; readonly total: number } | null> {
  let query = client.from('question_bank').select(QUESTION_SUMMARY_COLUMNS, { count: 'exact' });
  if (filter.section) query = query.eq('section_key', filter.section);
  if (filter.topic) query = query.eq('topic', filter.topic);
  if (filter.type) query = query.eq('question_type', filter.type);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.search) query = query.ilike('prompt', likePattern(filter.search));
  const from = (filter.page - 1) * filter.pageSize;
  const { data, error, count } = await query
    .order('section_key')
    .order('topic')
    .order('external_key', { nullsFirst: false })
    .order('created_at')
    .range(from, from + filter.pageSize - 1);
  if (error) return null;
  const parsed = z.array(questionSummarySchema).safeParse(data);
  return parsed.success ? { rows: parsed.data, total: count ?? parsed.data.length } : null;
}

export async function questionsByIds(
  client: Client,
  ids: readonly string[],
): Promise<readonly QuestionSummary[] | null> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from('question_bank')
    .select(QUESTION_SUMMARY_COLUMNS)
    .in('id', ids.slice(0, 300));
  if (error) return null;
  const parsed = z.array(questionSummarySchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Recuento de preguntas publicadas por sección y tema (para la selección aleatoria). */
export async function publishedTopicCounts(
  client: Client,
): Promise<ReadonlyMap<string, number> | null> {
  const { data, error } = await client
    .from('question_bank')
    .select('section_key, topic')
    .eq('status', 'published')
    .limit(5000);
  if (error) return null;
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { section_key: string; topic: string }[]) {
    for (const key of [row.section_key, `${row.section_key}:${row.topic}`]) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

export interface QuestionDetail extends QuestionSummary {
  readonly code: string | null;
  readonly exhibit: Exhibit | null;
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

export async function readQuestion(client: Client, id: string): Promise<QuestionDetail | null> {
  const { data, error } = await client
    .from('question_bank')
    .select(
      `${QUESTION_SUMMARY_COLUMNS}, code, exhibit, explanation, concept, review_hint, reference, tags,
       question_options (id, position, body, body_kind, result, is_correct, correct_position, feedback)`,
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const summary = questionSummarySchema.safeParse(data);
  const extra = z
    .object({
      code: z.string().nullable(),
      exhibit: exhibitSchema,
      explanation: z.string(),
      concept: z.string(),
      review_hint: z.string(),
      reference: z.string(),
      tags: z.array(z.string()),
      question_options: z.array(
        z.object({
          id: z.string().uuid(),
          position: z.number().int(),
          body: z.string(),
          body_kind: z.enum(['text', 'code', 'table']),
          result: tableSchema.nullable(),
          is_correct: z.boolean(),
          correct_position: z.number().int().nullable(),
          feedback: z.string(),
        }),
      ),
    })
    .safeParse(data);
  if (!summary.success || !extra.success) return null;
  return {
    ...summary.data,
    code: extra.data.code,
    exhibit: extra.data.exhibit as Exhibit | null,
    explanation: extra.data.explanation,
    concept: extra.data.concept,
    review: extra.data.review_hint,
    reference: extra.data.reference,
    tags: extra.data.tags,
    options: [...extra.data.question_options]
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        body: option.body,
        kind: option.body_kind,
        result: option.result,
        correct: option.is_correct,
        order: option.correct_position,
        feedback: option.feedback,
      })),
  };
}

// ---------------------------------------------------------------------------
// Profesor: evaluaciones
// ---------------------------------------------------------------------------

const ASSESSMENT_COLUMNS =
  'id, title, description, section_key, topics, selection_mode, question_count, duration_minutes, opens_at, closes_at, max_attempts, shuffle_questions, shuffle_options, feedback_mode, audience, institutional_only, record_clipboard, pass_grade, status, published_at, entry_closed_at, closed_at, archived_at, monitor_key, created_at, updated_at';

const assessmentSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    section_key: z.string(),
    topics: z.array(z.string()),
    selection_mode: z.enum(['manual', 'random']),
    question_count: z.number().int(),
    duration_minutes: z.number().int(),
    opens_at: timestamp.nullable(),
    closes_at: timestamp.nullable(),
    max_attempts: z.number().int(),
    shuffle_questions: z.boolean(),
    shuffle_options: z.boolean(),
    feedback_mode: z.enum(FEEDBACK_MODES),
    audience: z.enum(['all', 'selected']),
    institutional_only: z.boolean(),
    record_clipboard: z.boolean(),
    pass_grade: numeric,
    status: z.enum(ASSESSMENT_STATUSES),
    published_at: timestamp.nullable(),
    entry_closed_at: timestamp.nullable(),
    closed_at: timestamp.nullable(),
    archived_at: timestamp.nullable(),
    monitor_key: z.string().uuid(),
    created_at: timestamp,
    updated_at: timestamp,
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    sectionKey: row.section_key,
    topics: row.topics,
    selectionMode: row.selection_mode,
    questionCount: row.question_count,
    durationMinutes: row.duration_minutes,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    maxAttempts: row.max_attempts,
    shuffleQuestions: row.shuffle_questions,
    shuffleOptions: row.shuffle_options,
    feedbackMode: row.feedback_mode,
    audience: row.audience,
    institutionalOnly: row.institutional_only,
    recordClipboard: row.record_clipboard,
    passGrade: row.pass_grade,
    status: row.status,
    publishedAt: row.published_at,
    entryClosedAt: row.entry_closed_at,
    closedAt: row.closed_at,
    archivedAt: row.archived_at,
    monitorKey: row.monitor_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export type AssessmentRecord = z.output<typeof assessmentSchema>;

export async function listAssessments(client: Client): Promise<readonly AssessmentRecord[] | null> {
  const { data, error } = await client
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) return null;
  const parsed = z.array(assessmentSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function readAssessment(client: Client, id: string): Promise<AssessmentRecord | null> {
  const { data, error } = await client
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = assessmentSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Recuento de intentos por evaluación y estado (para las tarjetas). */
export async function attemptCounts(
  client: Client,
): Promise<ReadonlyMap<
  string,
  { readonly started: number; readonly finished: number; readonly open: number }
> | null> {
  const { data, error } = await client
    .from('assessment_attempts')
    .select('assessment_id, student_id, status')
    .limit(20000);
  if (error) return null;
  const counts = new Map<string, { started: Set<string>; finished: Set<string>; open: number }>();
  for (const row of (data ?? []) as {
    assessment_id: string;
    student_id: string;
    status: string;
  }[]) {
    const entry = counts.get(row.assessment_id) ?? {
      started: new Set(),
      finished: new Set(),
      open: 0,
    };
    entry.started.add(row.student_id);
    if (row.status === 'in_progress') entry.open += 1;
    else entry.finished.add(row.student_id);
    counts.set(row.assessment_id, entry);
  }
  return new Map(
    [...counts].map(([id, entry]) => [
      id,
      { started: entry.started.size, finished: entry.finished.size, open: entry.open },
    ]),
  );
}

export async function assessmentSelection(
  client: Client,
  id: string,
): Promise<{
  readonly questionIds: readonly string[];
  readonly studentIds: readonly string[];
} | null> {
  const [questions, students] = await Promise.all([
    client
      .from('assessment_questions')
      .select('question_id, position')
      .eq('assessment_id', id)
      .order('position'),
    client.from('assessment_assignments').select('student_id').eq('assessment_id', id),
  ]);
  if (questions.error || students.error) return null;
  return {
    questionIds: ((questions.data ?? []) as { question_id: string }[]).map(
      (row) => row.question_id,
    ),
    studentIds: ((students.data ?? []) as { student_id: string }[]).map((row) => row.student_id),
  };
}

const optionSnapshotSchema = z.object({
  id: z.string(),
  body: z.string(),
  kind: z.enum(['text', 'code', 'table']),
  result: tableSchema.nullable(),
  correct: z.boolean(),
  order: z.number().int().nullable(),
  feedback: z.string().nullable(),
});

const snapshotSchema = z.object({
  external_key: z.string().nullable(),
  topic: z.string(),
  type: z.enum(QUESTION_TYPES),
  response: z.enum(RESPONSE_KINDS),
  prompt: z.string(),
  code: z.string().nullable(),
  exhibit: z.unknown(),
  explanation: z.string(),
  concept: z.string(),
  review: z.string(),
  reference: z.string(),
  difficulty: z.number().int(),
  options: z.array(optionSnapshotSchema),
});

/** Preguntas congeladas de una evaluación publicada (con su clave: solo profesor). */
export async function frozenQuestions(
  client: Client,
  id: string,
): Promise<readonly FrozenQuestion[] | null> {
  const { data, error } = await client
    .from('assessment_questions')
    .select('question_id, position, weight, version, snapshot')
    .eq('assessment_id', id)
    .order('position');
  if (error) return null;
  const rows: FrozenQuestion[] = [];
  for (const row of (data ?? []) as {
    question_id: string;
    position: number;
    weight: number | string | null;
    version: number | null;
    snapshot: unknown;
  }[]) {
    const snapshot = snapshotSchema.safeParse(row.snapshot);
    if (!snapshot.success) continue;
    const s = snapshot.data;
    rows.push({
      questionId: row.question_id,
      position: row.position,
      weight: Number(row.weight ?? 1),
      version: row.version ?? 1,
      externalKey: s.external_key,
      type: s.type,
      response: s.response,
      topic: s.topic,
      difficulty: s.difficulty,
      prompt: s.prompt,
      code: s.code,
      exhibit: s.exhibit,
      explanation: s.explanation,
      concept: s.concept,
      review: s.review,
      reference: s.reference,
      options: s.options.map((option) => ({ ...option, feedback: option.feedback ?? '' })),
    });
  }
  return rows;
}

const attemptRowSchema = z
  .object({
    id: z.string().uuid(),
    student_id: z.string().uuid(),
    attempt_number: z.number().int(),
    status: z.enum(['in_progress', 'submitted', 'auto_submitted']),
    submitted_by: z.enum(['student', 'timer', 'teacher']).nullable(),
    started_at: timestamp,
    expires_at: timestamp,
    submitted_at: timestamp.nullable(),
    duration_seconds: z.number().int().nullable(),
    question_total: z.number().int(),
    correct_count: z.number().int().nullable(),
    score_percent: numeric.nullable(),
    grade: numeric.nullable(),
  })
  .transform<AttemptRow>((row) => ({
    id: row.id,
    studentId: row.student_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    submittedBy: row.submitted_by,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
    durationSeconds: row.duration_seconds,
    questionTotal: row.question_total,
    correctCount: row.correct_count,
    scorePercent: row.score_percent,
    grade: row.grade,
  }));

export async function assessmentAttempts(
  client: Client,
  id: string,
): Promise<readonly AttemptRow[] | null> {
  const { data, error } = await client
    .from('assessment_attempts')
    .select(
      'id, student_id, attempt_number, status, submitted_by, started_at, expires_at, submitted_at, duration_seconds, question_total, correct_count, score_percent, grade',
    )
    .eq('assessment_id', id)
    .order('started_at')
    .limit(5000);
  if (error) return null;
  const parsed = z.array(attemptRowSchema).safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function assessmentAnswers(
  client: Client,
  id: string,
  attemptId?: string,
): Promise<readonly AnswerRow[] | null> {
  const rows: AnswerRow[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    let query = client
      .from('assessment_answers')
      .select('attempt_id, position, question_id, response, credit, flagged, option_order')
      .eq('assessment_id', id);
    if (attemptId) query = query.eq('attempt_id', attemptId);
    const { data, error } = await query
      .order('attempt_id')
      .order('position')
      .range(from, from + 999);
    if (error) return null;
    for (const row of (data ?? []) as {
      attempt_id: string;
      position: number;
      question_id: string;
      response: unknown;
      credit: number | string | null;
      flagged: boolean;
      option_order: string[];
    }[]) {
      rows.push({
        attemptId: row.attempt_id,
        position: row.position,
        questionId: row.question_id,
        answer: readAnswer(row.response),
        credit: row.credit === null ? null : Number(row.credit),
        flagged: row.flagged,
        optionOrder: row.option_order,
      });
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  return rows;
}

export interface MonitorEntry {
  readonly attemptId: string;
  readonly studentId: string;
  readonly attemptNumber: number;
  readonly status: 'in_progress' | 'submitted' | 'auto_submitted';
  readonly submittedBy: 'student' | 'timer' | 'teacher' | null;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly lastSeenAt: string;
  readonly currentPosition: number;
  readonly questionTotal: number;
  readonly answered: number;
  readonly flagged: number;
  readonly lastEvent: { readonly type: string; readonly at: string } | null;
  readonly counts: Readonly<Record<string, number>>;
}

const monitorSchema = z.object({
  status: z.literal('ok'),
  server_now: timestamp,
  attempts: z.array(
    z
      .object({
        attempt_id: z.string().uuid(),
        student_id: z.string().uuid(),
        attempt_number: z.number().int(),
        status: z.enum(['in_progress', 'submitted', 'auto_submitted']),
        submitted_by: z.enum(['student', 'timer', 'teacher']).nullable(),
        started_at: timestamp,
        expires_at: timestamp,
        submitted_at: timestamp.nullable(),
        last_seen_at: timestamp,
        current_position: z.number().int(),
        question_total: z.number().int(),
        answered: z.number().int(),
        flagged: z.number().int(),
        last_event: z.object({ type: z.string(), at: timestamp }).nullable(),
        counts: z.record(z.string(), z.number()),
      })
      .transform<MonitorEntry>((row) => ({
        attemptId: row.attempt_id,
        studentId: row.student_id,
        attemptNumber: row.attempt_number,
        status: row.status,
        submittedBy: row.submitted_by,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        submittedAt: row.submitted_at,
        lastSeenAt: row.last_seen_at,
        currentPosition: row.current_position,
        questionTotal: row.question_total,
        answered: row.answered,
        flagged: row.flagged,
        lastEvent: row.last_event,
        counts: row.counts,
      })),
  ),
});

export async function assessmentMonitor(
  client: Client,
  id: string,
): Promise<{ readonly serverNow: string; readonly attempts: readonly MonitorEntry[] } | null> {
  const result = await callRpc(client, 'assessment_monitor', { p_assessment: id });
  if (!result.ok) return null;
  const parsed = monitorSchema.safeParse(result.data);
  return parsed.success
    ? { serverNow: parsed.data.server_now, attempts: parsed.data.attempts }
    : null;
}

export interface EventRow {
  readonly type: string;
  readonly at: string;
  readonly position: number | null;
  readonly durationMs: number | null;
}

export async function attemptEvents(
  client: Client,
  attemptId: string,
): Promise<readonly EventRow[] | null> {
  const { data, error } = await client
    .from('assessment_events')
    .select('event_type, occurred_at, metadata')
    .eq('attempt_id', attemptId)
    .order('occurred_at')
    .limit(1000);
  if (error) return null;
  return ((data ?? []) as { event_type: string; occurred_at: string; metadata: Json }[]).map(
    (row) => ({
      type: row.event_type,
      at: row.occurred_at,
      position: typeof row.metadata.position === 'number' ? row.metadata.position : null,
      durationMs: typeof row.metadata.duration_ms === 'number' ? row.metadata.duration_ms : null,
    }),
  );
}

export async function attemptRow(client: Client, attemptId: string): Promise<AttemptRow | null> {
  const { data, error } = await client
    .from('assessment_attempts')
    .select(
      'id, student_id, attempt_number, status, submitted_by, started_at, expires_at, submitted_at, duration_seconds, question_total, correct_count, score_percent, grade',
    )
    .eq('id', attemptId)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = attemptRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Estudiantes elegidos por evaluación (solo las de audiencia seleccionada tienen filas). */
export async function assignmentCounts(
  client: Client,
): Promise<ReadonlyMap<string, number> | null> {
  const { data, error } = await client
    .from('assessment_assignments')
    .select('assessment_id')
    .limit(20000);
  if (error) return null;
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { assessment_id: string }[]) {
    counts.set(row.assessment_id, (counts.get(row.assessment_id) ?? 0) + 1);
  }
  return counts;
}

export interface AuditEntry {
  readonly action: string;
  readonly at: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export async function auditTrail(
  client: Client,
  id: string,
): Promise<readonly AuditEntry[] | null> {
  const { data, error } = await client
    .from('assessment_audit')
    .select('action, details, created_at')
    .eq('assessment_id', id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return null;
  return ((data ?? []) as { action: string; details: Json; created_at: string }[]).map((row) => ({
    action: row.action,
    at: row.created_at,
    details: row.details,
  }));
}
