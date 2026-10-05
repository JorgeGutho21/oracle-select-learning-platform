import { describe, expect, it, vi } from 'vitest';
import {
  AnswerQueue,
  type DraftSnapshot,
  type ExamDraftStore,
  type ExamGateway,
} from '@/features/assessments/application/answer-queue';
import {
  parseAssessmentForm,
  parseQuestionForm,
} from '@/features/assessments/application/assessment-forms';
import { summaryRows, toCsv, exportFileName } from '@/features/assessments/application/csv-export';
import { EventBuffer } from '@/features/assessments/application/event-buffer';
import {
  readAttemptView,
  type AnswerEntry,
  type ExamItem,
  type SaveOutcome,
} from '@/features/assessments/application/exam-wire';
import {
  clockTone,
  formatClock,
  remainingMs,
  thresholdAnnouncement,
  timeAnnouncement,
} from '@/features/assessments/application/exam-timer';
import {
  isoToLocal,
  localToIso,
  parseExhibitTable,
} from '@/features/assessments/application/form-values';
import {
  eligibleStudents,
  gradeStats,
  participantRows,
  questionStats,
  resultsSummary,
  type AttemptRow,
  type FrozenQuestion,
  type RosterStudent,
} from '@/features/assessments/application/results';
import {
  studentState,
  minutesAvailable,
  type StudentAssessment,
} from '@/features/assessments/application/student-assessments';
import { assessmentPhase, formatGrade } from '@/features/assessments/domain/assessment';
import { defaultWeight } from '@/features/assessments/domain/question';

// ---------------------------------------------------------------------------
// Autoguardado
// ---------------------------------------------------------------------------

function item(position: number, revision = 0, answer: ExamItem['answer'] = null): ExamItem {
  return {
    position,
    type: 'single_choice',
    response: 'single',
    prompt: `P${position}`,
    code: null,
    exhibit: null,
    options: [
      { id: 'a', body: 'A', kind: 'text', result: null },
      { id: 'b', body: 'B', kind: 'text', result: null },
    ],
    answer,
    flagged: false,
    revision,
  };
}

function memoryStore(
  initial: DraftSnapshot | null = null,
): ExamDraftStore & { value: DraftSnapshot | null } {
  return {
    value: initial,
    load() {
      return this.value;
    },
    save(_id, snapshot) {
      this.value = snapshot;
    },
    clear() {
      this.value = null;
    },
  };
}

