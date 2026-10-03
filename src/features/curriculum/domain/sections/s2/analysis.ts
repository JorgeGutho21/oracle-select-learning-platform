import { lines, query, source } from '../../builders';
import type { CurriculumExample, CurriculumLesson } from '../../types';

/**
 * Sección 2, bloques 5 a 11: funciones de grupo, GROUP BY, HAVING, JOIN con agregaciones,
 * subconsultas, operadores de conjuntos e integración final.
 */

const EMP_DEP_SAL = ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'] as const;
const DEP_KEY = ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'] as const;

export const ANALYSIS_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloque 5: funciones de grupo ---------- */
  query(
    'S2-E-AGREGADOS',
    lines(
      'SELECT COUNT(*)           AS empleados,',
      '       SUM(salario)       AS nomina,',
      '       ROUND(AVG(salario)) AS promedio,',
      '       MIN(salario)       AS minimo,',
      '       MAX(salario)       AS maximo',
      'FROM empleados',
      "WHERE estado = 'ACTIVO';",
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ESTADO'])],
  ),
  query(
    'S2-E-FUNCION-FILA',
    lines(
      'SELECT nombre, UPPER(nombre) AS mayusculas',
      'FROM empleados',
      'WHERE id_departamento = 50',
      'ORDER BY nombre;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'], [5, 16, 17])],
  ),
  query(
    'S2-E-FUNCION-GRUPO',
    lines('SELECT COUNT(nombre) AS personas', 'FROM empleados', 'WHERE id_departamento = 50;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'], [5, 16, 17])],
  ),
  query(
    'S2-E-MIN-MAX-TEXTO',
    lines(
      'SELECT MIN(fecha_ingreso) AS primer_ingreso,',
      '       MAX(fecha_ingreso) AS ultimo_ingreso,',
      '       MIN(nombre)        AS primero_alfabetico',
      'FROM empleados;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'FECHA_INGRESO'])],
  ),
  query(
    'S2-E-COUNT-NULL',
    lines(
      'SELECT COUNT(*)                        AS filas,',
      '       COUNT(bono)                     AS con_bono,',
      '       COUNT(DISTINCT id_departamento) AS departamentos,',
      '       SUM(bono)                       AS total_bonos,',
      '       ROUND(AVG(bono))                AS promedio_bono',
      'FROM empleados;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'BONO'])],
  ),
  query(
    'S2-E-AVG-NVL',
    lines(
      'SELECT ROUND(AVG(bono))         AS ignora_null,',
      '       ROUND(AVG(NVL(bono, 0))) AS null_como_cero',
      'FROM empleados;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'BONO'])],
  ),
  query(
    'S2-E-SIN-GRUPO',
    lines('SELECT id_departamento, COUNT(*)', 'FROM empleados;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'])],
    { expectError: 'ORA-00937' },
  ),

  /* ---------- Bloque 6: GROUP BY ---------- */
  query(
    'S2-E-GROUP',
    lines(
      'SELECT id_departamento,',
      '       COUNT(*)            AS empleados,',
      '       ROUND(AVG(salario)) AS promedio',
      'FROM empleados',
      'GROUP BY id_departamento',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', EMP_DEP_SAL)],
  ),
  query(
    'S2-E-GROUP-CARGO',
    lines(
      'SELECT cargo, COUNT(*) AS personas',
      'FROM empleados',
      'GROUP BY cargo',
      'ORDER BY personas DESC, cargo;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO'])],
  ),
  query(
    'S2-E-GROUP-DOS',
    lines(
      'SELECT id_departamento, estado, COUNT(*) AS personas',
      'FROM empleados',
      'WHERE id_departamento IS NOT NULL',
      'GROUP BY id_departamento, estado',
      'ORDER BY id_departamento, estado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
  ),
  query(
    'S2-E-GROUP-INCOMPLETO',
    lines('SELECT id_departamento, cargo, COUNT(*)', 'FROM empleados', 'GROUP BY id_departamento;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'ID_DEPARTAMENTO'])],
    { expectError: 'ORA-00979' },
  ),
  query(
    'S2-E-WHERE-AGREGADO',
    lines(
      'SELECT id_departamento, COUNT(*)',
      'FROM empleados',
      'WHERE COUNT(*) > 3',
      'GROUP BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'])],
    { expectError: 'ORA-00934' },
  ),

  /* ---------- Bloque 7: HAVING ---------- */
  query(
    'S2-E-HAVING',
    lines(
      'SELECT id_departamento, ROUND(AVG(salario)) AS promedio',
      'FROM empleados',
      'GROUP BY id_departamento',
      'HAVING AVG(salario) > 4500000',
      'ORDER BY promedio DESC;',
    ),
    [source('EMPLEADOS', EMP_DEP_SAL)],
  ),
  query(
    'S2-E-HAVING-COUNT',
    lines(
      'SELECT id_departamento, COUNT(*) AS empleados',
      'FROM empleados',
      'GROUP BY id_departamento',
      'HAVING COUNT(*) >= 4',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'])],
  ),
  query(
    'S2-E-PIPE-WHERE',
    lines(
      'SELECT id_empleado, nombre, id_departamento',
      'FROM empleados',
      "WHERE estado = 'ACTIVO'",
      'ORDER BY id_departamento, id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
  ),
  query(
    'S2-E-PIPE-GROUP',
    lines(
      'SELECT id_departamento, COUNT(*) AS activos',
      'FROM empleados',
      "WHERE estado = 'ACTIVO'",
      'GROUP BY id_departamento',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
  ),
  query(
    'S2-E-PIPELINE',
    lines(
      'SELECT id_departamento, COUNT(*) AS activos',
      'FROM empleados',
      "WHERE estado = 'ACTIVO'",
      'GROUP BY id_departamento',
      'HAVING COUNT(*) >= 3',
      'ORDER BY activos DESC, id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
  ),
  query(
    'S2-E-HAVING-SIN-WHERE',
    lines(
      'SELECT id_departamento, COUNT(*) AS personas',
      'FROM empleados',
      'GROUP BY id_departamento',
      'HAVING COUNT(*) >= 3',
      'ORDER BY personas DESC, id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
  ),

  /* ---------- Bloque 8: JOIN + agregaciones ---------- */
  query(
    'S2-E-JOIN-COUNT',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(e.id_empleado) AS empleados',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY empleados DESC, d.nombre_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-JOIN-COUNT-STAR',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*) AS empleados',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY empleados DESC, d.nombre_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-JOIN-AVG',
    lines(
      'SELECT d.nombre_departamento,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY promedio DESC;',
    ),
    [source('EMPLEADOS', EMP_DEP_SAL), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-PROYECTOS-HORAS',
    lines(
      'SELECT p.nombre_proyecto,',
      '       COUNT(*)               AS personas,',
      '       SUM(a.horas_semanales) AS horas',
      'FROM proyectos p',
      'JOIN asignaciones a',
      '  ON p.id_proyecto = a.id_proyecto',
      'GROUP BY p.nombre_proyecto',
      'HAVING SUM(a.horas_semanales) > 35',
      'ORDER BY horas DESC;',
    ),
    [
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO']),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO', 'HORAS_SEMANALES']),
    ],
  ),
  query(
    'S2-E-DEPTO-PROMEDIO',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING AVG(e.salario) > 4500000',
      'ORDER BY promedio DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),

  /* ---------- Bloque 9: subconsultas ---------- */
  query('S2-E-SUB-PROMEDIO', lines('SELECT AVG(salario) AS promedio', 'FROM empleados;'), [
    source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'SALARIO']),
  ]),
  query(
    'S2-E-SUB-AVG',
    lines(
      'SELECT nombre, salario',
      'FROM empleados',
      'WHERE salario > (SELECT AVG(salario)',
      '                 FROM empleados)',
      'ORDER BY salario DESC;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'SALARIO'])],
  ),
  query(
    'S2-E-SUB-VENTAS',
    lines(
      'SELECT nombre, cargo',
      'FROM empleados',
      'WHERE id_departamento = (SELECT id_departamento',
      '                         FROM departamentos',
      "                         WHERE nombre_departamento = 'Ventas')",
      'ORDER BY id_empleado;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'ID_DEPARTAMENTO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-E-SUB-VARIAS',
    lines(
      'SELECT nombre',
      'FROM empleados',
      'WHERE id_departamento = (SELECT id_departamento',
      '                         FROM departamentos',
      "                         WHERE sede = 'Bogotá');",
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
    { expectError: 'ORA-01427' },
  ),
  query(
    'S2-E-SUB-IN',
    lines(
      'SELECT nombre',
      'FROM empleados',
      'WHERE id_empleado IN (SELECT id_empleado',
      '                      FROM asignaciones',
      '                      WHERE id_proyecto = 101)',
      'ORDER BY nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
    ],
  ),
  query(
    'S2-E-SUB-IN-BOGOTA',
    lines(
      'SELECT nombre, id_departamento',
      'FROM empleados',
      'WHERE id_departamento IN (SELECT id_departamento',
      '                          FROM departamentos',
      "                          WHERE sede = 'Bogotá')",
      'ORDER BY id_departamento, nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-SIN-PROYECTO',
    lines(
      'SELECT id_empleado, nombre',
      'FROM empleados',
      'WHERE id_empleado NOT IN (SELECT id_empleado',
      '                          FROM asignaciones)',
      'ORDER BY id_empleado;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
    ],
  ),
  query(
    'S2-E-NOT-IN-NULL',
    lines(
      'SELECT nombre_departamento',
      'FROM departamentos',
      'WHERE id_departamento NOT IN (SELECT id_departamento',
      '                              FROM empleados);',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-NOT-IN-OK',
    lines(
      'SELECT nombre_departamento',
      'FROM departamentos',
      'WHERE id_departamento NOT IN (SELECT id_departamento',
      '                              FROM empleados',
      '                              WHERE id_departamento IS NOT NULL);',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-CORRELACIONADA',
    lines(
      'SELECT e.nombre, e.id_departamento, e.salario',
      'FROM empleados e',
      'WHERE e.salario > (SELECT AVG(i.salario)',
      '                   FROM empleados i',
      '                   WHERE i.id_departamento = e.id_departamento)',
      'ORDER BY e.id_departamento, e.salario DESC;',
    ),
    [source('EMPLEADOS', EMP_DEP_SAL)],
  ),
  query(
    'S2-E-NOT-EXISTS',
    lines(
      'SELECT p.nombre_proyecto',
      'FROM proyectos p',
      'WHERE NOT EXISTS (SELECT 1',
      '                  FROM asignaciones a',
      '                  WHERE a.id_proyecto = p.id_proyecto);',
    ),
    [
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO']),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
    ],
  ),
  query(
    'S2-E-NOT-EXISTS-DEPTO',
    lines(
      'SELECT d.nombre_departamento',
      'FROM departamentos d',
      'WHERE NOT EXISTS (SELECT 1',
      '                  FROM empleados e',
      '                  WHERE e.id_departamento = d.id_departamento);',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO']),
    ],
  ),

  /* ---------- Bloque 10: operadores de conjuntos ---------- */
  query(
    'S2-E-UNION',
    lines(
      'SELECT ciudad FROM empleados',
      'UNION',
      'SELECT sede FROM departamentos',
      'ORDER BY ciudad;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-UNION-PEQUENA',
    lines(
      'SELECT ciudad FROM empleados WHERE id_departamento = 50',
      'UNION',
      'SELECT sede FROM departamentos WHERE id_departamento IN (40, 50)',
      'ORDER BY ciudad;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'CIUDAD'], [5, 16, 17]),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'], [40, 50]),
    ],
  ),
  query(
    'S2-E-UNION-ALL',
    lines(
      'SELECT ciudad FROM empleados WHERE id_departamento = 50',
      'UNION ALL',
      'SELECT sede FROM departamentos WHERE id_departamento IN (40, 50)',
      'ORDER BY ciudad;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'CIUDAD'], [5, 16, 17]),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'], [40, 50]),
    ],
  ),
  query(
    'S2-E-UNION-COLUMNAS',
    lines(
      'SELECT nombre, ciudad FROM empleados',
      'UNION',
      'SELECT nombre_departamento FROM departamentos;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']), source('DEPARTAMENTOS', DEP_KEY)],
    { expectError: 'ORA-01789' },
  ),
  query(
    'S2-E-UNION-TIPOS',
    lines('SELECT nombre FROM empleados', 'UNION', 'SELECT id_departamento FROM departamentos;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']), source('DEPARTAMENTOS', DEP_KEY)],
    { expectError: 'ORA-01790' },
  ),
  query(
    'S2-E-INTERSECT',
    lines(
      'SELECT ciudad FROM empleados',
      'INTERSECT',
      'SELECT sede FROM departamentos',
      'ORDER BY ciudad;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-MINUS',
    lines('SELECT ciudad FROM empleados', 'MINUS', 'SELECT sede FROM departamentos;'),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-EXCEPT',
    lines('SELECT ciudad FROM empleados', 'EXCEPT', 'SELECT sede FROM departamentos;'),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-MINUS-PROYECTOS',
    lines(
      'SELECT id_empleado FROM empleados',
      'MINUS',
      'SELECT id_empleado FROM asignaciones',
      'ORDER BY id_empleado;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
    ],
  ),

  /* ---------- Bloque 11: integración ---------- */
  query(
    'S2-E-INT-1',
    lines(
      'SELECT d.nombre_departamento, e.nombre, e.salario, e.estado',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'ORDER BY d.nombre_departamento, e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-E-INT-2',
    lines(
      'SELECT d.nombre_departamento, e.nombre, e.salario',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'ORDER BY d.nombre_departamento, e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-E-INT-3',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'ORDER BY d.nombre_departamento;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-E-INT-FINAL',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING AVG(e.salario) > (SELECT AVG(salario)',
      '                         FROM empleados)',
      'ORDER BY promedio DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
];

export const ANALYSIS_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S2-L12',
    block: 'funciones-grupo',
    slug: 'funciones-de-grupo',
    title: 'Funciones de grupo: COUNT, SUM, AVG, MIN y MAX',
    shortTitle: 'Funciones de grupo',
    summary: 'Una función de grupo recibe muchas filas y devuelve un solo valor que las resume.',
    concepts: ['group-function', 'count', 'sum-avg', 'min-max'],
    purpose:
      'Responder preguntas de resumen: cuántas personas hay, cuánto suma la nómina, cuál es el salario promedio, el menor y el mayor.',
    syntax: lines(
      'SELECT COUNT(*), SUM(col), AVG(col), MIN(col), MAX(col)',
      'FROM tabla',
      '[WHERE condición];',
    ),
    explanation: [
      'En la Sección 1, UPPER(nombre) devolvía un valor por cada fila: es una función de una fila. COUNT(nombre) mira todas las filas y devuelve un solo número: es una función de grupo (o de agregación).',
      'SUM y AVG trabajan con números. MIN y MAX también sirven para textos (orden alfabético) y fechas (la más antigua y la más reciente). COUNT(*) cuenta filas.',
      'Si la consulta no tiene GROUP BY, todas las filas que pasan el WHERE forman un único grupo: el resultado tiene una sola fila.',
    ],
    example: {
      question: '¿Cuántas personas activas hay y cómo es su salario?',
      example: 'S2-E-AGREGADOS',
      reading:
        'Toma las filas de personas activas y las resume en una sola fila: cuántas son, la suma de sus salarios, el promedio redondeado, el mínimo y el máximo.',
      visual: { kind: 'group', table: 'EMPLEADOS', by: [] },
    },
    more: [
      {
        question: '¿En qué se diferencia una función de una fila de una de grupo?',
        example: 'S2-E-FUNCION-FILA',
        reading:
          'UPPER devuelve un valor por cada una de las tres personas; COUNT devuelve un único número para las tres.',
        visual: {
          kind: 'compare',
          other: 'S2-E-FUNCION-GRUPO',
          labels: ['Función de una fila', 'Función de grupo'],
        },
      },
      {
        question: 'Error: una columna suelta junto a una función de grupo.',
        example: 'S2-E-SIN-GRUPO',
        reading:
          'Sin GROUP BY, COUNT(*) devuelve un solo valor y Oracle no sabe qué ID_DEPARTAMENTO poner a su lado: ORA-00937.',
      },
      {
        question: 'MIN y MAX también sirven para fechas y textos.',
        example: 'S2-E-MIN-MAX-TEXTO',
        reading:
          'La fecha de ingreso más antigua, la más reciente y el primer nombre en orden alfabético.',
      },
    ],
    changed: [
      'Muchas filas se convierten en una sola fila de resumen.',
      'Las columnas del resultado ya no son de una persona: son cálculos sobre todas.',
    ],
    mistakes: [
      {
        title: 'Mezclar una columna normal con una función de grupo sin GROUP BY',
        why: 'SELECT id_departamento, COUNT(*) FROM empleados da ORA-00937: Oracle no sabe qué ID_DEPARTAMENTO mostrar junto a un único total.',
        wrong: 'SELECT id_departamento, COUNT(*) FROM empleados;',
        right: 'SELECT id_departamento, COUNT(*) FROM empleados GROUP BY id_departamento;',
      },
    ],
    check: {
      id: 'S2-L12-C',
      kind: 'count',
      lesson: 'S2-L12',
      prompt:
        'La consulta de resumen de personas activas usa cinco funciones de grupo y no tiene GROUP BY. ¿Cuántas filas devuelve?',
      context: { example: 'S2-E-AGREGADOS' },
      hints: [
        'Sin GROUP BY, todas las filas forman un solo grupo.',
        'Cada grupo produce exactamente una fila de resultado.',
      ],
      explanation: 'Una: sin GROUP BY todas las filas son un único grupo y cada grupo da una fila.',
    },
    keyIdea: 'Función de una fila: un valor por fila. Función de grupo: un valor por grupo.',
    topic: 'agregacion',
    version: 1,
  },
  {
    id: 'S2-L13',
    block: 'funciones-grupo',
    slug: 'count-y-null',
    title: 'COUNT(*), COUNT(columna) y los NULL',
    shortTitle: 'COUNT y NULL',
    summary:
      'COUNT(*) cuenta filas; COUNT(columna) y las demás funciones de grupo ignoran los NULL.',
    concepts: ['count', 'sum-avg'],
    purpose:
      'Evitar promedios y conteos engañosos cuando hay datos vacíos, como los bonos sin asignar.',
    syntax: lines(
      'COUNT(*)            -- filas',
      'COUNT(columna)      -- valores no NULL',
      'COUNT(DISTINCT col) -- valores distintos no NULL',
    ),
    explanation: [
      'COUNT(*) cuenta filas, tengan o no NULL. COUNT(bono) cuenta solo las filas con un bono registrado. COUNT(DISTINCT id_departamento) cuenta los departamentos distintos.',
      'SUM, AVG, MIN y MAX también ignoran los NULL. Por eso AVG(bono) es el promedio entre quienes tienen bono, no entre todas las personas. Si un NULL debe contar como 0, se convierte antes con NVL(bono, 0).',
      'Un bono de 0 no es NULL: Mario Soto tiene bono 0 y sí cuenta en COUNT(bono).',
    ],
    example: {
      question: '¿Cuántos empleados hay, cuántos tienen bono y cuál es el bono promedio?',
      example: 'S2-E-COUNT-NULL',
      reading:
        'Cuenta todas las filas, las que tienen bono y los departamentos distintos; suma y promedia los bonos registrados.',
      visual: { kind: 'group', table: 'EMPLEADOS', by: [] },
    },
    more: [
      {
        question: '¿Qué cambia si los NULL cuentan como 0?',
        example: 'S2-E-AVG-NVL',
        reading:
          'AVG(bono) divide entre las 14 personas con bono; AVG(NVL(bono, 0)) divide entre las 20.',
      },
    ],
    changed: [
      'COUNT(*) y COUNT(bono) dan números distintos: hay seis bonos en NULL.',
      'El NULL de ID_DEPARTAMENTO no cuenta como un departamento más.',
    ],
    mistakes: [
      {
        title: 'Creer que AVG cuenta los NULL como cero',
        why: 'AVG ignora los NULL. Si la pregunta es «promedio por persona», hay que usar NVL(bono, 0).',
      },
      {
        title: 'Contar con COUNT(columna) cuando se quieren filas',
        why: 'Si la columna admite NULL, COUNT(columna) puede dar menos que el número de filas.',
      },
    ],
    check: {
      id: 'S2-L13-C',
      kind: 'choice',
      lesson: 'S2-L13',
      prompt:
        'De 20 empleados, 14 tienen bono (uno de ellos, 0) y 6 tienen NULL. ¿Qué devuelve COUNT(bono)?',
      options: [
        {
          text: '14',
          correct: true,
          feedback: 'Correcto: cuenta los bonos registrados, incluido el 0.',
        },
        {
          text: '13',
          correct: false,
          feedback: 'El bono 0 es un valor registrado, no NULL: sí se cuenta.',
        },
        { text: '20', correct: false, feedback: 'Eso es COUNT(*): cuenta filas, no valores.' },
        {
          text: '6',
          correct: false,
          feedback: 'Esos son los NULL, justamente los que COUNT(bono) ignora.',
        },
      ],
      hints: ['COUNT(columna) ignora los NULL.', '¿Es 0 lo mismo que NULL?'],
      explanation: 'COUNT(bono) cuenta los 14 valores no NULL; el 0 de Mario es un valor.',
    },
    keyIdea: 'COUNT(*) cuenta filas; COUNT(col), SUM y AVG ignoran los NULL.',
    topic: 'agregacion',
    version: 1,
  },
  {
    id: 'S2-L14',
    block: 'group-by',
    slug: 'group-by',
    title: 'GROUP BY: un resumen por grupo',
    shortTitle: 'GROUP BY',
    summary:
      'GROUP BY reúne las filas con el mismo valor y la función de grupo se calcula en cada grupo.',
    concepts: ['group-by'],
    purpose:
      'Pasar de un total a un resumen por categoría: empleados y salario promedio por departamento, personas por cargo.',
    syntax: lines(
      'SELECT columna_de_grupo, FUNCION(columna)',
      'FROM tabla',
      'GROUP BY columna_de_grupo;',
    ),
    explanation: [
      'Primero Oracle reparte las filas en grupos: todas las de ID_DEPARTAMENTO = 10 en uno, las de 20 en otro… Después calcula COUNT, AVG o la función pedida dentro de cada grupo.',
      'El resultado tiene una fila por grupo. En el SELECT solo pueden aparecer las columnas del GROUP BY y funciones de grupo.',
      'Los NULL forman su propio grupo: Esteban, sin departamento, aparece como un grupo con ID_DEPARTAMENTO vacío.',
    ],
    example: {
      question: '¿Cuántos empleados hay y cuál es el salario promedio en cada departamento?',
      example: 'S2-E-GROUP',
      reading:
        'Reúne las filas por ID_DEPARTAMENTO y, en cada grupo, cuenta personas y promedia salarios.',
      visual: { kind: 'group', table: 'EMPLEADOS', by: ['ID_DEPARTAMENTO'] },
    },
    more: [
      {
        question: '¿Cuántas personas hay por cargo?',
        example: 'S2-E-GROUP-CARGO',
        reading: 'Agrupa por CARGO y ordena de más a menos personas; con empate, por cargo.',
        visual: { kind: 'group', table: 'EMPLEADOS', by: ['CARGO'] },
      },
    ],
    changed: [
      'De 20 filas se pasa a una fila por departamento (y una para el NULL).',
      'Cada fila resume un grupo: ya no hay nombres de personas.',
    ],
    mistakes: [
      {
        title: 'Agrupar por una columna y mostrar otra',
        why: 'Si el SELECT tiene CARGO pero el GROUP BY solo ID_DEPARTAMENTO, Oracle responde ORA-00979: cada grupo tiene varios cargos.',
      },
    ],
    check: {
      id: 'S2-L14-C',
      kind: 'count',
      lesson: 'S2-L14',
      prompt: '¿Cuántas filas devuelve el resumen por departamento (incluido el grupo NULL)?',
      context: { example: 'S2-E-GROUP' },
      hints: [
        'Cuenta los valores distintos de ID_DEPARTAMENTO en EMPLEADOS.',
        'Hay cinco departamentos con personas y un empleado sin departamento.',
      ],
      explanation: 'Seis: 10, 20, 30, 40, 50 y el grupo NULL de Esteban.',
    },
    keyIdea: 'GROUP BY: una fila por grupo; la función se calcula dentro de cada grupo.',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L15',
    block: 'group-by',
    slug: 'group-by-varias-columnas',
    title: 'Agrupar por varias columnas y errores típicos',
    shortTitle: 'GROUP BY varias',
    summary:
      'Con varias columnas, cada combinación distinta es un grupo; lo que se muestra debe estar agrupado o resumido.',
    concepts: ['group-by'],
    purpose:
      'Hacer resúmenes más finos (activos e inactivos por departamento) y reconocer los dos errores más comunes con GROUP BY.',
    syntax: lines('SELECT col1, col2, FUNCION(col3)', 'FROM tabla', 'GROUP BY col1, col2;'),
    explanation: [
      'GROUP BY id_departamento, estado crea un grupo por cada pareja (departamento, estado) que existe en los datos.',
      'Regla de oro: toda columna del SELECT que no esté dentro de una función de grupo debe estar en el GROUP BY. Si falta, Oracle responde ORA-00979.',
      'Las funciones de grupo no pueden ir en el WHERE: el WHERE trabaja con filas sueltas, antes de que existan los grupos (ORA-00934). Para filtrar grupos está HAVING.',
    ],
    example: {
      question: '¿Cuántas personas activas e inactivas hay en cada departamento?',
      example: 'S2-E-GROUP-DOS',
      reading:
        'Forma un grupo por cada combinación de departamento y estado y cuenta las personas de cada uno.',
      visual: { kind: 'group', table: 'EMPLEADOS', by: ['ID_DEPARTAMENTO', 'ESTADO'] },
    },
    more: [
      {
        question: 'Error: mostrar CARGO sin agruparlo.',
        example: 'S2-E-GROUP-INCOMPLETO',
        reading:
          'Oracle responde ORA-00979: CARGO no está en el GROUP BY ni en una función de grupo.',
      },
      {
        question: 'Error: una función de grupo en el WHERE.',
        example: 'S2-E-WHERE-AGREGADO',
        reading: 'Oracle responde ORA-00934: no se permite una función de grupo en el WHERE.',
      },
    ],
    changed: [
      'Cada departamento puede aparecer dos veces: una por estado.',
      'Ventas y Recursos Humanos aparecen una sola vez: no tienen personas inactivas.',
    ],
    mistakes: [
      {
        title: 'GROUP BY incompleto',
        why: 'Columna en el SELECT, fuera de una función y fuera del GROUP BY: ORA-00979.',
      },
      {
        title: 'Función de grupo en el WHERE',
        why: 'WHERE COUNT(*) > 3 da ORA-00934. Ese filtro se escribe en HAVING.',
        wrong: 'WHERE COUNT(*) > 3',
        right: 'HAVING COUNT(*) > 3',
      },
    ],
    check: {
      id: 'S2-L15-C',
      kind: 'choice',
      lesson: 'S2-L15',
      prompt:
        'SELECT id_departamento, cargo, COUNT(*) FROM empleados GROUP BY id_departamento; ¿Qué ocurre?',
      options: [
        {
          text: 'Oracle responde ORA-00979: CARGO no está agrupado.',
          correct: true,
          feedback: 'Correcto: cada departamento tiene varios cargos y Oracle no puede elegir uno.',
        },
        {
          text: 'Devuelve un cargo cualquiera de cada departamento.',
          correct: false,
          feedback: 'Oracle no elige al azar: rechaza la consulta.',
        },
        {
          text: 'Agrupa también por cargo automáticamente.',
          correct: false,
          feedback: 'Oracle no completa el GROUP BY: hay que escribirlo.',
        },
        {
          text: 'Oracle responde ORA-00934 por usar COUNT.',
          correct: false,
          feedback: 'ORA-00934 aparece con una función de grupo en el WHERE, no en el SELECT.',
        },
      ],
      hints: [
        'Revisa qué columnas del SELECT no están dentro de una función de grupo.',
        '¿Están todas en el GROUP BY?',
      ],
      explanation:
        'Toda columna del SELECT fuera de una función debe estar en GROUP BY: falta CARGO.',
    },
    keyIdea: 'En el SELECT: columnas del GROUP BY o funciones de grupo. Nada más.',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L16',
    block: 'having',
    slug: 'having',
    title: 'HAVING: filtrar grupos',
    shortTitle: 'HAVING',
    summary: 'HAVING conserva los grupos que cumplen una condición sobre su resumen.',
    concepts: ['having'],
    purpose:
      'Responder preguntas como «¿qué departamentos tienen un promedio salarial superior a 4.500.000?» o «¿cuáles tienen al menos cuatro personas?».',
    syntax: lines(
      'SELECT columna_de_grupo, FUNCION(col)',
      'FROM tabla',
      'GROUP BY columna_de_grupo',
      'HAVING condición_sobre_el_grupo;',
    ),
    explanation: [
      'HAVING se evalúa después de formar los grupos y calcular sus funciones. Por eso puede usar AVG(salario) o COUNT(*), que el WHERE no puede usar.',
      'Los grupos que no cumplen la condición desaparecen del resultado completos.',
    ],
    example: {
      question: '¿Qué departamentos tienen un salario promedio superior a 4.500.000?',
      example: 'S2-E-HAVING',
      reading:
        'Agrupa por departamento, calcula el promedio de cada grupo y conserva solo los grupos cuyo promedio supera 4.500.000.',
      visual: { kind: 'group', table: 'EMPLEADOS', by: ['ID_DEPARTAMENTO'] },
    },
    more: [
      {
        question: '¿Qué departamentos tienen al menos cuatro personas?',
        example: 'S2-E-HAVING-COUNT',
        reading: 'Conserva los grupos con COUNT(*) mayor o igual a 4.',
      },
    ],
    changed: [
      'De seis grupos quedan tres: los demás no superan el promedio.',
      'Las filas de los grupos descartados no aparecen en ninguna forma.',
    ],
    mistakes: [
      {
        title: 'Usar el alias de columna en HAVING',
        why: 'HAVING promedio > 4500000 falla en Oracle: el alias del SELECT no existe todavía cuando se evalúa HAVING. Se repite la función.',
        wrong: 'HAVING promedio > 4500000',
        right: 'HAVING AVG(salario) > 4500000',
      },
    ],
    check: {
      id: 'S2-L16-C',
      kind: 'count',
      lesson: 'S2-L16',
      prompt: '¿Cuántos departamentos tienen al menos cuatro personas?',
      context: { example: 'S2-E-HAVING-COUNT' },
      hints: [
        'Cuenta las personas de cada ID_DEPARTAMENTO.',
        'TI y Finanzas tienen cuatro; Ventas, cinco.',
      ],
      explanation: 'Tres: TI (4), Ventas (5) y Finanzas (4).',
    },
    keyIdea: 'HAVING filtra grupos usando su resumen (COUNT, AVG…).',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L17',
    block: 'having',
    slug: 'where-frente-a-having',
    title: 'WHERE frente a HAVING: el orden de evaluación',
    shortTitle: 'WHERE vs HAVING',
    summary: 'WHERE filtra filas antes de agrupar; HAVING filtra grupos después de agrupar.',
    concepts: ['having', 'where-vs-having'],
    purpose:
      'Elegir dónde va cada condición y predecir el resultado de una consulta con WHERE, GROUP BY y HAVING a la vez.',
    syntax: lines(
      'SELECT …         -- 5. columnas y cálculos',
      'FROM …           -- 1. tablas',
      'WHERE …          -- 2. filtra filas',
      'GROUP BY …       -- 3. forma grupos',
      'HAVING …         -- 4. filtra grupos',
      'ORDER BY …;      -- 6. ordena',
    ),
    explanation: [
      'Oracle no evalúa la consulta en el orden en que se escribe. Conceptualmente: FROM (y JOIN), WHERE, GROUP BY, funciones de grupo, HAVING, SELECT y ORDER BY.',
      "Una condición sobre una columna de cada fila (estado = 'ACTIVO') va en el WHERE: reduce las filas antes de agrupar. Una condición sobre un resumen (COUNT(*) >= 3) va en HAVING.",
      'El mismo HAVING puede dar resultados distintos según el WHERE: contar activos no es lo mismo que contar a todas las personas.',
    ],
    example: {
      question: '¿Qué departamentos tienen al menos tres personas activas?',
      example: 'S2-E-PIPELINE',
      reading:
        'WHERE deja solo a las personas activas; GROUP BY las reúne por departamento; HAVING conserva los grupos con tres o más; ORDER BY ordena.',
      visual: {
        kind: 'pipeline',
        stages: [
          { label: 'WHERE: filas activas', example: 'S2-E-PIPE-WHERE' },
          { label: 'GROUP BY: activos por departamento', example: 'S2-E-PIPE-GROUP' },
          { label: 'HAVING: grupos con 3 o más', example: 'S2-E-PIPELINE' },
        ],
      },
    },
    more: [
      {
        question: '¿Y si se cuentan todas las personas, activas o no?',
        example: 'S2-E-HAVING-SIN-WHERE',
        reading:
          'Sin el WHERE, Operaciones llega a tres personas y entra en el resultado: el WHERE cambió los grupos.',
        visual: {
          kind: 'compare',
          other: 'S2-E-PIPELINE',
          labels: ['Sin WHERE (todas)', 'Con WHERE (activas)'],
        },
      },
    ],
    changed: [
      'WHERE redujo las filas de 20 a 17.',
      'GROUP BY convirtió 17 filas en seis grupos.',
      'HAVING dejó cuatro grupos.',
    ],
    mistakes: [
      {
        title: 'Filtrar filas con HAVING',
        why: "HAVING estado = 'ACTIVO' no es válido si ESTADO no está agrupado; y aunque lo estuviera, filtra después de agrupar. Las condiciones de fila van en el WHERE.",
      },
      {
        title: 'Filtrar grupos con WHERE',
        why: 'WHERE COUNT(*) >= 3 da ORA-00934.',
      },
    ],
    check: {
      id: 'S2-L17-C',
      kind: 'choice',
      lesson: 'S2-L17',
      prompt:
        'Quieres los departamentos cuyo salario promedio de personas ACTIVAS supera 5.000.000. ¿Dónde va cada condición?',
      options: [
        {
          text: "estado = 'ACTIVO' en WHERE; AVG(salario) > 5000000 en HAVING.",
          correct: true,
          feedback: 'Correcto: el estado es de cada fila; el promedio es del grupo.',
        },
        {
          text: 'Las dos en WHERE.',
          correct: false,
          feedback: 'AVG en el WHERE da ORA-00934: los grupos aún no existen.',
        },
        {
          text: 'Las dos en HAVING.',
          correct: false,
          feedback: 'ESTADO no está agrupado: Oracle no puede evaluarlo por grupo.',
        },
        {
          text: "AVG(salario) > 5000000 en WHERE; estado = 'ACTIVO' en HAVING.",
          correct: false,
          feedback: 'Es justo al revés: el WHERE no admite funciones de grupo.',
        },
      ],
      hints: [
        '¿Cuál condición se refiere a una fila y cuál a un grupo?',
        'Las funciones de grupo solo se pueden usar después de agrupar.',
      ],
      explanation: 'Condición de fila → WHERE; condición sobre un resumen → HAVING.',
    },
    keyIdea: 'WHERE filtra FILAS antes de agrupar; HAVING filtra GRUPOS después.',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L18',
    block: 'join-agregacion',
    slug: 'join-y-agregaciones',
    title: 'Contar y promediar por departamento con JOIN',
    shortTitle: 'JOIN + GROUP BY',
    summary:
      'Primero se unen las tablas y después se agrupa: así el resumen lleva nombres en lugar de claves.',
    concepts: ['group-by', 'left-join', 'count'],
    purpose:
      'Producir informes legibles: «Ventas: 5 personas» en vez de «30: 5», y no perder los departamentos vacíos.',
    syntax: lines(
      'SELECT d.nombre, COUNT(e.id_empleado)',
      'FROM departamentos d',
      'LEFT JOIN empleados e ON d.id = e.id_departamento',
      'GROUP BY d.nombre;',
    ),
    explanation: [
      'Oracle primero hace el JOIN (cada empleado con su departamento) y después agrupa las filas resultantes por el nombre del departamento.',
      'Para incluir departamentos sin empleados se usa LEFT JOIN desde DEPARTAMENTOS. Pero ojo: esa fila sin pareja existe, así que COUNT(*) la cuenta como 1. Para contar empleados se usa COUNT(e.id_empleado), que ignora el NULL.',
    ],
    example: {
      question: '¿Cuántos empleados tiene cada departamento, incluidos los que no tienen ninguno?',
      example: 'S2-E-JOIN-COUNT',
      reading:
        'Une cada departamento con sus empleados (conservando los vacíos), agrupa por nombre del departamento y cuenta los empleados reales.',
      visual: {
        kind: 'compare',
        other: 'S2-E-JOIN-COUNT-STAR',
        labels: ['COUNT(e.id_empleado)', 'COUNT(*)'],
      },
    },
    more: [
      {
        question: '¿Cuál es el salario promedio de cada departamento, con su nombre?',
        example: 'S2-E-JOIN-AVG',
        reading:
          'Une empleados y departamentos, agrupa por nombre del departamento y promedia los salarios.',
      },
    ],
    changed: [
      'El resumen muestra nombres de departamento en lugar de números.',
      'Investigación aparece con 0 gracias al LEFT JOIN y a COUNT(e.id_empleado).',
    ],
    mistakes: [
      {
        title: 'COUNT(*) con LEFT JOIN',
        why: 'La fila sin pareja existe (con NULL a la derecha): COUNT(*) la cuenta y un departamento vacío aparece con 1.',
        wrong: 'COUNT(*)',
        right: 'COUNT(e.id_empleado)',
      },
    ],
    check: {
      id: 'S2-L18-C',
      kind: 'choice',
      lesson: 'S2-L18',
      prompt:
        'Con DEPARTAMENTOS LEFT JOIN EMPLEADOS agrupado por departamento, ¿qué muestra COUNT(*) para Investigación?',
      options: [
        {
          text: '1',
          correct: true,
          feedback: 'Correcto: la fila sin pareja existe y COUNT(*) cuenta filas.',
        },
        {
          text: '0',
          correct: false,
          feedback: 'Eso muestra COUNT(e.id_empleado), que ignora el NULL.',
        },
        {
          text: 'NULL',
          correct: false,
          feedback: 'COUNT nunca devuelve NULL: como mínimo devuelve 0.',
        },
        {
          text: 'Investigación no aparece.',
          correct: false,
          feedback: 'Con LEFT JOIN desde DEPARTAMENTOS sí aparece.',
        },
      ],
      hints: [
        '¿Cuántas filas tiene el grupo de Investigación después del LEFT JOIN?',
        'COUNT(*) cuenta filas, aunque tengan NULL.',
      ],
      explanation:
        'El LEFT JOIN produce una fila (Investigación, NULL…). COUNT(*) la cuenta: 1. COUNT(e.id_empleado) da 0.',
    },
    keyIdea: 'JOIN primero, GROUP BY después; con LEFT JOIN, cuenta la columna de la derecha.',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L19',
    block: 'join-agregacion',
    slug: 'join-group-by-having',
    title: 'JOIN + GROUP BY + HAVING',
    shortTitle: 'JOIN + HAVING',
    summary:
      'Con varias tablas, HAVING filtra los grupos ya resumidos: proyectos con muchas horas, áreas con promedio alto.',
    concepts: ['having', 'group-by', 'inner-join'],
    purpose: 'Responder preguntas de análisis reales que combinan relaciones, resúmenes y filtros.',
    syntax: lines(
      'SELECT a.nombre, FUNCION(b.col)',
      'FROM tabla_a a',
      'JOIN tabla_b b ON …',
      '[WHERE condición_de_fila]',
      'GROUP BY a.nombre',
      'HAVING condición_de_grupo;',
    ),
    explanation: [
      'La consulta sigue el mismo orden lógico: une, filtra filas, agrupa, calcula, filtra grupos y ordena.',
      'Las funciones de grupo pueden usar columnas de cualquiera de las tablas unidas: COUNT(*) cuenta asignaciones y SUM(a.horas_semanales) suma sus horas.',
    ],
    example: {
      question: '¿Qué proyectos reciben más de 35 horas semanales en total, y de cuántas personas?',
      example: 'S2-E-PROYECTOS-HORAS',
      reading:
        'Une proyectos con sus asignaciones, agrupa por proyecto, suma horas y cuenta personas, y conserva los proyectos con más de 35 horas.',
      visual: { kind: 'group', table: 'ASIGNACIONES', by: ['ID_PROYECTO'] },
    },
    more: [
      {
        question:
          '¿Qué departamentos tienen un salario promedio de personas activas superior a 4.500.000?',
        example: 'S2-E-DEPTO-PROMEDIO',
        reading:
          'Une, deja a las personas activas, agrupa por departamento y conserva los grupos cuyo promedio supera 4.500.000.',
      },
    ],
    changed: [
      'Siete proyectos se convierten en seis grupos (uno no tiene asignaciones) y quedan tres.',
      'Ningún proyecto con exactamente 35 horas entra: la condición es «mayor que».',
    ],
    mistakes: [
      {
        title: 'Agrupar por la clave y mostrar el nombre',
        why: 'GROUP BY p.id_proyecto con SELECT p.nombre_proyecto da ORA-00979. Agrupa por lo que muestras (o por ambas columnas).',
      },
    ],
    check: {
      id: 'S2-L19-C',
      kind: 'count',
      lesson: 'S2-L19',
      prompt: '¿Cuántos proyectos superan 35 horas semanales en total?',
      context: { example: 'S2-E-PROYECTOS-HORAS' },
      hints: [
        'Suma HORAS_SEMANALES de ASIGNACIONES por proyecto.',
        'Hay dos proyectos con exactamente 35 horas: no cumplen «> 35».',
      ],
      explanation:
        'Tres: Migración a la nube (85), Expansión regional (70) y Portal de clientes (40).',
    },
    keyIdea: 'Une → filtra filas → agrupa → resume → filtra grupos → ordena.',
    topic: 'grupos',
    version: 1,
  },
  {
    id: 'S2-L20',
    block: 'subconsultas',
    slug: 'subconsultas-de-una-fila',
    title: 'Subconsultas de una fila',
    shortTitle: 'Subconsulta simple',
    summary:
      'Una subconsulta es un SELECT dentro de otro; si devuelve un solo valor, se compara con =, >, <…',
    concepts: ['subquery', 'single-row-subquery'],
    purpose:
      'Usar un valor calculado en la misma consulta, como «el salario promedio de la empresa», sin escribirlo a mano.',
    syntax: lines(
      'SELECT columnas',
      'FROM tabla',
      'WHERE columna > (SELECT FUNCION(col)',
      '                 FROM tabla);',
    ),
    explanation: [
      'Oracle resuelve primero la subconsulta (entre paréntesis) y usa su resultado en la consulta externa. Si el promedio cambia, la consulta sigue siendo correcta sin tocarla.',
      'Con =, >, <, >=, <= o <>, la subconsulta debe devolver una sola fila. Si devuelve varias, Oracle responde ORA-01427.',
      'Muchas subconsultas pueden reescribirse con JOIN; se elige la forma más clara para la pregunta.',
    ],
    example: {
      question: '¿Quién gana más que el promedio de la empresa?',
      example: 'S2-E-SUB-AVG',
      reading:
        'Calcula el salario promedio de todos y muestra a las personas cuyo salario es mayor, de mayor a menor.',
      visual: {
        kind: 'pipeline',
        stages: [
          { label: 'Subconsulta: el promedio', example: 'S2-E-SUB-PROMEDIO' },
          { label: 'Consulta externa: salario > promedio', example: 'S2-E-SUB-AVG' },
        ],
      },
    },
    more: [
      {
        question: '¿Quién trabaja en Ventas, buscando su ID por el nombre?',
        example: 'S2-E-SUB-VENTAS',
        reading:
          'La subconsulta devuelve el ID de Ventas (30) y la consulta externa lista a sus empleados.',
      },
      {
        question: 'Error: la subconsulta devuelve varias filas.',
        example: 'S2-E-SUB-VARIAS',
        reading:
          'Hay tres departamentos con sede en Bogotá: «=» no puede comparar con tres valores y Oracle responde ORA-01427.',
      },
    ],
    changed: [
      'El número 4.580.000 no aparece escrito en la consulta: lo calcula la subconsulta.',
      'Solo quedan las personas por encima del promedio.',
    ],
    mistakes: [
      {
        title: 'Usar = con una subconsulta de varias filas',
        why: 'Si la subconsulta puede devolver más de un valor, usa IN (siguiente lección).',
        wrong: "WHERE id_departamento = (SELECT … WHERE sede = 'Bogotá')",
        right: "WHERE id_departamento IN (SELECT … WHERE sede = 'Bogotá')",
      },
    ],
    check: {
      id: 'S2-L20-C',
      kind: 'count',
      lesson: 'S2-L20',
      prompt:
        'El salario promedio de la empresa es 4.580.000. ¿Cuántas personas ganan más que ese promedio?',
      context: { example: 'S2-E-SUB-AVG' },
      hints: [
        'Recorre la columna SALARIO buscando valores mayores que 4.580.000.',
        'Camila (4.500.000) queda justo por debajo; Alicia (4.800.000), por encima.',
      ],
      explanation: 'Ocho personas: Ana, Carlos, Jorge, Daniela, María, Laura, Diego y Alicia.',
    },
    keyIdea: 'Subconsulta de una fila: un valor calculado que se compara con =, >, <…',
    topic: 'subconsultas',
    version: 1,
  },
  {
    id: 'S2-L21',
    block: 'subconsultas',
    slug: 'subconsultas-de-varias-filas',
    title: 'Subconsultas de varias filas: IN y NOT IN',
    shortTitle: 'IN con subconsulta',
    summary:
      'Si la subconsulta devuelve una lista, se usa IN; NOT IN falla en silencio si la lista contiene NULL.',
    concepts: ['multi-row-subquery'],
    purpose:
      'Filtrar con una lista calculada: quién trabaja en un proyecto, qué áreas no tienen personas.',
    syntax: lines(
      'SELECT columnas',
      'FROM tabla',
      'WHERE columna IN (SELECT columna',
      '                  FROM otra_tabla',
      '                  WHERE condición);',
    ),
    explanation: [
      'IN compara con cada valor que devuelve la subconsulta: basta con que coincida con uno.',
      'NOT IN exige ser distinto de todos. Si la lista tiene un NULL, «distinto de NULL» es desconocido y NOT IN no devuelve ninguna fila. Es un error silencioso: la consulta funciona y no devuelve nada.',
      'Soluciones: filtrar los NULL dentro de la subconsulta (WHERE columna IS NOT NULL) o usar NOT EXISTS (siguiente lección).',
    ],
    example: {
      question: '¿Quién trabaja en el proyecto 101?',
      example: 'S2-E-SUB-IN',
      reading:
        'La subconsulta devuelve los ID de las personas asignadas al proyecto 101 y la consulta externa muestra sus nombres.',
    },
    more: [
      {
        question: '¿Quién trabaja en un departamento con sede en Bogotá?',
        example: 'S2-E-SUB-IN-BOGOTA',
        reading: 'Ahora la subconsulta de la sede devuelve tres ID (10, 20 y 50): con IN funciona.',
      },
      {
        question: '¿Quién no tiene ningún proyecto?',
        example: 'S2-E-SIN-PROYECTO',
        reading:
          'NOT IN funciona aquí porque ASIGNACIONES.ID_EMPLEADO nunca es NULL (es parte de la clave primaria).',
      },
      {
        question: 'Trampa: departamentos sin empleados con NOT IN.',
        example: 'S2-E-NOT-IN-NULL',
        reading:
          'La lista incluye el NULL de Esteban: NOT IN no devuelve ninguna fila, aunque Investigación no tiene empleados.',
        visual: {
          kind: 'compare',
          other: 'S2-E-NOT-IN-OK',
          labels: ['NOT IN con NULL en la lista', 'NOT IN sin NULL'],
        },
      },
    ],
    changed: ['La lista de la subconsulta reemplaza a una lista escrita a mano: IN (2, 6, 7, 20).'],
    mistakes: [
      {
        title: 'NOT IN con NULL',
        why: 'Una sola fila NULL en la subconsulta hace que NOT IN no devuelva nada.',
      },
    ],
    check: {
      id: 'S2-L21-C',
      kind: 'choice',
      lesson: 'S2-L21',
      prompt:
        'WHERE id_departamento NOT IN (SELECT id_departamento FROM empleados) no devuelve filas. ¿Por qué?',
      options: [
        {
          text: 'Porque la subconsulta incluye un NULL (Esteban) y NOT IN con NULL nunca es verdadero.',
          correct: true,
          feedback:
            'Correcto: comparar con NULL es desconocido, y NOT IN necesita verdadero para todos.',
        },
        {
          text: 'Porque todos los departamentos tienen empleados.',
          correct: false,
          feedback: 'Investigación no tiene empleados: el problema no está en los datos.',
        },
        {
          text: 'Porque NOT IN no admite subconsultas.',
          correct: false,
          feedback: 'NOT IN admite subconsultas; el problema es el NULL.',
        },
        {
          text: 'Porque falta un JOIN.',
          correct: false,
          feedback: 'La subconsulta reemplaza al JOIN; no hace falta otro.',
        },
      ],
      hints: [
        'Mira qué valores devuelve SELECT id_departamento FROM empleados.',
        '¿Qué pasa al comparar 60 <> NULL?',
      ],
      explanation:
        'NOT IN equivale a «<> cada valor». Con un NULL en la lista, una de esas comparaciones es desconocida y la fila no pasa.',
    },
    keyIdea: 'Lista → IN. Con NOT IN, asegúrate de que la lista no tenga NULL.',
    topic: 'subconsultas',
    version: 1,
  },
  {
    id: 'S2-L22',
    block: 'subconsultas',
    slug: 'subconsultas-correlacionadas',
    title: 'Subconsultas correlacionadas y EXISTS',
    shortTitle: 'Correlacionadas',
    summary:
      'Una subconsulta correlacionada usa una columna de la consulta externa y se evalúa para cada fila.',
    concepts: ['correlated-subquery', 'exists'],
    purpose:
      'Comparar a cada persona con su propio grupo (el promedio de su departamento) y comprobar si algo existe.',
    syntax: lines(
      'SELECT …',
      'FROM tabla e',
      'WHERE e.col > (SELECT FUNCION(i.col)',
      '               FROM tabla i',
      '               WHERE i.grupo = e.grupo);',
    ),
    explanation: [
      'La subconsulta menciona e.id_departamento, una columna de la consulta externa. Conceptualmente se calcula una vez por cada empleado: el promedio de su propio departamento.',
      'EXISTS (subconsulta) es verdadero si la subconsulta devuelve al menos una fila. NOT EXISTS no tiene la trampa de NOT IN con NULL.',
    ],
    example: {
      question: '¿Quién gana más que el promedio de su propio departamento?',
      example: 'S2-E-CORRELACIONADA',
      reading:
        'Para cada empleado, la subconsulta calcula el promedio de su departamento; se muestra si su salario es mayor.',
    },
    more: [
      {
        question: '¿Qué proyecto no tiene ninguna asignación?',
        example: 'S2-E-NOT-EXISTS',
        reading: 'Para cada proyecto, NOT EXISTS comprueba que no haya asignaciones con su ID.',
      },
      {
        question: 'Departamentos sin empleados, ahora con NOT EXISTS.',
        example: 'S2-E-NOT-EXISTS-DEPTO',
        reading: 'Devuelve Investigación: NOT EXISTS no se ve afectado por el NULL de Esteban.',
      },
    ],
    changed: [
      'Cada persona se compara con un promedio distinto: el de su departamento.',
      'Esteban no aparece: sin departamento, su promedio de comparación es NULL.',
    ],
    mistakes: [
      {
        title: 'Olvidar la correlación',
        why: 'Sin WHERE i.id_departamento = e.id_departamento, la subconsulta calcula el promedio de toda la empresa.',
      },
    ],
    check: {
      id: 'S2-L22-C',
      kind: 'choice',
      lesson: 'S2-L22',
      prompt: '¿Qué hace que una subconsulta sea correlacionada?',
      options: [
        {
          text: 'Usa una columna de la consulta externa, así que su resultado depende de cada fila.',
          correct: true,
          feedback: 'Correcto: i.id_departamento = e.id_departamento la ata a la fila externa.',
        },
        {
          text: 'Usa una función de grupo como AVG.',
          correct: false,
          feedback:
            'La subconsulta de una fila de la lección anterior también usa AVG y no es correlacionada.',
        },
        {
          text: 'Está en el SELECT y no en el WHERE.',
          correct: false,
          feedback:
            'La posición no la define: lo que importa es la referencia a la consulta externa.',
        },
        {
          text: 'Devuelve varias filas.',
          correct: false,
          feedback: 'Eso es una subconsulta de varias filas, correlacionada o no.',
        },
      ],
      hints: [
        'Busca dentro de la subconsulta un alias que pertenece a la consulta de afuera.',
        'e.id_departamento no existe dentro de la subconsulta: viene de la externa.',
      ],
      explanation:
        'Es correlacionada porque usa e.id_departamento: hay que evaluarla para cada fila externa.',
    },
    keyIdea: 'Correlacionada = depende de la fila externa. NOT EXISTS evita la trampa del NULL.',
    topic: 'subconsultas',
    version: 1,
  },
  {
    id: 'S2-L23',
    block: 'conjuntos',
    slug: 'union-y-union-all',
    title: 'UNION y UNION ALL',
    shortTitle: 'UNION',
    summary:
      'UNION apila los resultados de dos consultas sin duplicados; UNION ALL los apila tal cual.',
    concepts: ['set-operators', 'union', 'union-all'],
    purpose:
      'Combinar listas que vienen de tablas distintas, como las ciudades donde hay personas y las sedes de los departamentos.',
    syntax: lines(
      'SELECT columna FROM tabla_a',
      'UNION [ALL]',
      'SELECT columna FROM tabla_b',
      'ORDER BY columna;',
    ),
    explanation: [
      'Un operador de conjuntos une resultados verticalmente: las filas de una consulta debajo de las de la otra. Un JOIN, en cambio, une columnas horizontalmente.',
      'Las dos consultas deben devolver el mismo número de columnas, con tipos compatibles y en el mismo orden. Los títulos del resultado son los de la primera consulta. ORDER BY va una sola vez, al final.',
      'UNION elimina las filas repetidas; UNION ALL las conserva y es más rápido porque no tiene que buscarlas.',
    ],
    example: {
      question: '¿En qué ciudades tiene presencia la empresa (personas o sedes)?',
      example: 'S2-E-UNION',
      reading:
        'Apila las ciudades de los empleados y las sedes de los departamentos, sin repetir, y las ordena.',
    },
    more: [
      {
        question: 'UNION frente a UNION ALL con pocas filas.',
        example: 'S2-E-UNION-ALL',
        reading:
          'Tres ciudades de Recursos Humanos más dos sedes: UNION ALL conserva las 5 filas; UNION deja 3.',
        visual: {
          kind: 'compare',
          other: 'S2-E-UNION-PEQUENA',
          labels: ['UNION ALL', 'UNION'],
        },
      },
      {
        question: 'Error: distinto número de columnas.',
        example: 'S2-E-UNION-COLUMNAS',
        reading: 'Dos columnas arriba y una abajo: Oracle responde ORA-01789.',
      },
      {
        question: 'Error: tipos incompatibles.',
        example: 'S2-E-UNION-TIPOS',
        reading: 'Un texto arriba y un número abajo: Oracle responde ORA-01790.',
      },
    ],
    changed: [
      'Dos resultados se convierten en una sola columna de ciudades.',
      'Con UNION cada ciudad aparece una vez, aunque esté en las dos tablas.',
    ],
    mistakes: [
      {
        title: 'Usar UNION para unir columnas',
        why: 'UNION apila filas. Para poner datos de dos tablas en la misma fila se usa JOIN.',
      },
      {
        title: 'ORDER BY en cada consulta',
        why: 'Solo se permite un ORDER BY, al final de todo el conjunto.',
      },
    ],
    check: {
      id: 'S2-L23-C',
      kind: 'count',
      lesson: 'S2-L23',
      prompt:
        'Recursos Humanos tiene personas en Bogotá, Cali y Medellín; las sedes de Finanzas y Recursos Humanos son Cali y Bogotá. ¿Cuántas filas devuelve UNION ALL?',
      context: { example: 'S2-E-UNION-ALL' },
      hints: ['UNION ALL no elimina repetidos.', 'Suma las filas de las dos consultas.'],
      explanation: 'Cinco: 3 + 2. UNION, que quita repetidos, devolvería 3.',
    },
    keyIdea: 'UNION apila sin repetidos; UNION ALL apila todo. Mismas columnas, mismo orden.',
    topic: 'conjuntos',
    version: 1,
  },
  {
    id: 'S2-L24',
    block: 'conjuntos',
    slug: 'intersect-y-minus',
    title: 'INTERSECT y MINUS',
    shortTitle: 'INTERSECT y MINUS',
    summary:
      'INTERSECT deja lo que está en los dos resultados; MINUS deja lo del primero que no está en el segundo.',
    concepts: ['intersect', 'minus'],
    purpose:
      'Comparar listas: ciudades que son a la vez sede y lugar de trabajo, personas que no aparecen en ASIGNACIONES.',
    syntax: lines(
      'SELECT columna FROM tabla_a',
      'INTERSECT | MINUS',
      'SELECT columna FROM tabla_b;',
    ),
    explanation: [
      'INTERSECT devuelve las filas que aparecen en los dos resultados, sin repetidos.',
      'MINUS devuelve las filas del primer resultado que no aparecen en el segundo, sin repetidos. El orden importa: A MINUS B no es B MINUS A. En el estándar SQL y en otros motores se llama EXCEPT.',
    ],
    example: {
      question: '¿Qué ciudades son a la vez lugar de trabajo y sede de un departamento?',
      example: 'S2-E-INTERSECT',
      reading: 'Deja las ciudades presentes en los dos resultados.',
    },
    more: [
      {
        question: '¿En qué ciudad trabaja alguien sin que haya una sede allí?',
        example: 'S2-E-MINUS',
        reading: 'Las ciudades de los empleados menos las sedes: solo queda Valledupar.',
      },
      {
        question: 'EXCEPT, el nombre estándar de MINUS.',
        example: 'S2-E-EXCEPT',
        reading:
          'Desde Oracle 21c, EXCEPT devuelve lo mismo que MINUS (verificado aquí en Oracle 23). En Oracle 19c solo existe MINUS.',
        visual: { kind: 'compare', other: 'S2-E-MINUS', labels: ['EXCEPT', 'MINUS'] },
      },
      {
        question: '¿Quién no tiene proyecto? (otra forma de responder con MINUS)',
        example: 'S2-E-MINUS-PROYECTOS',
        reading:
          'Todos los ID de empleados menos los que aparecen en ASIGNACIONES: el mismo resultado que con NOT IN.',
      },
    ],
    changed: ['INTERSECT y MINUS devuelven subconjuntos de la primera lista, sin repetidos.'],
    mistakes: [
      {
        title: 'Invertir el orden en MINUS',
        why: 'SELECT sede … MINUS SELECT ciudad … responde otra pregunta (sedes sin personas en esa ciudad).',
      },
    ],
    check: {
      id: 'S2-L24-C',
      kind: 'choice',
      lesson: 'S2-L24',
      prompt:
        'SELECT id_empleado FROM empleados MINUS SELECT id_empleado FROM asignaciones; ¿qué devuelve?',
      options: [
        {
          text: 'Los empleados que no tienen ningún proyecto.',
          correct: true,
          feedback: 'Correcto: todos los empleados menos los que aparecen en ASIGNACIONES.',
        },
        {
          text: 'Los empleados que tienen al menos un proyecto.',
          correct: false,
          feedback: 'Eso sería INTERSECT.',
        },
        {
          text: 'Las asignaciones sin empleado.',
          correct: false,
          feedback: 'Eso sería el orden inverso, y la FK impide que existan.',
        },
        {
          text: 'Todos los empleados y todas las asignaciones juntos.',
          correct: false,
          feedback: 'Eso sería UNION.',
        },
      ],
      hints: [
        'MINUS = lo del primero que no está en el segundo.',
        'El primero son todos los empleados; el segundo, quienes tienen asignación.',
      ],
      explanation: 'MINUS deja los ID de EMPLEADOS que no aparecen en ASIGNACIONES.',
    },
    keyIdea: 'INTERSECT = en ambos; MINUS = en el primero y no en el segundo.',
    topic: 'conjuntos',
    version: 1,
  },
  {
    id: 'S2-L25',
    block: 'integracion',
    slug: 'consulta-integradora',
    title: 'Consulta integradora paso a paso',
    shortTitle: 'Integración',
    summary:
      'Una pregunta de negocio se responde construyendo la consulta por capas: JOIN, WHERE, GROUP BY, HAVING con subconsulta y ORDER BY.',
    concepts: ['where-vs-having', 'subquery'],
    purpose:
      'Construir y leer una consulta completa sin perderse: cada cláusula responde a una parte de la pregunta.',
    syntax: lines(
      'SELECT …',
      'FROM … JOIN … ON …',
      'WHERE …',
      'GROUP BY …',
      'HAVING … (subconsulta)',
      'ORDER BY …;',
    ),
    explanation: [
      'Pregunta: «¿Qué departamentos tienen un salario promedio de personas activas superior al promedio general de la empresa? Muestra cuántas personas activas tienen, de mayor a menor promedio».',
      'Se construye en capas y se comprueba cada una: primero las parejas (JOIN), después las filas que importan (WHERE), luego los grupos y su resumen (GROUP BY), el filtro de grupos con un valor calculado (HAVING con subconsulta) y el orden final.',
    ],
    example: {
      question: 'Departamentos activos con promedio superior al de la empresa.',
      example: 'S2-E-INT-FINAL',
      reading:
        'Une, deja a las personas activas, agrupa por departamento, conserva los grupos cuyo promedio supera el general (4.580.000) y ordena de mayor a menor promedio.',
      visual: {
        kind: 'pipeline',
        stages: [
          { label: '1. JOIN: cada persona con su área', example: 'S2-E-INT-1' },
          { label: '2. WHERE: solo personas activas', example: 'S2-E-INT-2' },
          { label: '3. GROUP BY: resumen por área', example: 'S2-E-INT-3' },
          { label: '4. HAVING con subconsulta y ORDER BY', example: 'S2-E-INT-FINAL' },
        ],
      },
    },
    changed: [
      '20 personas → 19 parejas → 16 activas con área → 5 grupos → 3 departamentos.',
      'La subconsulta calcula el promedio general (todas las personas) y HAVING lo compara con el de cada grupo.',
    ],
    mistakes: [
      {
        title: 'Construir todo de una vez',
        why: 'Si el resultado sale mal, no se sabe qué capa falló. Ejecuta y revisa cada paso.',
      },
      {
        title: 'Comparar con el promedio equivocado',
        why: 'La subconsulta no tiene WHERE: compara con el promedio de toda la empresa (activas e inactivas). Si la pregunta fuera «promedio de activas», la subconsulta también necesitaría el filtro.',
      },
    ],
    check: {
      id: 'S2-L25-C',
      kind: 'order',
      lesson: 'S2-L25',
      prompt: 'Ordena las cláusulas como se escriben en la consulta integradora.',
      pieces: [
        'SELECT d.nombre_departamento, COUNT(*) AS activos, ROUND(AVG(e.salario)) AS promedio',
        'FROM empleados e JOIN departamentos d ON e.id_departamento = d.id_departamento',
        "WHERE e.estado = 'ACTIVO'",
        'GROUP BY d.nombre_departamento',
        'HAVING AVG(e.salario) > (SELECT AVG(salario) FROM empleados)',
        'ORDER BY promedio DESC',
      ],
      hints: [
        'SELECT y FROM siempre van primero.',
        'WHERE va antes de GROUP BY; HAVING, después; ORDER BY, al final.',
      ],
      explanation:
        'Se escribe SELECT, FROM/JOIN, WHERE, GROUP BY, HAVING y ORDER BY, aunque Oracle la evalúe en otro orden.',
    },
    keyIdea: 'Una pregunta compleja = capas simples comprobadas una a una.',
    topic: 'conjuntos',
    version: 1,
  },
];
