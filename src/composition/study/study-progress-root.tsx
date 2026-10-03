'use client';
import { useState } from 'react';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import { StudyProgress, useStudyProgress } from '@/features/study/presentation/study-progress';
import { Alert } from '@/presentation/components/ui';
export function StudyProgressRoot({ compact = true }: { compact?: boolean }) {
  const [repository] = useState(() => new BrowserStudyProgressRepository());
  const { progress, warning } = useStudyProgress(repository);
  return (
    <>
      {warning && (
        <Alert tone="warning" title="Progreso solo en memoria">
          {warning}
        </Alert>
      )}
      <StudyProgress progress={progress} compact={compact} />
    </>
  );
}
