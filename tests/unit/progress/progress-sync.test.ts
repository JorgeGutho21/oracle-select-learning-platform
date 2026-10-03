import { describe, expect, it } from 'vitest';
import {
  ProgressSync,
  type CloudProgressGateway,
  type CloudResult,
  type LocalProgressSource,
  type Scheduler,
} from '@/features/progress/application/progress-sync';
import {
  challengeRecords,
  classRecord,
  newerScene,
  studyRecords,
  studyStateWithRecords,
} from '@/features/progress/application/local-mapping';
import { mergeRecords, type ProgressRecord } from '@/features/progress/domain/progress';
import { emptyStudyProgress } from '@/features/study/application/progress';
import { STUDY_RELEASE_ID } from '@/features/study/application/lesson-index';

function lesson(item: string, at = 1): ProgressRecord {
  return {
    section: 'fundamentos-sql',
    mode: 'study',
    item,
    status: 'completed',
    percent: 100,
    contentVersion: 1,
    state: {},
    lastActivityAt: at,
  };
}

class FakeLocal implements LocalProgressSource {
  constructor(public records: ProgressRecord[] = []) {}
  async snapshot() {
    return this.records;
  }
  async absorb(records: readonly ProgressRecord[]) {
    this.records = [...mergeRecords(this.records, records)];
  }
  async clear() {
    this.records = [];
  }
}

class FakeCloud implements CloudProgressGateway {
  online = true;
  pushes: ProgressRecord[][] = [];
  resets: string[] = [];
  constructor(public records: ProgressRecord[] = []) {}
  async pull(): Promise<CloudResult> {
    return this.online ? { ok: true, records: this.records } : { ok: false, reason: 'offline' };
  }
  async push(records: readonly ProgressRecord[]): Promise<CloudResult> {
    if (!this.online) return { ok: false, reason: 'offline' };
    this.pushes.push([...records]);
    this.records = [...mergeRecords(this.records, records)];
    return { ok: true, records };
  }
  async reset(section: string, mode: string) {
    if (!this.online) return false;
    this.resets.push(`${section}/${mode}`);
    this.records = this.records.filter((record) => record.mode !== mode);
    return true;
  }
}

