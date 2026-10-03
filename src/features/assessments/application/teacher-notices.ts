import { ASSESSMENT_PROBLEM_MESSAGE } from './assessment-forms-messages';
import { START_MESSAGE, type StartOutcome } from './student-assessments';

/** Estado de los formularios del profesor (useActionState). */
export interface TeacherFormState {
  readonly status: 'idle' | 'error';
  readonly message: string;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export const INITIAL_TEACHER_FORM: TeacherFormState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
};

export type NoticeTone = 'success' | 'info' | 'warning' | 'danger';

export interface Notice {
  readonly tone: NoticeTone;
  readonly text: string;
}

const TEACHER_NOTICES: Readonly<Record<string, Notice>> = {
  guardada: { tone: 'success', text: 'Cambios guardados.' },
  publicada: {
    tone: 'success',
    text: 'Evaluación publicada. Las preguntas quedaron congeladas para todos los intentos.',
  },
  'accesos-cerrados': {
    tone: 'info',
    text: 'Nuevos accesos cerrados. Quienes ya comenzaron siguen hasta terminar su tiempo.',
  },
  finalizada: {
    tone: 'info',
    text: 'Evaluación finalizada. Los intentos abiertos se entregaron y calificaron.',
  },
  archivada: { tone: 'info', text: 'Evaluación archivada.' },
  retroalimentacion: {
    tone: 'success',
    text: 'Retroalimentación actualizada para los estudiantes.',
  },
  duplicada: { tone: 'success', text: 'Copia creada como borrador. Revísala antes de publicar.' },
  eliminada: { tone: 'info', text: 'Borrador eliminado.' },
  'sin-cambios': { tone: 'info', text: 'No había cambios que guardar.' },
  estado: { tone: 'success', text: 'Estado de la pregunta actualizado.' },
  copia: { tone: 'success', text: 'Copia creada como borrador propio. Ya puedes editarla.' },
  'no-aplica': { tone: 'warning', text: 'Esa acción no se puede aplicar en el estado actual.' },
  'sin-permiso': {
    tone: 'danger',
    text: 'Tu sesión de profesor terminó. Vuelve a iniciar sesión.',
  },
  error: { tone: 'danger', text: 'No pudimos completar la acción. Inténtalo de nuevo.' },
};

export function teacherNotice(
  code: string | undefined,
  extra: { readonly reason?: string; readonly counts?: readonly [number, number, number] } = {},
): Notice | null {
  if (!code) return null;
  if (code === 'no-publicada') {
    return {
      tone: 'warning',
      text: `No se publicó. ${ASSESSMENT_PROBLEM_MESSAGE[extra.reason ?? 'data'] ?? ASSESSMENT_PROBLEM_MESSAGE.data}`,
    };
  }
  if (code === 'sincronizado' && extra.counts) {
    const [created, updated, unchanged] = extra.counts;
    return {
      tone: 'success',
      text: `Banco oficial sincronizado: ${created} nuevas, ${updated} actualizadas y ${unchanged} sin cambios.`,
    };
  }
  return TEACHER_NOTICES[code] ?? null;
}

export function studentNotice(code: string | undefined): Notice | null {
  if (!code) return null;
  if (code === 'entregada') {
    return { tone: 'success', text: 'Evaluación entregada. Tus respuestas quedaron guardadas.' };
  }
  if (code === 'cerrada') {
    return {
      tone: 'info',
      text: 'La evaluación se cerró. Tus respuestas guardadas se entregaron y calificaron.',
    };
  }
  if (code === 'tiempo') {
    return { tone: 'info', text: 'El tiempo terminó y la evaluación se entregó automáticamente.' };
  }
  if (code in START_MESSAGE) {
    return {
      tone: 'warning',
      text: START_MESSAGE[code as Exclude<StartOutcome, 'started' | 'resumed'>],
    };
  }
  return null;
}
