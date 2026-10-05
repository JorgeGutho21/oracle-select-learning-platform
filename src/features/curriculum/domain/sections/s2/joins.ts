import { lines, plsql, query, source } from '../../builders';
import type { CurriculumExample, CurriculumLesson } from '../../types';

/**
 * Sección 2, bloques 1 a 4: relaciones y claves, modelo mental del JOIN, INNER JOIN y los
 * demás JOIN. Dataset empresa-relacional-v1 (src/domain/dataset/empresa.ts).
 */

const EMP_KEY = ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'] as const;
const DEP_KEY = ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'] as const;
const SAMPLE = [2, 3, 6, 9, 20] as const;

export const JOIN_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloque 1: relaciones y claves ---------- */
  query(
    'S2-E-PK-FK',
    lines(
      'SELECT id_empleado, nombre, id_departamento',
      'FROM empleados',
      'WHERE id_empleado IN (2, 6, 9, 20)',
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY, [2, 6, 9, 20]), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  plsql(
    'S2-E-FK-VIOLADA',
    lines(
      'INSERT INTO empleados',
      '  (id_empleado, nombre, apellido, cargo, id_departamento,',
      '   ciudad, salario, fecha_ingreso, estado)',
      "VALUES (21, 'Nora', 'Peña', 'Analista', 70,",
      "        'Cali', 4000000, DATE '2026-09-01', 'ACTIVO');",
    ),
    { expectError: 'ORA-02291' },
  ),
  plsql(
    'S2-E-PK-DUPLICADA',
    lines(
      'INSERT INTO departamentos (id_departamento, nombre_departamento, sede)',
      "VALUES (20, 'Soporte', 'Cali');",
    ),
    { expectError: 'ORA-00001' },
  ),
  query(
    'S2-E-ALIAS-TABLA',
    lines(
      'SELECT e.nombre, e.cargo, e.salario',
      'FROM empleados e',
      'WHERE e.id_departamento = 20',
      'ORDER BY e.salario DESC, e.nombre;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'ID_DEPARTAMENTO', 'SALARIO'])],
  ),
  query(
    'S2-E-AMBIGUA',
    lines(
      'SELECT nombre, id_departamento, nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento;',
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
    { expectError: 'ORA-00918' },
  ),

  /* ---------- Bloque 2: modelo mental ---------- */
  query(
    'S2-E-MODELO',
    lines(
      'SELECT e.nombre, e.id_departamento, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.id_empleado IN (2, 3, 6, 9, 20)',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY, SAMPLE), source('DEPARTAMENTOS', DEP_KEY)],
  ),

  /* ---------- Bloque 3: INNER JOIN ---------- */
  query(
    'S2-E-INNER',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-INNER-EXPLICITO',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'INNER JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-SEDE-CIUDAD',
    lines(
      'SELECT e.nombre, e.ciudad, d.nombre_departamento, d.sede',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.ciudad <> d.sede',
      'ORDER BY d.nombre_departamento, e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-COLUMNA-CALIFICADA',
    lines(
      'SELECT e.nombre, e.id_departamento, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE d.id_departamento = 50',
      'ORDER BY e.nombre;',
    ),
    [source('EMPLEADOS', EMP_KEY, [5, 16, 17]), source('DEPARTAMENTOS', DEP_KEY, [50])],
  ),
  query(
    'S2-E-JOIN-WHERE',
    lines(
      'SELECT e.nombre, e.salario, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE d.sede = 'Bogotá'",
      "  AND e.estado = 'ACTIVO'",
      'ORDER BY e.salario DESC, e.nombre;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-E-ON-EQUIVOCADO',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_empleado = d.id_departamento',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-TRES-TABLAS',
    lines(
      'SELECT p.nombre_proyecto, e.nombre, a.rol, a.horas_semanales',
      'FROM asignaciones a',
      'JOIN empleados e',
      '  ON a.id_empleado = e.id_empleado',
      'JOIN proyectos p',
      '  ON a.id_proyecto = p.id_proyecto',
      'WHERE p.id_proyecto IN (101, 104)',
      'ORDER BY p.id_proyecto, e.nombre;',
    ),
    [
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO', 'ROL', 'HORAS_SEMANALES']),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO'], [101, 104]),
    ],
  ),
  query(
    'S2-E-CUATRO-TABLAS',
    lines(
      'SELECT e.nombre,',
      '       d_emp.nombre_departamento AS depto_empleado,',
      '       p.nombre_proyecto,',
      '       d_pro.nombre_departamento AS depto_proyecto',
      'FROM empleados e',
      'JOIN departamentos d_emp',
      '  ON e.id_departamento = d_emp.id_departamento',
      'JOIN asignaciones a',
      '  ON e.id_empleado = a.id_empleado',
      'JOIN proyectos p',
      '  ON a.id_proyecto = p.id_proyecto',
      'JOIN departamentos d_pro',
      '  ON p.id_departamento = d_pro.id_departamento',
      'WHERE e.id_departamento <> p.id_departamento',
      'ORDER BY e.nombre;',
    ),
    [
      source('EMPLEADOS', EMP_KEY),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),

  /* ---------- Bloque 4: otros JOIN ---------- */
  query(
    'S2-E-LEFT',
    lines(
      'SELECT e.nombre, e.id_departamento, d.nombre_departamento',
      'FROM empleados e',
      'LEFT OUTER JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.id_empleado IN (2, 3, 6, 9, 20)',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY, SAMPLE), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-LEFT-SIN-EMPLEADOS',
    lines(
      'SELECT d.nombre_departamento, e.nombre',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      'WHERE e.id_empleado IS NULL;',
    ),
    [source('DEPARTAMENTOS', DEP_KEY), source('EMPLEADOS', EMP_KEY)],
  ),
  query(
    'S2-E-LEFT-FILTRO-ON',
    lines(
      'SELECT d.nombre_departamento, e.nombre',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      "  AND e.cargo = 'Líder de área'",
      'ORDER BY d.id_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-LEFT-FILTRO-WHERE',
    lines(
      'SELECT d.nombre_departamento, e.nombre',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      "WHERE e.cargo = 'Líder de área'",
      'ORDER BY d.id_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-RIGHT',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'RIGHT OUTER JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE d.id_departamento IN (50, 60)',
      'ORDER BY d.id_departamento, e.nombre;',
    ),
    [source('EMPLEADOS', EMP_KEY, [5, 16, 17]), source('DEPARTAMENTOS', DEP_KEY, [50, 60])],
  ),
  query(
    'S2-E-FULL',
    lines(
      'SELECT e.nombre, d.nombre_departamento',
      'FROM empleados e',
      'FULL OUTER JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      'WHERE e.id_empleado IS NULL',
      '   OR d.id_departamento IS NULL',
      '   OR d.id_departamento = 50',
      'ORDER BY d.id_departamento, e.nombre;',
    ),
    [source('EMPLEADOS', EMP_KEY, [5, 16, 17, 20]), source('DEPARTAMENTOS', DEP_KEY, [50, 60])],
  ),
  query(
    'S2-E-FULL-CONTEO',
    lines(
      'SELECT COUNT(*) AS filas',
      'FROM empleados e',
      'FULL OUTER JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento;',
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-E-SELF',
    lines(
      'SELECT e.nombre AS empleado, j.nombre AS jefe',
      'FROM empleados e',
      'JOIN empleados j',
      '  ON e.id_jefe = j.id_empleado',
      'WHERE e.id_departamento = 20',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ID_JEFE'], [1, 2, 6, 7, 8])],
  ),
  query(
    'S2-E-SELF-LEFT',
    lines(
      'SELECT e.nombre AS empleado, j.nombre AS jefe',
      'FROM empleados e',
      'LEFT JOIN empleados j',
      '  ON e.id_jefe = j.id_empleado',
      'WHERE e.id_jefe IS NULL',
      '   OR e.id_jefe = 1',
      'ORDER BY e.id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_JEFE'], [1, 2, 3, 4, 5, 18, 19, 20])],
  ),
  query(
    'S2-E-CROSS',
    lines(
      'SELECT d.nombre_departamento, p.nombre_proyecto',
      'FROM departamentos d',
      'CROSS JOIN proyectos p',
      'WHERE d.id_departamento IN (10, 60)',
      '  AND p.id_proyecto IN (101, 102, 103)',
      'ORDER BY d.id_departamento, p.id_proyecto;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY, [10, 60]),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO'], [101, 102, 103]),
    ],
  ),
  query(
    'S2-E-CROSS-CONTEO',
    lines('SELECT COUNT(*) AS combinaciones', 'FROM departamentos', 'CROSS JOIN proyectos;'),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-E-SIN-CONDICION',
    lines(
      'SELECT COUNT(*) AS filas',
      'FROM empleados e, departamentos d',
      "WHERE d.sede = 'Bogotá';",
    ),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'SEDE'])],
  ),
  query(
    'S2-E-JOIN-SIN-ON',
    lines('SELECT e.nombre, d.nombre_departamento', 'FROM empleados e', 'JOIN departamentos d;'),
    [source('EMPLEADOS', EMP_KEY), source('DEPARTAMENTOS', DEP_KEY)],
    { expectError: 'ORA-02000' },
  ),
  query(
    'S2-E-USING',
    lines(
      'SELECT e.nombre, id_departamento, d.nombre_departamento',
      'FROM empleados e',
      'JOIN departamentos d',
      '  USING (id_departamento)',
      'WHERE id_departamento = 40',
      'ORDER BY e.nombre;',
    ),
    [source('EMPLEADOS', EMP_KEY, [4, 13, 14, 15]), source('DEPARTAMENTOS', DEP_KEY, [40])],
  ),
  query(
    'S2-E-NATURAL',
    lines(
      'SELECT e.nombre, p.nombre_proyecto',
      'FROM empleados e',
      'NATURAL JOIN proyectos p',
      "WHERE e.nombre = 'Andrés'",
      'ORDER BY p.nombre_proyecto;',
    ),
    [
      source('EMPLEADOS', EMP_KEY, [6]),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO'], [101, 102]),
    ],
  ),
  query(
    'S2-E-PROYECTO-REAL',
    lines(
      'SELECT e.nombre, p.nombre_proyecto',
      'FROM empleados e',
      'JOIN asignaciones a',
      '  ON e.id_empleado = a.id_empleado',
      'JOIN proyectos p',
      '  ON a.id_proyecto = p.id_proyecto',
      "WHERE e.nombre = 'Andrés';",
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE'], [6]),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO'], [6]),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO'], [101]),
    ],
  ),
];

