import 'server-only';
import { notFound } from 'next/navigation';
import type { AccountProfile } from '@/features/accounts/domain/account';
import {
  BANK_TARGET_PER_SECTION,
  OFFICIAL_BANK,
} from '@/features/assessments/application/official-bank';
import { assessmentPhase, type AssessmentPhase } from '@/features/assessments/domain/assessment';
import {
  eligibleStudents,
  participantRows,
  questionStats,
  resultsSummary,
  type RosterStudent,
} from '@/features/assessments/application/results';
import {
  assessmentAnswers,
  assessmentAttempts,
  assessmentMonitor,
  assessmentSelection,
  assignmentCounts,
  attemptCounts,
  attemptEvents,
  attemptRow,
  auditTrail,
  frozenQuestions,
  listAssessments,
  listQuestions,
  publishedTopicCounts,
  questionsByIds,
  readAssessment,
  readQuestion,
  type AssessmentRecord,
} from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { authConfig } from '@/features/accounts/infrastructure/supabase-auth';
import { listStudentProfiles } from '@/features/teacher/infrastructure/supabase-roster-repository';
import { requireTeacher } from '../accounts/auth-server';

/**
 * Datos del panel docente de evaluaciones. Cada cargador exige el rol de profesor (403 sin
 * él) y lee con la sesión del profesor: RLS decide qué filas existen.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function roster(profiles: readonly AccountProfile[]): RosterStudent[] {
  return profiles.map((profile) => ({
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    institutional: profile.institutional,
  }));
}

function audienceOf(record: AssessmentRecord, assigned: readonly string[]) {
  return {
    audience: record.audience,
    institutionalOnly: record.institutionalOnly,
    assigned: new Set(assigned),
  };
}

export interface AssessmentCard {
  readonly record: AssessmentRecord;
  readonly phase: AssessmentPhase;
  readonly audienceSize: number;
  readonly started: number;
  readonly finished: number;
  readonly open: number;
}

export async function loadAssessmentList() {
  const account = await requireTeacher('/teacher/assessments');
  const [records, counts, assignments, profiles] = await Promise.all([
    listAssessments(account.client),
    attemptCounts(account.client),
    assignmentCounts(account.client),
    listStudentProfiles(account.client),
  ]);
  if (!records || !counts || !assignments || !profiles) return { status: 'error' as const };
  const now = Date.now();
  const students = roster(profiles);
  const institutional = students.filter((student) => student.institutional).length;
  const cards = records.map<AssessmentCard>((record) => {
    const count = counts.get(record.id) ?? { started: 0, finished: 0, open: 0 };
    return {
      record,
      phase: assessmentPhase(record, now),
      audienceSize:
        record.audience === 'selected'
          ? (assignments.get(record.id) ?? 0)
          : record.institutionalOnly
            ? institutional
            : students.length,
      ...count,
    };
  });
  return { status: 'ready' as const, cards, now };
}

/** Formulario de nueva evaluación (o de un borrador). */
export async function loadAssessmentEditor(id?: string) {
  if (id && !UUID.test(id)) notFound();
  const account = await requireTeacher(
    id ? `/teacher/assessments/${id}` : '/teacher/assessments/new',
  );
  const [bank, topicCounts, profiles, record, selection] = await Promise.all([
    listQuestions(account.client, { status: 'published', page: 1, pageSize: 600 }),
    publishedTopicCounts(account.client),
    listStudentProfiles(account.client),
    id ? readAssessment(account.client, id) : Promise.resolve(null),
    id ? assessmentSelection(account.client, id) : Promise.resolve(null),
  ]);
  if (id && !record) notFound();
  if (!bank || !topicCounts || !profiles || (id && !selection)) return { status: 'error' as const };
  return {
    status: 'ready' as const,
    record,
    selection,
    bank: bank.rows,
    topicCounts: Object.fromEntries(topicCounts),
    students: roster(profiles),
  };
}

export async function loadAssessmentDetail(id: string) {
  if (!UUID.test(id)) notFound();
  const account = await requireTeacher(`/teacher/assessments/${id}`);
  const record = await readAssessment(account.client, id);
  if (!record) notFound();
  const [selection, frozen, counts, audit, profiles] = await Promise.all([
    assessmentSelection(account.client, id),
    record.status === 'draft' ? Promise.resolve([]) : frozenQuestions(account.client, id),
    attemptCounts(account.client),
    auditTrail(account.client, id),
    listStudentProfiles(account.client),
  ]);
  if (!selection || !frozen || !counts || !audit || !profiles) return { status: 'error' as const };
  const draftQuestions =
    record.status === 'draft' ? await questionsByIds(account.client, selection.questionIds) : [];
  if (!draftQuestions) return { status: 'error' as const };
  const order = new Map(selection.questionIds.map((questionId, index) => [questionId, index]));
  const students = roster(profiles);
  return {
    status: 'ready' as const,
    record,
    phase: assessmentPhase(record, Date.now()),
    draftQuestions: [...draftQuestions].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    ),
    frozen,
    counts: counts.get(id) ?? { started: 0, finished: 0, open: 0 },
    audienceSize: eligibleStudents(students, audienceOf(record, selection.studentIds)).length,
    assigned: students.filter((student) => selection.studentIds.includes(student.id)),
    audit,
  };
}

