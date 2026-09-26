'use client';
import { useState, type ReactNode } from 'react';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import { StudyProgressProvider } from '@/features/study/presentation/study-progress';

/** Une el progreso del navegador con las páginas del Modo Estudio. */
export function StudyProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(() => new BrowserStudyProgressRepository());
  return <StudyProgressProvider repository={repository}>{children}</StudyProgressProvider>;
}