function manualScheduler() {
  const tasks = new Map<number, () => void>();
  let next = 1;
  return {
    setTimeout: (callback: () => void) => {
      const id = next++;
      tasks.set(id, callback);
      return id;
    },
    clearTimeout: (handle: unknown) => tasks.delete(handle as number),
    run() {
      const pending = [...tasks.values()];
      tasks.clear();
      for (const task of pending) task();
    },
    size: () => tasks.size,
  };
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AnswerQueue (autoguardado)', () => {
  it('antes de entregar espera el autoguardado en vuelo y confirma la revisión más nueva', async () => {
    let confirm!: (outcome: SaveOutcome) => void;
    const acknowledged = (entries: readonly AnswerEntry[]): SaveOutcome => ({
      status: 'saved',
      saved: entries.map(({ position, revision }) => ({ position, revision })),
      rejected: [],
      serverNow: null,
      expiresAt: null,
    });
    const gateway: ExamGateway = {
      saveAnswers: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<SaveOutcome>((resolve) => {
              confirm = resolve;
            }),
        )
        .mockImplementation(
          async (_id: string, _position: number, entries: readonly AnswerEntry[]) =>
            acknowledged(entries),
        ),
    };
    const scheduler = manualScheduler();
    const store = memoryStore();
    const queue = new AnswerQueue('submit-race', [item(1)], { gateway, store, scheduler });
    queue.start();
    queue.answer(1, { choice: 'a' });
    scheduler.run();
    await flushPromises();
    queue.answer(1, { choice: 'b' });
    let completed = false;
    const beforeSubmit = queue.flushNow().then(() => {
      completed = true;
    });
    await flushPromises();
    expect(completed).toBe(false);
    expect(gateway.saveAnswers).toHaveBeenCalledTimes(1);
    confirm(acknowledged([{ position: 1, revision: 1, answer: { choice: 'a' }, flagged: false }]));
    await beforeSubmit;
    expect(gateway.saveAnswers).toHaveBeenCalledTimes(2);
    expect(queue.snapshot().items.get(1)).toMatchObject({
      answer: { choice: 'b' },
      savedRevision: 2,
    });
    expect(queue.hasPending()).toBe(false);
    expect(store.value).toBeNull();
    expect(scheduler.size()).toBe(0);
  });

  it('antes de entregar vacía todos los lotes y conserva lo local si la red falla', async () => {
    let online = false;
    const gateway: ExamGateway = {
      saveAnswers: vi.fn(async (_id: string, _position: number, entries: readonly AnswerEntry[]) =>
        online
          ? {
              status: 'saved' as const,
              saved: entries.map(({ position, revision }) => ({ position, revision })),
              rejected: [],
              serverNow: null,
              expiresAt: null,
            }
          : ('network' as const),
      ),
    };
    const scheduler = manualScheduler();
    const store = memoryStore();
    const queue = new AnswerQueue(
      'submit-batches',
      Array.from({ length: 101 }, (_, n) => item(n + 1)),
      { gateway, store, scheduler },
    );
    queue.start();
    for (let position = 1; position <= 101; position++) queue.answer(position, { choice: 'a' });
    await queue.flushNow();
    expect(queue.snapshot().status).toBe('offline');
    expect(store.value?.entries).toHaveLength(101);
    online = true;
    await queue.flushNow();
    expect(queue.hasPending()).toBe(false);
    expect(queue.snapshot().status).toBe('saved');
    expect(store.value).toBeNull();
    expect(gateway.saveAnswers).toHaveBeenCalledTimes(3);
    expect(scheduler.size()).toBe(0);
  });

  it('agrupa los cambios, sube la revisión y borra la copia local solo al confirmar', async () => {
    const saved: unknown[] = [];
    const gateway: ExamGateway = {
      saveAnswers: vi.fn(
        async (_id: string, _position: number, entries: readonly AnswerEntry[]) => {
          saved.push(entries);
          return {
            status: 'saved' as const,
            saved: entries.map((entry) => ({ position: entry.position, revision: entry.revision })),
            rejected: [],
            serverNow: null,
            expiresAt: null,
          };
        },
      ),
    };
    const store = memoryStore();
    const scheduler = manualScheduler();
    const queue = new AnswerQueue('t1', [item(1), item(2)], { gateway, store, scheduler });
    queue.start();
    queue.answer(1, { choice: 'a' });
    queue.answer(1, { choice: 'b' });
    queue.flag(2, true);
    expect(queue.snapshot().status).toBe('pending');
    expect(store.value?.entries).toHaveLength(2);
    scheduler.run();
    await flushPromises();
    expect(gateway.saveAnswers).toHaveBeenCalledTimes(1);
    expect(saved[0]).toEqual([
      { position: 1, answer: { choice: 'b' }, flagged: false, revision: 2 },
      { position: 2, answer: null, flagged: true, revision: 1 },
    ]);
    expect(queue.snapshot().status).toBe('saved');
    expect(store.value).toBeNull();
  });

  it('sin conexión conserva lo local, avisa y reintenta', async () => {
    let online = false;
    const gateway: ExamGateway = {
      saveAnswers: vi.fn(async (_id: string, _position: number, entries: readonly AnswerEntry[]) =>
        online
          ? {
              status: 'saved' as const,
              saved: entries.map((entry) => ({
                position: entry.position,
                revision: entry.revision,
              })),
              rejected: [],
              serverNow: null,
              expiresAt: null,
            }
          : ('network' as const),
      ),
    };
    const store = memoryStore();
    const scheduler = manualScheduler();
    const queue = new AnswerQueue('t2', [item(1)], { gateway, store, scheduler });
    queue.start();
    queue.answer(1, { choice: 'a' });
    scheduler.run();
    await flushPromises();
    expect(queue.snapshot().status).toBe('offline');
    expect(store.value?.entries[0]?.answer).toEqual({ choice: 'a' });
    expect(scheduler.size()).toBe(1);
    online = true;
    scheduler.run();
    await flushPromises();
    expect(queue.snapshot().status).toBe('saved');
    expect(store.value).toBeNull();
  });

  it('al recargar, lo local más nuevo gana y lo ya confirmado se descarta', () => {
    const store = memoryStore({
      position: 2,
      entries: [
        { position: 1, answer: { choice: 'b' }, flagged: true, revision: 3 },
        { position: 2, answer: { choice: 'a' }, flagged: false, revision: 1 },
      ],
    });
    const queue = new AnswerQueue(
      't3',
      [item(1, 2, { choice: 'a' }), item(2, 4, { choice: 'b' })],
      {
        gateway: { saveAnswers: vi.fn() },
        store,
        scheduler: manualScheduler(),
      },
    );
    // Antes de start (render del servidor y primer render) solo lo del servidor.
    expect(queue.snapshot().items.get(1)?.answer).toEqual({ choice: 'a' });
    queue.start();
    const items = queue.snapshot().items;
    expect(items.get(1)).toMatchObject({ answer: { choice: 'b' }, revision: 3, savedRevision: 2 });
    expect(items.get(2)).toMatchObject({ answer: { choice: 'b' }, revision: 4, savedRevision: 4 });
    expect(queue.snapshot().pending).toBe(1);
  });

  it('si el servidor dice que el intento terminó, deja de guardar y avisa', async () => {
    const finished = vi.fn();
    const scheduler = manualScheduler();
    const queue = new AnswerQueue('t4', [item(1)], {
      gateway: { saveAnswers: vi.fn(async () => ({ status: 'finished' as const })) },
      store: memoryStore(),
      scheduler,
    });
    queue.start(finished);
    queue.answer(1, { choice: 'a' });
    scheduler.run();
    await flushPromises();
    expect(finished).toHaveBeenCalledTimes(1);
    expect(queue.snapshot().status).toBe('finished');
    queue.answer(1, { choice: 'b' });
    expect(queue.snapshot().items.get(1)?.answer).toEqual({ choice: 'a' });
  });
});