export async function loadMonitor(id: string) {
  if (!UUID.test(id)) notFound();
  const account = await requireTeacher(`/teacher/assessments/${id}/monitor`);
  const record = await readAssessment(account.client, id);
  if (!record || record.status === 'draft') notFound();
  const [monitor, selection, profiles] = await Promise.all([
    assessmentMonitor(account.client, id),
    assessmentSelection(account.client, id),
    listStudentProfiles(account.client),
  ]);
  if (!monitor || !selection || !profiles) return { status: 'error' as const };
  const students = roster(profiles);
  const byId = new Map(students.map((student) => [student.id, student]));
  const started = new Set(monitor.attempts.map((attempt) => attempt.studentId));
  const realtime = authConfig(process.env);
  return {
    status: 'ready' as const,
    record,
    phase: assessmentPhase(record, Date.parse(monitor.serverNow)),
    serverNow: monitor.serverNow,
    rows: monitor.attempts.map((entry) => ({ entry, student: byId.get(entry.studentId) ?? null })),
    notStarted: eligibleStudents(students, audienceOf(record, selection.studentIds)).filter(
      (student) => !started.has(student.id),
    ),
    realtime: realtime
      ? {
          url: realtime.url,
          anonKey: realtime.publishableKey,
          topic: `assessment-monitor:${record.monitorKey}`,
        }
      : null,
  };
}

export async function loadResults(id: string) {
  if (!UUID.test(id)) notFound();
  const account = await requireTeacher(`/teacher/assessments/${id}/results`);
  const record = await readAssessment(account.client, id);
  if (!record || record.status === 'draft') notFound();
  // Entrega los intentos vencidos antes de contar.
  await assessmentMonitor(account.client, id);
  const [attempts, answers, frozen, selection, profiles] = await Promise.all([
    assessmentAttempts(account.client, id),
    assessmentAnswers(account.client, id),
    frozenQuestions(account.client, id),
    assessmentSelection(account.client, id),
    listStudentProfiles(account.client),
  ]);
  if (!attempts || !answers || !frozen || !selection || !profiles) {
    return { status: 'error' as const };
  }
  const students = roster(profiles);
  const phase = assessmentPhase(record, Date.now());
  const rows = participantRows(
    eligibleStudents(students, audienceOf(record, selection.studentIds)),
    students,
    attempts,
    phase,
  );
  const finished = new Set(
    attempts.filter((attempt) => attempt.status !== 'in_progress').map((attempt) => attempt.id),
  );
  return {
    status: 'ready' as const,
    record,
    phase,
    rows,
    summary: resultsSummary(rows, record.passGrade),
    // En selección aleatoria el conjunto es mayor que cada examen: solo las presentadas.
    questions: questionStats(frozen, answers, finished).filter((stat) => stat.presented > 0),
    notPresented: questionStats(frozen, answers, finished).filter((stat) => stat.presented === 0)
      .length,
    frozen,
    answers,
  };
}

export async function loadAttemptReview(id: string, attemptId: string) {
  if (!UUID.test(id) || !UUID.test(attemptId)) notFound();
  const account = await requireTeacher(`/teacher/assessments/${id}/results`);
  const [record, attempt] = await Promise.all([
    readAssessment(account.client, id),
    attemptRow(account.client, attemptId),
  ]);
  if (!record || !attempt) notFound();
  const [frozen, answers, events, profiles] = await Promise.all([
    frozenQuestions(account.client, id),
    assessmentAnswers(account.client, id, attemptId),
    attemptEvents(account.client, attemptId),
    listStudentProfiles(account.client),
  ]);
  if (!frozen || !answers || !events || !profiles) return { status: 'error' as const };
  const student = roster(profiles).find((entry) => entry.id === attempt.studentId) ?? null;
  const byQuestion = new Map(frozen.map((question) => [question.questionId, question]));
  return {
    status: 'ready' as const,
    record,
    attempt,
    student,
    items: [...answers]
      .sort((a, b) => a.position - b.position)
      .flatMap((answer) => {
        const question = byQuestion.get(answer.questionId);
        return question ? [{ answer, question }] : [];
      }),
    events,
  };
}

// ---------------------------------------------------------------------------
// Banco de preguntas
// ---------------------------------------------------------------------------

export const BANK_PAGE_SIZE = 20;

export async function loadQuestionBank(filter: {
  readonly section?: string | undefined;
  readonly topic?: string | undefined;
  readonly type?: string | undefined;
  readonly status?: string | undefined;
  readonly search?: string | undefined;
  readonly page: number;
}) {
  const account = await requireTeacher('/teacher/questions');
  const [page, published, all] = await Promise.all([
    listQuestions(account.client, { ...filter, pageSize: BANK_PAGE_SIZE }),
    publishedTopicCounts(account.client),
    listQuestions(account.client, { page: 1, pageSize: 1 }),
  ]);
  if (!page || !published || !all) return { status: 'error' as const };
  const official = Object.entries(OFFICIAL_BANK).map(([section, questions]) => ({
    section,
    available: questions.length,
    published: published.get(section) ?? 0,
    target: BANK_TARGET_PER_SECTION,
  }));
  return {
    status: 'ready' as const,
    rows: page.rows,
    total: page.total,
    bankSize: all.total,
    pages: Math.max(1, Math.ceil(page.total / BANK_PAGE_SIZE)),
    official,
  };
}

export async function loadQuestion(id: string) {
  if (!UUID.test(id)) notFound();
  const account = await requireTeacher(`/teacher/questions/${id}`);
  const question = await readQuestion(account.client, id);
  if (!question) notFound();
  return question;
}

export async function loadQuestionEditor(id?: string) {
  if (!id) {
    await requireTeacher('/teacher/questions/new');
    return null;
  }
  return loadQuestion(id);
}
