/**
 * Guion del Modo Exposición: dieciséis escenas para proyector (CONTENT_MAP, «Exposición»).
 * El número de escena es el identificador público que se usa en `?scene=N`.
 */

export interface SceneOutline {
  readonly number: number;
  readonly title: string;
}

export const SCENES: readonly SceneOutline[] = [
  { number: 1, title: 'Portada' },
  { number: 2, title: 'Qué aprenderemos' },
  { number: 3, title: 'Qué es SQL' },
  { number: 4, title: 'La tabla EMPLEADOS' },
  { number: 5, title: 'SELECT y FROM' },
  { number: 6, title: 'SELECT *' },
  { number: 7, title: 'Columnas específicas' },
  { number: 8, title: 'Expresiones' },
  { number: 9, title: 'Alias con AS' },
  { number: 10, title: 'DISTINCT' },
  { number: 11, title: 'Anatomía de una consulta' },
  { number: 12, title: 'Laboratorio' },
  { number: 13, title: 'SQL Challenge' },
  { number: 14, title: 'Resumen' },
  { number: 15, title: 'Reto y QR' },
  { number: 16, title: 'Cierre' },
];

export const SCENE_TOTAL = SCENES.length;

export function isSceneNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= SCENE_TOTAL;
}

/** Convierte el parámetro de la URL en una escena válida, o `null` si no la indica. */
export function parseSceneParam(value: string | readonly string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return isSceneNumber(parsed) ? parsed : null;
}

export function clampScene(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(SCENE_TOTAL, Math.max(1, Math.round(value)));
}