export const JOIN_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S2-L01',
    block: 'relaciones',
    slug: 'claves-primarias-y-foraneas',
    title: 'Por qué varias tablas: claves primarias y foráneas',
    shortTitle: 'PK y FK',
    summary:
      'Una tabla guarda una sola cosa; las claves conectan cada empleado con su departamento.',
    concepts: ['primary-key', 'foreign-key', 'referential-integrity'],
    purpose:
      'Guardar cada dato una sola vez (el nombre del departamento vive solo en DEPARTAMENTOS) y aun así poder reunirlo cuando una pregunta lo necesita.',
    syntax: lines(
      'CREATE TABLE empleados (',
      '  id_empleado     NUMBER(4) PRIMARY KEY,',
      '  ...',
      '  id_departamento NUMBER(4)',
      '    REFERENCES departamentos (id_departamento)',
      ');',
    ),
    explanation: [
      'En la Sección 1, EMPLEADOS repetía el texto «TI» en cada persona de TI. Si el área cambiara de nombre habría que corregir cinco filas. Ahora el nombre vive una sola vez en DEPARTAMENTOS y cada empleado guarda solo el número del área: ID_DEPARTAMENTO.',
      'La clave primaria (PRIMARY KEY) identifica cada fila sin repetirse ni quedar vacía. La clave foránea (FOREIGN KEY) es una columna que apunta a la clave primaria de otra tabla: EMPLEADOS.ID_DEPARTAMENTO apunta a DEPARTAMENTOS.ID_DEPARTAMENTO.',
      'Oracle protege la relación: no deja guardar un empleado con un departamento que no existe (integridad referencial). Una clave foránea sí puede quedar en NULL: Esteban Torres todavía no tiene departamento.',
    ],
    example: {
      question: '¿En qué área trabaja cada persona? EMPLEADOS solo dice un número.',
      example: 'S2-E-PK-FK',
      reading:
        'Muestra el identificador, el nombre y el número de departamento de cuatro personas. Para saber qué es el 20 hay que mirar DEPARTAMENTOS: es TI.',
    },
    more: [
      {
        question:
          '¿Qué pasa si se intenta guardar un empleado en el departamento 70, que no existe?',
        example: 'S2-E-FK-VIOLADA',
        reading:
          'Oracle rechaza la fila con ORA-02291: la clave foránea EMPLEADOS_DEPARTAMENTO_FK no encuentra su clave padre.',
      },
      {
        question: '¿Y si se repite la clave primaria 20 en DEPARTAMENTOS?',
        example: 'S2-E-PK-DUPLICADA',
        reading:
          'Oracle rechaza la fila con ORA-00001: la clave primaria DEPARTAMENTOS_PK no admite valores repetidos.',
      },
    ],
    changed: [
      'El dato completo está repartido: el número en EMPLEADOS y el nombre en DEPARTAMENTOS.',
      'Esteban Torres (20) tiene ID_DEPARTAMENTO en NULL: la FK lo permite.',
    ],
    mistakes: [
      {
        title: 'Creer que la FK debe tener el mismo nombre que la PK',
        why: 'Lo que importa es la restricción REFERENCES, no el nombre. ID_JEFE es una FK hacia ID_EMPLEADO, con otro nombre.',
      },
      {
        title: 'Creer que una FK nunca puede ser NULL',
        why: 'Una FK sin NOT NULL admite NULL: significa «todavía sin relación». Lo que no admite es un valor que no exista en la tabla padre.',
      },
    ],
    check: {
      id: 'S2-L01-C',
      kind: 'choice',
      lesson: 'S2-L01',
      prompt: '¿Qué columna de EMPLEADOS es la clave foránea que la conecta con DEPARTAMENTOS?',
      options: [
        {
          text: 'ID_DEPARTAMENTO',
          code: true,
          correct: true,
          feedback: 'Exacto: guarda el número de la fila de DEPARTAMENTOS a la que pertenece.',
        },
        {
          text: 'ID_EMPLEADO',
          code: true,
          correct: false,
          feedback: 'Es la clave primaria de EMPLEADOS: identifica a la persona, no a su área.',
        },
        {
          text: 'ID_JEFE',
          code: true,
          correct: false,
          feedback:
            'También es una FK, pero apunta a la misma tabla EMPLEADOS, no a DEPARTAMENTOS.',
        },
        {
          text: 'NOMBRE_DEPARTAMENTO',
          code: true,
          correct: false,
          feedback: 'Esa columna está en DEPARTAMENTOS; EMPLEADOS ya no guarda el nombre del área.',
        },
      ],
      hints: [
        'Busca en EMPLEADOS una columna cuyo valor también aparezca en DEPARTAMENTOS.',
        'El número 20 de Andrés coincide con la clave primaria de TI.',
      ],
      explanation:
        'EMPLEADOS.ID_DEPARTAMENTO es la clave foránea: sus valores (10, 20…) son claves primarias de DEPARTAMENTOS.',
    },
    keyIdea: 'La clave primaria identifica; la clave foránea apunta. Juntas permiten reunir datos.',
    topic: 'relaciones',
    version: 1,
  },
  {
    id: 'S2-L02',
    block: 'relaciones',
    slug: 'alias-de-tabla',
    title: 'Alias de tabla y columnas calificadas',
    shortTitle: 'Alias de tabla',
    summary: 'Un alias corto (e, d) dice de qué tabla sale cada columna cuando hay más de una.',
    concepts: ['table-alias'],
    purpose:
      'Escribir consultas de varias tablas más cortas y sin ambigüedad: e.nombre es el nombre del empleado y d.nombre_departamento, el del área.',
    syntax: lines('SELECT alias.columna', 'FROM tabla alias;'),
    explanation: [
      'El alias de tabla se escribe justo después del nombre de la tabla, sin AS (Oracle no acepta AS en el alias de tabla). Desde ese momento la tabla se llama así en toda la consulta.',
      'Calificar una columna es escribir alias.columna. Con una sola tabla es opcional; con dos tablas que comparten un nombre de columna, como ID_DEPARTAMENTO, es obligatorio.',
    ],
    example: {
      question: '¿Cómo se ve una consulta de una tabla escrita con alias?',
      example: 'S2-E-ALIAS-TABLA',
      reading:
        'Llama e a EMPLEADOS y toma de ella nombre, cargo y salario de las personas del departamento 20, de mayor a menor salario (con empate, por nombre).',
    },
    changed: [
      'El resultado es el mismo que sin alias: el alias cambia cómo se escribe, no qué se obtiene.',
    ],
    mistakes: [
      {
        title: 'Escribir AS en el alias de tabla',
        why: 'En Oracle, FROM empleados AS e es un error de sintaxis. AS sirve para alias de columna, no de tabla.',
        wrong: 'FROM empleados AS e',
        right: 'FROM empleados e',
      },
      {
        title: 'Usar el nombre completo después de definir el alias',
        why: 'Con FROM empleados e, la tabla ya se llama e: empleados.nombre da error ORA-00904.',
        wrong: 'SELECT empleados.nombre FROM empleados e',
        right: 'SELECT e.nombre FROM empleados e',
      },
    ],
    check: {
      id: 'S2-L02-C',
      kind: 'choice',
      lesson: 'S2-L02',
      prompt: '¿Cuál de estas cláusulas FROM es válida en Oracle?',
      options: [
        {
          text: 'FROM empleados e',
          code: true,
          correct: true,
          feedback: 'Correcto: el alias de tabla va después del nombre, sin AS.',
        },
        {
          text: 'FROM empleados AS e',
          code: true,
          correct: false,
          feedback: 'Oracle no admite AS para alias de tabla (sí para alias de columna).',
        },
        {
          text: 'FROM e = empleados',
          code: true,
          correct: false,
          feedback: 'No existe esa forma: el alias no se asigna con =.',
        },
        {
          text: "FROM empleados 'e'",
          code: true,
          correct: false,
          feedback: 'Las comillas simples son para textos; un alias no es un texto.',
        },
      ],
      hints: [
        'Recuerda en qué se diferencia el alias de tabla del alias de columna.',
        'AS se usa en SELECT, no en FROM.',
      ],
      explanation:
        'En Oracle el alias de tabla se escribe a continuación del nombre: FROM empleados e.',
    },
    keyIdea: 'Con varias tablas, cada columna lleva su alias: e.nombre, d.nombre_departamento.',
    topic: 'relaciones',
    version: 1,
  },
  {
    id: 'S2-L03',
    block: 'modelo-join',
    slug: 'modelo-mental-del-join',
    title: 'Tabla A + tabla B + condición = resultado',
    shortTitle: 'Modelo del JOIN',
    summary:
      'Un JOIN arma filas nuevas uniendo cada fila de una tabla con las filas de otra que cumplen la condición.',
    concepts: ['join'],
    purpose:
      'Entender qué hace Oracle antes de memorizar la sintaxis: buscar pareja para cada fila usando la columna que conecta las tablas.',
    syntax: lines(
      'SELECT columnas',
      'FROM tabla_a a',
      'JOIN tabla_b b',
      '  ON a.columna = b.columna;',
    ),
    explanation: [
      'Piensa en cada fila de EMPLEADOS buscando su departamento: toma su ID_DEPARTAMENTO y busca en DEPARTAMENTOS la fila con el mismo valor. Si la encuentra, se forma una fila del resultado con columnas de las dos tablas.',
      'La condición ON dice qué columnas deben coincidir. Sin ella no hay forma de saber qué departamento corresponde a cada persona.',
      'Una fila sin pareja (Esteban, con ID_DEPARTAMENTO NULL) no aparece en un JOIN normal: NULL no es igual a ningún valor.',
    ],
    example: {
      question: '¿Cómo se combinan cinco empleados con sus departamentos?',
      example: 'S2-E-MODELO',
      reading:
        'Para cada uno de los empleados 2, 3, 6, 9 y 20 busca el departamento con el mismo ID_DEPARTAMENTO y muestra el nombre del área junto al de la persona.',
      visual: {
        kind: 'join',
        join: 'inner',
        left: 'EMPLEADOS',
        right: 'DEPARTAMENTOS',
        leftKey: 'ID_DEPARTAMENTO',
        rightKey: 'ID_DEPARTAMENTO',
      },
    },
    changed: [
      'Entran cinco empleados y salen cuatro filas: Esteban no tiene pareja.',
      'Cada fila del resultado tiene columnas de las dos tablas.',
      'Ventas y TI aparecen dos veces: un departamento puede emparejarse con varias personas.',
    ],
    mistakes: [
      {
        title: 'Pensar que el JOIN suma filas',
        why: 'El resultado no es «filas de A más filas de B»: son las parejas que cumplen la condición.',
      },
    ],
    check: {
      id: 'S2-L03-C',
      kind: 'count',
      lesson: 'S2-L03',
      prompt:
        'Antes de ver el resultado: ¿cuántas filas devuelve esta consulta con los cinco empleados de la muestra?',
      context: { example: 'S2-E-MODELO' },
      hints: [
        'Cada empleado con un ID_DEPARTAMENTO que exista en DEPARTAMENTOS produce una fila.',
        'Revisa si algún empleado tiene ID_DEPARTAMENTO en NULL.',
      ],
      explanation:
        'Cuatro: Carlos, María, Andrés y Sofía encuentran su departamento; Esteban (NULL) no encuentra ninguno.',
    },
    keyIdea: 'JOIN = cada fila busca su pareja según la condición ON.',
    topic: 'join',
    version: 1,
  },
  {
    id: 'S2-L04',
    block: 'inner-join',
    slug: 'inner-join',
    title: 'INNER JOIN … ON',
    shortTitle: 'INNER JOIN',
    summary: 'INNER JOIN devuelve solo las filas que tienen pareja en las dos tablas.',
    concepts: ['inner-join', 'on'],
    purpose:
      'Responder preguntas que necesitan datos de dos tablas relacionadas, como el nombre de cada empleado junto al nombre de su departamento.',
    syntax: lines(
      'SELECT a.columna, b.columna',
      'FROM tabla_a a',
      '[INNER] JOIN tabla_b b',
      '  ON a.clave_foranea = b.clave_primaria;',
    ),
    explanation: [
      'JOIN y INNER JOIN son lo mismo en Oracle: INNER es opcional. La condición ON compara la clave foránea de una tabla con la clave primaria de la otra.',
      'El resultado tiene una fila por cada pareja. Las filas sin pareja en cualquiera de las dos tablas quedan fuera: por eso es un JOIN «interno».',
    ],
    example: {
      question: '¿Cuál es el nombre del departamento de cada empleado?',
      example: 'S2-E-INNER',
      reading:
        'Une cada empleado con su departamento por ID_DEPARTAMENTO y muestra el nombre de la persona y el del área.',
      visual: {
        kind: 'join',
        join: 'inner',
        left: 'EMPLEADOS',
        right: 'DEPARTAMENTOS',
        leftKey: 'ID_DEPARTAMENTO',
        rightKey: 'ID_DEPARTAMENTO',
      },
    },
    more: [
      {
        question: '¿Cambia algo si se escribe INNER JOIN?',
        example: 'S2-E-INNER-EXPLICITO',
        reading: 'Devuelve exactamente lo mismo: INNER es la opción por defecto de JOIN.',
        visual: {
          kind: 'compare',
          other: 'S2-E-INNER',
          labels: ['INNER JOIN', 'JOIN'],
        },
      },
    ],
    changed: [
      'De 20 empleados quedan 19 filas: Esteban no tiene departamento.',
      'Investigación no aparece: ningún empleado apunta a ella.',
      'Las columnas vienen de dos tablas distintas.',
    ],
    mistakes: [
      {
        title: 'Comparar columnas que no se relacionan',
        why: 'ON e.id_empleado = d.id_departamento es SQL válido, pero compara un empleado con un área: el resultado no significa nada y Oracle no avisa.',
        wrong: 'ON e.id_empleado = d.id_departamento',
        right: 'ON e.id_departamento = d.id_departamento',
      },
    ],
    check: {
      id: 'S2-L04-C',
      kind: 'choice',
      lesson: 'S2-L04',
      prompt: '¿Por qué Investigación no aparece en el resultado de EMPLEADOS JOIN DEPARTAMENTOS?',
      options: [
        {
          text: 'Porque ningún empleado tiene ID_DEPARTAMENTO = 60.',
          correct: true,
          feedback: 'Correcto: INNER JOIN solo conserva parejas, y Investigación no tiene ninguna.',
        },
        {
          text: 'Porque su SEDE es distinta de la de los demás.',
          correct: false,
          feedback: 'La condición ON solo compara ID_DEPARTAMENTO; la sede no interviene.',
        },
        {
          text: 'Porque JOIN muestra solo las primeras cinco áreas.',
          correct: false,
          feedback: 'JOIN no limita la cantidad de filas: todas las parejas aparecen.',
        },
        {
          text: 'Porque falta escribir la palabra INNER.',
          correct: false,
          feedback: 'JOIN e INNER JOIN son equivalentes en Oracle.',
        },
      ],
      hints: [
        'Piensa en qué filas de DEPARTAMENTOS encuentran pareja en EMPLEADOS.',
        'Busca cuántos empleados tienen el valor 60 en ID_DEPARTAMENTO.',
      ],
      explanation:
        'En un INNER JOIN, una fila que no encuentra pareja desaparece. Ningún empleado apunta al 60.',
    },
    keyIdea: 'INNER JOIN conserva solo las parejas que cumplen ON; lo demás queda fuera.',
    topic: 'join',
    version: 1,
  },
  {
    id: 'S2-L05',
    block: 'inner-join',
    slug: 'columnas-de-varias-tablas',
    title: 'Columnas de varias tablas y nombres repetidos',
    shortTitle: 'Columnas de 2 tablas',
    summary: 'Después del JOIN se pueden elegir, comparar y calificar columnas de las dos tablas.',
    concepts: ['table-alias', 'on'],
    purpose:
      'Hacer preguntas que comparan un dato de cada tabla, como «¿quién trabaja en una ciudad distinta de la sede de su área?».',
    syntax: lines(
      'SELECT a.col1, b.col2',
      'FROM tabla_a a',
      'JOIN tabla_b b ON a.clave = b.clave',
      'WHERE a.col3 <> b.col4;',
    ),
    explanation: [
      'Tras el JOIN, cada fila tiene las columnas de EMPLEADOS y las de DEPARTAMENTOS. Se pueden mostrar, filtrar u ordenar como si fueran de una sola tabla.',
      'Las columnas con el mismo nombre en las dos tablas (ID_DEPARTAMENTO) deben calificarse con su alias. Calificar todas, aunque no sea obligatorio, hace la consulta más fácil de leer.',
    ],
    example: {
      question: '¿Quién trabaja en una ciudad distinta de la sede de su departamento?',
      example: 'S2-E-SEDE-CIUDAD',
      reading:
        'Une empleados y departamentos, y conserva las filas en las que la ciudad de la persona no coincide con la sede de su área.',
      visual: { kind: 'transform' },
    },
    more: [
      {
        question: 'Si se quiere mostrar ID_DEPARTAMENTO, ¿de qué tabla sale?',
        example: 'S2-E-COLUMNA-CALIFICADA',
        reading:
          'Con e.id_departamento no hay duda: es la columna de EMPLEADOS (en un INNER JOIN vale lo mismo que d.id_departamento).',
      },
      {
        question: 'Error esperado: una columna tiene dos orígenes posibles.',
        example: 'S2-E-AMBIGUA',
        reading:
          'Después de aprender JOIN y ON, compara los nombres: ID_DEPARTAMENTO existe en ambas tablas. Oracle devuelve ORA-00918; e.id_departamento o d.id_departamento resuelve la ambigüedad.',
      },
    ],
    changed: [
      'Hay columnas de las dos tablas en la misma fila: e.ciudad junto a d.sede.',
      'El WHERE compara dos columnas de tablas distintas.',
    ],
    mistakes: [
      {
        title: 'Columna ambigua',
        why: 'Si dos tablas tienen ID_DEPARTAMENTO, escribirla sin alias da ORA-00918.',
        wrong: 'SELECT id_departamento FROM empleados e JOIN departamentos d ON …',
        right: 'SELECT e.id_departamento FROM empleados e JOIN departamentos d ON …',
      },
    ],
    check: {
      id: 'S2-L05-C',
      kind: 'choice',
      lesson: 'S2-L05',
      prompt:
        'En EMPLEADOS e JOIN DEPARTAMENTOS d, ¿qué columna debe escribirse obligatoriamente con alias?',
      options: [
        {
          text: 'ID_DEPARTAMENTO',
          code: true,
          correct: true,
          feedback: 'Exacto: existe en las dos tablas, así que sin alias es ambigua.',
        },
        {
          text: 'NOMBRE',
          code: true,
          correct: false,
          feedback: 'Solo existe en EMPLEADOS (en DEPARTAMENTOS se llama NOMBRE_DEPARTAMENTO).',
        },
        {
          text: 'SEDE',
          code: true,
          correct: false,
          feedback: 'Solo existe en DEPARTAMENTOS: Oracle sabe de dónde sale.',
        },
        {
          text: 'Todas, siempre',
          correct: false,
          feedback:
            'Calificar todas es una buena práctica, pero solo es obligatorio con los nombres repetidos.',
        },
      ],
      hints: [
        'Busca un nombre de columna que aparezca en las dos tablas.',
        'Es justamente la columna de la condición ON.',
      ],
      explanation:
        'Solo los nombres que existen en ambas tablas son ambiguos. Aquí, ID_DEPARTAMENTO.',
    },
    keyIdea: 'Columna repetida en dos tablas = columna con alias.',
    topic: 'join',
    version: 1,
  },
  {
    id: 'S2-L06',
    block: 'inner-join',
    slug: 'join-con-where',
    title: 'JOIN con WHERE y ORDER BY',
    shortTitle: 'JOIN + WHERE',
    summary: 'ON une las tablas; WHERE filtra las filas ya unidas; ORDER BY las ordena.',
    concepts: ['on', 'inner-join'],
    purpose:
      'Combinar lo aprendido en la Sección 1 con varias tablas: filtrar por un dato de cualquiera de ellas.',
    syntax: lines(
      'SELECT …',
      'FROM tabla_a a',
      'JOIN tabla_b b ON a.clave = b.clave',
      'WHERE condición',
      'ORDER BY columna;',
    ),
    explanation: [
      'ON responde «¿qué filas van juntas?». WHERE responde «¿cuáles de esas parejas me interesan?». En un INNER JOIN, poner un filtro en ON o en WHERE da el mismo resultado, pero separarlos hace la intención clara.',
      'El WHERE puede usar columnas de cualquiera de las tablas unidas: aquí, la sede (DEPARTAMENTOS) y el estado (EMPLEADOS).',
    ],
    example: {
      question: '¿Qué personas activas trabajan en departamentos con sede en Bogotá?',
      example: 'S2-E-JOIN-WHERE',
      reading:
        'Une empleados y departamentos, se queda con las parejas cuya sede es Bogotá y cuyo empleado está activo, y ordena por salario de mayor a menor (con empate, por nombre).',
      visual: { kind: 'transform' },
    },
    more: [
      {
        question: '¿Qué ocurre si ON compara columnas equivocadas?',
        example: 'S2-E-ON-EQUIVOCADO',
        reading:
          'Oracle ejecuta la consulta sin error, pero empareja el empleado 10 con el departamento 10, el 20 con el 20… El resultado no tiene sentido.',
        visual: { kind: 'compare', other: 'S2-E-INNER', labels: ['ON equivocado', 'ON correcto'] },
      },
    ],
    changed: [
      'Primero se forman las parejas; después WHERE descarta las que no son de Bogotá o no están activas.',
      'El orden lo decide ORDER BY, igual que con una tabla.',
    ],
    mistakes: [
      {
        title: 'Confiar en que «no dio error»',
        why: 'Un ON con columnas equivocadas es SQL válido y devuelve filas. Revisa siempre que la condición una la FK con su PK.',
      },
    ],
    check: {
      id: 'S2-L06-C',
      kind: 'count',
      lesson: 'S2-L06',
      prompt:
        '¿Cuántas filas devuelve la consulta de personas activas en áreas con sede en Bogotá?',
      context: { example: 'S2-E-JOIN-WHERE' },
      hints: [
        'Las áreas con sede en Bogotá son Operaciones, TI y Recursos Humanos.',
        'Descarta a Oscar Vega y a Alicia Paz: están inactivos.',
      ],
      explanation:
        'Operaciones aporta a Ana y Felipe; TI a Carlos, Andrés y Paula; Recursos Humanos a Laura, Julián y Carolina.',
    },
    keyIdea: 'ON decide las parejas; WHERE decide cuáles parejas se quedan.',
    topic: 'join',
    version: 1,
  },
  {
    id: 'S2-L07',
    block: 'inner-join',
    slug: 'joins-multiples',
    title: 'JOIN de tres o más tablas',
    shortTitle: 'Joins múltiples',
    summary:
      'Cada JOIN añade una tabla con su propia condición; una tabla intermedia une relaciones muchos a muchos.',
    concepts: ['inner-join', 'junction-table'],
    purpose:
      'Responder preguntas que cruzan más de dos tablas, como quién trabaja en qué proyecto y cuántas horas.',
    syntax: lines(
      'SELECT …',
      'FROM tabla_a a',
      'JOIN tabla_b b ON a.clave = b.clave',
      'JOIN tabla_c c ON b.otra_clave = c.otra_clave;',
    ),
    explanation: [
      'Una persona puede estar en varios proyectos y un proyecto tiene varias personas: es una relación muchos a muchos. ASIGNACIONES la resuelve con una fila por cada pareja persona–proyecto.',
      'Para ir de EMPLEADOS a PROYECTOS se pasa por ASIGNACIONES: dos JOIN, cada uno con su ON. Con n tablas hacen falta, por lo general, n − 1 condiciones de unión.',
    ],
    example: {
      question: '¿Quién trabaja en los proyectos 101 y 104, con qué rol y cuántas horas?',
      example: 'S2-E-TRES-TABLAS',
      reading:
        'Parte de ASIGNACIONES, trae el nombre de cada persona desde EMPLEADOS y el del proyecto desde PROYECTOS, y deja solo los proyectos 101 y 104.',
      visual: { kind: 'transform' },
    },
    more: [
      {
        question:
          '¿Quién trabaja en un proyecto de un departamento distinto del suyo? (DEPARTAMENTOS dos veces)',
        example: 'S2-E-CUATRO-TABLAS',
        reading:
          'Usa DEPARTAMENTOS dos veces con alias distintos: una para el área de la persona y otra para el área del proyecto.',
      },
    ],
    changed: [
      'Tres tablas producen una sola tabla de resultado.',
      'Una persona aparece una vez por cada proyecto en el que trabaja.',
    ],
    mistakes: [
      {
        title: 'Olvidar una condición de unión',
        why: 'Con tres tablas y una sola condición, la tabla sin condición se combina con todas las filas: el resultado se multiplica.',
      },
      {
        title: 'Usar la misma tabla dos veces con el mismo alias',
        why: 'Cada aparición de una tabla necesita su propio alias (d_emp y d_pro).',
      },
    ],
    check: {
      id: 'S2-L07-C',
      kind: 'choice',
      lesson: 'S2-L07',
      prompt:
        'Para unir EMPLEADOS, ASIGNACIONES y PROYECTOS, ¿cuántas condiciones de unión se necesitan?',
      options: [
        {
          text: 'Dos: EMPLEADOS–ASIGNACIONES y ASIGNACIONES–PROYECTOS.',
          correct: true,
          feedback: 'Correcto: n tablas necesitan n − 1 condiciones de unión.',
        },
        {
          text: 'Una: Oracle deduce la otra por las claves foráneas.',
          correct: false,
          feedback: 'Oracle no deduce condiciones de las FK: cada JOIN necesita su ON.',
        },
        {
          text: 'Tres: una por cada tabla.',
          correct: false,
          feedback: 'Cada condición une dos tablas; con tres tablas bastan dos.',
        },
        {
          text: 'Ninguna, si se usa INNER JOIN.',
          correct: false,
          feedback: 'INNER JOIN sin ON es un error de sintaxis en Oracle.',
        },
      ],
      hints: [
        'Cada condición ON conecta exactamente dos tablas.',
        'ASIGNACIONES está en medio: se conecta con cada una de las otras.',
      ],
      explanation: 'Con n tablas se necesitan, por lo general, n − 1 condiciones de unión.',
    },
    keyIdea: 'n tablas → n − 1 condiciones ON; la tabla intermedia une el muchos a muchos.',
    topic: 'join',
    version: 1,
  },
  {
    id: 'S2-L08',
    block: 'otros-join',
    slug: 'left-outer-join',
    title: 'LEFT OUTER JOIN: conservar las filas sin pareja',
    shortTitle: 'LEFT JOIN',
    summary:
      'LEFT JOIN conserva todas las filas de la tabla izquierda; si no tienen pareja, las columnas de la derecha quedan en NULL.',
    concepts: ['left-join', 'outer-join'],
    purpose:
      'No perder información: listar a todas las personas aunque no tengan departamento, o encontrar las áreas que no tienen empleados.',
    syntax: lines(
      'SELECT …',
      'FROM tabla_izquierda i',
      'LEFT [OUTER] JOIN tabla_derecha d',
      '  ON i.clave = d.clave;',
    ),
    explanation: [
      'La tabla «izquierda» es la que se escribe antes de LEFT JOIN. Todas sus filas aparecen en el resultado; las que no encuentran pareja llevan NULL en las columnas de la otra tabla.',
      'Para encontrar filas sin pareja se combina LEFT JOIN con WHERE … IS NULL sobre una columna de la tabla derecha que nunca es NULL cuando hay pareja (su clave primaria).',
      'Cuidado con el WHERE: un filtro sobre la tabla derecha en el WHERE descarta las filas con NULL y convierte el LEFT JOIN en un INNER JOIN. Si el filtro es parte del emparejamiento, va en ON.',
    ],
    example: {
      question: '¿Cómo listar a los cinco empleados de la muestra, tengan o no departamento?',
      example: 'S2-E-LEFT',
      reading:
        'Toma todos los empleados de la muestra (tabla izquierda) y añade el nombre del departamento cuando lo encuentra. Esteban queda con NULL.',
      visual: {
        kind: 'join',
        join: 'left',
        left: 'EMPLEADOS',
        right: 'DEPARTAMENTOS',
        leftKey: 'ID_DEPARTAMENTO',
        rightKey: 'ID_DEPARTAMENTO',
      },
    },
    more: [
      {
        question: '¿Qué departamentos no tienen ningún empleado?',
        example: 'S2-E-LEFT-SIN-EMPLEADOS',
        reading:
          'Parte de DEPARTAMENTOS, intenta emparejar empleados y se queda con las filas en las que no hubo pareja (e.id_empleado IS NULL).',
        visual: {
          kind: 'join',
          join: 'left',
          left: 'DEPARTAMENTOS',
          right: 'EMPLEADOS',
          leftKey: 'ID_DEPARTAMENTO',
          rightKey: 'ID_DEPARTAMENTO',
        },
      },
      {
        question: '¿Da lo mismo filtrar los líderes en ON que en WHERE?',
        example: 'S2-E-LEFT-FILTRO-ON',
        reading:
          'En ON, el filtro decide qué empleados sirven de pareja: los seis departamentos se conservan y Operaciones e Investigación, sin «Líder de área», quedan con NULL. En WHERE, el filtro se aplica después y elimina esas dos filas.',
        visual: {
          kind: 'compare',
          other: 'S2-E-LEFT-FILTRO-WHERE',
          labels: ['Filtro en ON', 'Filtro en WHERE'],
        },
      },
    ],
    changed: [
      'Entran cinco empleados y salen cinco filas: nadie se pierde.',
      'Esteban aparece con NOMBRE_DEPARTAMENTO en NULL.',
    ],
    mistakes: [
      {
        title: 'Filtrar la tabla derecha en el WHERE',
        why: 'WHERE d.columna = … descarta las filas con NULL: el LEFT JOIN deja de conservar las filas sin pareja.',
      },
      {
        title: 'Confundir izquierda y derecha',
        why: 'La izquierda es la tabla escrita antes de LEFT JOIN, no la más importante. Para conservar todos los departamentos, DEPARTAMENTOS va a la izquierda.',
      },
    ],
    check: {
      id: 'S2-L08-C',
      kind: 'choice',
      lesson: 'S2-L08',
      prompt:
        '¿Qué consulta conserva todos los departamentos, incluso los que no tienen empleados?',
      options: [
        {
          text: 'FROM departamentos d LEFT JOIN empleados e ON d.id_departamento = e.id_departamento',
          code: true,
          correct: true,
          feedback:
            'Correcto: DEPARTAMENTOS está a la izquierda, así que todas sus filas se conservan.',
        },
        {
          text: 'FROM empleados e LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento',
          code: true,
          correct: false,
          feedback:
            'Esta conserva todos los empleados; Investigación se pierde porque nadie la referencia.',
        },
        {
          text: 'FROM departamentos d JOIN empleados e ON d.id_departamento = e.id_departamento',
          code: true,
          correct: false,
          feedback: 'Un INNER JOIN descarta los departamentos sin empleados.',
        },
        {
          text: 'FROM departamentos d CROSS JOIN empleados e',
          code: true,
          correct: false,
          feedback:
            'CROSS JOIN combina todo con todo y no tiene condición: no responde la pregunta.',
        },
      ],
      hints: [
        '¿Qué tabla debe conservar todas sus filas?',
        'LEFT JOIN conserva la tabla escrita antes de LEFT JOIN.',
      ],
      explanation:
        'La tabla que se quiere conservar completa va a la izquierda del LEFT JOIN: aquí, DEPARTAMENTOS.',
    },
    keyIdea: 'LEFT JOIN = todas las filas de la izquierda; NULL donde no hay pareja.',
    topic: 'otros-join',
    version: 1,
  },
  {
    id: 'S2-L09',
    block: 'otros-join',
    slug: 'right-y-full-outer-join',
    title: 'RIGHT y FULL OUTER JOIN',
    shortTitle: 'RIGHT y FULL',
    summary:
      'RIGHT JOIN conserva la tabla derecha; FULL JOIN conserva las filas sin pareja de las dos tablas.',
    concepts: ['right-join', 'full-join', 'outer-join'],
    purpose:
      'Conservar el lado que interesa sin reescribir la consulta, o ver de una vez lo que sobra en cada tabla.',
    syntax: lines(
      'FROM tabla_a a',
      'RIGHT [OUTER] JOIN tabla_b b ON a.clave = b.clave',
      '',
      'FROM tabla_a a',
      'FULL [OUTER] JOIN tabla_b b ON a.clave = b.clave',
    ),
    explanation: [
      'A RIGHT JOIN B es lo mismo que B LEFT JOIN A: cambia qué tabla se conserva. Muchos equipos prefieren escribir siempre LEFT JOIN y ordenar las tablas en consecuencia.',
      'FULL OUTER JOIN reúne las parejas, más las filas sin pareja de la izquierda (con NULL a la derecha) y las de la derecha (con NULL a la izquierda).',
    ],
    example: {
      question:
        '¿Quién trabaja en Recursos Humanos y en Investigación, conservando las áreas vacías?',
      example: 'S2-E-RIGHT',
      reading:
        'DEPARTAMENTOS es la tabla derecha: los departamentos 50 y 60 aparecen siempre; Investigación, sin nadie, sale con NULL en NOMBRE.',
      visual: {
        kind: 'join',
        join: 'right',
        left: 'EMPLEADOS',
        right: 'DEPARTAMENTOS',
        leftKey: 'ID_DEPARTAMENTO',
        rightKey: 'ID_DEPARTAMENTO',
      },
    },
    more: [
      {
        question:
          '¿Qué sobra en cada lado? Las parejas de Recursos Humanos más las filas sin pareja.',
        example: 'S2-E-FULL',
        reading:
          'FULL JOIN conserva a Esteban (sin departamento) y a Investigación (sin empleados), además de las parejas de Recursos Humanos.',
        visual: {
          kind: 'join',
          join: 'full',
          left: 'EMPLEADOS',
          right: 'DEPARTAMENTOS',
          leftKey: 'ID_DEPARTAMENTO',
          rightKey: 'ID_DEPARTAMENTO',
        },
      },
      {
        question: '¿Cuántas filas da el FULL JOIN completo?',
        example: 'S2-E-FULL-CONTEO',
        reading: '19 parejas, más Esteban, más Investigación: 21 filas.',
      },
    ],
    changed: [
      'RIGHT JOIN: aparecen todos los departamentos pedidos, aunque estén vacíos.',
      'FULL JOIN: aparecen las filas sin pareja de los dos lados, cada una con NULL en el otro.',
    ],
    mistakes: [
      {
        title: 'Creer que FULL JOIN es todo con todo',
        why: 'Todo con todo es CROSS JOIN. FULL JOIN sigue usando la condición ON: solo añade las filas sin pareja.',
      },
    ],
    check: {
      id: 'S2-L09-C',
      kind: 'count',
      measure: 'value',
      lesson: 'S2-L09',
      prompt:
        'Esta consulta cuenta las filas del FULL OUTER JOIN completo entre EMPLEADOS y DEPARTAMENTOS. ¿Qué número devuelve?',
      context: { example: 'S2-E-FULL-CONTEO', showResult: false },
      hints: [
        'Cuenta las parejas del INNER JOIN y suma las filas sin pareja de cada lado.',
        'Hay 19 parejas, un empleado sin departamento y un departamento sin empleados.',
      ],
      explanation:
        '19 parejas + Esteban + Investigación = 21. La consulta devuelve una fila con el valor 21.',
    },
    keyIdea: 'RIGHT = conserva la derecha; FULL = conserva lo que sobra en ambos lados.',
    topic: 'otros-join',
    version: 1,
  },
  {
    id: 'S2-L10',
    block: 'otros-join',
    slug: 'self-join',
    title: 'SELF JOIN: una tabla consigo misma',
    shortTitle: 'SELF JOIN',
    summary:
      'Una tabla se une consigo misma con dos alias cuando una columna apunta a otra fila de la misma tabla.',
    concepts: ['self-join'],
    purpose: 'Responder preguntas jerárquicas como «¿quién es el jefe de cada persona?».',
    syntax: lines(
      'SELECT e.nombre, j.nombre',
      'FROM empleados e',
      'JOIN empleados j',
      '  ON e.id_jefe = j.id_empleado;',
    ),
    explanation: [
      'ID_JEFE guarda el ID_EMPLEADO de otra persona de la misma tabla. Para leer el nombre del jefe se usa EMPLEADOS dos veces: e (la persona) y j (su jefe).',
      'No es un tipo nuevo de JOIN: es un JOIN normal (INNER o LEFT) en el que las dos tablas son la misma. Los alias distintos son obligatorios.',
    ],
    example: {
      question: '¿Quién es el jefe de cada persona de TI?',
      example: 'S2-E-SELF',
      reading:
        'Para cada empleado de TI (e) busca la fila de EMPLEADOS (j) cuyo ID_EMPLEADO es su ID_JEFE y muestra los dos nombres.',
      visual: {
        kind: 'join',
        join: 'inner',
        left: 'EMPLEADOS',
        right: 'EMPLEADOS',
        leftKey: 'ID_JEFE',
        rightKey: 'ID_EMPLEADO',
      },
    },
    more: [
      {
        question: '¿Y quien no tiene jefe? Con LEFT JOIN también aparece.',
        example: 'S2-E-SELF-LEFT',
        reading:
          'Ana (gerente) y Esteban no tienen jefe: con LEFT JOIN se conservan con JEFE en NULL.',
      },
    ],
    changed: [
      'La misma tabla aporta dos papeles: empleado y jefe.',
      'Los alias de columna (AS empleado, AS jefe) distinguen los dos nombres.',
    ],
    mistakes: [
      {
        title: 'Invertir la condición',
        why: 'ON e.id_empleado = j.id_jefe busca a los subordinados de e, no a su jefe.',
        wrong: 'ON e.id_empleado = j.id_jefe',
        right: 'ON e.id_jefe = j.id_empleado',
      },
    ],
    check: {
      id: 'S2-L10-C',
      kind: 'choice',
      lesson: 'S2-L10',
      prompt: 'En un SELF JOIN de EMPLEADOS, ¿por qué hacen falta dos alias?',
      options: [
        {
          text: 'Porque la misma tabla cumple dos papeles y hay que distinguir sus columnas.',
          correct: true,
          feedback: 'Exacto: e.nombre es el empleado y j.nombre es el jefe.',
        },
        {
          text: 'Porque Oracle copia la tabla en otra temporal.',
          correct: false,
          feedback: 'Oracle no copia nada: los alias solo nombran las dos apariciones.',
        },
        {
          text: 'Porque un SELF JOIN necesita LEFT JOIN.',
          correct: false,
          feedback: 'Puede ser INNER o LEFT; los alias hacen falta en ambos casos.',
        },
        {
          text: 'No hacen falta: basta con ON id_jefe = id_empleado.',
          correct: false,
          feedback: 'Sin alias, Oracle no sabe de qué aparición de EMPLEADOS es cada columna.',
        },
      ],
      hints: [
        'Piensa en qué significa NOMBRE en cada lado de la unión.',
        'Sin alias, «empleados.nombre» tendría dos significados.',
      ],
      explanation:
        'Con dos alias cada aparición de la tabla tiene nombre propio y las columnas dejan de ser ambiguas.',
    },
    keyIdea: 'SELF JOIN = la misma tabla con dos alias y dos papeles.',
    topic: 'otros-join',
    version: 1,
  },
  {
    id: 'S2-L11',
    block: 'otros-join',
    slug: 'cross-y-natural-join',
    title: 'CROSS JOIN, NATURAL JOIN y USING',
    shortTitle: 'CROSS y NATURAL',
    summary:
      'CROSS JOIN combina todo con todo; NATURAL JOIN y USING unen por nombre de columna, con riesgos.',
    concepts: ['cross-join', 'natural-join'],
    purpose:
      'Reconocer el producto cartesiano (a propósito o por un error) y saber por qué la condición explícita es la opción recomendada.',
    syntax: lines(
      'FROM tabla_a CROSS JOIN tabla_b',
      'FROM tabla_a NATURAL JOIN tabla_b',
      'FROM tabla_a JOIN tabla_b USING (columna)',
    ),
    explanation: [
      'CROSS JOIN no tiene condición: cada fila de una tabla se combina con cada fila de la otra (producto cartesiano). 6 departamentos × 7 proyectos = 42 filas. Se usa poco y a propósito, por ejemplo para generar todas las combinaciones posibles.',
      'El mismo producto aparece por error con la sintaxis antigua (FROM a, b) si se olvida la condición en el WHERE.',
      'NATURAL JOIN une automáticamente por todas las columnas con el mismo nombre; USING (columna) elige cuáles. Son válidos en Oracle, pero dependen de los nombres, no del significado: EMPLEADOS NATURAL JOIN PROYECTOS une por ID_DEPARTAMENTO y empareja a cada persona con todos los proyectos de su área, aunque no trabaje en ellos.',
    ],
    example: {
      question: '¿Qué combinaciones salen de dos departamentos y tres proyectos?',
      example: 'S2-E-CROSS',
      reading:
        'Combina cada uno de los dos departamentos con cada uno de los tres proyectos: 2 × 3 = 6 filas.',
      visual: { kind: 'transform' },
    },
    more: [
      {
        question: 'Producto cartesiano completo: ¿cuántas combinaciones hay?',
        example: 'S2-E-CROSS-CONTEO',
        reading: '6 departamentos × 7 proyectos = 42.',
      },
      {
        question: '¿Qué pasa con la sintaxis antigua si se olvida la condición?',
        example: 'S2-E-SIN-CONDICION',
        reading:
          'Cada uno de los 20 empleados se combina con los tres departamentos de Bogotá: 60 filas sin sentido.',
      },
      {
        question: '¿Y si se escribe JOIN sin ON?',
        example: 'S2-E-JOIN-SIN-ON',
        reading:
          'Oracle lo rechaza: falta ON o USING. Oracle 23 responde ORA-02000; Oracle 19c, ORA-00905 (falta una palabra clave).',
      },
      {
        question: 'USING une por una columna con el mismo nombre en las dos tablas.',
        example: 'S2-E-USING',
        reading:
          'Equivale a ON e.id_departamento = d.id_departamento. La columna de USING se escribe sin alias en toda la consulta.',
      },
      {
        question: 'NATURAL JOIN entre EMPLEADOS y PROYECTOS: ¿en qué proyectos trabaja Andrés?',
        example: 'S2-E-NATURAL',
        reading:
          'Devuelve los dos proyectos de TI porque une por ID_DEPARTAMENTO, pero Andrés solo trabaja en Migración a la nube.',
        visual: {
          kind: 'compare',
          other: 'S2-E-PROYECTO-REAL',
          labels: ['NATURAL JOIN (por nombre)', 'Por ASIGNACIONES (real)'],
        },
      },
    ],
    changed: [
      'CROSS JOIN multiplica: filas de A × filas de B.',
      'NATURAL JOIN no muestra la condición: hay que conocer las columnas para saber qué hace.',
    ],
    mistakes: [
      {
        title: 'Producto cartesiano accidental',
        why: 'FROM empleados, departamentos sin condición en el WHERE produce 20 × 6 filas. Con JOIN explícito, Oracle exige ON.',
      },
      {
        title: 'Confiar en NATURAL JOIN',
        why: 'Si alguien añade una columna con un nombre repetido, la condición cambia sin que la consulta cambie.',
      },
    ],
    check: {
      id: 'S2-L11-C',
      kind: 'choice',
      lesson: 'S2-L11',
      prompt: '¿Cuántas filas devuelve FROM departamentos CROSS JOIN proyectos?',
      options: [
        {
          text: '42',
          correct: true,
          feedback: 'Correcto: 6 departamentos × 7 proyectos.',
        },
        {
          text: '13',
          correct: false,
          feedback: 'Eso sería sumar 6 + 7; CROSS JOIN multiplica.',
        },
        {
          text: '7',
          correct: false,
          feedback:
            'Eso sería un proyecto por fila: la cantidad de parejas por la FK, no un CROSS JOIN.',
        },
        {
          text: 'Ninguna: falta ON.',
          correct: false,
          feedback: 'CROSS JOIN no lleva condición: es válido sin ON.',
        },
      ],
      hints: ['CROSS JOIN no tiene condición.', 'Cada departamento se combina con cada proyecto.'],
      explanation: 'El producto cartesiano tiene filas(A) × filas(B) = 6 × 7 = 42 filas.',
    },
    keyIdea: 'CROSS = todo con todo. Une por la condición explícita: ON con la FK y su PK.',
    topic: 'otros-join',
    version: 1,
  },
];
