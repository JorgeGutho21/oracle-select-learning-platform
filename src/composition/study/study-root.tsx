'use client';
import { useState } from 'react';
import type { StudyLesson } from '@/features/study/application/study-api';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import { StudyPage } from '@/features/study/presentation/learn-page';
export function StudyRoot({ lesson }: { lesson?: StudyLesson }) {
  const [repository] = useState(() => new BrowserStudyProgressRepository());
  return lesson ? (
    <StudyPage repository={repository} lesson={lesson} />
  ) : (
    <StudyPage repository={repository} />
  );
}
