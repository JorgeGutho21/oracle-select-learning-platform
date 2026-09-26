/**
 * Guion del Modo Exposición (CONTENT_MAP, «Exposición»): veintinueve escenas para proyector,
 * una idea por escena. El número es el identificador público de `?scene=N`; `id` es estable
 * aunque cambie el orden. `lessons` enlaza cada escena con las lecciones del Modo Estudio que
 * desarrollan el mismo tema en profundidad (solo temas del nivel actual).
 */

export interface SceneOutline {
  readonly number: number;
  readonly id: string;
  readonly title: string;
  /** Rutas de las lecciones del Modo Estudio que amplían la escena. */
  readonly lessons: readonly string[];
}

const OUTLINE: readonly Omit<SceneOutline, 'number'>[] = [
  { id: 'portada', title: 'Portada', lessons: [] },
  { id: 'ruta', title: 'Ruta de aprendizaje', lessons: [] },
  { id: 'que-es-sql', title: 'Qué es SQL', lessons: ['introduccion'] },
  { id: 'empleados', title: 'Conoce EMPLEADOS', lessons: ['empleados'] },
  { id: 'select-from', title: 'SELECT y FROM', lessons: ['select', 'from'] },
  { id: 'asterisco', title: 'SELECT *', lessons: ['asterisco'] },
  { id: 'columnas', title: 'Columnas específicas', lessons: ['columnas'] },
  {
    id: 'expresiones',
    title: 'Expresiones y precedencia',
    lessons: ['expresiones', 'precedencia'],
  },
  { id: 'alias', title: 'Alias con AS', lessons: ['alias', 'concatenacion'] },
  { id: 'distinct', title: 'DISTINCT', lessons: ['distinct'] },
  { id: 'where', title: 'WHERE', lessons: ['where'] },
  { id: 'comparaciones', title: 'Comparaciones', lessons: ['comparaciones'] },
  { id: 'and-or', title: 'AND y OR', lessons: ['and-or'] },
  { id: 'parentesis', title: 'Paréntesis y precedencia lógica', lessons: ['parentesis'] },
  { id: 'between', title: 'BETWEEN', lessons: ['between'] },
  { id: 'in', title: 'IN', lessons: ['in'] },
  { id: 'like', title: 'LIKE', lessons: ['like'] },
  { id: 'null', title: 'NULL e IS NULL', lessons: ['null'] },
  { id: 'order-by', title: 'ORDER BY', lessons: ['order-by'] },
  { id: 'anatomia', title: 'Anatomía de una consulta', lessons: ['consulta-completa'] },
  { id: 'paso-a-paso', title: 'Construimos una consulta', lessons: ['consulta-completa'] },
  { id: 'errores', title: 'Errores frecuentes', lessons: ['errores-frecuentes'] },
  { id: 'laboratorio', title: 'Laboratorio', lessons: [] },
  { id: 'challenge', title: 'SQL Challenge', lessons: [] },
  { id: 'aprendimos', title: 'Qué aprendimos', lessons: [] },
  { id: 'video', title: 'Video resumen', lessons: [] },
  { id: 'reto', title: 'Reto en vivo', lessons: [] },
  { id: 'proximos', title: 'Próximos temas', lessons: [] },
  { id: 'cierre', title: 'Cierre', lessons: [] },
];

export const SCENES: readonly SceneOutline[] = OUTLINE.map((scene, index) => ({
  ...scene,
  number: index + 1,
}));

export const SCENE_TOTAL = SCENES.length;

export function sceneNumber(id: string): number {
  const scene = SCENES.find((entry) => entry.id === id);
  if (!scene) throw new Error(`Escena desconocida: ${id}`);
  return scene.number;
}

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
