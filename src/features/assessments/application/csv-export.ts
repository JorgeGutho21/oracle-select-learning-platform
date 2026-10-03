import { formatGrade, PARTICIPANT_LABEL, ASSESSMENT_TIME_ZONE } from '../domain/assessment';
import type { ParticipantRow, AnswerRow, FrozenQuestion } from './results';

/**
 * Exportación de resultados sin dependencias: CSV estándar (coma y punto decimal) o CSV para
 * Excel en español (punto y coma y coma decimal). Las celdas que empiezan por =, +, - o @
 * se neutralizan para que una hoja de cálculo nunca las ejecute como fórmula. No incluye
 * identificadores internos, claves ni eventos de supervisión.
 */

export type CsvFormat = 'csv' | 'excel';

interface Dialect {
  readonly separator: string;
  readonly decimal: string;
}

const DIALECTS: Readonly<Record<CsvFormat, Dialect>> = {
  csv: { separator: ',', decimal: '.' },
  excel: { separator: ';', decimal: ',' },
};

type Cell = string | number | null;

function cell(value: Cell, dialect: Dialect): string {
  if (value === null) return '';
  let text = typeof value === 'number' ? String(value).replace('.', dialect.decimal) : value;
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /["\n\r]/.test(text) || text.includes(dialect.separator)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

export function toCsv(rows: readonly (readonly Cell[])[], format: CsvFormat): string {
  const dialect = DIALECTS[format];
  // BOM: Excel reconoce así las tildes en UTF-8.
  return `﻿${rows.map((row) => row.map((value) => cell(value, dialect)).join(dialect.separator)).join('\r\n')}\r\n`;
}

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: ASSESSMENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function exportDate(iso: string | null): string | null {
  return iso ? dateFormat.format(new Date(iso)) : null;
}

function duration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${String(seconds % 60).padStart(2, '0')} s`;
}

export interface ExportContext {
  readonly title: string;
  readonly section: string;
  readonly date: string | null;
}

export const SUMMARY_HEADER = [
  'Nombre',
  'Apellido',
  'Correo',
  'Evaluación',
  'Sección',
  'Fecha',
  'Estado',
  'Inicio',
  'Entrega',
  'Duración',
  'Correctas',
  'Total',
  'Porcentaje',
  'Nota',
] as const;

export function summaryRows(context: ExportContext, rows: readonly ParticipantRow[]): Cell[][] {
  return [
    [...SUMMARY_HEADER],
    ...rows.map(({ student, status, attempt }) => {
      const finished = attempt && attempt.status !== 'in_progress';
      return [
        student.firstName,
        student.lastName,
        student.email,
        context.title,
        context.section,
        context.date,
        PARTICIPANT_LABEL[status],
        exportDate(attempt?.startedAt ?? null),
        exportDate(finished ? attempt.submittedAt : null),
        duration(finished ? attempt.durationSeconds : null),
        finished ? (attempt.correctCount ?? 0) : null,
        attempt ? attempt.questionTotal : null,
        finished ? (attempt.scorePercent ?? 0) : null,
        finished ? formatGrade(attempt.grade) : null,
      ];
    }),
  ];
}

/** Detalle por pregunta: una fila por estudiante y pregunta del intento informado. */
export function detailRows(
  rows: readonly ParticipantRow[],
  questions: readonly FrozenQuestion[],
  answers: readonly AnswerRow[],
): Cell[][] {
  const byId = new Map(questions.map((question) => [question.questionId, question]));
  const header: Cell[] = [
    'Nombre',
    'Apellido',
    'Correo',
    'Pregunta',
    'Clave',
    'Tema',
    'Enunciado',
    'Respuesta',
    'Correcta',
    'Crédito',
    'Peso',
  ];
  const lines: Cell[][] = [header];
  for (const { student, attempt } of rows) {
    if (!attempt || attempt.status === 'in_progress') continue;
    for (const answer of answers
      .filter((row) => row.attemptId === attempt.id)
      .sort((a, b) => a.position - b.position)) {
      const question = byId.get(answer.questionId);
      if (!question) continue;
      lines.push([
        student.firstName,
        student.lastName,
        student.email,
        answer.position,
        question.externalKey ?? `v${question.version}`,
        question.topic,
        question.prompt,
        answerText(question, answer),
        correctText(question),
        answer.credit ?? 0,
        question.weight,
      ]);
    }
  }
  return lines;
}

function optionLabel(question: FrozenQuestion, id: string): string {
  return question.options.find((option) => option.id === id)?.body.replaceAll('\n', ' ') ?? '?';
}

function answerText(question: FrozenQuestion, row: AnswerRow): string {
  const answer = row.answer;
  if (!answer) return 'Sin responder';
  if ('choice' in answer) return optionLabel(question, answer.choice);
  if ('choices' in answer) return answer.choices.map((id) => optionLabel(question, id)).join(' | ');
  return answer.order.map((id) => optionLabel(question, id)).join(' → ');
}

function correctText(question: FrozenQuestion): string {
  if (question.response === 'order') {
    return [...question.options]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((option) => option.body.replaceAll('\n', ' '))
      .join(' → ');
  }
  return question.options
    .filter((option) => option.correct)
    .map((option) => option.body.replaceAll('\n', ' '))
    .join(' | ');
}

/** Nombre de archivo sin datos personales ni caracteres problemáticos. */
export function exportFileName(title: string, detail: boolean, format: CsvFormat): string {
  const slug =
    title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'evaluacion';
  return `${slug}-${detail ? 'detalle' : 'resultados'}${format === 'excel' ? '-excel' : ''}.csv`;
}
