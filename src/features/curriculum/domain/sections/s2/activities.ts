import { lines, query, source } from '../../builders';
import type { Activity, CurriculumExample, Mission } from '../../types';

/**
 * Sección 2: prácticas guiadas (Practicar) y misiones (Challenge). Las respuestas numéricas
 * y las tablas de resultado salen de Oracle; los distractores de las preguntas «¿qué
 * devuelve?» son resultados reales de consultas con un error plausible.
 */

const EMP_KEY = ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'] as const;
const DEP_KEY = ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'] as const;

export const ACTIVITY_EXAMPLES: readonly CurriculumExample[] = [
  query(
    'S2-P-LEFT-DEP',
    lines(
      'SELECT e.nombre, e.id_departamento, d.nombre_departamento',
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      ' AND e.id_empleado IN (2, 3, 6, 9, 20)',
      'ORDER BY d.id_departamento, e.id_empleado;',
    ),
    [source('EMPLEADOS', EMP_KEY, [2, 3, 6, 9, 20]), source('DEPARTAMENTOS', DEP_KEY)],
  ),
  query(
    'S2-P-COUNT-BONO-TI',
    lines('SELECT COUNT(bono) AS con_bono', 'FROM empleados', 'WHERE id_departamento = 20;'),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'BONO'], [2, 6, 7, 8])],
  ),
  query(
    'S2-P-GROUP-CIUDAD',
    lines(
      'SELECT ciudad, COUNT(*) AS personas',
      'FROM empleados',
      'GROUP BY ciudad',
      'ORDER BY personas DESC, ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'BONO'])],
  ),
  query(
    'S2-P-GROUP-CIUDAD-BONO',
    lines(
      'SELECT ciudad, COUNT(bono) AS personas',
      'FROM empleados',
      'GROUP BY ciudad',
      'ORDER BY personas DESC, ciudad;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'BONO'])],
  ),
  query(
    'S2-P-JOIN-COUNT-INNER',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(e.id_empleado) AS empleados',
      'FROM departamentos d',
      'JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY empleados DESC, d.nombre_departamento;',
    ),
    [source('DEPARTAMENTOS', DEP_KEY), source('EMPLEADOS', EMP_KEY)],
  ),
  query(
    'S2-P-UNION-ALL-CIUDADES',
    lines(
      'SELECT ciudad FROM empleados',
      'UNION ALL',
      'SELECT sede FROM departamentos',
      'ORDER BY ciudad;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']),
      source('DEPARTAMENTOS', ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
  ),
  query(
    'S2-P-PROYECTOS-DEPTO',
    lines(
      'SELECT p.nombre_proyecto, d.nombre_departamento',
      'FROM proyectos p',
      'JOIN departamentos d',
      '  ON p.id_departamento = d.id_departamento',
      'ORDER BY p.id_proyecto;',
    ),
    [
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-P-FINANZAS',
    lines(
      'SELECT e.nombre, e.salario',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE d.nombre_departamento = 'Finanzas'",
      'ORDER BY e.salario DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'], [4, 13, 14, 15]),
      source('DEPARTAMENTOS', DEP_KEY, [40]),
    ],
  ),
  query(
    'S2-P-FINANZAS-ASC',
    lines(
      'SELECT e.nombre, e.salario',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE d.nombre_departamento = 'Finanzas'",
      'ORDER BY e.salario;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'], [4, 13, 14, 15]),
      source('DEPARTAMENTOS', DEP_KEY, [40]),
    ],
  ),
  query(
    'S2-P-FINANZAS-ON',
    lines(
      'SELECT e.nombre, e.salario',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_empleado = d.id_departamento',
      "WHERE d.nombre_departamento = 'Finanzas'",
      'ORDER BY e.salario DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-P-TI-ASIGNACIONES',
    lines(
      'SELECT p.nombre_proyecto, e.nombre',
      'FROM proyectos p',
      'JOIN asignaciones a',
      '  ON p.id_proyecto = a.id_proyecto',
      'JOIN empleados e',
      '  ON a.id_empleado = e.id_empleado',
      'WHERE p.id_departamento = 20',
      'ORDER BY p.nombre_proyecto, e.nombre;',
    ),
    [
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO'], [101, 102]),
      source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO']),
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE']),
    ],
  ),
  query(
    'S2-P-DEP-SIN-PROYECTO',
    lines(
      'SELECT d.nombre_departamento',
      'FROM departamentos d',
      'LEFT JOIN proyectos p',
      '  ON d.id_departamento = p.id_departamento',
      'WHERE p.id_proyecto IS NULL;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-P-DEP-PROY-COUNT',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(p.id_proyecto) AS proyectos',
      'FROM departamentos d',
      'LEFT JOIN proyectos p',
      '  ON d.id_departamento = p.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY proyectos DESC, d.nombre_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-P-DEP-PROY-STAR',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*) AS proyectos',
      'FROM departamentos d',
      'LEFT JOIN proyectos p',
      '  ON d.id_departamento = p.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY proyectos DESC, d.nombre_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query(
    'S2-P-DEP-PROY-INNER',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(p.id_proyecto) AS proyectos',
      'FROM departamentos d',
      'JOIN proyectos p',
      '  ON d.id_departamento = p.id_departamento',
      'GROUP BY d.nombre_departamento',
      'ORDER BY proyectos DESC, d.nombre_departamento;',
    ),
    [
      source('DEPARTAMENTOS', DEP_KEY),
      source('PROYECTOS', ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO']),
    ],
  ),
  query('S2-P-HORAS-TOTAL', lines('SELECT SUM(horas_semanales) AS horas', 'FROM asignaciones;'), [
    source('ASIGNACIONES', ['ID_EMPLEADO', 'ID_PROYECTO', 'HORAS_SEMANALES']),
  ]),
  query(
    'S2-P-MAX-DEPTO',
    lines(
      'SELECT id_departamento, MAX(salario) AS salario',
      'FROM empleados',
      'WHERE id_departamento IS NOT NULL',
      'GROUP BY id_departamento',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'])],
  ),
  query(
    'S2-P-MIN-DEPTO',
    lines(
      'SELECT id_departamento, MIN(salario) AS salario',
      'FROM empleados',
      'WHERE id_departamento IS NOT NULL',
      'GROUP BY id_departamento',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'])],
  ),
  query(
    'S2-P-AVG-DEPTO',
    lines(
      'SELECT id_departamento, ROUND(AVG(salario)) AS salario',
      'FROM empleados',
      'WHERE id_departamento IS NOT NULL',
      'GROUP BY id_departamento',
      'ORDER BY id_departamento;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'])],
  ),
  query(
    'S2-P-META',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING COUNT(*) >= 3',
      '   AND AVG(e.salario) > 4000000',
      'ORDER BY promedio DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-P-META-OR',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING COUNT(*) >= 3',
      '    OR AVG(e.salario) > 4000000',
      'ORDER BY promedio DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-P-META-GE',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING COUNT(*) >= 3',
      '   AND AVG(e.salario) >= 4000000',
      'ORDER BY promedio DESC;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
  query(
    'S2-P-INT-SIN-WHERE',
    lines(
      'SELECT d.nombre_departamento,',
      '       COUNT(*)              AS activos,',
      '       ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
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
  query(
    'S2-P-INT-ASC',
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
      'ORDER BY promedio;',
    ),
    [
      source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO']),
      source('DEPARTAMENTOS', DEP_KEY),
    ],
  ),
];

export const S2_PRACTICE: readonly Activity[] = [
  {
    id: 'S2-P01',
    lesson: 'S2-L01',
    kind: 'choice',
    prompt:
      'Alguien intenta guardar un empleado con ID_DEPARTAMENTO = 70 y Oracle responde ORA-02291. ¿Qué restricción lo impidió?',
    options: [
      {
        text: 'La FOREIGN KEY de EMPLEADOS.ID_DEPARTAMENTO',
        correct: true,
        feedback:
          'Correcto: el 70 no existe en DEPARTAMENTOS, así que la clave foránea lo rechaza.',
      },
      {
        text: 'La PRIMARY KEY de EMPLEADOS',
        correct: false,
        feedback: 'La PK rechaza ID_EMPLEADO repetidos (ORA-00001), no departamentos inexistentes.',
      },
      {
        text: 'La PRIMARY KEY de DEPARTAMENTOS',
        correct: false,
        feedback: 'Esa PK solo se comprueba al insertar en DEPARTAMENTOS.',
      },
      {
        text: 'Un CHECK sobre el salario',
        correct: false,
        feedback: 'El salario no tiene que ver con el departamento.',
      },
    ],
    hints: [
      'ORA-02291 dice «clave padre no encontrada».',
      '¿Qué restricción exige que el valor exista en otra tabla?',
    ],
    explanation:
      'La clave foránea exige que cada ID_DEPARTAMENTO de EMPLEADOS exista en DEPARTAMENTOS (o sea NULL).',
  },
  {
    id: 'S2-P02',
    lesson: 'S2-L04',
    kind: 'choice',
    prompt: 'Completa la condición para unir cada empleado con su departamento.',
    context: {
      code: lines(
        'SELECT e.nombre, d.nombre_departamento',
        'FROM empleados e',
        'JOIN departamentos d',
        '  ON e.________ = d.id_departamento;',
      ),
    },
    options: [
      {
        text: 'id_departamento',
        code: true,
        correct: true,
        feedback: 'Correcto: la FK de EMPLEADOS se compara con la PK de DEPARTAMENTOS.',
      },
      {
        text: 'id_empleado',
        code: true,
        correct: false,
        feedback:
          'Compararía el número de la persona con el del área: Oracle no da error, pero el resultado no tiene sentido.',
      },
      {
        text: 'id_jefe',
        code: true,
        correct: false,
        feedback: 'ID_JEFE apunta a otro empleado, no a un departamento.',
      },
      {
        text: 'nombre',
        code: true,
        correct: false,
        feedback: 'Un nombre de persona nunca coincide con un número de departamento.',
      },
    ],
    hints: [
      'Busca la columna de EMPLEADOS que guarda el número del área.',
      'Es la clave foránea hacia DEPARTAMENTOS.',
    ],
    explanation: 'ON e.id_departamento = d.id_departamento une la FK con su PK.',
  },
  {
    id: 'S2-P03',
    lesson: 'S2-L04',
    kind: 'count',
    prompt: '¿Cuántas filas devuelve el INNER JOIN completo de empleados y departamentos?',
    context: { example: 'S2-E-INNER' },
    hints: [
      'Cada empleado con departamento produce una fila.',
      'Hay 20 empleados; uno no tiene departamento.',
    ],
    explanation: '19: todos menos Esteban, que tiene ID_DEPARTAMENTO en NULL.',
  },
  {
    id: 'S2-P04',
    lesson: 'S2-L05',
    kind: 'choice',
    prompt: 'Oracle responde ORA-00918 a esta consulta. ¿Qué corrección funciona?',
    context: { example: 'S2-E-AMBIGUA' },
    options: [
      {
        text: 'Escribir e.id_departamento en el SELECT.',
        correct: true,
        feedback: 'Correcto: con el alias, Oracle sabe de qué tabla sale la columna.',
      },
      {
        text: 'Añadir DISTINCT después de SELECT.',
        correct: false,
        feedback: 'DISTINCT quita filas repetidas; no resuelve de qué tabla es la columna.',
      },
      {
        text: 'Cambiar JOIN por LEFT JOIN.',
        correct: false,
        feedback: 'El tipo de JOIN no cambia que la columna exista en las dos tablas.',
      },
      {
        text: 'Quitar la condición ON.',
        correct: false,
        feedback: 'Sin ON, JOIN es un error de sintaxis.',
      },
    ],
    hints: [
      'ORA-00918 significa columna ambigua.',
      '¿Qué columna del SELECT existe en las dos tablas?',
    ],
    explanation: 'ID_DEPARTAMENTO está en EMPLEADOS y en DEPARTAMENTOS: hay que calificarla.',
  },
  {
    id: 'S2-P05',
    lesson: 'S2-L07',
    kind: 'order',
    prompt: 'Ordena la consulta que muestra cada proyecto con las personas asignadas.',
    pieces: [
      'SELECT p.nombre_proyecto, e.nombre',
      'FROM proyectos p',
      'JOIN asignaciones a ON p.id_proyecto = a.id_proyecto',
      'JOIN empleados e ON a.id_empleado = e.id_empleado',
      'ORDER BY p.nombre_proyecto, e.nombre;',
    ],
    hints: [
      'Cada JOIN necesita que su tabla de enlace ya esté en la consulta.',
      'ASIGNACIONES va entre PROYECTOS y EMPLEADOS.',
    ],
    explanation:
      'PROYECTOS se une con ASIGNACIONES por ID_PROYECTO y ASIGNACIONES con EMPLEADOS por ID_EMPLEADO.',
  },
  {
    id: 'S2-P06',
    lesson: 'S2-L08',
    kind: 'result',
    prompt: '¿Qué devuelve este LEFT JOIN con los cinco empleados de la muestra?',
    context: { example: 'S2-E-LEFT' },
    distractors: [
      {
        example: 'S2-E-MODELO',
        feedback: 'Ese es el resultado de un INNER JOIN: falta Esteban, que no tiene departamento.',
      },
      {
        example: 'S2-P-LEFT-DEP',
        feedback:
          'Ese resultado conserva todos los departamentos: sería DEPARTAMENTOS LEFT JOIN EMPLEADOS.',
      },
    ],
    hints: [
      'LEFT JOIN conserva todas las filas de la tabla izquierda.',
      'La tabla izquierda es EMPLEADOS: los cinco deben aparecer.',
    ],
    explanation:
      'Aparecen los cinco empleados; Esteban, sin pareja, con NULL en las columnas de DEPARTAMENTOS.',
  },
  {
    id: 'S2-P22',
    lesson: 'S2-L08',
    kind: 'count',
    prompt: '¿Cuántas filas devuelve esta consulta de departamentos sin proyectos?',
    context: { example: 'S2-P-DEP-SIN-PROYECTO' },
    hints: [
      'LEFT JOIN conserva todos los departamentos; IS NULL deja los que no encontraron proyecto.',
      'Revisa qué ID_DEPARTAMENTO no aparece en PROYECTOS.',
    ],
    explanation: 'Una: Investigación (60) es el único departamento sin proyectos.',
  },
  {
    id: 'S2-P07',
    lesson: 'S2-L09',
    kind: 'choice',
    prompt:
      '¿Qué JOIN conserva a la vez a Esteban (sin departamento) y a Investigación (sin empleados)?',
    options: [
      {
        text: 'FULL OUTER JOIN',
        code: true,
        correct: true,
        feedback: 'Correcto: conserva las filas sin pareja de los dos lados.',
      },
      {
        text: 'LEFT OUTER JOIN desde EMPLEADOS',
        code: true,
        correct: false,
        feedback: 'Conserva a Esteban, pero pierde a Investigación.',
      },
      {
        text: 'RIGHT OUTER JOIN hacia DEPARTAMENTOS',
        code: true,
        correct: false,
        feedback: 'Conserva Investigación, pero pierde a Esteban.',
      },
      {
        text: 'CROSS JOIN',
        code: true,
        correct: false,
        feedback: 'Combina todo con todo: no respeta la relación.',
      },
    ],
    hints: ['Hay filas sin pareja en las dos tablas.', 'Busca el JOIN que conserva ambos lados.'],
    explanation: 'FULL OUTER JOIN = parejas + sobrantes de la izquierda + sobrantes de la derecha.',
  },
  {
    id: 'S2-P08',
    lesson: 'S2-L10',
    kind: 'choice',
    prompt: 'Completa el SELF JOIN para obtener el nombre del jefe de cada persona.',
    context: {
      code: lines(
        'SELECT e.nombre AS empleado, j.nombre AS jefe',
        'FROM empleados e',
        'JOIN empleados j',
        '  ON e.id_jefe = j.________;',
      ),
    },
    options: [
      {
        text: 'id_empleado',
        code: true,
        correct: true,
        feedback: 'Correcto: el ID_JEFE de e es el ID_EMPLEADO de j.',
      },
      {
        text: 'id_jefe',
        code: true,
        correct: false,
        feedback:
          'Compararía los jefes de dos personas: emparejaría compañeros, no jefe y empleado.',
      },
      {
        text: 'id_departamento',
        code: true,
        correct: false,
        feedback: 'Un número de jefe no es un número de departamento.',
      },
      {
        text: 'nombre',
        code: true,
        correct: false,
        feedback: 'ID_JEFE es un número; se compara con la clave de la otra fila.',
      },
    ],
    hints: [
      'ID_JEFE guarda la clave primaria de otra persona.',
      '¿Cuál es la clave primaria de EMPLEADOS?',
    ],
    explanation: 'ON e.id_jefe = j.id_empleado: la FK de la persona apunta a la PK de su jefe.',
  },
  {
    id: 'S2-P09',
    lesson: 'S2-L11',
    kind: 'choice',
    prompt:
      'Alguien escribe FROM empleados e, departamentos d y olvida la condición en el WHERE. ¿Cuántas filas obtiene?',
    options: [
      {
        text: '120',
        correct: true,
        feedback: 'Correcto: sin condición es un producto cartesiano, 20 × 6.',
      },
      { text: '26', correct: false, feedback: 'Eso sería sumar 20 + 6; el producto multiplica.' },
      { text: '19', correct: false, feedback: 'Eso da el JOIN con la condición correcta.' },
      {
        text: 'Error de sintaxis',
        correct: false,
        feedback: 'La sintaxis antigua con coma es válida aunque falte la condición.',
      },
    ],
    hints: [
      'Sin condición, cada fila se combina con todas las de la otra tabla.',
      '20 empleados, 6 departamentos.',
    ],
    explanation: 'El producto cartesiano tiene 20 × 6 = 120 filas.',
  },
  {
    id: 'S2-P10',
    lesson: 'S2-L13',
    kind: 'count',
    measure: 'value',
    prompt: 'En TI hay cuatro personas y una no tiene bono. ¿Qué número devuelve la consulta?',
    context: { example: 'S2-P-COUNT-BONO-TI' },
    hints: ['COUNT(columna) ignora los NULL.', 'Paula Castro tiene BONO en NULL.'],
    explanation: '3: COUNT(bono) cuenta los bonos de Carlos, Andrés y Oscar.',
  },
  {
    id: 'S2-P11',
    lesson: 'S2-L14',
    kind: 'result',
    prompt: '¿Qué devuelve el conteo de personas por ciudad?',
    context: { example: 'S2-P-GROUP-CIUDAD' },
    distractors: [
      {
        example: 'S2-P-GROUP-CIUDAD-BONO',
        feedback: 'Ese resultado cuenta bonos (COUNT(bono)), no personas: ignora los NULL.',
      },
    ],
    hints: ['COUNT(*) cuenta todas las filas del grupo.', 'Bogotá tiene siete personas.'],
    explanation: 'Cada ciudad es un grupo y COUNT(*) cuenta todas sus filas, tengan o no bono.',
  },
  {
    id: 'S2-P12',
    lesson: 'S2-L16',
    kind: 'choice',
    prompt: 'Completa la consulta de departamentos con salario promedio superior a 4.500.000.',
    context: {
      code: lines(
        'SELECT id_departamento, ROUND(AVG(salario)) AS promedio',
        'FROM empleados',
        'GROUP BY id_departamento',
        'HAVING ________ > 4500000;',
      ),
    },
    options: [
      {
        text: 'AVG(salario)',
        code: true,
        correct: true,
        feedback: 'Correcto: HAVING repite la función de grupo.',
      },
      {
        text: 'promedio',
        code: true,
        correct: false,
        feedback: 'En Oracle, el alias del SELECT no se puede usar en HAVING.',
      },
      {
        text: 'salario',
        code: true,
        correct: false,
        feedback: 'SALARIO no está agrupado: cada grupo tiene varios salarios.',
      },
      {
        text: 'COUNT(*)',
        code: true,
        correct: false,
        feedback: 'Compararía la cantidad de personas, no el promedio.',
      },
    ],
    hints: [
      'La condición es sobre el promedio del grupo.',
      'El alias no existe todavía cuando se evalúa HAVING.',
    ],
    explanation: 'HAVING AVG(salario) > 4500000 filtra los grupos por su promedio.',
  },
  {
    id: 'S2-P13',
    lesson: 'S2-L17',
    kind: 'multi',
    prompt: 'En una consulta agrupada por departamento, ¿qué condiciones deben ir en el WHERE?',
    options: [
      {
        text: "estado = 'ACTIVO'",
        code: true,
        correct: true,
        feedback: 'Correcto: es una condición sobre cada fila.',
      },
      {
        text: 'salario > 3000000',
        code: true,
        correct: true,
        feedback: 'Correcto: filtra personas antes de agrupar.',
      },
      {
        text: 'COUNT(*) >= 3',
        code: true,
        correct: false,
        feedback: 'Es una condición sobre el grupo: va en HAVING (en el WHERE da ORA-00934).',
      },
      {
        text: 'AVG(salario) > 4000000',
        code: true,
        correct: false,
        feedback: 'Usa una función de grupo: va en HAVING.',
      },
    ],
    hints: [
      'Pregúntate si la condición se puede evaluar mirando una sola fila.',
      'Las funciones de grupo no pueden ir en el WHERE.',
    ],
    explanation: 'Condiciones de fila → WHERE; condiciones con funciones de grupo → HAVING.',
  },
  {
    id: 'S2-P14',
    lesson: 'S2-L18',
    kind: 'result',
    prompt:
      '¿Qué devuelve el conteo de empleados por departamento con LEFT JOIN y COUNT(e.id_empleado)?',
    context: { example: 'S2-E-JOIN-COUNT' },
    distractors: [
      {
        example: 'S2-E-JOIN-COUNT-STAR',
        feedback: 'Ese resultado usa COUNT(*): cuenta la fila sin pareja de Investigación como 1.',
      },
      {
        example: 'S2-P-JOIN-COUNT-INNER',
        feedback: 'Ese es el resultado con INNER JOIN: Investigación desaparece.',
      },
    ],
    hints: [
      'LEFT JOIN desde DEPARTAMENTOS conserva Investigación.',
      'COUNT(e.id_empleado) ignora el NULL de la fila sin pareja.',
    ],
    explanation: 'Aparecen los seis departamentos e Investigación tiene 0.',
  },
  {
    id: 'S2-P15',
    lesson: 'S2-L19',
    kind: 'order',
    prompt: 'Ordena la consulta de proyectos con más de 35 horas semanales.',
    pieces: [
      'SELECT p.nombre_proyecto, SUM(a.horas_semanales) AS horas',
      'FROM proyectos p',
      'JOIN asignaciones a ON p.id_proyecto = a.id_proyecto',
      'GROUP BY p.nombre_proyecto',
      'HAVING SUM(a.horas_semanales) > 35',
      'ORDER BY horas DESC;',
    ],
    hints: ['GROUP BY va antes que HAVING.', 'ORDER BY siempre va al final.'],
    explanation: 'SELECT, FROM con JOIN, GROUP BY, HAVING y ORDER BY.',
  },
  {
    id: 'S2-P16',
    lesson: 'S2-L20',
    kind: 'choice',
    prompt: 'Esta consulta da ORA-01427. ¿Cuál es la mejor corrección?',
    context: { example: 'S2-E-SUB-VARIAS' },
    options: [
      {
        text: 'Cambiar = por IN.',
        correct: true,
        feedback: 'Correcto: la subconsulta devuelve tres departamentos; IN compara con la lista.',
      },
      {
        text: 'Añadir DISTINCT en la subconsulta.',
        correct: false,
        feedback: 'Los tres ID ya son distintos: seguirían siendo tres filas.',
      },
      {
        text: 'Cambiar = por >.',
        correct: false,
        feedback: 'Cualquier comparación simple necesita un solo valor.',
      },
      {
        text: 'Quitar los paréntesis.',
        correct: false,
        feedback: 'Una subconsulta siempre va entre paréntesis.',
      },
    ],
    hints: ['¿Cuántos departamentos tienen sede en Bogotá?', 'Una lista se compara con IN.'],
    explanation: 'Con una subconsulta de varias filas se usa IN (o NOT IN, ANY, ALL).',
  },
  {
    id: 'S2-P17',
    lesson: 'S2-L21',
    kind: 'choice',
    prompt:
      'Para listar departamentos sin empleados, ¿qué consulta es correcta aunque haya empleados con ID_DEPARTAMENTO NULL?',
    options: [
      {
        text: 'WHERE NOT EXISTS (SELECT 1 FROM empleados e WHERE e.id_departamento = d.id_departamento)',
        code: true,
        correct: true,
        feedback: 'Correcto: NOT EXISTS no se ve afectado por los NULL.',
      },
      {
        text: 'WHERE id_departamento NOT IN (SELECT id_departamento FROM empleados)',
        code: true,
        correct: false,
        feedback: 'El NULL de Esteban hace que NOT IN no devuelva ninguna fila.',
      },
      {
        text: 'WHERE id_departamento <> (SELECT id_departamento FROM empleados)',
        code: true,
        correct: false,
        feedback: 'La subconsulta devuelve varias filas: ORA-01427.',
      },
      {
        text: 'WHERE id_departamento IN (SELECT id_departamento FROM empleados)',
        code: true,
        correct: false,
        feedback: 'IN devuelve justo lo contrario: los departamentos con empleados.',
      },
    ],
    hints: [
      'Recuerda la trampa de NOT IN con NULL.',
      'Hay una forma que solo pregunta si existe alguna fila.',
    ],
    explanation: 'NOT EXISTS (o NOT IN filtrando los NULL) devuelve Investigación.',
  },
  {
    id: 'S2-P18',
    lesson: 'S2-L22',
    kind: 'choice',
    prompt: '¿Qué parte convierte esta subconsulta en correlacionada?',
    context: { example: 'S2-E-CORRELACIONADA' },
    options: [
      {
        text: 'WHERE i.id_departamento = e.id_departamento',
        code: true,
        correct: true,
        feedback: 'Correcto: e pertenece a la consulta externa.',
      },
      {
        text: 'SELECT AVG(i.salario)',
        code: true,
        correct: false,
        feedback: 'La función de grupo no la correlaciona.',
      },
      {
        text: 'FROM empleados i',
        code: true,
        correct: false,
        feedback: 'Leer la misma tabla con otro alias no basta.',
      },
      {
        text: 'ORDER BY e.id_departamento',
        code: true,
        correct: false,
        feedback: 'ORDER BY es de la consulta externa y no afecta a la subconsulta.',
      },
    ],
    hints: [
      'Busca un alias de afuera usado adentro.',
      'El alias e pertenece a la consulta externa.',
    ],
    explanation: 'Al usar e.id_departamento, la subconsulta depende de cada fila externa.',
  },
  {
    id: 'S2-P19',
    lesson: 'S2-L23',
    kind: 'count',
    prompt: '¿Cuántas filas devuelve UNION ALL de las 20 ciudades de empleados y las 6 sedes?',
    context: { example: 'S2-P-UNION-ALL-CIUDADES' },
    hints: ['UNION ALL no quita repetidos.', 'Suma las filas de las dos consultas.'],
    explanation: '26 = 20 + 6. Con UNION serían 5 ciudades distintas.',
  },
  {
    id: 'S2-P20',
    lesson: 'S2-L24',
    kind: 'choice',
    prompt: '¿Qué operador responde «ciudades con sede de departamento donde no trabaja nadie»?',
    options: [
      {
        text: 'SELECT sede FROM departamentos MINUS SELECT ciudad FROM empleados',
        code: true,
        correct: true,
        feedback: 'Correcto: sedes menos ciudades con personas.',
      },
      {
        text: 'SELECT ciudad FROM empleados MINUS SELECT sede FROM departamentos',
        code: true,
        correct: false,
        feedback: 'Orden invertido: devuelve ciudades con personas pero sin sede (Valledupar).',
      },
      {
        text: 'SELECT sede FROM departamentos INTERSECT SELECT ciudad FROM empleados',
        code: true,
        correct: false,
        feedback: 'INTERSECT devuelve las comunes, no las que faltan.',
      },
      {
        text: 'SELECT sede FROM departamentos UNION SELECT ciudad FROM empleados',
        code: true,
        correct: false,
        feedback: 'UNION junta las dos listas.',
      },
    ],
    hints: [
      'La pregunta empieza por las sedes.',
      'Quieres lo que está en la primera lista y no en la segunda.',
    ],
    explanation:
      'A MINUS B = lo de A que no está en B. Aquí no devuelve filas: toda sede tiene personas.',
  },
  {
    id: 'S2-P21',
    lesson: 'S2-L25',
    kind: 'multi',
    prompt: 'Sobre la consulta integradora, ¿qué afirmaciones son ciertas?',
    context: { example: 'S2-E-INT-FINAL' },
    options: [
      {
        text: 'La subconsulta calcula el promedio de toda la empresa, activos e inactivos.',
        correct: true,
        feedback: 'Correcto: la subconsulta no tiene WHERE.',
      },
      {
        text: 'El WHERE se aplica antes de calcular AVG(e.salario) de cada grupo.',
        correct: true,
        feedback: 'Correcto: el promedio de cada grupo solo usa personas activas.',
      },
      {
        text: 'Esteban se cuenta en un grupo propio.',
        correct: false,
        feedback: 'El INNER JOIN lo descarta antes de agrupar.',
      },
      {
        text: 'HAVING podría reemplazarse por WHERE sin cambiar nada.',
        correct: false,
        feedback: 'El WHERE no admite AVG: daría ORA-00934.',
      },
    ],
    hints: [
      'Sigue el orden: JOIN, WHERE, GROUP BY, HAVING.',
      'Mira si la subconsulta tiene su propio filtro.',
    ],
    explanation:
      'La subconsulta usa toda la tabla; el promedio de cada grupo, solo las filas que pasaron el WHERE.',
  },
];

export const S2_MISSIONS: readonly Mission[] = [
  {
    id: 'S2-M01',
    title: 'El mapa de la empresa',
    skill: 'Identificar claves primarias y foráneas',
    scenario:
      'Recursos Humanos quiere cruzar personas, áreas y proyectos. Antes de escribir SQL, hay que leer el mapa de relaciones.',
    steps: [
      {
        id: 'S2-M01-1',
        lesson: 'S2-L01',
        kind: 'multi',
        prompt: '¿Cuáles de estas columnas son claves foráneas?',
        options: [
          {
            text: 'EMPLEADOS.ID_DEPARTAMENTO',
            code: true,
            correct: true,
            feedback: 'Apunta a DEPARTAMENTOS.',
          },
          {
            text: 'EMPLEADOS.ID_JEFE',
            code: true,
            correct: true,
            feedback: 'Apunta a EMPLEADOS (la misma tabla).',
          },
          {
            text: 'ASIGNACIONES.ID_PROYECTO',
            code: true,
            correct: true,
            feedback: 'Apunta a PROYECTOS.',
          },
          {
            text: 'DEPARTAMENTOS.ID_DEPARTAMENTO',
            code: true,
            correct: false,
            feedback: 'Es la clave primaria de DEPARTAMENTOS: otras tablas la referencian.',
          },
          {
            text: 'PROYECTOS.PRESUPUESTO',
            code: true,
            correct: false,
            feedback: 'Es un dato del proyecto; no apunta a otra tabla.',
          },
        ],
        hints: [
          'Una FK guarda la clave de otra fila.',
          'Una clave primaria es el destino de la flecha, no su origen.',
        ],
        explanation:
          'ID_DEPARTAMENTO e ID_JEFE en EMPLEADOS e ID_PROYECTO en ASIGNACIONES apuntan a la PK de otra tabla.',
      },
      {
        id: 'S2-M01-2',
        lesson: 'S2-L07',
        kind: 'choice',
        prompt: '¿Qué tablas hacen falta para saber en qué proyectos trabaja cada persona?',
        options: [
          {
            text: 'EMPLEADOS, ASIGNACIONES y PROYECTOS',
            correct: true,
            feedback: 'Correcto: ASIGNACIONES registra quién trabaja en qué proyecto.',
          },
          {
            text: 'EMPLEADOS y PROYECTOS, unidas por ID_DEPARTAMENTO',
            correct: false,
            feedback:
              'Eso empareja a cada persona con los proyectos de su área, trabaje en ellos o no.',
          },
          {
            text: 'EMPLEADOS y DEPARTAMENTOS',
            correct: false,
            feedback: 'Ninguna de las dos guarda proyectos.',
          },
          {
            text: 'Solo ASIGNACIONES',
            correct: false,
            feedback: 'Tiene los números, pero no los nombres de personas ni de proyectos.',
          },
        ],
        hints: [
          'Una persona puede estar en varios proyectos: es una relación muchos a muchos.',
          '¿Qué tabla resuelve ese muchos a muchos?',
        ],
        explanation: 'El muchos a muchos se recorre a través de la tabla intermedia ASIGNACIONES.',
      },
    ],
  },
  {
    id: 'S2-M02',
    title: 'La condición correcta',
    skill: 'Construir la condición ON',
    scenario: 'Gerencia pide la lista de proyectos con el nombre del área responsable.',
    steps: [
      {
        id: 'S2-M02-1',
        lesson: 'S2-L04',
        kind: 'choice',
        prompt: '¿Qué condición une cada proyecto con su departamento?',
        context: {
          code: lines(
            'SELECT p.nombre_proyecto, d.nombre_departamento',
            'FROM proyectos p',
            'JOIN departamentos d',
            '  ON ________;',
          ),
        },
        options: [
          {
            text: 'p.id_departamento = d.id_departamento',
            code: true,
            correct: true,
            feedback: 'Correcto: la FK de PROYECTOS con la PK de DEPARTAMENTOS.',
          },
          {
            text: 'p.id_proyecto = d.id_departamento',
            code: true,
            correct: false,
            feedback:
              'Compara el número de proyecto con el de área: ningún 10x coincide y el resultado queda vacío.',
          },
          {
            text: 'd.id_departamento = d.id_departamento',
            code: true,
            correct: false,
            feedback: 'Es siempre verdadera: combina cada proyecto con todos los departamentos.',
          },
          {
            text: 'p.nombre_proyecto = d.nombre_departamento',
            code: true,
            correct: false,
            feedback: 'Los nombres no coinciden nunca; las tablas se unen por claves.',
          },
        ],
        hints: [
          '¿Qué columna de PROYECTOS apunta a DEPARTAMENTOS?',
          'Las dos columnas de la condición deben significar lo mismo.',
        ],
        explanation: 'ON p.id_departamento = d.id_departamento.',
      },
      {
        id: 'S2-M02-2',
        lesson: 'S2-L04',
        kind: 'count',
        prompt: 'Con la condición correcta, ¿cuántas filas devuelve la lista?',
        context: { example: 'S2-P-PROYECTOS-DEPTO' },
        hints: [
          'Todo proyecto tiene departamento (su FK es NOT NULL).',
          'Cuenta los proyectos de la tabla PROYECTOS.',
        ],
        explanation: 'Siete: cada proyecto encuentra exactamente un departamento.',
      },
    ],
  },
  {
    id: 'S2-M03',
    title: 'Nómina de Finanzas',
    skill: 'Leer y predecir un INNER JOIN con filtro y orden',
    scenario:
      'Finanzas revisa su nómina: nombre y salario de su equipo, del salario más alto al más bajo.',
    steps: [
      {
        id: 'S2-M03-1',
        lesson: 'S2-L06',
        kind: 'result',
        prompt: '¿Qué devuelve la consulta?',
        context: { example: 'S2-P-FINANZAS' },
        distractors: [
          {
            example: 'S2-P-FINANZAS-ASC',
            feedback:
              'Las personas son las correctas, pero ese orden es ascendente; la consulta usa DESC.',
          },
          {
            example: 'S2-P-FINANZAS-ON',
            feedback:
              'Ese resultado vacío sale de una condición ON que compara ID_EMPLEADO con ID_DEPARTAMENTO.',
          },
        ],
        hints: ['Finanzas es el departamento 40.', 'DESC ordena de mayor a menor.'],
        explanation: 'Jorge, Daniela, Diego y Camila, de 6.800.000 a 4.500.000.',
      },
      {
        id: 'S2-M03-2',
        lesson: 'S2-L04',
        kind: 'choice',
        prompt: 'Si se quita el WHERE, el informe muestra 19 personas, no 20. ¿Por qué?',
        options: [
          {
            text: 'Esteban no tiene departamento y el INNER JOIN lo descarta.',
            correct: true,
            feedback: 'Correcto: su ID_DEPARTAMENTO es NULL y no encuentra pareja.',
          },
          {
            text: 'Oracle omite las personas inactivas.',
            correct: false,
            feedback: 'Sin WHERE no hay filtro por estado: las inactivas aparecen.',
          },
          {
            text: 'Investigación no tiene empleados.',
            correct: false,
            feedback: 'Eso explica por qué no aparece Investigación, no por qué falta una persona.',
          },
          {
            text: 'Hay un empleado repetido.',
            correct: false,
            feedback: 'ID_EMPLEADO es la clave primaria: no se repite.',
          },
        ],
        hints: ['INNER JOIN solo conserva parejas.', '¿Quién tiene ID_DEPARTAMENTO en NULL?'],
        explanation: 'Para incluirlo haría falta un LEFT JOIN desde EMPLEADOS.',
      },
    ],
  },
  {
    id: 'S2-M04',
    title: 'Equipos de TI',
    skill: 'Escribir un JOIN de tres tablas',
    scenario:
      'TI necesita ver quién participa en cada uno de sus proyectos, incluida gente de otras áreas.',
    steps: [
      {
        id: 'S2-M04-1',
        lesson: 'S2-L07',
        kind: 'order',
        prompt: 'Ordena la consulta.',
        pieces: [
          'SELECT p.nombre_proyecto, e.nombre',
          'FROM proyectos p',
          'JOIN asignaciones a ON p.id_proyecto = a.id_proyecto',
          'JOIN empleados e ON a.id_empleado = e.id_empleado',
          'WHERE p.id_departamento = 20',
          'ORDER BY p.nombre_proyecto, e.nombre;',
        ],
        hints: [
          'Primero las tablas y sus condiciones; después el filtro.',
          'WHERE va después de los JOIN.',
        ],
        explanation:
          'FROM y JOIN arman las parejas; WHERE deja los proyectos de TI; ORDER BY ordena.',
      },
      {
        id: 'S2-M04-2',
        lesson: 'S2-L07',
        kind: 'count',
        prompt: '¿Cuántas filas devuelve?',
        context: { example: 'S2-P-TI-ASIGNACIONES' },
        hints: [
          'TI tiene los proyectos 101 y 102.',
          'Cuenta las asignaciones de cada uno en ASIGNACIONES.',
        ],
        explanation: 'Ocho: cuatro personas en Migración a la nube y cuatro en Portal de clientes.',
      },
    ],
  },
  {
    id: 'S2-M05',
    title: 'Áreas sin proyectos',
    skill: 'Usar LEFT JOIN para encontrar lo que falta',
    scenario: 'El comité de innovación quiere saber qué áreas todavía no tienen ningún proyecto.',
    steps: [
      {
        id: 'S2-M05-1',
        lesson: 'S2-L08',
        kind: 'choice',
        prompt: '¿Qué consulta lista los departamentos sin proyectos?',
        options: [
          {
            text: 'FROM departamentos d LEFT JOIN proyectos p ON d.id_departamento = p.id_departamento WHERE p.id_proyecto IS NULL',
            code: true,
            correct: true,
            feedback:
              'Correcto: conserva todos los departamentos y deja los que no encontraron proyecto.',
          },
          {
            text: 'FROM departamentos d JOIN proyectos p ON d.id_departamento = p.id_departamento WHERE p.id_proyecto IS NULL',
            code: true,
            correct: false,
            feedback:
              'Con INNER JOIN nunca hay filas con p.id_proyecto NULL: el resultado queda vacío.',
          },
          {
            text: 'FROM proyectos p LEFT JOIN departamentos d ON d.id_departamento = p.id_departamento WHERE d.id_departamento IS NULL',
            code: true,
            correct: false,
            feedback: 'Conserva proyectos, no departamentos: buscaría proyectos sin área.',
          },
          {
            text: 'FROM departamentos d LEFT JOIN proyectos p ON d.id_departamento = p.id_departamento WHERE p.id_proyecto IS NOT NULL',
            code: true,
            correct: false,
            feedback: 'IS NOT NULL deja los departamentos que sí tienen proyectos.',
          },
        ],
        hints: [
          'La tabla que se debe conservar entera va a la izquierda.',
          'Sin pareja, las columnas de la derecha quedan en NULL.',
        ],
        explanation:
          'LEFT JOIN desde DEPARTAMENTOS + WHERE p.id_proyecto IS NULL. Devuelve Investigación.',
      },
      {
        id: 'S2-M05-2',
        lesson: 'S2-L18',
        kind: 'result',
        prompt:
          'Ahora cuentan los proyectos de cada área, sin perder ninguna. ¿Qué devuelve la consulta?',
        context: { example: 'S2-P-DEP-PROY-COUNT' },
        distractors: [
          {
            example: 'S2-P-DEP-PROY-STAR',
            feedback:
              'Ese resultado usa COUNT(*): Investigación aparece con 1 por su fila sin pareja.',
          },
          {
            example: 'S2-P-DEP-PROY-INNER',
            feedback: 'Ese es el resultado con INNER JOIN: Investigación desaparece.',
          },
        ],
        hints: ['COUNT(p.id_proyecto) ignora los NULL.', 'LEFT JOIN conserva Investigación.'],
        explanation: 'Seis áreas; Investigación con 0 proyectos.',
      },
    ],
  },
  {
    id: 'S2-M06',
    title: 'Primer resumen',
    skill: 'Elegir la función de grupo adecuada',
    scenario:
      'Dirección pide dos cifras: las horas semanales comprometidas y el bono promedio por persona.',
    steps: [
      {
        id: 'S2-M06-1',
        lesson: 'S2-L12',
        kind: 'count',
        measure: 'value',
        prompt: '¿Cuántas horas semanales suman todas las asignaciones?',
        context: { example: 'S2-P-HORAS-TOTAL' },
        hints: [
          'SUM suma los valores de la columna en todas las filas.',
          'Suma la columna HORAS_SEMANALES de ASIGNACIONES.',
        ],
        explanation: '295 horas: 85 + 40 + 70 + 35 + 30 + 35.',
      },
      {
        id: 'S2-M06-2',
        lesson: 'S2-L13',
        kind: 'choice',
        prompt:
          'El «bono promedio por persona» debe repartir el total de bonos entre las 20 personas. ¿Qué expresión lo calcula?',
        options: [
          {
            text: 'AVG(NVL(bono, 0))',
            code: true,
            correct: true,
            feedback: 'Correcto: los NULL cuentan como 0, así que divide entre 20.',
          },
          {
            text: 'AVG(bono)',
            code: true,
            correct: false,
            feedback: 'Ignora los NULL: divide entre las 14 personas con bono.',
          },
          {
            text: 'SUM(bono) / COUNT(bono)',
            code: true,
            correct: false,
            feedback: 'Es lo mismo que AVG(bono): divide entre 14.',
          },
          {
            text: 'MAX(bono)',
            code: true,
            correct: false,
            feedback: 'Es el bono más alto, no un promedio.',
          },
        ],
        hints: ['Las funciones de grupo ignoran los NULL.', '¿Cómo se convierte un NULL en 0?'],
        explanation: 'AVG(NVL(bono, 0)) = 5.000.000 / 20 = 250.000.',
      },
    ],
  },
  {
    id: 'S2-M07',
    title: 'El salario más alto de cada área',
    skill: 'Agrupar y corregir un GROUP BY',
    scenario: 'Para una revisión salarial se necesita el salario más alto de cada departamento.',
    steps: [
      {
        id: 'S2-M07-1',
        lesson: 'S2-L14',
        kind: 'result',
        prompt: '¿Qué devuelve la consulta?',
        context: { example: 'S2-P-MAX-DEPTO' },
        distractors: [
          {
            example: 'S2-P-MIN-DEPTO',
            feedback: 'Esos son los salarios más bajos (MIN).',
          },
          {
            example: 'S2-P-AVG-DEPTO',
            feedback: 'Esos son los promedios (AVG).',
          },
        ],
        hints: [
          'MAX devuelve el mayor valor de cada grupo.',
          'En el departamento 10 está Ana, con 9.000.000.',
        ],
        explanation:
          'Un máximo por departamento: 9.000.000, 7.500.000, 6.000.000, 6.800.000 y 5.800.000.',
      },
      {
        id: 'S2-M07-2',
        lesson: 'S2-L15',
        kind: 'choice',
        prompt:
          'Alguien añade NOMBRE para saber quién gana ese máximo y Oracle responde ORA-00979. ¿Por qué?',
        context: {
          code: lines(
            'SELECT id_departamento, nombre, MAX(salario)',
            'FROM empleados',
            'GROUP BY id_departamento;',
          ),
        },
        options: [
          {
            text: 'NOMBRE no está en el GROUP BY ni en una función de grupo.',
            correct: true,
            feedback: 'Correcto. Para saber quién lo gana hace falta una subconsulta (bloque 9).',
          },
          {
            text: 'MAX no admite columnas numéricas.',
            correct: false,
            feedback: 'MAX funciona con números, textos y fechas.',
          },
          {
            text: 'Falta un HAVING.',
            correct: false,
            feedback: 'HAVING es opcional: filtra grupos.',
          },
          {
            text: 'Falta un ORDER BY.',
            correct: false,
            feedback: 'ORDER BY es opcional y no causa ORA-00979.',
          },
        ],
        hints: [
          'Cada grupo tiene varios nombres.',
          'Revisa la regla de las columnas del SELECT con GROUP BY.',
        ],
        explanation:
          'Agrupar por NOMBRE tampoco sirve: daría un grupo por persona. La pregunta «quién» se resuelve con una subconsulta correlacionada.',
      },
    ],
  },
  {
    id: 'S2-M08',
    title: 'Áreas sobre la meta',
    skill: 'Combinar WHERE, GROUP BY y HAVING',
    scenario:
      'Se premiará a las áreas con al menos tres personas activas y un salario promedio de activos superior a 4.000.000.',
    steps: [
      {
        id: 'S2-M08-1',
        lesson: 'S2-L17',
        kind: 'multi',
        prompt: '¿Qué condiciones van en HAVING?',
        options: [
          {
            text: 'COUNT(*) >= 3',
            code: true,
            correct: true,
            feedback: 'Es una condición sobre el grupo.',
          },
          {
            text: 'AVG(e.salario) > 4000000',
            code: true,
            correct: true,
            feedback: 'Usa una función de grupo.',
          },
          {
            text: "e.estado = 'ACTIVO'",
            code: true,
            correct: false,
            feedback: 'Se refiere a cada fila: va en el WHERE, antes de agrupar.',
          },
          {
            text: 'e.id_departamento = d.id_departamento',
            code: true,
            correct: false,
            feedback: 'Es la condición de unión: va en ON.',
          },
        ],
        hints: [
          'HAVING trabaja con resúmenes de grupo.',
          'Las condiciones de fila van antes de agrupar.',
        ],
        explanation: 'COUNT y AVG en HAVING; el estado en WHERE; la unión en ON.',
      },
      {
        id: 'S2-M08-2',
        lesson: 'S2-L19',
        kind: 'result',
        prompt: '¿Qué áreas cumplen la meta?',
        context: { example: 'S2-P-META' },
        distractors: [
          {
            example: 'S2-P-META-OR',
            feedback: 'Ese resultado usa OR: basta con cumplir una de las dos condiciones.',
          },
          {
            example: 'S2-P-META-GE',
            feedback:
              'Ese resultado usa >=: incluye Recursos Humanos, cuyo promedio es exactamente 4.000.000.',
          },
        ],
        hints: [
          'Las dos condiciones deben cumplirse a la vez.',
          'Recursos Humanos tiene un promedio exactamente de 4.000.000.',
        ],
        explanation: 'Finanzas (5.800.000) y TI (5.300.000), cada una con tres personas activas.',
      },
    ],
  },
  {
    id: 'S2-M09',
    title: 'Personas y áreas sin asignar',
    skill: 'Elegir entre subconsulta y operador de conjuntos',
    scenario: 'Planeación busca a las personas sin proyecto y a las áreas sin personas.',
    steps: [
      {
        id: 'S2-M09-1',
        lesson: 'S2-L24',
        kind: 'multi',
        prompt: '¿Qué consultas devuelven los ID de las personas sin ningún proyecto?',
        options: [
          {
            text: 'SELECT id_empleado FROM empleados MINUS SELECT id_empleado FROM asignaciones',
            code: true,
            correct: true,
            feedback: 'Correcto: todos los empleados menos los asignados.',
          },
          {
            text: 'SELECT id_empleado FROM empleados WHERE id_empleado NOT IN (SELECT id_empleado FROM asignaciones)',
            code: true,
            correct: true,
            feedback: 'Correcto: ASIGNACIONES.ID_EMPLEADO nunca es NULL, así que NOT IN es seguro.',
          },
          {
            text: 'SELECT id_empleado FROM empleados INTERSECT SELECT id_empleado FROM asignaciones',
            code: true,
            correct: false,
            feedback: 'INTERSECT devuelve los que sí tienen proyecto.',
          },
          {
            text: 'SELECT id_empleado FROM asignaciones MINUS SELECT id_empleado FROM empleados',
            code: true,
            correct: false,
            feedback: 'Orden invertido: busca asignaciones sin empleado (la FK lo impide).',
          },
        ],
        hints: [
          'Quieres los que están en EMPLEADOS y no en ASIGNACIONES.',
          'Hay más de una forma correcta.',
        ],
        explanation: 'MINUS y NOT IN dan los mismos seis empleados.',
      },
      {
        id: 'S2-M09-2',
        lesson: 'S2-L21',
        kind: 'choice',
        prompt:
          'Para las áreas sin personas alguien usa NOT IN (SELECT id_departamento FROM empleados) y no obtiene filas. ¿Qué corrección funciona?',
        options: [
          {
            text: 'Añadir WHERE id_departamento IS NOT NULL dentro de la subconsulta.',
            correct: true,
            feedback: 'Correcto: sin el NULL de Esteban, NOT IN devuelve Investigación.',
          },
          {
            text: 'Cambiar NOT IN por IN.',
            correct: false,
            feedback: 'IN devuelve las áreas con personas.',
          },
          {
            text: 'Añadir DISTINCT en la subconsulta.',
            correct: false,
            feedback: 'El NULL sigue en la lista.',
          },
          {
            text: 'Usar = en lugar de NOT IN.',
            correct: false,
            feedback: 'La subconsulta devuelve varias filas: ORA-01427.',
          },
        ],
        hints: [
          'El problema es un NULL en la lista.',
          '¿Cómo se quita un NULL de una subconsulta?',
        ],
        explanation: 'Filtrar los NULL (o usar NOT EXISTS) arregla la consulta.',
      },
    ],
  },
  {
    id: 'S2-M10',
    title: 'Query Master relacional',
    skill: 'Construir y predecir una consulta completa',
    scenario:
      'Informe para la junta: áreas cuyo salario promedio de personas activas supera el promedio de toda la empresa, con cuántas personas activas tienen, de mayor a menor promedio.',
    steps: [
      {
        id: 'S2-M10-1',
        lesson: 'S2-L25',
        kind: 'order',
        prompt: 'Ordena la consulta.',
        pieces: [
          'SELECT d.nombre_departamento, COUNT(*) AS activos, ROUND(AVG(e.salario)) AS promedio',
          'FROM empleados e JOIN departamentos d ON e.id_departamento = d.id_departamento',
          "WHERE e.estado = 'ACTIVO'",
          'GROUP BY d.nombre_departamento',
          'HAVING AVG(e.salario) > (SELECT AVG(salario) FROM empleados)',
          'ORDER BY promedio DESC;',
        ],
        hints: [
          'El orden de escritura es SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.',
          'La subconsulta va dentro del HAVING.',
        ],
        explanation:
          'Cada cláusula responde una parte de la pregunta, en el orden de escritura de SQL.',
      },
      {
        id: 'S2-M10-2',
        lesson: 'S2-L25',
        kind: 'result',
        prompt: '¿Qué devuelve el informe?',
        context: { example: 'S2-E-INT-FINAL' },
        distractors: [
          {
            example: 'S2-P-INT-SIN-WHERE',
            feedback:
              'Ese resultado no filtra a las personas activas: cuenta y promedia también a las inactivas.',
          },
          {
            example: 'S2-P-INT-ASC',
            feedback: 'Las áreas son las correctas, pero el orden es ascendente.',
          },
        ],
        hints: [
          'El promedio de la empresa es 4.580.000.',
          'Calcula el promedio de activos de cada área y ordénalo de mayor a menor.',
        ],
        explanation: 'Finanzas (3; 5.800.000), Operaciones (2; 5.550.000) y TI (3; 5.300.000).',
      },
    ],
  },
];