// ---------------------------------------------------------------------------
// Reloj y eventos
// ---------------------------------------------------------------------------

describe('Reloj del examen', () => {
  it('calcula lo que queda con la hora del servidor y lo muestra', () => {
    const expires = '2026-10-03T15:20:00.000Z';
    expect(remainingMs(expires, Date.parse('2026-10-03T15:01:26Z'), 0)).toBe(1_114_000);
    // El reloj del dispositivo va 30 s atrasado: la diferencia lo corrige.
    expect(remainingMs(expires, Date.parse('2026-10-03T15:00:56Z'), 30_000)).toBe(1_114_000);
    expect(remainingMs(expires, Date.parse('2026-10-03T16:00:00Z'), 0)).toBe(0);
    expect(formatClock(1_114_000)).toBe('18:34');
    expect(formatClock(3_725_000)).toBe('1:02:05');
    expect(clockTone(301_000)).toBe('normal');
    expect(clockTone(299_000)).toBe('warning');
    expect(clockTone(59_000)).toBe('final');
  });

  it('anuncia solo al cruzar 10, 5 y 1 minuto (nunca cada segundo)', () => {
    expect(timeAnnouncement(600_500, 599_500)).toBe('Quedan 10 minutos.');
    expect(timeAnnouncement(599_500, 598_500)).toBeNull();
    expect(timeAnnouncement(60_200, 59_200)).toBe('Queda 1 minuto.');
    const texts = new Set<string>();
    for (let ms = 12 * 60_000; ms >= 0; ms -= 1000) texts.add(thresholdAnnouncement(ms));
    expect([...texts]).toEqual([
      '',
      'Quedan 10 minutos.',
      'Quedan 5 minutos.',
      'Queda 1 minuto.',
      'Se acabó el tiempo. Entregando tu evaluación.',
    ]);
  });
});

