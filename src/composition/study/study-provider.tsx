'use client';
import { useState, type ReactNode } from 'react';
import { SyncedStudyProgressRepository } from '../progress/progress-sync-client';
import { StudyProgressProvider } from '@/features/study/presentation/study-progress';
import { ProgressStorageNote } from '../accounts/progress-storage-note';

/** Une el progreso del navegador con las páginas del Modo Estudio. */
export function StudyProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(() => new SyncedStudyProgressRepository());
  return (
    <StudyProgressProvider repository={repository} storageNote={<ProgressStorageNote />}>
      {children}
    </StudyProgressProvider>
  );
}
