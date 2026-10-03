import { SECTION_IDS } from '@/features/sections/domain/sections';
import { PROGRESS_STATUSES, type ProgressRecord, type ProgressStatus } from '../domain/progress';

/**
 * Lectura ligera de los registros que devuelve `/api/progress`, para el navegador (sin
 * zod: el servidor ya validó con el esquema completo). Un registro con otra forma se
 * descarta. También vive aquí la zona de presencia, que se calcula en el navegador.
 */

export const MAX_UPLOAD_RECORDS = 200;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isState(value: unknown): value is ProgressRecord['state'] {
  return (
    isObject(value) &&
    Object.values(value).every((item) => ['number', 'string', 'boolean'].includes(typeof item))
  );
}

export function readProgressRecord(value: unknown): ProgressRecord | null {
  if (!isObject(value)) return null;
  const { section, mode, item, status, percent, contentVersion, state, lastActivityAt } = value;
  if (
    typeof section !== 'string' ||
    typeof mode !== 'string' ||
    typeof item !== 'string' ||
    !(PROGRESS_STATUSES as readonly unknown[]).includes(status) ||
    typeof percent !== 'number' ||
    !(contentVersion === null || typeof contentVersion === 'number') ||
    !isState(state) ||
    typeof lastActivityAt !== 'number'
  ) {
    return null;
  }
  return {
    section,
    mode,
    item,
    status: status as ProgressStatus,
    percent,
    contentVersion,
    state,
    lastActivityAt,
  };
}

/** Zona general de la plataforma para la presencia (nunca la URL completa). */
export function presenceArea(pathname: string): string {
  const [first = '', second = ''] = pathname.split('/').filter(Boolean);
  const areas: Readonly<Record<string, string>> = {
    learn: 'fundamentos-sql/study',
    presentation: 'fundamentos-sql/class',
    lab: 'fundamentos-sql/practice',
    challenge: 'fundamentos-sql/challenge',
    resources: 'fundamentos-sql/resources',
    modules: 'ruta',
    live: 'sala-en-vivo',
    join: 'sala-en-vivo',
    dashboard: 'mi-progreso',
    profile: 'perfil',
    teacher: 'panel-docente',
  };
  if (first === 'sections') {
    return (SECTION_IDS as readonly string[]).includes(second)
      ? `secciones/${second}`
      : 'secciones';
  }
  return areas[first] ?? (first ? 'otras' : 'inicio');
}
