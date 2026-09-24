import type { LessonId } from './study-api';

export const STUDY_PROGRESS_VERSION = 1;

export interface StudyProgressState {
  readonly releaseId: string;
  readonly version: number;
  readonly completed: readonly LessonId[];
  readonly lessonVersions: Readonly<Partial<Record<LessonId, number>>>;
  readonly lastLesson: LessonId | null;
  readonly updatedAt: number;
}

export type StoredStudyProgress =
  | { readonly status: 'found'; readonly data: unknown }
  | { readonly status: 'empty' | 'unavailable' | 'unreadable' };

export interface StudyProgressRepository {
  load(): Promise<StoredStudyProgress>;
  save(progress: StudyProgressState): Promise<boolean>;
  clear(): Promise<boolean>;
}
