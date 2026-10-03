/**
 * Evaluaciones calificadas (docs/ASSESSMENT_ARCHITECTURE.md). La base guarda el ciclo de
 * vida (borrador, publicada, finalizada, archivada); la fase que se muestra se deriva de las
 * fechas, igual que en `private.assessment_phase`. La nota la calcula la base (0,0 a 5,0);
 * aquí solo se presenta.
 */

export const ASSESSMENT_STATUSES = ['draft', 'published', 'closed', 'archived'] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_PHASES = [
  'draft',
  'scheduled',
  'active',
  'ending',
  'closed',
  'archived',
] as const;
export type AssessmentPhase = (typeof ASSESSMENT_PHASES)[number];

export const PHASE_LABEL: Readonly<Record<AssessmentPhase, string>> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'Activa',
  ending: 'Sin nuevos accesos',
  closed: 'Finalizada',
  archived: 'Archivada',
};

export interface PhaseInput {
  readonly status: AssessmentStatus;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly entryClosedAt: string | null;
}

export function assessmentPhase(input: PhaseInput, now: number): AssessmentPhase {
  if (input.status !== 'published') return input.status;
  if (input.opensAt && now < Date.parse(input.opensAt)) return 'scheduled';
  if (input.closesAt && now >= Date.parse(input.closesAt)) return 'closed';
  if (input.entryClosedAt) return 'ending';
  return 'active';
}

export const SELECTION_MODES = ['manual', 'random'] as const;
export type SelectionMode = (typeof SELECTION_MODES)[number];

export const FEEDBACK_MODES = ['hidden', 'score_only', 'answers', 'full_feedback'] as const;
export type FeedbackMode = (typeof FEEDBACK_MODES)[number];

export const FEEDBACK_LABEL: Readonly<Record<FeedbackMode, string>> = {
  hidden: 'Retenida: el estudiante no ve la nota',
  score_only: 'Solo la nota',
  answers: 'Nota y respuestas correctas',
  full_feedback: 'Nota, respuestas y explicación completa',
};

export const AUDIENCES = ['all', 'selected'] as const;
export type Audience = (typeof AUDIENCES)[number];

/** Límites de configuración (los mismos que comprueba la base). */
export const LIMITS = {
  questionCount: { min: 1, max: 100 },
  duration: { min: 5, max: 300 },
  attempts: { min: 1, max: 5 },
  title: { min: 3, max: 120 },
  description: 2000,
} as const;

/** Cantidades sugeridas en el formulario; se admite cualquier valor dentro de los límites. */
export const SUGGESTED_COUNTS = [10, 20, 30, 40, 50] as const;

export const ATTEMPT_STATUSES = ['in_progress', 'submitted', 'auto_submitted'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export type SubmittedBy = 'student' | 'timer' | 'teacher';

/** Estado de una persona frente a una evaluación (incluye a quien nunca comenzó). */
export type ParticipantStatus =
  'absent' | 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted';

export const PARTICIPANT_LABEL: Readonly<Record<ParticipantStatus, string>> = {
  absent: 'Ausente',
  not_started: 'Sin iniciar',
  in_progress: 'En curso',
  submitted: 'Entregada',
  auto_submitted: 'Entregada automáticamente',
};

export const SUBMITTED_BY_LABEL: Readonly<Record<SubmittedBy, string>> = {
  student: 'por la persona',
  timer: 'al terminar el tiempo',
  teacher: 'al finalizar la evaluación',
};

/** Nota de 0,0 a 5,0 con un decimal, como se escribe en la universidad: «4.2». */
export function formatGrade(grade: number | null | undefined): string {
  if (grade === null || grade === undefined || !Number.isFinite(grade)) return '—';
  return (Math.round(grade * 10) / 10).toFixed(1);
}

export const GRADE_SCALE_MAX = 5;
export const DEFAULT_PASS_GRADE = 3;

export function passes(grade: number, passGrade: number = DEFAULT_PASS_GRADE): boolean {
  return grade >= passGrade;
}

// ---------------------------------------------------------------------------
// Supervisión
// ---------------------------------------------------------------------------

/** Eventos que puede enviar el navegador (la base rechaza cualquier otro). */
export const CLIENT_EVENT_TYPES = [
  'entered',
  'reloaded',
  'focus_lost',
  'focus_returned',
  'visibility_hidden',
  'visibility_visible',
  'fullscreen_entered',
  'fullscreen_exited',
  'copy_attempt',
  'paste_attempt',
  'context_menu',
  'offline',
  'online',
  'page_exit',
] as const;
export type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];
export type EventType = ClientEventType | 'started' | 'submitted' | 'auto_submitted';

export const EVENT_LABEL: Readonly<Record<EventType, string>> = {
  started: 'Comenzó',
  entered: 'Volvió a entrar',
  reloaded: 'Recargó la página',
  focus_lost: 'Salió de la ventana',
  focus_returned: 'Volvió a la ventana',
  visibility_hidden: 'Pestaña oculta',
  visibility_visible: 'Pestaña visible',
  fullscreen_entered: 'Entró en pantalla completa',
  fullscreen_exited: 'Salió de pantalla completa',
  copy_attempt: 'Intentó copiar',
  paste_attempt: 'Intentó pegar',
  context_menu: 'Abrió el menú contextual',
  offline: 'Perdió la conexión',
  online: 'Recuperó la conexión',
  page_exit: 'Cerró o abandonó la página',
  submitted: 'Entregó',
  auto_submitted: 'Entrega automática',
};

/**
 * Eventos que se cuentan como «relevantes» en el monitor. Son hechos del navegador, no
 * pruebas de fraude: una pérdida de foco puede ser una notificación del sistema.
 */
export const RELEVANT_EVENTS: readonly EventType[] = [
  'focus_lost',
  'visibility_hidden',
  'fullscreen_exited',
  'copy_attempt',
  'paste_attempt',
  'context_menu',
  'offline',
  'page_exit',
  'reloaded',
  'entered',
];

export function relevantEventCount(counts: Readonly<Partial<Record<string, number>>>): number {
  return RELEVANT_EVENTS.reduce((total, type) => total + (counts[type] ?? 0), 0);
}

/** Ventana para considerar «conectada» a una persona durante el examen (latidos cada 30 s). */
export const EXAM_ONLINE_WINDOW_MS = 75_000;

/** Zona horaria del curso: fechas del formulario y de la interfaz. */
export const ASSESSMENT_TIME_ZONE = 'America/Bogota';
