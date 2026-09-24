'use client';

import { useState } from 'react';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import { StudyProgressSummary, useStudyProgress } from '@/features/study/presentation/learn-page';

/** Progreso local de la unidad actual, para su tarjeta en el catálogo de módulos. */
export function ModuleProgressRoot() {
  const [repository] = useState(() => new BrowserStudyProgressRepository());
  const { progress } = useStudyProgress(repository);
  return <StudyProgressSummary progress={progress} />;
}
