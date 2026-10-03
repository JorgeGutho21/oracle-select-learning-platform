import {
  DEFAULT_PASS_GRADE,
  type AssessmentPhase,
  type AttemptStatus,
  type Audience,
  type ParticipantStatus,
  type SubmittedBy,
} from '../domain/assessment';
import type { DataTable, QuestionType, ResponseKind } from '../domain/question';
import type { Answer } from './exam-wire';

/**
 * Resultados de una evaluación para el profesor: participantes (con ausentes), estadísticas
 * en la escala 0–5 y análisis por pregunta. Todo se calcula con las notas que ya calculó la
 * base; aquí no se recalifica nada.
 */

export interface RosterStudent {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly institutional: boolean;
}

export interface AttemptRow {
  readonly id: string;
  readonly studentId: string;
  readonly attemptNumber: number;
  readonly status: AttemptStatus;
  readonly submittedBy: SubmittedBy | null;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly durationSeconds: number | null;
  readonly questionTotal: number;
  readonly correctCount: number | null;
  readonly scorePercent: number | null;
  readonly grade: number | null;
}

export interface AudienceRule {
  readonly audience: Audience;
  readonly institutionalOnly: boolean;
  readonly assigned: ReadonlySet<string>;
}

/** Estudiantes a los que está dirigida la evaluación (la misma regla que la base). */
export function eligibleStudents(
  students: readonly RosterStudent[],
  rule: AudienceRule,
): RosterStudent[] {
  return students.filter(
    (student) =>
      (!rule.institutionalOnly || student.institutional) &&
      (rule.audience === 'all' || rule.assigned.has(student.id)),
  );
}

export interface ParticipantRow {
  readonly student: RosterStudent;
  readonly status: ParticipantStatus;
  /** Intento que se informa: el abierto, o el entregado con mejor nota. */
  readonly attempt: AttemptRow | null;
  readonly attempts: number;
}

function reported(attempts: readonly AttemptRow[]): AttemptRow | null {
  const open = attempts.find((attempt) => attempt.status === 'in_progress');
  if (open) return open;
  const finished = attempts.filter((attempt) => attempt.status !== 'in_progress');
  if (finished.length === 0) return null;
  return finished.reduce((best, attempt) =>
    (attempt.grade ?? -1) > (best.grade ?? -1) ? attempt : best,
  );
}

/**
 * Una fila por estudiante: quien nunca comenzó aparece «Ausente» cuando la evaluación ya no
 * admite nuevos accesos (y «Sin iniciar» mientras sigue abierta). Ausente no es un 0,0.
 * También aparecen quienes presentaron aunque ya no estén en la audiencia.
 */
export function participantRows(
  eligible: readonly RosterStudent[],
  everyone: readonly RosterStudent[],
  attempts: readonly AttemptRow[],
  phase: AssessmentPhase,
): ParticipantRow[] {
  const byStudent = new Map<string, AttemptRow[]>();
  for (const attempt of attempts) {
    byStudent.set(attempt.studentId, [...(byStudent.get(attempt.studentId) ?? []), attempt]);
  }
  const listed = new Map(eligible.map((student) => [student.id, student]));
  for (const student of everyone) {
    if (byStudent.has(student.id)) listed.set(student.id, student);
  }
  const accepting = phase === 'active' || phase === 'scheduled';
  return [...listed.values()]
    .map((student) => {
      const own = byStudent.get(student.id) ?? [];
      const attempt = reported(own);
      const status: ParticipantStatus = attempt
        ? attempt.status
        : accepting
          ? 'not_started'
          : 'absent';
      return { student, status, attempt, attempts: own.length };
    })
    .sort(
      (a, b) =>
        a.student.lastName.localeCompare(b.student.lastName, 'es') ||
        a.student.firstName.localeCompare(b.student.firstName, 'es'),
    );
}

export interface GradeBucket {
  readonly label: string;
  readonly count: number;
}

export interface GradeStats {
  readonly count: number;
  readonly mean: number | null;
  readonly median: number | null;
  readonly min: number | null;
  readonly max: number | null;
  readonly passed: number;
  readonly passRate: number | null;
  readonly distribution: readonly GradeBucket[];
}

const BUCKETS = [
  { label: '0.0 – 0.9', from: 0, to: 1 },
  { label: '1.0 – 1.9', from: 1, to: 2 },
  { label: '2.0 – 2.9', from: 2, to: 3 },
  { label: '3.0 – 3.9', from: 3, to: 4 },
  { label: '4.0 – 5.0', from: 4, to: 5.01 },
] as const;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function gradeStats(grades: readonly number[], passGrade = DEFAULT_PASS_GRADE): GradeStats {
  const sorted = [...grades].sort((a, b) => a - b);
  const count = sorted.length;
  const passed = sorted.filter((grade) => grade >= passGrade).length;
  const middle = Math.floor(count / 2);
  return {
    count,
    mean: count ? round1(sorted.reduce((sum, grade) => sum + grade, 0) / count) : null,
    median: count
      ? round1(count % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2)
      : null,
    min: count ? sorted[0]! : null,
    max: count ? sorted[count - 1]! : null,
    passed,
    passRate: count ? Math.round((passed / count) * 100) : null,
    distribution: BUCKETS.map(({ label, from, to }) => ({
      label,
      count: sorted.filter((grade) => grade >= from && grade < to).length,
    })),
  };
}

