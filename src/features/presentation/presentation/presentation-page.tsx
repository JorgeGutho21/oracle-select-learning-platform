import { ACADEMIC_IDENTITY } from '@/application/academic-identity';
import { LESSONS } from '@/features/study/application/study-api';
import { PresentationDeck } from './presentation-deck';

export interface PresentationPageProps {
  readonly initialScene?: number;
}

export function PresentationPage({ initialScene = 1 }: PresentationPageProps) {
  return (
    <PresentationDeck
      initialScene={initialScene}
      identity={ACADEMIC_IDENTITY}
      lessonCount={LESSONS.length}
    />
  );
}
