import { lines, query, source } from '../../builders';
import type { CurriculumExample } from '../../types';

/**
 * Sección 2: consultas propias del banco de evaluación (S2-B-*). No aparecen en las lecciones
 * para que la evaluación no repita los ejemplos estudiados, pero salen de la misma fuente y se
 * verifican igual: Oracle real y comprobación cruzada en PostgreSQL. El banco
 * (features/assessments) toma de aquí sus tablas de resultado.
 */

const EMP = ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'] as const;
const DEP = ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'] as const;
const PRO = ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO'] as const;
const ASI = ['ID_EMPLEADO', 'ID_PROYECTO', 'ROL', 'HORAS_SEMANALES'] as const;

export const S2_ASSESSMENT_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- JOIN ---------- */
  query(
    'S2-B-INNER-CUATRO',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.id_empleado IN (5, 13, 18, 20)',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP, [5, 13, 18, 20]), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-LEFT-CUATRO',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'LEFT JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.id_empleado IN (5, 13, 18, 20)',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP, [5, 13, 18, 20]), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-PROY-DEPTO',
    lines(
      'SELECT p.nombre_proyecto, d.nombre_departamento',
      'FROM proyectos p',
      'JOIN departamentos d',
      '  ON p.id_departamento = d.id_departamento',
      'ORDER BY p.id_proyecto;',
    ),
    [source('PROYECTOS', PRO), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-PROY-ON-MAL',
    lines(
      'SELECT p.nombre_proyecto, d.nombre_departamento',
      'FROM proyectos p',
      'JOIN departamentos d',
      '  ON p.id_proyecto = d.id_departamento',
      'ORDER BY p.id_proyecto;',
    ),
    [source('PROYECTOS', PRO), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-PROY-LEFT',
    lines(
      'SELECT p.nombre_proyecto, d.nombre_departamento',
      'FROM departamentos d',
      'LEFT JOIN proyectos p',
      '  ON p.id_departamento = d.id_departamento',
      'ORDER BY p.id_proyecto;',
    ),
    [source('PROYECTOS', PRO), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-PROY-CROSS',
    lines(
      'SELECT p.nombre_proyecto, d.nombre_departamento',
      'FROM proyectos p',
      'CROSS JOIN departamentos d',
      "WHERE d.sede = 'Cali'",
      'ORDER BY p.id_proyecto;',
    ),
    [source('PROYECTOS', PRO), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-TRES-105',
    lines(
      'SELECT e.nombre, a.rol',
      'FROM asignaciones a',
      'JOIN empleados e',
      '  ON a.id_empleado = e.id_empleado',
      'WHERE a.id_proyecto = 105',
      'ORDER BY e.nombre;',
    ),
    [source('ASIGNACIONES', ASI), source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE'])],
  ),

  /* ---------- Agregación ---------- */
  query(
    'S2-B-CIUDAD-ACTIVOS',
    lines(
      'SELECT ciudad, COUNT(*) AS activos',
      'FROM empleados',
      "WHERE estado = 'ACTIVO'",
      'GROUP BY ciudad',
      'ORDER BY ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'ESTADO', 'BONO'])],
  ),
  query(
    'S2-B-CIUDAD-TODOS',
    lines(
      'SELECT ciudad, COUNT(*) AS activos',
      'FROM empleados',
      'GROUP BY ciudad',
      'ORDER BY ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'ESTADO', 'BONO'])],
  ),
  query(
    'S2-B-CIUDAD-BONO',
    lines(
      'SELECT ciudad, COUNT(bono) AS activos',
      'FROM empleados',
      "WHERE estado = 'ACTIVO'",
      'GROUP BY ciudad',
      'ORDER BY ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'ESTADO', 'BONO'])],
  ),
  query(
    'S2-B-HORAS-COUNT',
    lines(
      'SELECT p.nombre_proyecto,',
      '       COUNT(*)               AS personas,',
      '       SUM(a.horas_semanales) AS horas',
      'FROM proyectos p',
      'JOIN asignaciones a',
      '  ON p.id_proyecto = a.id_proyecto',
      'GROUP BY p.nombre_proyecto',
      'HAVING COUNT(*) > 3',
      'ORDER BY horas DESC;',
    ),
    [source('PROYECTOS', PRO), source('ASIGNACIONES', ASI)],
  ),
  query(
    'S2-B-HORAS-TODOS',
    lines(
      'SELECT p.nombre_proyecto,',
      '       COUNT(*)               AS personas,',
      '       SUM(a.horas_semanales) AS horas',
      'FROM proyectos p',
      'JOIN asignaciones a',
      '  ON p.id_proyecto = a.id_proyecto',
      'GROUP BY p.nombre_proyecto',
      'ORDER BY horas DESC, p.nombre_proyecto;',
    ),
    [source('PROYECTOS', PRO), source('ASIGNACIONES', ASI)],
  ),

  /* ---------- Subconsultas ---------- */
  query(
    'S2-B-SIN-PROYECTO-LEFT',
    lines(
      'SELECT e.id_empleado, e.nombre',
      'FROM empleados e',
      'LEFT JOIN asignaciones a',
      '  ON e.id_empleado = a.id_empleado',
      'WHERE a.id_proyecto IS NULL',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']), source('ASIGNACIONES', ASI)],
  ),
  query(
    'S2-B-SIN-PROYECTO-EXISTS',
    lines(
      'SELECT e.id_empleado, e.nombre',
      'FROM empleados e',
      'WHERE NOT EXISTS (SELECT 1',
      '                  FROM asignaciones a',
      '                  WHERE a.id_empleado = e.id_empleado)',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']), source('ASIGNACIONES', ASI)],
  ),
  query(
    'S2-B-SIN-PROYECTO-INNER',
    lines(
      'SELECT e.id_empleado, e.nombre',
      'FROM empleados e',
      'JOIN asignaciones a',
      '  ON e.id_empleado = a.id_empleado',
      'WHERE a.id_proyecto IS NULL',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']), source('ASIGNACIONES', ASI)],
  ),
  query(
    'S2-B-CON-PROYECTO',
    lines(
      'SELECT id_empleado, nombre',
      'FROM empleados',
      'WHERE id_empleado IN (SELECT id_empleado',
      '                      FROM asignaciones)',
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']), source('ASIGNACIONES', ASI)],
  ),
  query(
    'S2-B-IN-TI',
    lines(
      'SELECT e.nombre',
      'FROM empleados e',
      'WHERE e.id_empleado IN (SELECT a.id_empleado',
      '                        FROM asignaciones a',
      '                        JOIN proyectos p',
      '                          ON a.id_proyecto = p.id_proyecto',
      '                        WHERE p.id_departamento = 20)',
      'ORDER BY e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('ASIGNACIONES', ASI),
      source('PROYECTOS', PRO),
    ],
  ),
  query(
    'S2-B-JOIN-TI',
    lines(
      'SELECT e.nombre',
      'FROM empleados e',
      'JOIN asignaciones a',
      '  ON e.id_empleado = a.id_empleado',
      'JOIN proyectos p',
      '  ON a.id_proyecto = p.id_proyecto',
      'WHERE p.id_departamento = 20',
      'ORDER BY e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('ASIGNACIONES', ASI),
      source('PROYECTOS', PRO),
    ],
  ),

  /* ---------- Conjuntos ---------- */
  query(
    'S2-B-CIUDAD-IN-SEDE',
    lines(
      'SELECT DISTINCT ciudad',
      'FROM empleados',
      'WHERE ciudad IN (SELECT sede FROM departamentos)',
      'ORDER BY ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']), source('DEPARTAMENTOS', DEP)],
  ),
  query(
    'S2-B-SEDE-MINUS',
    lines('SELECT sede FROM departamentos', 'MINUS', 'SELECT ciudad FROM empleados;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']), source('DEPARTAMENTOS', DEP)],
  ),
];
