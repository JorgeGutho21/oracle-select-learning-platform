import { EMPLEADOS_DATASET, EMPLEADOS_FIELD_GROUPS } from '@/domain/dataset/empleados';

/**
 * Cómo se muestran las filas de EMPLEADOS cuando la tabla completa no cabe: ID_EMPLEADO y
 * NOMBRE identifican cada fila y las demás columnas se reparten en grupos de dos, así que en
 * un móvil hay como mucho cuatro columnas a la vez. Los grupos siguen el orden de la tabla.
 */
export const EMPLEADOS_TAB_GROUPS = [
  { title: 'Identidad', columns: ['APELLIDO', 'CARGO'] },
  { title: 'Organización', columns: ['DEPARTAMENTO', 'CIUDAD'] },
  { title: 'Compensación', columns: ['SALARIO', 'BONO'] },
  { title: 'Empleo', columns: ['FECHA_INGRESO', 'ESTADO'] },
  { title: 'Contacto y jefe', columns: ['CORREO', 'ID_JEFE'] },
] as const;

export const EMPLEADOS_VIEW_SCHEMA = {
  idColumn: 'ID_EMPLEADO',
  nameColumn: 'NOMBRE',
  tabGroups: EMPLEADOS_TAB_GROUPS,
} as const;

/** Grupos semánticos de las 12 columnas (esquema, escena del dataset y Estudio). */
export const EMPLEADOS_FIELD_GROUP_LIST = EMPLEADOS_FIELD_GROUPS;

/** Columnas de EMPLEADOS con su tipo Oracle, para fichas de esquema. */
export const EMPLEADOS_SCHEMA_COLUMNS = EMPLEADOS_DATASET.columns;
