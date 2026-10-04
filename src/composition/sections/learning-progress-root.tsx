'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { SectionId, SectionStatus } from '@/features/sections/application/sections-api';
import {
  LearningOverview,
  SectionProgressMeter,
  type ContinueItem,
  type SectionProgressItem,
} from '@/features/sections/presentation/learning-overview';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  LESSON_VERSIONS,
} from '@/features/study/application/lesson-index';
import { currentCompletedCount } from '@/features/study/application/progress';
import { CURRICULUM_OUTLINE, extensionOf } from '@/features/curriculum/application/outline';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import { useCurriculumRecords } from '../curriculum/curriculum-client';
import { SyncedStudyProgressRepository } from '../progress/progress-sync-client';
import { useStudyProgress } from '@/features/study/presentation/study-progress';
import { ProgressStorageNote } from '../accounts/progress-storage-note';

/**
 * Raíces cliente del avance por sección. Solo leen el progreso real guardado en este
 * navegador (el Modo Estudio de la Sección 1 y el de la fuente curricular); nunca escriben
 * ni inventan datos. Los totales coinciden con el catálogo de progreso.
 */

export interface SectionSummary {
  readonly id: SectionId;
  readonly code: string;
  readonly title: string;
  readonly status: SectionStatus;
}

const FIRST_LESSON = LESSON_INDEX[0]!;

interface VersionedLesson {
  readonly id: string;
  readonly version: number;
}

/** Lecciones de la fuente curricular por sección: la ampliación de la S1 y las S2 y S3. */
const CURRICULUM_LESSONS: ReadonlyMap<SectionId, readonly VersionedLesson[]> = new Map([
  ['fundamentos-sql', extensionOf('fundamentos-sql')?.lessons ?? []],
  ...CURRICULUM_OUTLINE.map((outline) => [outline.section, outline.lessons] as const),
]);

function completedLessons(
  records: readonly ProgressRecord[],
  section: SectionId,
  lessons: readonly VersionedLesson[],
): number {
  return lessons.filter((lesson) =>
    records.some(
      (record) =>
        record.section === section &&
        record.mode === 'study' &&
        record.item === lesson.id &&
        record.status === 'completed' &&
        record.contentVersion === lesson.version,
    ),
  ).length;
}

function useLocalStudy() {
  const [repository] = useState(() => new SyncedStudyProgressRepository());
  const { progress } = useStudyProgress(repository);
  return {
    done: currentCompletedCount(progress, LESSON_VERSIONS),
    last: LESSON_INDEX.find((lesson) => lesson.id === progress.lastLesson) ?? null,
  };
}

function progressItem(
  section: SectionSummary,
  studyDone: number,
  records: readonly ProgressRecord[],
): SectionProgressItem {
  const lessons = CURRICULUM_LESSONS.get(section.id);
  const base = { id: section.id, code: section.code, title: section.title, status: section.status };
  if (!lessons) return { ...base, done: null, total: null };
  const done = completedLessons(records, section.id, lessons);
  return section.id === 'fundamentos-sql'
    ? { ...base, done: studyDone + done, total: LESSON_COUNT + lessons.length }
    : { ...base, done, total: lessons.length };
}

export function LearningOverviewRoot({
  sections,
}: {
  readonly sections: readonly SectionSummary[];
}) {
  const { done, last } = useLocalStudy();
  const records = useCurriculumRecords();
  const next: ContinueItem = last
    ? {
        label: `Continuar en ${last.shortTitle}`,
        href: `/learn/${last.slug}`,
        detail: `Última lección abierta en Fundamentos SQL: ${last.title}.`,
      }
    : {
        label: `Empezar por «${FIRST_LESSON.shortTitle}»`,
        href: `/learn/${FIRST_LESSON.slug}`,
        detail: 'Todavía no has abierto ninguna lección de Fundamentos SQL en este navegador.',
      };
  return (
    <LearningOverview
      items={sections.map((section) => progressItem(section, done, records))}
      next={next}
      storageNote={<ProgressStorageNote />}
    />
  );
}

export function SectionProgressRoot({ section }: { readonly section: SectionSummary }) {
  const { done } = useLocalStudy();
  const records = useCurriculumRecords();
  return <SectionProgressMeter item={progressItem(section, done, records)} />;
}

/** Lleva a la última lección abierta o, sin progreso, al temario. El texto no cambia. */
export function ContinueLearningLink({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const { last } = useLocalStudy();
  return (
    <Link href={(last ? `/learn/${last.slug}` : '/learn') as Route} className={className}>
      {children}
    </Link>
  );
}
