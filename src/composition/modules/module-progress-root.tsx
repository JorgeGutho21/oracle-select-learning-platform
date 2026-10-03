'use client';

import { useState } from 'react';
import { SyncedStudyProgressRepository } from '../progress/progress-sync-client';
import {
  StudyProgressSummary,
  useStudyProgress,
} from '@/features/study/presentation/study-progress';

/** Progreso local de la unidad actual, para su tarjeta en el catálogo de módulos. */
export function ModuleProgressRoot() {
  const [repository] = useState(() => new SyncedStudyProgressRepository());
  const { progress } = useStudyProgress(repository);
  return <StudyProgressSummary progress={progress} />;
}
