import type {
  AssessmentPhase,
  AttemptStatus,
  FeedbackMode,
  SubmittedBy,
} from '../domain/assessment';

/**
 * Evaluaciones vistas por el estudiante (resultado de `student_assessments` y
 * `student_assessment`). La nota solo llega si el profesor la liberó.
 */

export interface StudentAttemptSummary {
  readonly id: string;
  readonly number: number;
  readonly status: AttemptStatus;
  readonly submittedBy: SubmittedBy | null;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly grade: number | null;
  readonly scorePercent: number | null;
  readonly correctCount: number | null;
  readonly questionTotal: number;
}

export interface StudentAssessment {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sectionKey: string;
  readonly questionCount: number;
  readonly durationMinutes: number;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly maxAttempts: number;
  readonly recordClipboard: boolean;
  readonly passGrade: number;
  readonly phase: AssessmentPhase;
  readonly feedbackMode: FeedbackMode;
  readonly serverNow: string;
  readonly attempts: readonly StudentAttemptSummary[];
}

/** Qué puede hacer la persona ahora con esta evaluación. */
export type StudentState = 'in_progress' | 'available' | 'upcoming' | 'completed' | 'missed';

export const STUDENT_STATE_LABEL: Readonly<Record<StudentState, string>> = {
  in_progress: 'En curso',
  available: 'Disponible',
  upcoming: 'Aún no abre',
  completed: 'Presentada',
  missed: 'No presentada',
};

export function openAttempt(assessment: StudentAssessment): StudentAttemptSummary | null {
  return assessment.attempts.find((attempt) => attempt.status === 'in_progress') ?? null;
}

export function finishedAttempts(assessment: StudentAssessment): StudentAttemptSummary[] {
  return assessment.attempts.filter((attempt) => attempt.status !== 'in_progress');
}

export function studentState(assessment: StudentAssessment): StudentState {
  if (openAttempt(assessment)) return 'in_progress';
  const used = assessment.attempts.length;
  if (assessment.phase === 'scheduled') return 'upcoming';
  if (assessment.phase === 'active' && used < assessment.maxAttempts) return 'available';
  return used > 0 ? 'completed' : 'missed';
}

/** Pendiente para el panel: lo que aún puede (o podrá) hacer. */
export function isPending(assessment: StudentAssessment): boolean {
  const state = studentState(assessment);
  return state === 'in_progress' || state === 'available' || state === 'upcoming';
}

/** Minutos que tendrá al comenzar ahora: la duración o lo que falte para el cierre. */
export function minutesAvailable(assessment: StudentAssessment, now: number): number {
  if (!assessment.closesAt) return assessment.durationMinutes;
  const untilClose = Math.floor((Date.parse(assessment.closesAt) - now) / 60_000);
  return Math.max(0, Math.min(assessment.durationMinutes, untilClose));
}

export function bestReleasedGrade(assessment: StudentAssessment): number | null {
  const grades = finishedAttempts(assessment)
    .map((attempt) => attempt.grade)
    .filter((grade): grade is number => grade !== null);
  return grades.length > 0 ? Math.max(...grades) : null;
}

export type StartOutcome =
  | 'started'
  | 'resumed'
  | 'time-over'
  | 'not-open'
  | 'closed'
  | 'no-attempts-left'
  | 'not-found'
  | 'error';

/** Mensajes de inicio que no se pudo hacer (sin detalles técnicos). */
export const START_MESSAGE: Readonly<Record<Exclude<StartOutcome, 'started' | 'resumed'>, string>> =
  {
    'time-over': 'El tiempo de tu intento terminó y se entregó automáticamente.',
    'not-open': 'La evaluación aún no abre.',
    closed: 'La evaluación está cerrada.',
    'no-attempts-left': 'Ya presentaste esta evaluación.',
    'not-found': 'Esta evaluación no está disponible para tu cuenta.',
    error: 'No pudimos comenzar la evaluación. Inténtalo de nuevo en unos segundos.',
  };
