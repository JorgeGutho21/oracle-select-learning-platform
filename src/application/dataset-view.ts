import {
  EMPLEADOS_DATASET,
  EMPLEADOS_FIELD_GROUPS,
  EMPLEADOS_PRIORITY_COLUMNS,
} from '@/domain/dataset/empleados';

/**
 * Cómo se presentan los registros de EMPLEADOS cuando una tabla no cabe: título con nombre
 * y apellido, número de empleado, cargo, campos prioritarios y el resto por grupos.
 */
export const EMPLEADOS_VIEW_SCHEMA = {
  titleColumns: ['NOMBRE', 'APELLIDO'],
  idColumn: 'ID_EMPLEADO',
  subtitleColumn: 'CARGO',
  priorityColumns: EMPLEADOS_PRIORITY_COLUMNS,
  fieldGroups: EMPLEADOS_FIELD_GROUPS,
} as const;

export const EMPLEADOS_FIELD_GROUP_LIST = EMPLEADOS_FIELD_GROUPS;

/** Columnas de EMPLEADOS con su tipo Oracle, para fichas de esquema. */
export const EMPLEADOS_SCHEMA_COLUMNS = EMPLEADOS_DATASET.columns;
