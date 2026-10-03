import type { ConceptId } from '@/application/sql-concepts';
import type { EmpleadosColumn, MissionId } from '../application/challenge-api';

/**
 * Densidad propia del Challenge: cada misión razona sobre una MUESTRA DE TRABAJO pequeña
 * (hasta 8 registros y 3–4 columnas relevantes; 5 como máximo), nunca sobre la tabla
 * EMPLEADOS completa. La tabla completa (20 × 12) queda como consulta secundaria y la misión
 * se resuelve sin abrirla. Los conceptos provienen de la fuente conceptual canónica, la
 * misma de la exposición y los recursos.
 */

/** Como mucho, registros y columnas de una muestra de trabajo. */
export const SAMPLE_LIMITS = { rows: 8, columns: 5 } as const;

export interface MissionSampleSpec {
  /** Columnas relevantes para la misión, en el orden de la tabla. */
  readonly columns: readonly EmpleadosColumn[];
  /** Registros de la muestra (ID_EMPLEADO). */
  readonly rowIds: readonly number[];
  /** Qué registros son («Analistas de EMPLEADOS»). */
  readonly title?: string;
  /** Aclaración breve de la muestra. */
  readonly note?: string;
}

export interface MissionContext {
  readonly concepts: readonly ConceptId[];
  /**
   * Muestra de trabajo junto al pedido. `null` cuando la propia interacción es la tabla de
   * trabajo (M04 marca filas en ella) o la misión trabaja con el esquema (M03).
   */
  readonly sample: MissionSampleSpec | null;
  /** Esquema compacto de EMPLEADOS: 3 × 4 en escritorio, por grupos en el móvil (M03). */
  readonly schema?: boolean;
}

export const MISSION_CONTEXT: Readonly<Record<MissionId, MissionContext>> = {
  M01: {
    concepts: ['select', 'column-list'],
    sample: {
      columns: ['NOMBRE', 'CIUDAD', 'SALARIO', 'CORREO'],
      rowIds: [1, 3, 4, 6, 9, 13],
      note: 'Tu resultado se calcula sobre estas mismas filas.',
    },
  },
  M02: {
    concepts: ['select', 'from'],
    sample: {
      columns: ['NOMBRE', 'CARGO', 'CIUDAD', 'SALARIO'],
      rowIds: [1, 2, 3, 4, 5, 6],
    },
  },
  M03: { concepts: ['star'], sample: null, schema: true },
  M04: { concepts: ['where', 'comparison'], sample: null },
  M05: {
    concepts: ['expression', 'arithmetic-precedence'],
    sample: { columns: ['NOMBRE', 'SALARIO', 'BONO'], rowIds: [1, 2, 3, 6] },
  },
  M06: {
    concepts: ['alias', 'as'],
    sample: { columns: ['NOMBRE', 'SALARIO'], rowIds: [1, 2, 3, 6] },
  },
  M07: {
    concepts: ['distinct'],
    sample: {
      title: 'Analistas de EMPLEADOS',
      columns: ['NOMBRE', 'CIUDAD', 'DEPARTAMENTO'],
      rowIds: [6, 7, 8, 13, 14, 17],
      note: "Son las filas de WHERE cargo = 'Analista': todos los analistas de la tabla.",
    },
  },
  M08: { concepts: [], sample: null },
  M09: {
    concepts: ['where', 'and', 'in', 'order-by'],
    sample: {
      columns: ['NOMBRE', 'CIUDAD', 'SALARIO'],
      rowIds: [1, 3, 4, 6, 8, 10, 11, 13],
      note: 'La consulta se corrige sobre la tabla completa; esta muestra basta para razonar.',
    },
  },
  M10: {
    concepts: ['where', 'as', 'order-by'],
    sample: {
      columns: ['NOMBRE', 'CIUDAD', 'SALARIO', 'ESTADO'],
      rowIds: [1, 2, 4, 8, 10, 11, 14, 16],
      note: 'Vista previa: Oracle evalúa la tabla completa.',
    },
  },
};
