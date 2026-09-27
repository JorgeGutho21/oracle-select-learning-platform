import {
  CONCEPT_PROJECTIONS,
  type ConceptProjectionId,
  type ConceptProjectionSpec,
} from '@/domain/concepts/concept-projections';
import { SQL_CONCEPTS, type ConceptId } from '@/domain/concepts/sql-concepts';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { explainQuery, type ExplainedQuery } from '@/features/laboratory/application/lab-api';

/**
 * Proyección didáctica: la simplificación ocurre solo en lo que se MUESTRA. La consulta se
 * ejecuta con el motor educativo sobre las filas de muestra de EMPLEADOS (el mismo dataset
 * que Oracle), de modo que la tabla de origen, las marcas «cumple / no cumple» y el
 * resultado visibles son coherentes entre sí; aparte se informa del recuento en la tabla
 * completa de 20 filas.
 */

export type {
  ConceptProjectionId,
  ConceptProjectionSpec,
} from '@/domain/concepts/concept-projections';
export { CONCEPT_PROJECTIONS } from '@/domain/concepts/concept-projections';

export interface ProjectedPart {
  readonly code: string;
  readonly concept: ConceptId;
  /** Nombre del concepto («WHERE», «Alias»). */
  readonly title: string;
  /** Qué hace esta parte: la glosa de la fuente conceptual o el detalle de la consulta. */
  readonly text: string;
}

export interface ConceptProjection {
  readonly spec: ConceptProjectionSpec;
  readonly sql: string;
  /** Origen (filas de muestra con su estado) y resultado calculado sobre esas mismas filas. */
  readonly sample: ExplainedQuery;
  /** Recuentos sobre la tabla completa. */
  readonly full: { readonly rows: number; readonly result: number };
  readonly parts: readonly ProjectedPart[];
  readonly keyIdea: string;
}

function sampleDataset(ids: readonly number[]) {
  return {
    ...EMPLEADOS_DATASET,
    rows: EMPLEADOS_DATASET.rows.filter((row) => ids.includes(row.ID_EMPLEADO)),
  };
}

/** Proyecta una especificación; `sql` permite comparar otra consulta sobre la misma muestra. */
export function projectConcept(
  spec: ConceptProjectionSpec,
  options: { readonly sql?: string } = {},
): ConceptProjection {
  const sql = options.sql ?? spec.sql;
  const sample = explainQuery(sql, {
    dataset: sampleDataset(spec.sampleIds),
    sourceColumns: spec.columns,
  });
  const full = explainQuery(sql);
  return {
    spec,
    sql,
    sample,
    full: { rows: full.counts.source, result: full.counts.result },
    parts: spec.parts.map((part) => ({
      code: part.code,
      concept: part.concept,
      title: SQL_CONCEPTS[part.concept].title,
      text: part.detail ?? SQL_CONCEPTS[part.concept].gloss,
    })),
    keyIdea: spec.keyIdea ?? SQL_CONCEPTS[spec.concept].keyTakeaway,
  };
}

export function conceptProjection(
  id: ConceptProjectionId,
  options: { readonly sql?: string } = {},
): ConceptProjection {
  return projectConcept(CONCEPT_PROJECTIONS[id], options);
}
