// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CONCEPT_CATEGORY_LABEL, CONCEPT_IDS, SQL_CONCEPTS } from '@/application/sql-concepts';
import { analyzeLabQuery } from '@/features/laboratory/application/lab-api';
import { publicCatalog } from '@/features/search/domain/public-catalog';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { LESSONS, lessonDefinition } from '@/features/study/application/study-api';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe('fuente conceptual única', () => {
  it('cada concepto tiene una definición breve y una idea clave de una línea', () => {
    for (const id of CONCEPT_IDS) {
      const concept = SQL_CONCEPTS[id];
      expect(words(concept.definition), id).toBeLessThanOrEqual(25);
      expect(concept.definition, id).toMatch(/\.$/);
      expect(words(concept.keyTakeaway), id).toBeLessThanOrEqual(16);
      expect(concept.humanReading.length, id).toBeGreaterThan(10);
      expect(CONCEPT_CATEGORY_LABEL[concept.category], id).toBeTruthy();
    }
  });

  it('clasifica los términos: cláusulas, operadores, condiciones y comodines', () => {
    const category = (id: keyof typeof SQL_CONCEPTS) =>
      CONCEPT_CATEGORY_LABEL[SQL_CONCEPTS[id].category];
    expect(category('select')).toBe('Cláusula');
    expect(category('where')).toBe('Cláusula');
    expect(category('order-by')).toBe('Cláusula');
    expect(category('distinct')).toBe('Palabra clave');
    expect(category('as')).toBe('Palabra clave de alias');
    expect(category('and')).toBe('Operador lógico');
    expect(category('not')).toBe('Operador lógico');
    expect(category('between')).toBe('Condición');
    expect(category('in')).toBe('Condición');
    expect(category('like')).toBe('Condición');
    expect(category('is-null')).toBe('Condición');
    expect(category('asc')).toBe('Opción de ordenamiento');
    expect(category('star')).toBe('Comodín en SELECT');
    expect(category('percent')).toBe('Comodín en LIKE');
    expect(category('underscore')).toBe('Comodín en LIKE');
    expect(category('concat')).toBe('Operador de concatenación');
    expect(category('comparison')).toBe('Operadores de comparación');
  });

  it('los ejemplos y las correcciones son SQL válido del motor; los errores no', () => {
    for (const id of CONCEPT_IDS) {
      const concept = SQL_CONCEPTS[id];
      expect(analyzeLabQuery(concept.example).status, `${id}: ${concept.example}`).toBe('valid');
      if (concept.mistake) {
        expect(analyzeLabQuery(concept.mistake.right).status, `${id}: corrección`).toBe('valid');
        const wrong = analyzeLabQuery(concept.mistake.wrong);
        // Un error de la unidad o una advertencia (la coma olvidada es SQL válido con alias).
        expect(wrong.status === 'invalid' || wrong.diagnostics.length > 0, `${id}: error`).toBe(
          true,
        );
      }
    }
  });

  it('cada concepto remite a una lección existente', () => {
    const slugs = new Set(LESSON_INDEX.map(({ slug }) => slug));
    for (const id of CONCEPT_IDS) expect(slugs.has(SQL_CONCEPTS[id].lesson), id).toBe(true);
  });

  it('Estudio y buscador muestran la misma definición que la Exposición y los Recursos', () => {
    for (const lesson of LESSONS) {
      if (!lesson.concept) continue;
      const primary = SQL_CONCEPTS[lesson.concept.concepts[0]];
      expect(lessonDefinition(lesson), lesson.slug).toBe(primary.definition);
      const concept = publicCatalog.find((entry) => entry.id === `concept-${lesson.slug}`);
      expect(concept?.description, lesson.slug).toBe(primary.definition);
      const lessonEntry = publicCatalog.find((entry) => entry.id === `lesson-${lesson.slug}`);
      expect(lessonEntry?.description, lesson.slug).toBe(primary.definition);
    }
  });

  it('NULL respeta a Oracle: el texto vacío también es NULL', () => {
    expect(SQL_CONCEPTS.null.definition).not.toMatch(/vac[ií]/);
    expect(SQL_CONCEPTS.null.oracleNote).toMatch(/texto vacío/);
  });
});
