import type { LabDraftRepository } from '../application/lab-draft';

export class BrowserLabDraftRepository implements LabDraftRepository {
  async load(): Promise<string | null> {
    return window.localStorage.getItem('sql-select-lab:draft:v1');
  }

  async save(sql: string): Promise<void> {
    window.localStorage.setItem('sql-select-lab:draft:v1', sql);
  }
}
