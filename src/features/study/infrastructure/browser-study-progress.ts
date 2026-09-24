import type {
  StoredStudyProgress,
  StudyProgressRepository,
  StudyProgressState,
} from '../application/progress';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const STUDY_STORAGE_KEY = 'sql-select-lab:study:progress';

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export class BrowserStudyProgressRepository implements StudyProgressRepository {
  constructor(private readonly resolveStorage: () => StorageLike | null = browserStorage) {}
  async load(): Promise<StoredStudyProgress> {
    const storage = this.resolveStorage();
    if (!storage) return { status: 'unavailable' };
    try {
      const raw = storage.getItem(STUDY_STORAGE_KEY);
      if (raw === null) return { status: 'empty' };
      try {
        return { status: 'found', data: JSON.parse(raw) as unknown };
      } catch {
        return { status: 'unreadable' };
      }
    } catch {
      return { status: 'unavailable' };
    }
  }
  async save(progress: StudyProgressState): Promise<boolean> {
    const storage = this.resolveStorage();
    if (!storage) return false;
    try {
      storage.setItem(STUDY_STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch {
      return false;
    }
  }
  async clear(): Promise<boolean> {
    const storage = this.resolveStorage();
    if (!storage) return false;
    try {
      storage.removeItem(STUDY_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}
