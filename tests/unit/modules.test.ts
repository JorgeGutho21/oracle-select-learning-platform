import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_LEVELS,
  currentLevel,
  FUTURE_TOPICS,
  futureTopicHref,
  levelAnchor,
  STAGE_LABEL,
  topicAnchor,
  topicStatusLabel,
  upcomingLevels,
} from '@/features/modules/application/modules-api';
import { FUNCTION_TOPICS, FUTURE_KEYWORDS, FORBIDDEN_STATEMENTS } from '@/domain/sql/keywords';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';

describe('ruta de aprendizaje (roadmap)', () => {
  it('ordena siete niveles: AHORA, SIGUIENTE NIVEL y MÁS ADELANTE', () => {
    expect(CURRICULUM_LEVELS.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(CURRICULUM_LEVELS.map(({ stage }) => stage)).toEqual([
      'AHORA',
      'SIGUIENTE NIVEL',
      'SIGUIENTE NIVEL',
      'MÁS ADELANTE',
      'MÁS ADELANTE',
      'MÁS ADELANTE',
      'MÁS ADELANTE',
    ]);
    expect(currentLevel().title).toBe('SELECT fundamental');
    expect(STAGE_LABEL['SIGUIENTE NIVEL']).toBe('Siguiente nivel');
    expect(levelAnchor({ number: 3 })).toBe('nivel-3');
  });

  it('cada tema futuro tiene título, definición, utilidad, sintaxis, ejemplo, nivel y estado', () => {
    const slugs = FUTURE_TOPICS.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const topic of FUTURE_TOPICS) {
      expect(topic.status, topic.id).toBe('future');
      expect(topicStatusLabel(topic)).toBe('Próximamente');
      expect(topic.title, topic.id).toMatch(/\S/);
      expect(topic.shortDefinition.length, topic.id).toBeGreaterThan(15);
      expect(topic.purpose.length, topic.id).toBeGreaterThan(15);
      expect(topic.syntax, topic.id).toMatch(/\S/);
      expect(topic.example, topic.id).toMatch(/\S/);
      expect(topic.exampleNote, topic.id).toMatch(/\S/);
      expect(topic.level, topic.id).toBeGreaterThanOrEqual(2);
      expect(topic.availableInLab, topic.id).toBe(false);
      expect(topic.availableInChallenge, topic.id).toBe(false);
      expect(topic.presentationScene, topic.id).toBeNull();
      expect(topic.lesson, topic.id).toBeNull();
      expect(topic.keywords.length, topic.id).toBeGreaterThan(0);
      expect(topicAnchor(topic)).toBe(`tema-${topic.slug}`);
    }
  });

  it('prepara los temas pedidos de los niveles 2 a 7', () => {
    const titles = FUTURE_TOPICS.map(({ title }) => title);
    for (const required of [
      'UPPER',
      'LOWER',
      'INITCAP',
      'LENGTH',
      'SUBSTR',
      'ROUND',
      'TRUNC',
      'MOD',
      'SYSDATE',
      'ADD_MONTHS',
      'TO_CHAR',
      'TO_DATE',
      'TO_NUMBER',
      'NVL',
      'COALESCE',
      'COUNT',
      'SUM',
      'AVG',
      'MIN y MAX',
      'GROUP BY',
      'HAVING',
      'INNER JOIN',
      'LEFT OUTER JOIN',
      'RIGHT OUTER JOIN',
      'FULL OUTER JOIN',
      'CROSS JOIN',
      'ON y USING',
      'INSERT INTO',
      'UPDATE',
      'DELETE',
      'COMMIT y ROLLBACK',
      'CREATE TABLE',
      'ALTER TABLE',
      'DROP TABLE',
      'PRIMARY KEY',
      'FOREIGN KEY',
      'NOT NULL',
      'UNIQUE',
      'CHECK',
      'DEFAULT',
    ]) {
      expect(titles, required).toContain(required);
    }
    const levels = upcomingLevels();
    expect(levels).toHaveLength(6);
    for (const level of levels) expect(level.topics.length, level.title).toBeGreaterThan(0);
  });

  it('UPDATE y DELETE advierten el riesgo sin WHERE y las transacciones están contempladas', () => {
    const topic = (slug: string) => FUTURE_TOPICS.find((entry) => entry.slug === slug)!;
    expect(topic('update').warning).toMatch(/sin WHERE/);
    expect(topic('delete').warning).toMatch(/sin WHERE/);
    for (const slug of ['insert', 'update', 'delete', 'commit-rollback']) {
      expect(topic(slug).before, slug).toMatch(/\S/);
      expect(topic(slug).after, slug).toMatch(/\S/);
    }
    expect(topic('commit-rollback').warning).toMatch(/DDL/);
  });

  it('los ejemplos futuros usan columnas de EMPLEADOS o tablas anunciadas', () => {
    const columns = new Set(EMPLEADOS_DATASET.columns.map(({ name }) => name as string));
    const allowed = new Set([
      ...columns,
      'EMPLEADOS',
      'DEPARTAMENTOS',
      'SEDE',
      'PRESUPUESTO',
      'TELEFONO',
      'E',
      'J',
      'D',
      'JEFE',
    ]);
    const sqlWords = new Set(
      'SELECT FROM WHERE AND OR NOT IN IS NULL AS ORDER BY ASC DESC GROUP HAVING JOIN INNER LEFT RIGHT FULL OUTER CROSS ON USING INSERT INTO VALUES UPDATE SET DELETE COMMIT ROLLBACK CREATE TABLE ALTER ADD DROP PRIMARY KEY REFERENCES UNIQUE CHECK DEFAULT DATE NUMBER VARCHAR2 CHAR LIKE BETWEEN SYSDATE'.split(
        ' ',
      ),
    );
    const functions = new Set(FUNCTION_TOPICS.keys());
    for (const topic of FUTURE_TOPICS) {
      const words =
        topic.example
          .replace(/'(?:[^']|'')*'/g, ' ')
          .toUpperCase()
          .match(/\b[A-Z_][A-Z0-9_]*\b/g) ?? [];
      for (const word of words) {
        const known = allowed.has(word) || sqlWords.has(word) || functions.has(word);
        // Alias de columna del resultado: después de AS, o nombres en minúsculas del ejemplo.
        const alias = new RegExp(`AS\\s+${word}\\b`, 'i').test(topic.example);
        expect(known || alias, `${topic.id}: ${word}`).toBe(true);
      }
    }
  });

  it('todo tema futuro citado por el laboratorio tiene su ficha y destino real', () => {
    const referenced = [
      ...FUTURE_KEYWORDS.values(),
      ...FUNCTION_TOPICS.values(),
      ...FORBIDDEN_STATEMENTS.values(),
    ]
      .map(({ topic }) => topic)
      .filter((topic): topic is string => topic !== null);
    for (const topic of new Set(referenced)) {
      expect(futureTopicHref(topic), topic).toBe(`/modules#tema-${topic}`);
    }
    expect(futureTopicHref('no-existe')).toBeNull();
  });
});