export interface ResultsSummary {
  readonly participants: number;
  readonly submitted: number;
  readonly inProgress: number;
  readonly absent: number;
  readonly notStarted: number;
  readonly stats: GradeStats;
}

export function resultsSummary(rows: readonly ParticipantRow[], passGrade: number): ResultsSummary {
  const finished = rows.filter(
    (row) => row.status === 'submitted' || row.status === 'auto_submitted',
  );
  return {
    participants: rows.length,
    submitted: finished.length,
    inProgress: rows.filter((row) => row.status === 'in_progress').length,
    absent: rows.filter((row) => row.status === 'absent').length,
    notStarted: rows.filter((row) => row.status === 'not_started').length,
    stats: gradeStats(
      finished.map((row) => row.attempt?.grade).filter((grade): grade is number => grade != null),
      passGrade,
    ),
  };
}

// ---------------------------------------------------------------------------
// Análisis por pregunta
// ---------------------------------------------------------------------------

export interface FrozenOption {
  readonly id: string;
  readonly body: string;
  readonly kind: 'text' | 'code' | 'table';
  readonly result: DataTable | null;
  readonly correct: boolean;
  readonly order: number | null;
  readonly feedback: string;
}

/** Copia congelada de una pregunta de la evaluación (lo que vio cada estudiante). */
export interface FrozenQuestion {
  readonly questionId: string;
  readonly position: number;
  readonly weight: number;
  readonly version: number;
  readonly externalKey: string | null;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly topic: string;
  readonly difficulty: number;
  readonly prompt: string;
  readonly code: string | null;
  readonly exhibit: unknown;
  readonly explanation: string;
  readonly concept: string;
  readonly review: string;
  readonly reference: string;
  readonly options: readonly FrozenOption[];
}

export interface AnswerRow {
  readonly attemptId: string;
  readonly position: number;
  readonly questionId: string;
  readonly answer: Answer | null;
  readonly credit: number | null;
  readonly flagged: boolean;
  readonly optionOrder: readonly string[];
}

export type ObservedDifficulty = 'easy' | 'medium' | 'hard';

export const OBSERVED_LABEL: Readonly<Record<ObservedDifficulty, string>> = {
  easy: 'Fácil para el grupo',
  medium: 'Intermedia',
  hard: 'Difícil para el grupo',
};

export interface OptionStat {
  readonly id: string;
  readonly body: string;
  readonly correct: boolean;
  readonly chosen: number;
  readonly share: number;
}

export interface QuestionStat {
  readonly question: FrozenQuestion;
  readonly presented: number;
  readonly answered: number;
  readonly fullyCorrect: number;
  /** Porcentaje de quienes la recibieron que la respondieron completamente bien. */
  readonly correctRate: number | null;
  readonly averageCredit: number | null;
  readonly observed: ObservedDifficulty | null;
  readonly options: readonly OptionStat[];
  /** Distractor más elegido (posible confusión o pregunta ambigua). */
  readonly topDistractor: OptionStat | null;
}

function chosenIds(answer: Answer | null): readonly string[] {
  if (!answer) return [];
  if ('choice' in answer) return [answer.choice];
  if ('choices' in answer) return answer.choices;
  return [];
}

export function questionStats(
  questions: readonly FrozenQuestion[],
  answers: readonly AnswerRow[],
  finishedAttemptIds: ReadonlySet<string>,
): QuestionStat[] {
  return questions.map((question) => {
    const rows = answers.filter(
      (row) => row.questionId === question.questionId && finishedAttemptIds.has(row.attemptId),
    );
    const presented = rows.length;
    const answered = rows.filter((row) => row.answer !== null).length;
    const fullyCorrect = rows.filter((row) => row.credit === 1).length;
    const credits = rows.map((row) => row.credit ?? 0);
    const correctRate = presented ? Math.round((fullyCorrect / presented) * 100) : null;
    const options = question.options.map<OptionStat>((option) => {
      const chosen = rows.filter((row) => chosenIds(row.answer).includes(option.id)).length;
      return {
        id: option.id,
        body: option.body,
        correct: option.correct,
        chosen,
        share: presented ? Math.round((chosen / presented) * 100) : 0,
      };
    });
    const distractors = options
      .filter((option) => !option.correct && option.chosen > 0)
      .sort((a, b) => b.chosen - a.chosen);
    return {
      question,
      presented,
      answered,
      fullyCorrect,
      correctRate,
      averageCredit: presented
        ? Math.round((credits.reduce((sum, credit) => sum + credit, 0) / presented) * 100) / 100
        : null,
      observed:
        correctRate === null
          ? null
          : correctRate >= 80
            ? 'easy'
            : correctRate >= 50
              ? 'medium'
              : 'hard',
      options: question.response === 'order' ? [] : options,
      topDistractor: question.response === 'order' ? null : (distractors[0] ?? null),
    };
  });
}