describe('Eventos de supervisión', () => {
  it('agrupa repeticiones, mide la ausencia y no pierde eventos si falla el envío', () => {
    const buffer = new EventBuffer();
    buffer.record('focus_lost', 1_000, 3);
    buffer.record('focus_lost', 1_500, 3);
    buffer.record('focus_returned', 6_000, 3);
    const { batch, taken } = buffer.take(7_000);
    expect(batch).toEqual([
      { type: 'focus_lost', ago_ms: 6_000, position: 3 },
      { type: 'focus_returned', ago_ms: 1_000, position: 3, duration_ms: 5_000 },
    ]);
    expect(buffer.size()).toBe(0);
    buffer.restore(taken);
    expect(buffer.size()).toBe(2);
    expect(buffer.take(10_000_000).batch[0]?.ago_ms).toBe(600_000);
  });
});

// ---------------------------------------------------------------------------
// Vista del intento: sin clave
// ---------------------------------------------------------------------------

describe('readAttemptView', () => {
  it('nunca conserva campos de clave aunque llegaran en un intento abierto', () => {
    const view = readAttemptView({
      status: 'in_progress',
      attempt_id: 'x',
      attempt_status: 'in_progress',
      started_at: '2026-10-03T10:00:00Z',
      expires_at: '2026-10-03T10:30:00Z',
      server_now: '2026-10-03T10:05:00Z',
      current_position: 1,
      question_total: 1,
      assessment: {
        id: 'a',
        title: 'T',
        section_key: 'fundamentos-sql',
        record_clipboard: true,
        feedback_mode: 'hidden',
        pass_grade: 3,
      },
      items: [
        {
          position: 1,
          type: 'single_choice',
          response: 'single',
          prompt: '¿?',
          options: [{ id: 'o1', body: 'A', kind: 'text', correct: true, feedback: 'clave' }],
          explanation: 'clave',
          revision: 0,
        },
      ],
    });
    expect(view?.status).toBe('in_progress');
    expect(JSON.stringify(view)).not.toContain('clave');
    expect(JSON.stringify(view)).not.toContain('correct');
  });
});

// ---------------------------------------------------------------------------
// Resultados y escala 0–5
// ---------------------------------------------------------------------------

const roster: RosterStudent[] = [
  { id: 's1', firstName: 'Ana', lastName: 'Ruiz', email: 'ana@example.com', institutional: true },
  { id: 's2', firstName: 'Luis', lastName: 'Paz', email: 'luis@example.com', institutional: false },
  { id: 's3', firstName: 'Eva', lastName: 'Mora', email: 'eva@example.com', institutional: true },
];

function attempt(
  id: string,
  studentId: string,
  grade: number | null,
  status: AttemptRow['status'] = 'submitted',
): AttemptRow {
  return {
    id,
    studentId,
    attemptNumber: 1,
    status,
    submittedBy: status === 'in_progress' ? null : 'student',
    startedAt: '2026-10-03T10:00:00Z',
    expiresAt: '2026-10-03T10:30:00Z',
    submittedAt: status === 'in_progress' ? null : '2026-10-03T10:20:00Z',
    durationSeconds: status === 'in_progress' ? null : 1200,
    questionTotal: 10,
    correctCount: grade === null ? null : Math.round(grade * 2),
    scorePercent: grade === null ? null : grade * 20,
    grade,
  };
}