class ManualScheduler implements Scheduler {
  tasks = new Map<number, () => void>();
  private next = 0;
  set(callback: () => void) {
    this.next += 1;
    this.tasks.set(this.next, callback);
    return this.next;
  }
  clear(handle: unknown) {
    this.tasks.delete(handle as number);
  }
  async runAll() {
    const tasks = [...this.tasks.values()];
    this.tasks.clear();
    for (const task of tasks) task();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function owner(initial: string | null = null) {
  let value = initial;
  return { read: () => value, write: (id: string) => (value = id), clear: () => (value = null) };
}

function setup(local: ProgressRecord[], cloud: ProgressRecord[], ownerId: string | null = null) {
  const scheduler = new ManualScheduler();
  const fakes = { local: new FakeLocal(local), cloud: new FakeCloud(cloud), owner: owner(ownerId) };
  const sync = new ProgressSync({ ...fakes, scheduler, debounceMs: 10, retryDelaysMs: [10] });
  return { sync, scheduler, ...fakes };
}

describe('Sincronización del progreso', () => {
  it('primer inicio de sesión: el avance de invitado se suma a la nube sin perder nada', async () => {
    const { sync, local, cloud, owner: store } = setup([lesson('L05', 5)], [lesson('L04', 4)]);
    await sync.start('usuario-a');
    expect(cloud.records.map(({ item }) => item).sort()).toEqual(['L04', 'L05']);
    expect(local.records.map(({ item }) => item).sort()).toEqual(['L04', 'L05']);
    expect(store.read()).toBe('usuario-a');
    expect(sync.snapshot.status).toBe('synced');
    // Idempotente: repetir no vuelve a subir nada.
    await sync.flush();
    expect(cloud.pushes).toHaveLength(1);
  });

  it('el progreso local de otra cuenta no se mezcla con esta', async () => {
    const { sync, local, cloud } = setup([lesson('L09')], [lesson('L01')], 'usuario-b');
    await sync.start('usuario-a');
    expect(cloud.records.map(({ item }) => item)).toEqual(['L01']);
    expect(local.records.map(({ item }) => item)).toEqual(['L01']);
  });

  it('sin conexión queda en local, avisa y reintenta', async () => {
    const { sync, cloud, scheduler, local } = setup([lesson('L02')], []);
    cloud.online = false;
    await sync.start('usuario-a');
    expect(sync.snapshot.status).toBe('offline');
    expect(sync.snapshot.records.map(({ item }) => item)).toEqual(['L02']);
    cloud.online = true;
    await scheduler.runAll();
    await sync.flush();
    expect(cloud.records.map(({ item }) => item)).toEqual(['L02']);
    expect(sync.snapshot.status).toBe('synced');
    expect(local.records).toHaveLength(1);
  });

  it('un cambio local se sube tras la espera, solo lo pendiente', async () => {
    const { sync, cloud, scheduler, local } = setup([], []);
    await sync.start('usuario-a');
    local.records.push(lesson('L07', 7));
    sync.notifyLocalChange();
    sync.notifyLocalChange();
    expect(cloud.pushes).toHaveLength(0);
    await scheduler.runAll();
    await sync.flush();
    expect(cloud.pushes).toEqual([[lesson('L07', 7)]]);
  });

  it('reiniciar el Modo Estudio también lo borra de la nube', async () => {
    const { sync, cloud, local } = setup([], [lesson('L01')]);
    await sync.start('usuario-a');
    // El repositorio del Modo Estudio borra primero lo local y luego pide el reinicio.
    await local.clear();
    await sync.reset('fundamentos-sql', 'study');
    expect(cloud.resets).toEqual(['fundamentos-sql/study']);
    expect(cloud.records).toEqual([]);
  });

  it('cerrar sesión limpia el dispositivo solo si la nube quedó al día', async () => {
    const first = setup([lesson('L01')], []);
    await first.sync.start('usuario-a');
    expect(await first.sync.signOut()).toBe(true);
    expect(first.local.records).toEqual([]);
    expect(first.owner.read()).toBeNull();

    const offline = setup([], []);
    await offline.sync.start('usuario-a');
    offline.local.records.push(lesson('L02'));
    offline.cloud.online = false;
    expect(await offline.sync.signOut()).toBe(false);
    expect(offline.local.records).toHaveLength(1);
    expect(offline.owner.read()).toBe('usuario-a');
  });

  it('un invitado no espera ni sincroniza', async () => {
    const { sync, cloud } = setup([lesson('L01')], []);
    await sync.ready(1000);
    sync.notifyLocalChange();
    expect(await sync.flush()).toBe(true);
    expect(cloud.pushes).toEqual([]);
  });
});

describe('Progreso local de siempre ↔ registros', () => {
  it('Modo Estudio: completadas y última lección', () => {
    const state = {
      ...emptyStudyProgress(STUDY_RELEASE_ID, 50),
      completed: ['L01' as const],
      lessonVersions: { L01: 1 },
      lastLesson: 'L02' as const,
    };
    const records = studyRecords(state);
    expect(records).toEqual([
      { ...lesson('L01', 0) },
      { ...lesson('L02', 50), status: 'in_progress', percent: 0, contentVersion: null },
    ]);
    const merged = studyStateWithRecords(state, [lesson('L05', 99), lesson('L01', 1)]);
    expect([...merged.completed].sort()).toEqual(['L01', 'L05']);
    expect(merged.lastLesson).toBe('L05');
    expect(studyStateWithRecords(merged, [lesson('L05', 99)])).toEqual(merged);
  });

  it('Challenge: misiones cerradas y en curso, con tolerancia a datos dañados', () => {
    const records = challengeRecords({
      mode: 'practice',
      missions: {
        M01: { status: 'solved', closedAt: 30, openedAt: 10, attempts: [{ submittedAt: 20 }] },
        M02: { status: 'in-progress', openedAt: 40, attempts: [] },
        M03: { status: 'not-started' },
        M99: { status: 'solved' },
      },
    });
    expect(
      records.map(({ item, status, lastActivityAt }) => [item, status, lastActivityAt]),
    ).toEqual([
      ['M01', 'completed', 30],
      ['M02', 'in_progress', 40],
    ]);
    expect(challengeRecords('dañado')).toEqual([]);
  });

  it('Exposición: posición de la escena', () => {
    expect(classRecord(15, 30, 5)[0]).toMatchObject({ percent: 50, state: { scene: 15 } });
    expect(classRecord(30, 30, 5)[0]?.status).toBe('completed');
    expect(classRecord(99, 30, 5)).toEqual([]);
    expect(newerScene(classRecord(12, 30, 9), 5)).toBe(12);
    expect(newerScene(classRecord(12, 30, 9), 10)).toBeNull();
  });
});
