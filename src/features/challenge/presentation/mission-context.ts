import type { ConceptId } from '@/application/sql-concepts';
import type { EmpleadosColumn, MissionId } from '../application/challenge-api';

/**
 * Densidad propia del Challenge: cada misión muestra solo los datos que necesita para
 * razonar (4–7 columnas y pocas filas), nunca la tabla EMPLEADOS completa por defecto. La
 * tabla completa queda como consulta secundaria («Ver tabla completa»). Los conceptos
 * provienen de la fuente conceptual canónica, la misma de la exposición y los recursos.
 */

export interface MissionDataSpec {
  /** Columnas relevantes para la misión, en el orden de la tabla. */
  readonly columns: readonly EmpleadosColumn[];
  /**
   * Filas de la vista previa (ID_EMPLEADO), a todo el ancho bajo la misión. Vacío: solo el
   * esquema de las columnas.
   */
  readonly rowIds: readonly number[];
  /** Filas con que trabaja la interacción cuando no hay vista previa (muestra de M04). */
  readonly rowCount?: number;
  /** Aclaración de la vista («Vista previa: Oracle evalúa la tabla completa»). */
  readonly note?: string;
  /** Muestra el esquema completo numerado (M03). */
  readonly fullSchema?: boolean;
}

export interface MissionContext {
  readonly concepts: readonly ConceptId[];
  readonly data: MissionDataSpec;
}

export const MISSION_CONTEXT: Readonly<Record<MissionId, MissionContext>> = {
  M01: {
    concepts: ['select', 'column-list'],
    data: {
      columns: ['ID_EMPLEADO', 'NOMBRE', 'APELLIDO', 'DEPARTAMENTO', 'CIUDAD', 'SALARIO', 'BONO'],
      rowIds: [],
      note: 'Las columnas que eliges se marcan aquí y la vista previa muestra tu resultado.',
    },
  },
  M02: {
    concepts: ['select', 'from', 'where'],
    data: { columns: ['NOMBRE', 'DEPARTAMENTO', 'CIUDAD'], rowIds: [] },
  },
  M03: {
    concepts: ['star'],
    data: {
      columns: [],
      rowIds: [],
      fullSchema: true,
      note: 'EMPLEADOS tiene 20 filas. El esquema lista sus columnas en el orden de la tabla.',
    },
  },
  M04: {
    concepts: ['where', 'comparison'],
    data: {
      columns: ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'SALARIO'],
      rowIds: [],
      rowCount: 10,
      note: 'Trabajas sobre una muestra de 10 de los 20 registros: la respuesta depende solo de las filas visibles.',
    },
  },
  M05: {
    concepts: ['expression', 'arithmetic-precedence'],
    data: { columns: ['NOMBRE', 'SALARIO', 'BONO'], rowIds: [1, 9, 18] },
  },
  M06: {
    concepts: ['alias', 'as'],
    data: {
      columns: ['NOMBRE', 'SALARIO'],
      rowIds: [],
      note: 'El alias solo cambia el encabezado del resultado: estas columnas no cambian.',
    },
  },
  M07: {
    concepts: ['distinct'],
    data: {
      columns: ['DEPARTAMENTO', 'CIUDAD'],
      rowIds: [],
      note: 'Sin DISTINCT, la consulta devuelve una fila por cada empleado de Bogotá.',
    },
  },
  M08: {
    concepts: ['column-list', 'alias'],
    data: { columns: ['NOMBRE', 'SALARIO'], rowIds: [] },
  },
  M09: {
    concepts: ['order-by', 'desc'],
    data: {
      columns: ['NOMBRE', 'CIUDAD', 'SALARIO', 'BONO'],
      rowIds: [],
      note: 'La consulta trabaja con los 20 empleados.',
    },
  },
  M10: {
    concepts: ['where', 'as', 'order-by'],
    data: {
      columns: ['NOMBRE', 'CARGO', 'CIUDAD', 'SALARIO', 'ESTADO'],
      rowIds: [1, 2, 3, 5, 6, 8, 10, 14],
      note: 'Vista previa: Oracle evalúa la tabla completa de 20 filas.',
    },
  },
};
