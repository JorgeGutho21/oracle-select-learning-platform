import { MISSION_IDS } from '@/features/challenge/domain/types';
import {
  CURRICULUM_OUTLINE,
  curriculumLessonHref,
  extensionOf,
  type SectionOutline,
} from '@/features/curriculum/application/outline';
import { SCENE_TOTAL } from '@/features/presentation/domain/scenes';
import { SECTIONS, type SectionId, type SectionModeId } from '@/features/sections/domain/sections';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { CLASS_ITEM, type ProgressKey } from '../domain/progress';

/**
 * Registro canónico de lo que se puede completar en cada sección y modo. Sale del contenido
 * publicado (temario, misiones, escenas): ningún total está escrito a mano. Una sección
 * «Próximamente» no tiene elementos y su avance se muestra como no disponible; cuando
 * publique contenido, basta con añadir sus modos aquí.
 */

export type TrackingKind =
  /** Cada elemento se completa por separado (lecciones, misiones). */
  | 'items'
  /** Un solo elemento con una posición (la escena de la exposición). */
  | 'position';

export interface CatalogItem {
  readonly key: string;
  readonly label: string;
  readonly href: string | null;
  /** Versión vigente del contenido; un elemento completado con otra no cuenta. */
  readonly version: number | null;
}

export interface ModeCatalog {
  readonly section: SectionId;
  readonly mode: SectionModeId;
  readonly kind: TrackingKind;
  /** Unidad en plural para los textos («lecciones», «misiones», «escenas»). */
  readonly unit: string;
  readonly items: readonly CatalogItem[];
  /** Elementos a completar, o escenas en el modo de posición. */
  readonly total: number;
}

export { CLASS_ITEM };

export const PROGRESS_CATALOG: readonly ModeCatalog[] = [
  {
    section: 'fundamentos-sql',
    mode: 'study',
    kind: 'items',
    unit: 'lecciones',
    items: [
      ...LESSON_INDEX.map((lesson) => ({
        key: lesson.id,
        label: lesson.shortTitle,
        href: `/learn/${lesson.slug}`,
        version: lesson.version,
      })),
      // Ampliación «Funciones de una fila» (fuente curricular, verificada en Oracle).
      ...(extensionOf('fundamentos-sql')?.lessons ?? []).map((lesson) => ({
        key: lesson.id,
        label: lesson.shortTitle,
        href: curriculumLessonHref('fundamentos-sql', lesson.slug),
        version: lesson.version,
      })),
    ],
    total: LESSON_INDEX.length + (extensionOf('fundamentos-sql')?.lessons.length ?? 0),
  },
  {
    section: 'fundamentos-sql',
    mode: 'challenge',
    kind: 'items',
    unit: 'misiones',
    items: MISSION_IDS.map((id) => ({
      key: id,
      label: `Misión ${Number(id.slice(1))}`,
      href: '/challenge',
      version: null,
    })),
    total: MISSION_IDS.length,
  },
  {
    section: 'fundamentos-sql',
    mode: 'class',
    kind: 'position',
    unit: 'escenas',
    items: [{ key: CLASS_ITEM, label: 'Exposición', href: '/presentation', version: null }],
    total: SCENE_TOTAL,
  },
  ...CURRICULUM_OUTLINE.flatMap(curriculumCatalogs),
];

/**
 * Secciones descritas en la fuente curricular (features/curriculum): lecciones, prácticas,
 * misiones y escenas salen de su contenido publicado, igual que en la Sección 1.
 */
function curriculumCatalogs(outline: SectionOutline): ModeCatalog[] {
  const { section, lessons, practice, missions, scenes } = outline;
  const base = `/sections/${section}`;
  return [
    {
      section,
      mode: 'study',
      kind: 'items',
      unit: 'lecciones',
      items: lessons.map((lesson) => ({
        key: lesson.id,
        label: lesson.shortTitle,
        href: curriculumLessonHref(section, lesson.slug),
        version: lesson.version,
      })),
      total: lessons.length,
    },
    {
      section,
      mode: 'practice',
      kind: 'items',
      unit: 'prácticas',
      items: practice.map((id, index) => ({
        key: id,
        label: `Práctica ${index + 1}`,
        href: `${base}/practice`,
        version: null,
      })),
      total: practice.length,
    },
    {
      section,
      mode: 'challenge',
      kind: 'items',
      unit: 'misiones',
      items: missions.map((mission, index) => ({
        key: mission.id,
        label: `Misión ${index + 1}`,
        href: `${base}/challenge`,
        version: null,
      })),
      total: missions.length,
    },
    {
      section,
      mode: 'class',
      kind: 'position',
      unit: 'escenas',
      items: [{ key: CLASS_ITEM, label: 'Clase', href: `${base}/class`, version: null }],
      total: scenes,
    },
  ];
}

/** Modo que mide el avance de una sección: el temario del Modo Estudio. */
export const PRIMARY_MODE: SectionModeId = 'study';

export function modeCatalog(section: string, mode: string): ModeCatalog | undefined {
  return PROGRESS_CATALOG.find((entry) => entry.section === section && entry.mode === mode);
}

export function catalogItem(key: ProgressKey): CatalogItem | undefined {
  return modeCatalog(key.section, key.mode)?.items.find((item) => item.key === key.item);
}

/** Solo se aceptan elementos del registro: nada inventado ni de secciones sin contenido. */
export function isTrackedKey(key: ProgressKey): boolean {
  return catalogItem(key) !== undefined;
}

export function sectionCatalogs(section: SectionId): readonly ModeCatalog[] {
  return PROGRESS_CATALOG.filter((entry) => entry.section === section);
}

export function sectionIsTracked(section: SectionId): boolean {
  return sectionCatalogs(section).some((entry) => entry.mode === PRIMARY_MODE);
}

export const TRACKED_SECTIONS: readonly SectionId[] = SECTIONS.map(({ id }) => id).filter(
  sectionIsTracked,
);
