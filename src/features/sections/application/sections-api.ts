import { MISSION_OVERVIEW } from '@/features/challenge/application/challenge-api';
import {
  curriculumLessonHref,
  extensionOf,
  outlineOf,
  type SectionOutline,
} from '@/features/curriculum/application/outline';
import { SCENE_TOTAL } from '@/features/presentation/application/presentation-api';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  STUDY_BLOCKS,
} from '@/features/study/application/lesson-index';
import {
  findSection,
  SECTIONS,
  type SectionDefinition,
  type SectionId,
  type SectionMode,
  type SectionModeId,
  type SectionStatus,
} from '../domain/sections';

export type { SectionId, SectionMode, SectionModeId, SectionStatus };
export { SECTION_IDS } from '../domain/sections';

export const SECTIONS_PATH = '/sections';

export const SECTION_STATUS_LABEL: Readonly<Record<SectionStatus, string>> = {
  available: 'Disponible',
  'coming-soon': 'Próximamente',
};

export interface SectionTopicDto {
  readonly label: string;
  /** Lección existente; `null` en los temas previstos. */
  readonly href: string | null;
}

export interface SectionTopicGroupDto {
  readonly title: string;
  readonly status: 'available' | 'planned';
  readonly topics: readonly SectionTopicDto[];
}

export interface SectionFactDto {
  readonly value: string;
  readonly label: string;
}

export interface SectionDto {
  readonly id: SectionId;
  readonly number: 1 | 2 | 3;
  /** «01», «02», «03»: el número se ve en la ruta y en las tarjetas. */
  readonly code: string;
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly practice: string;
  readonly status: SectionStatus;
  readonly statusLabel: string;
  readonly href: string;
  readonly prerequisites: readonly string[];
  readonly highlights: readonly string[];
  readonly topicGroups: readonly SectionTopicGroupDto[];
  readonly modes: readonly SectionMode[];
  readonly roadmapHref: string | null;
  /** Cifras reales del contenido publicado; vacías en las secciones en preparación. */
  readonly facts: readonly SectionFactDto[];
}

export function sectionHref(id: SectionId): string {
  return `${SECTIONS_PATH}/${id}`;
}

/** Temario real de la Sección 1: los bloques y lecciones del Modo Estudio. */
function studyTopicGroups(): readonly SectionTopicGroupDto[] {
  const extension = extensionOf('fundamentos-sql');
  return [
    ...STUDY_BLOCKS.map((block) => ({
      title: `${block.letter} · ${block.title}`,
      status: 'available' as const,
      topics: LESSON_INDEX.filter((lesson) => lesson.block === block.id).map((lesson) => ({
        label: lesson.shortTitle,
        href: `/learn/${lesson.slug}`,
      })),
    })),
    // Ampliación «Funciones de una fila» (fuente curricular, Fase 4): bloque I.
    ...(extension?.blocks ?? []).map((block) => ({
      title: `I · ${block.title}`,
      status: 'available' as const,
      topics: extension!.lessons
        .filter((lesson) => lesson.block === block.id)
        .map((lesson) => ({
          label: lesson.shortTitle,
          href: curriculumLessonHref('fundamentos-sql', lesson.slug),
        })),
    })),
  ];
}

/** Lecciones de la Sección 1: las del Modo Estudio más las de su ampliación. */
const S1_LESSON_COUNT = LESSON_COUNT + (extensionOf('fundamentos-sql')?.lessons.length ?? 0);
const S1_BLOCK_COUNT = STUDY_BLOCKS.length + (extensionOf('fundamentos-sql')?.blocks.length ?? 0);

/** Temario real de una sección de la fuente curricular: sus bloques y lecciones. */
function curriculumTopicGroups(outline: SectionOutline): readonly SectionTopicGroupDto[] {
  return outline.blocks.map((block) => ({
    title: `${block.number} · ${block.title}`,
    status: 'available' as const,
    topics: outline.lessons
      .filter((lesson) => lesson.block === block.id)
      .map((lesson) => ({
        label: lesson.shortTitle,
        href: curriculumLessonHref(outline.section, lesson.slug),
      })),
  }));
}

function curriculumFacts(outline: SectionOutline): readonly SectionFactDto[] {
  return [
    { value: String(outline.lessons.length), label: 'lecciones' },
    { value: String(outline.blocks.length), label: 'bloques' },
    { value: String(outline.scenes), label: 'escenas de clase' },
    { value: String(outline.missions.length), label: 'misiones' },
  ];
}

function toDto(section: SectionDefinition): SectionDto {
  const available = section.status === 'available';
  const outline = outlineOf(section.id);
  const planned = section.plannedTopics.map((group) => ({
    title: group.title,
    status: group.status,
    topics: group.topics.map((label) => ({ label, href: null })),
  }));
  return {
    id: section.id,
    number: section.number,
    code: String(section.number).padStart(2, '0'),
    kicker: `Sección ${section.number}`,
    title: section.title,
    summary: section.summary,
    objective: section.objective,
    practice: section.practice,
    status: section.status,
    statusLabel: SECTION_STATUS_LABEL[section.status],
    href: sectionHref(section.id),
    prerequisites: section.prerequisites,
    highlights: section.highlights,
    topicGroups:
      section.id === 'fundamentos-sql'
        ? [...studyTopicGroups(), ...planned]
        : outline && available
          ? [...curriculumTopicGroups(outline), ...planned]
          : planned,
    modes: section.modes,
    roadmapHref: section.roadmapHref,
    facts:
      available && outline && section.id !== 'fundamentos-sql'
        ? curriculumFacts(outline)
        : available && section.id === 'fundamentos-sql'
          ? [
              { value: String(S1_LESSON_COUNT), label: 'lecciones' },
              { value: String(S1_BLOCK_COUNT), label: 'bloques' },
              { value: String(SCENE_TOTAL), label: 'escenas de clase' },
              { value: String(MISSION_OVERVIEW.length), label: 'misiones' },
            ]
          : [],
  };
}

export const SECTION_LIST: readonly SectionDto[] = SECTIONS.map(toDto);

export function getSection(id: string): SectionDto | undefined {
  const section = findSection(id);
  return section ? toDto(section) : undefined;
}

/** Sección anterior y siguiente en la ruta, para orientar «qué sigue». */
export function sectionNeighbors(id: SectionId): {
  readonly previous: SectionDto | null;
  readonly next: SectionDto | null;
} {
  const index = SECTION_LIST.findIndex((section) => section.id === id);
  return {
    previous: index > 0 ? SECTION_LIST[index - 1]! : null,
    next: index >= 0 && index < SECTION_LIST.length - 1 ? SECTION_LIST[index + 1]! : null,
  };
}

/** Modos con destino real: solo estos se enlazan. */
export function availableModes(section: Pick<SectionDto, 'modes'>): readonly SectionMode[] {
  return section.modes.filter((mode) => mode.href !== null);
}
