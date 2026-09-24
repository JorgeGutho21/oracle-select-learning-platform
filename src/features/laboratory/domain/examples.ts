/** Ejemplos del laboratorio: casos de aceptación LAB01–LAB10 de LAB_SPEC.md. */

export interface LabExample {
  readonly id: string;
  readonly title: string;
  readonly sql: string;
}

export const LAB_EXAMPLES: readonly LabExample[] = Object.freeze([
  { id: 'LAB01', title: 'Todas las columnas', sql: 'SELECT *\nFROM empleados;' },
  { id: 'LAB02', title: 'Columnas en otro orden', sql: 'select ciudad, nombre\nfrom EMPLEADOS' },
  {
    id: 'LAB03',
    title: 'Cálculo con alias',
    sql: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
  },
  { id: 'LAB04', title: 'Ciudades sin repetir', sql: 'SELECT DISTINCT ciudad\nFROM empleados;' },
  {
    id: 'LAB05',
    title: 'Combinaciones únicas',
    sql: 'SELECT DISTINCT ciudad, depto\nFROM empleados;',
  },
  {
    id: 'LAB06',
    title: 'Precedencia sin paréntesis',
    sql: 'SELECT salario + 100000 * 12 AS total\nFROM empleados;',
  },
  {
    id: 'LAB07',
    title: 'Precedencia con paréntesis',
    sql: 'SELECT (salario + 100000) * 12 AS total\nFROM empleados;',
  },
  { id: 'LAB08', title: 'División', sql: 'SELECT salario / 2 AS mitad\nFROM empleados;' },
  {
    id: 'LAB09',
    title: 'Alias entre comillas',
    sql: 'SELECT nombre AS "Nombre empleado"\nFROM empleados;',
  },
  { id: 'LAB10', title: 'Coma ausente', sql: 'SELECT nombre salario\nFROM empleados;' },
]);

export const DEFAULT_LAB_SQL = 'SELECT nombre, salario\nFROM empleados;';
