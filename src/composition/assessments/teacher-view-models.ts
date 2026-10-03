import 'server-only';
import { exhibitTableText, isoToLocal } from '@/features/assessments/application/form-values';
import type { AssessmentFormValues } from '@/features/assessments/presentation/assessment-form';
import type { DetailRecord } from '@/features/assessments/presentation/assessment-detail';
import type { MonitorRow } from '@/features/assessments/presentation/monitor-view';
import type { QuestionFormValues } from '@/features/assessments/presentation/question-form';
import type {
  AssessmentRecord,
  MonitorEntry,
  QuestionDetail,
} from '@/features/assessments/infrastructure/supabase-assessment-repository';
import type { RosterStudent } from '@/features/assessments/application/results';
import { SECTION_TITLES } from './section-titles';

/** Traducción de los datos del repositorio a lo que muestran las vistas docentes. */

export function toDetailRecord(record: AssessmentRecord): DetailRecord {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    sectionTitle: SECTION_TITLES[record.sectionKey] ?? record.sectionKey,
    sectionKey: record.sectionKey,
    selectionMode: record.selectionMode,
    topics: record.topics,
    questionCount: record.questionCount,
    durationMinutes: record.durationMinutes,
    opensAt: record.opensAt,
    closesAt: record.closesAt,
    maxAttempts: record.maxAttempts,
    shuffleQuestions: record.shuffleQuestions,
    shuffleOptions: record.shuffleOptions,
    feedbackMode: record.feedbackMode,
    audience: record.audience,
    institutionalOnly: record.institutionalOnly,
    recordClipboard: record.recordClipboard,
    passGrade: record.passGrade,
    publishedAt: record.publishedAt,
    entryClosedAt: record.entryClosedAt,
    closedAt: record.closedAt,
  };
}

export const NEW_ASSESSMENT: AssessmentFormValues = {
  title: '',
  description: '',
  sectionKey: 'fundamentos-sql',
  topics: [],
  selectionMode: 'random',
  questionIds: [],
  questionCount: 20,
  durationMinutes: 45,
  opensAt: '',
  closesAt: '',
  maxAttempts: 1,
  shuffleQuestions: true,
  shuffleOptions: true,
  feedbackMode: 'hidden',
  audience: 'all',
  studentIds: [],
  institutionalOnly: false,
  recordClipboard: true,
  passGrade: '3.0',
};

export function toFormValues(
  record: AssessmentRecord,
  selection: { readonly questionIds: readonly string[]; readonly studentIds: readonly string[] },
): AssessmentFormValues {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    sectionKey: record.sectionKey,
    topics: record.topics,
    selectionMode: record.selectionMode,
    questionIds: selection.questionIds,
    questionCount: record.questionCount,
    durationMinutes: record.durationMinutes,
    opensAt: isoToLocal(record.opensAt),
    closesAt: isoToLocal(record.closesAt),
    maxAttempts: record.maxAttempts,
    shuffleQuestions: record.shuffleQuestions,
    shuffleOptions: record.shuffleOptions,
    feedbackMode: record.feedbackMode,
    audience: record.audience,
    studentIds: selection.studentIds,
    institutionalOnly: record.institutionalOnly,
    recordClipboard: record.recordClipboard,
    passGrade: record.passGrade.toFixed(1),
  };
}

export function toMonitorRows(
  rows: readonly { readonly entry: MonitorEntry; readonly student: RosterStudent | null }[],
): MonitorRow[] {
  return rows.map(({ entry, student }) => ({
    attemptId: entry.attemptId,
    name: student
      ? `${student.firstName} ${student.lastName}`.trim() || student.email
      : 'Estudiante',
    email: student?.email ?? '',
    status: entry.status,
    currentPosition: entry.currentPosition,
    questionTotal: entry.questionTotal,
    answered: entry.answered,
    flagged: entry.flagged,
    expiresAt: entry.expiresAt,
    submittedAt: entry.submittedAt,
    lastSeenAt: entry.lastSeenAt,
    lastEvent: entry.lastEvent,
    counts: entry.counts,
  }));
}

export const NEW_QUESTION: QuestionFormValues = {
  section: 'fundamentos-sql',
  topic: 'select-from',
  subtopic: '',
  type: 'single_choice',
  response: 'single',
  difficulty: 2,
  weight: '',
  prompt: '',
  code: '',
  exhibitTable: '',
  options: [],
  explanation: '',
  concept: '',
  review: '',
  reference: '',
  tags: '',
  status: 'draft',
};

export function toQuestionFormValues(question: QuestionDetail): QuestionFormValues {
  return {
    id: question.id,
    section: question.section,
    topic: question.topic,
    subtopic: question.subtopic,
    type: question.type,
    response: question.response,
    difficulty: question.difficulty,
    weight: String(question.weight),
    prompt: question.prompt,
    code: question.code ?? '',
    exhibitTable: exhibitTableText(question.exhibit?.tables?.[0]),
    options: question.options.map((option) => ({
      body: option.body,
      kind: option.kind === 'code' ? 'code' : 'text',
      correct: option.correct,
      order: option.order ?? 0,
      feedback: option.feedback,
    })),
    explanation: question.explanation,
    concept: question.concept,
    review: question.review,
    reference: question.reference,
    tags: question.tags.join(', '),
    status: question.status === 'published' ? 'published' : 'draft',
  };
}
