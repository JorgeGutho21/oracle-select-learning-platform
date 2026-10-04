import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
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
import { outlineOf } from '@/features/curriculum/application/outline';
import { ASSESSMENT_EXAMPLES } from '@/features/curriculum/domain/registry';

/**
 * Bancos oficiales de las secciones 2 y 3 (QUESTION_BANK_SPEC): 50 preguntas cada uno con la
 * distribución por tema y por nivel cognitivo acordada, forma válida para la base, repaso que
 * apunta a lecciones publicadas, sin pistas por longitud y sin llegar al navegador. Los
 * resultados que citan salen de Oracle (oracle-results.json), que verifica
 * curriculum-oracle.test.ts.
 */

const SPEC = {
  'consultas-relacionales': {
    prefix: 'S2',
    topics: [
      [['relaciones'], 5],
      [['join', 'otros-join'], 15],
      [['agregacion', 'grupos'], 15],
      [['subconsultas'], 8],
      [['conjuntos'], 7],
    ],
  },
  plsql: {
    prefix: 'S3',
    topics: [
      [['bloques'], 6],
      [['variables'], 7],
      [['control'], 7],
      [['cursores'], 7],
      [['excepciones'], 5],
      [['subprogramas'], 7],
      [['paquetes'], 4],
      [['triggers'], 7],
    ],
  },
} as const;

/** 15 % recordar, 40 % aplicar, 45 % analizar, con un margen de una pregunta. */
const LEVELS = { recordar: 7.5, aplicar: 20, analizar: 22.5 } as const;

describe.each(Object.entries(SPEC))('Banco oficial · %s', (section, spec) => {
  const bank = OFFICIAL_BANK[section as keyof typeof OFFICIAL_BANK];

  it('tiene 50 preguntas con claves únicas y estables', () => {
    expect(bank).toHaveLength(BANK_TARGET_PER_SECTION);
    const keys = bank.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(new RegExp(`^${spec.prefix}-[A-Z]+-\\d{2}$`));
  });

  it('respeta la distribución por tema', () => {
    for (const [topics, expected] of spec.topics) {
      const found = bank.filter(({ topic }) => (topics as readonly string[]).includes(topic));
      expect(found.length, topics.join('+')).toBe(expected);
    }
  });

  it('respeta la mezcla cognitiva (15 % / 40 % / 45 %)', () => {
    for (const question of bank) {
      const levels = (question.tags ?? []).filter((tag) => tag.startsWith('nivel:'));
      expect(levels, question.key).toHaveLength(1);
    }
    for (const [level, target] of Object.entries(LEVELS)) {
      const found = bank.filter(({ tags }) => tags?.includes(`nivel:${level}`)).length;
      expect(Math.abs(found - target), `${level}: ${found}`).toBeLessThanOrEqual(1);
    }
  });

  it('usa variedad de tipos y dificultades internas', () => {
    expect(new Set(bank.map(({ type }) => type)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(bank.map(({ difficulty }) => difficulty)).size).toBeGreaterThanOrEqual(4);
    for (const question of bank) expect(QUESTION_TYPES).toContain(question.type);
  });

  it.each(bank.map((question) => [question.key, question] as const))(
    '%s: forma válida, retroalimentación completa y repaso publicado',
    (_key, question) => {
      expect(question.section).toBe(section);
      expect(isTopicOf(question.section, question.topic), question.topic).toBe(true);
      expect(RESPONSE_KINDS_BY_TYPE[question.type]).toContain(question.response);
      expect(questionProblems(question)).toEqual([]);
      for (const field of [
        question.prompt,
        question.explanation,
        question.concept,
        question.reference,
      ]) {
        expect(field.trim().length).toBeGreaterThan(0);
      }
      expect(question.concept.length).toBeLessThanOrEqual(200);
      const bodies = question.options.map(({ body }) => body);
      expect(new Set(bodies).size).toBe(bodies.length);
      for (const option of question.options) {
        if (question.response !== 'order')
          expect(option.feedback?.trim(), option.body).toBeTruthy();
      }
      const slug = /\(\/sections\/([a-z-]+)\/study\/([a-z0-9-]+)\)$/.exec(question.review);
      expect(slug?.[1], question.review).toBe(section);
      expect(outlineOf(section)?.lessons.some((lesson) => lesson.slug === slug?.[2])).toBe(true);
    },
  );

  it('los distractores de resultado son tablas distintas con las columnas del correcto', () => {
    for (const question of bank.filter((q) => q.options.some((o) => o.kind === 'table'))) {
      const tables = question.options.map((option) => JSON.stringify(option.result));
      expect(new Set(tables).size, question.key).toBe(tables.length);
      const correct = question.options.find((option) => option.correct)!.result!;
      for (const option of question.options) {
        expect(option.result?.columns, question.key).toEqual(correct.columns);
      }
    }
  });

  it('la respuesta correcta no se delata por ser la opción más larga', () => {
    const textual = bank.filter(
      (question) =>
        // Las opciones de código son salidas o sentencias literales: su longitud la da Oracle.
        question.response === 'single' &&
        question.options.every((option) => option.kind !== 'table' && option.kind !== 'code'),
    );
    const revealing = textual.filter((question) => {
      const correct = question.options.find((option) => option.correct)!.body.length;
      const longest = Math.max(
        ...question.options.filter((option) => !option.correct).map((option) => option.body.length),
      );
      return correct > longest * 1.25;
    });
    expect(
      revealing.map(({ key }) => key),
      'preguntas cuya opción correcta es mucho más larga',
    ).toEqual([]);
  });
});

describe('Banco oficial · todas las secciones', () => {
  it('cada consulta o bloque propio del banco (S2-B, S3-B) se usa en alguna pregunta', () => {
    const sources = ['consultas-relacionales', 'plsql']
      .map((file) => readFileSync(`src/features/assessments/application/bank/${file}.ts`, 'utf8'))
      .join('\n');
    const unused = ASSESSMENT_EXAMPLES.map(({ id }) => id).filter(
      (id) => !sources.includes(`'${id}'`),
    );
    // S3-B-MAX-VACIO se cita en la retroalimentación; el resto, como código o resultado.
    expect(unused).toEqual([]);
  });

  it('las claves son únicas entre secciones', () => {
    const keys = Object.values(OFFICIAL_BANK).flatMap((bank) => bank.map(({ key }) => key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(150);
  });

  it('las respuestas correctas no llegan al navegador: ningún código de cliente importa el banco', () => {
    const offenders: string[] = [];
    const visit = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) visit(path);
        else if (/\.(ts|tsx)$/.test(entry)) {
          const text = readFileSync(path, 'utf8');
          const imports = /from ['"][^'"]*(official-bank|domain\/bank|application\/bank\/)/.test(
            text,
          );
          const client = /^['"]use client['"]/m.test(text) || path.includes('/presentation/');
          if (imports && client) offenders.push(path);
        }
      }
    };
    visit('src');
    expect(offenders).toEqual([]);
  });
});
