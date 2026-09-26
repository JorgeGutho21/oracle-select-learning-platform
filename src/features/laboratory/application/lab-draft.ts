import { SCENE_TOTAL } from '@/features/presentation/application/presentation-api';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';

/** Puerto del borrador local; el SQL nunca sale del navegador por guardar. */
export interface LabDraftRepository {
  load(): Promise<string | null>;
  save(sql: string): Promise<void>;
}

// Destinos de vuelta: las escenas y las lecciones que existen, nada más.
const LESSON_RETURNS = new Set(LESSON_INDEX.map((lesson) => `/learn/${lesson.slug}`));

/** Solo rutas públicas de retorno conocidas; no admite redirecciones externas. */
export function safeLabReturn(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value === '/presentation') return value;
  const scene = /^\/presentation\?scene=([1-9]\d?)$/.exec(value);
  if (scene && Number(scene[1]) <= SCENE_TOTAL) return value;
  return LESSON_RETURNS.has(value) ? value : null;
}

export function incomingLabSql(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 4000
    ? value
    : null;
}
