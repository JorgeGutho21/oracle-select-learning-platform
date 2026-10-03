'use client';
import { useState } from 'react';
import { SyncedStudyProgressRepository } from '../progress/progress-sync-client';
import { StudyProgress, useStudyProgress } from '@/features/study/presentation/study-progress';
import { Alert } from '@/presentation/components/ui';
import { ProgressStorageNote } from '../accounts/progress-storage-note';
export function StudyProgressRoot({ compact = true }: { compact?: boolean }) {
  const [repository] = useState(() => new SyncedStudyProgressRepository());
  const { progress, warning } = useStudyProgress(repository);
  return (
    <>
      {warning && (
        <Alert tone="warning" title="Progreso solo en memoria">
          {warning}
        </Alert>
      )}
      <StudyProgress progress={progress} compact={compact} storageNote={<ProgressStorageNote />} />
    </>
  );
}
