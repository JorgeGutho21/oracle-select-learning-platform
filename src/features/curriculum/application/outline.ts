import type { SectionId } from '@/features/sections/domain/sections';
import outline from './outline.json';

/**
 * Índice ligero de la fuente curricular: identificadores, rutas, títulos y versiones de las
 * lecciones, más los identificadores de prácticas, misiones y escenas. Lo usan el registro de
 * progreso y el buscador, que viajan al navegador, sin cargar el contenido completo. Lo
 * genera `tests/unit/curriculum/outline.test.ts` (CURRICULUM_UPDATE=1), que también exige
 * que coincida con el contenido.
 */

export interface OutlineBlock {
  readonly id: string;
  readonly number: number;
  readonly title: string;
}

export interface OutlineLesson {
  readonly id: string;
  readonly block: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly version: number;
}

/** Guion de clase vigente: cambia cuando se reestructuran las escenas. */
export const CURRENT_SCENE_RELEASE = 'pedagogy-20261017';

export interface SectionOutline {
  readonly scenePositions: Readonly<Record<string, number>>;
  /** Posiciones del primer guion (antes de los releases con identidad de escena). */
  readonly legacyScenePositions: readonly number[];
  /** Posiciones del guion pedagogy-20261004 en el guion vigente. */
  readonly releaseScenePositions: readonly number[];
  /** Escenas retiradas del guion anterior → escena equivalente del vigente. */
  readonly retiredScenePositions: Readonly<Record<string, number>>;
  readonly classLessonScenes: Readonly<Record<string, number>>;
  readonly section: SectionId;
  readonly blocks: readonly OutlineBlock[];
  readonly lessons: readonly OutlineLesson[];
  readonly practice: readonly string[];
  readonly missions: readonly { readonly id: string; readonly title: string }[];
  readonly scenes: number;
}

/** Ampliación de una sección con modos propios: solo bloques y lecciones. */
export interface ExtensionOutline {
  readonly section: SectionId;
  readonly blocks: readonly OutlineBlock[];
  readonly lessons: readonly OutlineLesson[];
}

const data = outline as {
  readonly sections: readonly SectionOutline[];
  readonly extensions: readonly ExtensionOutline[];
};

export const CURRICULUM_OUTLINE: readonly SectionOutline[] = data.sections;

/** Lecciones de la fuente curricular que amplían una sección con modos propios. */
export const EXTENSION_OUTLINE: readonly ExtensionOutline[] = data.extensions;

export function extensionOf(section: string): ExtensionOutline | undefined {
  return EXTENSION_OUTLINE.find((entry) => entry.section === section);
}

export function outlineOf(section: string): SectionOutline | undefined {
  return CURRICULUM_OUTLINE.find((entry) => entry.section === section);
}

/** Resuelve por identidad estable; la posición numérica del release anterior se migra sin borrar progreso. */
export function curriculumScenePosition(
  section: string,
  state: Readonly<Record<string, number | string | boolean>>,
): number | null {
  const outline = outlineOf(section);
  if (!outline) return null;
  if (typeof state.sceneId === 'string')
    return (
      outline.scenePositions[state.sceneId] ?? outline.retiredScenePositions[state.sceneId] ?? null
    );
  const scene = state.scene;
  if (typeof scene !== 'number' || !Number.isInteger(scene) || scene < 1) return null;
  if (state.sceneRelease === CURRENT_SCENE_RELEASE) return scene <= outline.scenes ? scene : null;
  if (state.sceneRelease === 'pedagogy-20261004')
    return outline.releaseScenePositions[scene - 1] ?? null;
  return outline.legacyScenePositions[scene - 1] ?? null;
}

export function curriculumLessonHref(section: SectionId, slug: string): string {
  return `/sections/${section}/study/${slug}`;
}
