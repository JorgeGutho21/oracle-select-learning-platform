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
import { SyncedStudyProgressRepository } from '../progress/progress-sync-client';
import { useStudyProgress } from '@/features/study/presentation/study-progress';
import { ProgressStorageNote } from '../accounts/progress-storage-note';

/**
 * Raíces cliente del avance por sección. Solo leen el progreso real del Modo Estudio
 * guardado en este navegador (la misma clave de siempre); nunca escriben ni inventan datos.
 */

export interface SectionSummary {
  readonly id: SectionId;
  readonly code: string;
  readonly title: string;
  readonly status: SectionStatus;
}

const FIRST_LESSON = LESSON_INDEX[0]!;

function useLocalStudy() {
  const [repository] = useState(() => new SyncedStudyProgressRepository());
  const { progress } = useStudyProgress(repository);
  return {
    done: currentCompletedCount(progress, LESSON_VERSIONS),
    last: LESSON_INDEX.find((lesson) => lesson.id === progress.lastLesson) ?? null,
  };
}

function progressItem(section: SectionSummary, done: number): SectionProgressItem {
  const studied = section.id === 'fundamentos-sql';
  return {
    id: section.id,
    code: section.code,
    title: section.title,
    status: section.status,
    done: studied ? done : null,
    total: studied ? LESSON_COUNT : null,
  };
}

export function LearningOverviewRoot({
  sections,
}: {
  readonly sections: readonly SectionSummary[];
}) {
  const { done, last } = useLocalStudy();
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
      items={sections.map((section) => progressItem(section, done))}
      next={next}
      storageNote={<ProgressStorageNote />}
    />
  );
}

export function SectionProgressRoot({ section }: { readonly section: SectionSummary }) {
  const { done } = useLocalStudy();
  return <SectionProgressMeter item={progressItem(section, done)} />;
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