describe('Resultados', () => {
  it('estadísticas en escala 0–5: promedio, mediana, extremos, distribución y aprobación', () => {
    const stats = gradeStats([4.2, 0, 3.0, 2.9, 5.0], 3.0);
    expect(stats).toMatchObject({
      count: 5,
      mean: 3,
      median: 3,
      min: 0,
      max: 5,
      passed: 3,
      passRate: 60,
    });
    expect(stats.distribution.map((bucket) => bucket.count)).toEqual([1, 0, 1, 1, 2]);
    expect(gradeStats([])).toMatchObject({ count: 0, mean: null, median: null, passRate: null });
    expect(gradeStats([3.5, 4.0]).median).toBe(3.8);
  });

  it('distingue ausente de quien presentó y sacó 0.0, y sin iniciar mientras sigue abierta', () => {
    const attempts = [attempt('a1', 's1', 0)];
    const closed = participantRows(roster, roster, attempts, 'closed');
    expect(closed.map((row) => [row.student.id, row.status, row.attempt?.grade ?? null])).toEqual([
      ['s3', 'absent', null],
      ['s2', 'absent', null],
      ['s1', 'submitted', 0],
    ]);
    const summary = resultsSummary(closed, 3);
    expect(summary).toMatchObject({ participants: 3, submitted: 1, absent: 2 });
    expect(summary.stats.count).toBe(1);
    const open = participantRows(roster, roster, [], 'active');
    expect(new Set(open.map((row) => row.status))).toEqual(new Set(['not_started']));
  });

  it('con varios intentos informa el entregado de mejor nota (o el abierto)', () => {
    const rows = participantRows(
      roster.slice(0, 1),
      roster,
      [attempt('a1', 's1', 2.5), { ...attempt('a2', 's1', 3.9), attemptNumber: 2 }],
      'active',
    );
    expect(rows[0]?.attempt?.id).toBe('a2');
    expect(rows[0]?.attempts).toBe(2);
  });

  it('audiencia: solo institucionales y estudiantes elegidos', () => {
    expect(
      eligibleStudents(roster, {
        audience: 'all',
        institutionalOnly: true,
        assigned: new Set(),
      }).map((s) => s.id),
    ).toEqual(['s1', 's3']);
    expect(
      eligibleStudents(roster, {
        audience: 'selected',
        institutionalOnly: false,
        assigned: new Set(['s2']),
      }).map((s) => s.id),
    ).toEqual(['s2']);
  });

  it('análisis por pregunta: porcentaje correcto y distractor frecuente', () => {
    const question: FrozenQuestion = {
      questionId: 'q1',
      position: 1,
      weight: 1,
      version: 1,
      externalKey: 'S1-NUL-02',
      type: 'interpret_query',
      response: 'single',
      topic: 'null',
      difficulty: 2,
      prompt: '¿?',
      code: null,
      exhibit: null,
      explanation: '',
      concept: '',
      review: '',
      reference: '',
      options: [
        {
          id: 'ok',
          body: 'Ninguna',
          kind: 'text',
          result: null,
          correct: true,
          order: null,
          feedback: '',
        },
        {
          id: 'no',
          body: 'Las 6',
          kind: 'text',
          result: null,
          correct: false,
          order: null,
          feedback: '',
        },
      ],
    };
    const answers = [
      {
        attemptId: 'a1',
        position: 1,
        questionId: 'q1',
        answer: { choice: 'ok' },
        credit: 1,
        flagged: false,
        optionOrder: [],
      },
      {
        attemptId: 'a2',
        position: 1,
        questionId: 'q1',
        answer: { choice: 'no' },
        credit: 0,
        flagged: false,
        optionOrder: [],
      },
      {
        attemptId: 'a3',
        position: 1,
        questionId: 'q1',
        answer: { choice: 'no' },
        credit: 0,
        flagged: false,
        optionOrder: [],
      },
      {
        attemptId: 'open',
        position: 1,
        questionId: 'q1',
        answer: { choice: 'ok' },
        credit: null,
        flagged: false,
        optionOrder: [],
      },
    ];
    const [stat] = questionStats([question], answers, new Set(['a1', 'a2', 'a3']));
    expect(stat).toMatchObject({
      presented: 3,
      fullyCorrect: 1,
      correctRate: 33,
      observed: 'hard',
    });
    expect(stat?.topDistractor).toMatchObject({ id: 'no', chosen: 2, share: 67 });
  });

  it('nota con un decimal y pesos por dificultad', () => {
    expect(formatGrade(4.2)).toBe('4.2');
    expect(formatGrade(5)).toBe('5.0');
    expect(formatGrade(null)).toBe('—');
    expect([1, 2, 3, 4, 5].map((level) => defaultWeight(level as 1 | 2 | 3 | 4 | 5))).toEqual([
      1, 1.25, 1.5, 1.75, 2,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Exportación
// ---------------------------------------------------------------------------

describe('Exportación CSV', () => {
  it('columnas pedidas, BOM, ausentes sin nota y celdas peligrosas neutralizadas', () => {
    const rows = participantRows(
      [
        ...roster,
        { id: 's4', firstName: '=CMD()', lastName: '+1', email: '@x.com', institutional: false },
      ],
      roster,
      [attempt('a1', 's1', 4.2)],
      'closed',
    );
    const csv = toCsv(
      summaryRows({ title: 'Parcial, 1', section: 'Sección 1', date: '03/10/2026' }, rows),
      'csv',
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      '﻿Nombre,Apellido,Correo,Evaluación,Sección,Fecha,Estado,Inicio,Entrega,Duración,Correctas,Total,Porcentaje,Nota',
    );
    expect(csv).toContain('Ana,Ruiz,ana@example.com,"Parcial, 1",Sección 1,03/10/2026,Entregada');
    expect(csv).toContain(',8,10,84,4.2');
    expect(csv).toContain("'=CMD(),'+1,'@x.com");
    expect(csv).toMatch(
      /Luis,Paz,luis@example.com,"Parcial, 1",Sección 1,03\/10\/2026,Ausente,,,,,,,/,
    );
  });

  it('versión para Excel en español: punto y coma y coma decimal', () => {
    const csv = toCsv([['Nota'], [4.2]], 'excel');
    expect(csv).toBe('﻿Nota\r\n4,2\r\n');
    expect(exportFileName('Parcial NULL · Grupo A', false, 'excel')).toBe(
      'parcial-null-grupo-a-resultados-excel.csv',
    );
  });

  it('la nota real del resumen respeta el separador decimal y conserva un decimal', () => {
    const rows = participantRows(roster, roster, [attempt('a1', 's1', 4.2)], 'closed');
    const context = { title: 'Parcial', section: 'Sección 1', date: null };
    expect(toCsv(summaryRows(context, rows, 'excel'), 'excel')).toContain(';8;10;84;4,2\r\n');
    const perfect = participantRows(roster, roster, [attempt('a1', 's1', 5)], 'closed');
    expect(toCsv(summaryRows(context, perfect, 'excel'), 'excel')).toContain(';5,0\r\n');
  });

  it('neutraliza fórmulas precedidas de espacios o caracteres de control', () => {
    expect(toCsv([['  =SUM(1)', '\t+1', '\n@SUM(1)', 'texto normal']], 'excel')).toBe(
      "\uFEFF'  =SUM(1);'\t+1;\"'\n@SUM(1)\";texto normal\r\n",
    );
    expect(toCsv([['\u0000=2+2', ' \u0001@SUM(1)']], 'excel')).toBe(
      "\uFEFF'\u0000=2+2;' \u0001@SUM(1)\r\n",
    );
  });
});

// ---------------------------------------------------------------------------
// Formularios del profesor
// ---------------------------------------------------------------------------

function form(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const Q1 = '11111111-1111-4111-8111-111111111111';
const Q2 = '22222222-2222-4222-8222-222222222222';

describe('Formulario de evaluación', () => {
  const base = {
    title: 'Parcial 1',
    section_key: 'fundamentos-sql',
    selection_mode: 'manual',
    question_ids: [Q1, Q2],
    question_count: '2',
    duration_minutes: '45',
    feedback_mode: 'hidden',
    audience: 'all',
    shuffle_questions: 'on',
  };

  it('convierte fechas de Colombia (UTC−5) y lee los interruptores', () => {
    const parsed = parseAssessmentForm(
      form({ ...base, opens_at: '2026-10-05T08:00', closes_at: '2026-10-05T10:00' }),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.value).toMatchObject({
      opens_at: '2026-10-05T13:00:00.000Z',
      closes_at: '2026-10-05T15:00:00.000Z',
      shuffle_questions: true,
      shuffle_options: false,
      question_ids: [Q1, Q2],
      pass_grade: 3,
    });
    expect(isoToLocal('2026-10-05T13:00:00.000Z')).toBe('2026-10-05T08:00');
    expect(localToIso('mañana')).toBeNull();
  });

  it('explica cada error: cantidad mayor que la selección, cierre antes de abrir, nota fuera de escala', () => {
    const parsed = parseAssessmentForm(
      form({
        ...base,
        question_count: '3',
        opens_at: '2026-10-05T10:00',
        closes_at: '2026-10-05T09:00',
        pass_grade: '6',
      }),
    );
    expect(parsed.ok).toBe(false);
    expect(Object.keys(parsed.errors).sort()).toEqual([
      'closes_at',
      'pass_grade',
      'question_count',
    ]);
  });

  it('acepta cantidades configurables, no solo 10/20/30/40/50', () => {
    expect(
      parseAssessmentForm(form({ ...base, selection_mode: 'random', question_count: '17' })).value
        ?.question_count,
    ).toBe(17);
    expect(
      parseAssessmentForm(form({ ...base, selection_mode: 'random', question_count: '101' })).ok,
    ).toBe(false);
  });
});

describe('Formulario de pregunta', () => {
  const base = {
    section: 'fundamentos-sql',
    topic: 'null',
    type: 'single_choice',
    response: 'single',
    difficulty: '2',
    prompt: '¿Qué devuelve BONO = NULL?',
    option_0_body: 'Ninguna fila',
    option_0_correct: 'on',
    option_1_body: 'Las 6 sin bono',
    status: 'published',
  };

  it('valida la clave según la forma de respuesta', () => {
    expect(parseQuestionForm(form(base)).ok).toBe(true);
    expect(parseQuestionForm(form({ ...base, option_1_correct: 'on' })).errors.options).toMatch(
      /exactamente una/,
    );
    const order = parseQuestionForm(
      form({
        ...base,
        type: 'order_fragments',
        option_0_correct: '',
        option_0_order: '1',
        option_1_order: '1',
      }),
    );
    expect(order.errors.options).toMatch(/del 1 al total/);
  });

  it('lee la tabla de origen escrita con barras verticales', () => {
    expect(parseExhibitTable('NOMBRE | BONO\nJorge | NULL\nMario | 0')).toEqual({
      columns: ['NOMBRE', 'BONO'],
      rows: [
        ['Jorge', null],
        ['Mario', 0],
      ],
    });
    expect(parseExhibitTable('A | B\nsolo uno')).toBe('invalid');
    expect(parseExhibitTable('  ')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Fases y estado del estudiante
// ---------------------------------------------------------------------------

describe('Fases', () => {
  const now = Date.parse('2026-10-03T12:00:00Z');
  it('deriva programada, activa, sin nuevos accesos y finalizada de las fechas', () => {
    const base = {
      status: 'published' as const,
      opensAt: null,
      closesAt: null,
      entryClosedAt: null,
    };
    expect(assessmentPhase({ ...base, opensAt: '2026-10-03T13:00:00Z' }, now)).toBe('scheduled');
    expect(assessmentPhase(base, now)).toBe('active');
    expect(assessmentPhase({ ...base, entryClosedAt: '2026-10-03T11:00:00Z' }, now)).toBe('ending');
    expect(assessmentPhase({ ...base, closesAt: '2026-10-03T11:59:00Z' }, now)).toBe('closed');
    expect(assessmentPhase({ ...base, status: 'draft' }, now)).toBe('draft');
  });

  it('estado del estudiante y minutos disponibles hasta el cierre', () => {
    const summary: StudentAssessment = {
      id: 'a',
      title: 'T',
      description: '',
      sectionKey: 'fundamentos-sql',
      questionCount: 10,
      durationMinutes: 60,
      opensAt: null,
      closesAt: '2026-10-03T12:20:00Z',
      maxAttempts: 1,
      recordClipboard: true,
      passGrade: 3,
      phase: 'active',
      feedbackMode: 'hidden',
      serverNow: '2026-10-03T12:00:00Z',
      attempts: [],
    };
    expect(studentState(summary)).toBe('available');
    expect(minutesAvailable(summary, now)).toBe(20);
    expect(studentState({ ...summary, phase: 'closed' })).toBe('missed');
    expect(studentState({ ...summary, phase: 'scheduled' })).toBe('upcoming');
  });
});
