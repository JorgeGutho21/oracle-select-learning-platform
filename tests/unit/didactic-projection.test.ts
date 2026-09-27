import { describe, expect, it } from 'vitest';
import {
  CONCEPT_PROJECTIONS,
  conceptProjection,
  type ConceptProjectionId,
} from '@/application/didactic-projection';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { runEducational } from '@/domain/sql/educational-run';

/**
 * Proyecciones didácticas: cada escena muestra una parte pequeña y coherente del dataset real
 * (sin datos inventados) y el resultado de la consulta sobre esas mismas filas.
 */

const IDS = Object.keys(CONCEPT_PROJECTIONS) as ConceptProjectionId[];

describe('proyección didáctica sobre EMPLEADOS', () => {
  it('el dataset real sigue completo: 20 filas, 12 columnas, empleados-select-v2', () => {
    expect(EMPLEADOS_DATASET.id).toBe('empleados-select-v2');
    expect(EMPLEADOS_DATASET.rows).toHaveLength(20);
    expect(EMPLEADOS_DATASET.columns).toHaveLength(12);
  });

  it.each(IDS)('%s: consulta válida, muestra compacta y partes presentes en el SQL', (id) => {
    const spec = CONCEPT_PROJECTIONS[id];
    expect(runEducational(spec.sql).analysis.ok, spec.sql).toBe(true);
    // Solo las columnas del concepto (SELECT * enseña precisamente las 12).
    if (id !== 'star') expect(spec.columns.length).toBeLessThanOrEqual(7);
    expect(spec.sampleIds.length).toBeGreaterThanOrEqual(2);
    expect(spec.sampleIds.length).toBeLessThanOrEqual(6);
    for (const sampleId of spec.sampleIds) {
      expect(EMPLEADOS_DATASET.rows.some((row) => row.ID_EMPLEADO === sampleId)).toBe(true);
    }
    const flat = spec.sql.replace(/\s+/g, ' ');
    for (const part of spec.parts) expect(flat, part.code).toContain(part.code);
    expect(spec.purpose.length).toBeGreaterThan(20);
  });

  it.each(IDS)('%s: origen y resultado salen de las mismas filas reales', (id) => {
    const projection = conceptProjection(id);
    const spec = CONCEPT_PROJECTIONS[id];
    const { source, result } = projection.sample;
    expect(source.rows).toHaveLength(spec.sampleIds.length);
    expect(source.columns.map(({ name }) => name)).toEqual([...spec.columns]);
    // Cada fila de origen es la fila real del dataset, sin cambios.
    source.rows.forEach((row, index) => {
      const real = EMPLEADOS_DATASET.rows.find(
        (entry) => entry.ID_EMPLEADO === spec.sampleIds[index],
      );
      spec.columns.forEach((column, position) => expect(row[position]).toBe(real![column]));
    });
    expect(result).not.toBeNull();
    expect(result!.rows.length).toBeLessThanOrEqual(source.rows.length);
    // El recuento de la tabla completa es el del motor sobre las 20 filas.
    expect(projection.full.rows).toBe(20);
    expect(projection.full.result).toBe(runEducational(spec.sql).result!.table.rows.length);
    expect(projection.keyIdea.length).toBeGreaterThan(10);
    expect(projection.parts.every((part) => part.text.length > 3)).toBe(true);
  });

  it('en los filtros la muestra tiene filas que cumplen y filas que no', () => {
    for (const id of IDS) {
      const { sample } = conceptProjection(id);
      if (!sample.clauses.where) continue;
      const states = sample.source.rowStates ?? [];
      expect(states, id).toContain('kept');
      expect(states, id).toContain('discarded');
    }
  });

  it('otra consulta sobre la misma muestra (orden de columnas, sin alias)', () => {
    const swapped = conceptProjection('columns', { sql: 'SELECT ciudad, nombre\nFROM empleados;' });
    expect(swapped.sample.result!.columns.map(({ name }) => name)).toEqual(['CIUDAD', 'NOMBRE']);
    expect(swapped.sample.result!.rows).toHaveLength(CONCEPT_PROJECTIONS.columns.sampleIds.length);
  });
});
