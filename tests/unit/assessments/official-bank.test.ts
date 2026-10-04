import { describe, expect, it } from 'vitest';
import { evaluate } from '@/features/assessments/domain/bank/bank-builders';
import {
  BANK_TARGET_PER_SECTION,
  OFFICIAL_BANK,
} from '@/features/assessments/application/official-bank';
import {
  QUESTION_TYPES,
  questionProblems,
  RESPONSE_KINDS_BY_TYPE,
} from '@/features/assessments/domain/question';
import { isTopicOf } from '@/features/assessments/domain/topics';

/**
 * Banco oficial de la Sección 1: forma válida para la base y cada afirmación comprobada con
 * el motor educativo (que a su vez se compara con Oracle real en oracle-real.test.ts).
 */

const bank = OFFICIAL_BANK['fundamentos-sql'];

describe('Banco oficial · Fundamentos SQL', () => {
  it('tiene las 50 preguntas previstas, con claves únicas y estables', () => {
    expect(bank).toHaveLength(BANK_TARGET_PER_SECTION);
    const keys = bank.map((question) => question.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[A-Z0-9]+(-[A-Z0-9]+){1,4}$/);
  });

  it('usa los diez tipos de pregunta y varias dificultades', () => {
    const types = new Set(bank.map((question) => question.type));
    expect([...types].sort()).toEqual([...QUESTION_TYPES].sort());
    for (const type of QUESTION_TYPES) {
      expect(bank.filter((question) => question.type === type).length, type).toBeGreaterThanOrEqual(
        2,
      );
    }
    const difficulties = new Set(bank.map((question) => question.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(4);
  });

  it.each(bank.map((question) => [question.key, question] as const))(
    '%s: forma válida, retroalimentación completa y límites de la base',
    (_key, question) => {
      expect(isTopicOf('fundamentos-sql', question.topic)).toBe(true);
      expect(RESPONSE_KINDS_BY_TYPE[question.type]).toContain(question.response);
      expect(questionProblems(question)).toEqual([]);
      for (const field of [
        question.prompt,
        question.explanation,
        question.concept,
        question.review,
        question.reference,
      ]) {
        expect(field.trim().length).toBeGreaterThan(0);
      }
      expect(question.prompt.length).toBeLessThanOrEqual(2000);
      expect(question.explanation.length).toBeLessThanOrEqual(2000);
      expect(question.concept.length).toBeLessThanOrEqual(200);
      const bodies = question.options.map((option) => option.body);
      expect(new Set(bodies).size).toBe(bodies.length);
      for (const option of question.options) {
        expect(option.body.length).toBeLessThanOrEqual(2000);
        if (question.response !== 'order')
          expect(option.feedback?.trim().length ?? 0).toBeGreaterThan(0);
      }
    },
  );

  it.each(
    bank
      .filter((question) => question.options.some((option) => option.kind === 'table'))
      .map((question) => [question.key, question] as const),
  )('%s: los distractores de resultado difieren del correcto y entre sí', (_key, question) => {
    const tables = question.options.map((option) => JSON.stringify(option.result));
    expect(new Set(tables).size).toBe(tables.length);
    const correct = question.options.find((option) => option.correct)!.result!;
    for (const option of question.options) expect(option.result?.columns).toEqual(correct.columns);
  });

  it.each(
    bank.flatMap((question) =>
      (question.checks ?? []).map(
        (check, index) => [`${question.key} #${index + 1}`, check] as const,
      ),
    ),
  )('%s: comprobado con el motor educativo', (_label, check) => {
    switch (check.kind) {
      case 'rows':
        expect(evaluate(check.sql, check.ids)?.rows.length, check.sql).toBe(check.rows);
        break;
      case 'error':
        expect(evaluate(check.sql), check.sql).toBeNull();
        break;
      case 'valid':
        expect(evaluate(check.sql), check.sql).not.toBeNull();
        break;
      case 'columns':
        expect(evaluate(check.sql)?.columns, check.sql).toEqual(check.columns);
        break;
      case 'same': {
        const result = evaluate(check.sql);
        const target = evaluate(check.target);
        expect(target, check.target).not.toBeNull();
        const same =
          result !== null && JSON.stringify(result.rows) === JSON.stringify(target!.rows);
        expect(same, check.sql).toBe(check.expected);
        break;
      }
    }
  });
});
