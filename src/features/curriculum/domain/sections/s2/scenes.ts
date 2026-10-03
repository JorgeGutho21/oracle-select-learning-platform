import { lines } from '../../builders';
import type { CurriculumBlock, CurriculumScene } from '../../types';

/**
 * Bloques y guion de la clase de la Sección 2. Las escenas de lección proyectan el ejemplo
 * de su lección (mismos datos, misma consulta, mismo resultado verificado); aquí solo se
 * escriben las notas del profesor y las escenas de idea, pregunta y cierre.
 */

export const S2_BLOCKS: readonly CurriculumBlock[] = [
  {
    id: 'relaciones',
    number: 1,
    title: 'Relaciones y claves',
    summary: 'Por qué varias tablas: PK, FK, integridad referencial y alias de tabla.',
  },
  {
    id: 'modelo-join',
    number: 2,
    title: 'Modelo mental del JOIN',
    summary: 'Tabla A + tabla B + condición = resultado.',
  },
  {
    id: 'inner-join',
    number: 3,
    title: 'INNER JOIN',
    summary: 'ON, columnas de varias tablas, JOIN con WHERE y joins múltiples.',
  },
  {
    id: 'otros-join',
    number: 4,
    title: 'OUTER, SELF y CROSS JOIN',
    summary: 'Qué filas conserva cada JOIN: LEFT, RIGHT, FULL, SELF, CROSS y NATURAL.',
  },
  {
    id: 'funciones-grupo',
    number: 5,
    title: 'Funciones de grupo',
    summary: 'COUNT, SUM, AVG, MIN y MAX, y cómo tratan los NULL.',
  },
  {
    id: 'group-by',
    number: 6,
    title: 'GROUP BY',
    summary: 'Un resumen por grupo y los errores típicos.',
  },
  {
    id: 'having',
    number: 7,
    title: 'HAVING',
    summary: 'Filtrar grupos y el orden WHERE → GROUP BY → HAVING.',
  },
  {
    id: 'join-agregacion',
    number: 8,
    title: 'JOIN + agregaciones',
    summary: 'Resúmenes por departamento y proyecto con nombres legibles.',
  },
  {
    id: 'subconsultas',
    number: 9,
    title: 'Subconsultas',
    summary: 'De una fila, de varias filas, correlacionadas y EXISTS.',
  },
  {
    id: 'conjuntos',
    number: 10,
    title: 'Operadores de conjuntos',
    summary: 'UNION, UNION ALL, INTERSECT y MINUS.',
  },
  {
    id: 'integracion',
    number: 11,
    title: 'Integración final',
    summary: 'Una consulta completa, construida y comprobada por capas.',
  },
];

export const S2_SCENES: readonly CurriculumScene[] = [
  {
    id: 'portada',
    block: 'relaciones',
    kind: 'cover',
    title: 'Consultas relacionales y análisis',
    shortTitle: 'Portada',
    notes: {
      explain:
        'Presenta la meta: pasar de consultar una tabla a responder preguntas que necesitan varias tablas y resúmenes.',
      question:
        '¿Dónde está el nombre del departamento de Andrés en la tabla de la Sección 1? (En cada fila, repetido.)',
      transition: 'Primero, el mapa de la clase.',
    },
  },
  {
    id: 'ruta',
    block: 'relaciones',
    kind: 'agenda',
    title: 'Ruta de la clase',
    shortTitle: 'Ruta',
    notes: {
      explain:
        'Once bloques: relaciones, JOIN, agregaciones, subconsultas, conjuntos e integración.',
      transition: 'Empezamos por la pregunta clave: ¿por qué varias tablas?',
    },
  },
  {
    id: 'varias-tablas',
    block: 'relaciones',
    kind: 'idea',
    title: 'Cada dato, una sola vez',
    shortTitle: 'Varias tablas',
    lesson: 'S2-L01',
    points: [
      'DEPARTAMENTOS guarda cada área una vez.',
      'EMPLEADOS guarda solo el número del área: ID_DEPARTAMENTO.',
      'La clave foránea conecta las dos tablas.',
    ],
    code: lines(
      'EMPLEADOS.ID_DEPARTAMENTO',
      '        │ FK',
      '        ▼',
      'DEPARTAMENTOS.ID_DEPARTAMENTO (PK)',
    ),
    notes: {
      explain:
        'Si el área cambia de nombre, se corrige una fila y no cinco. El precio: para leer el nombre hay que unir tablas.',
      mistake: 'Pensar que la FK debe llamarse igual que la PK: ID_JEFE es FK con otro nombre.',
      transition: 'Veamos las claves con datos reales.',
    },
  },
  {
    id: 'pk-fk',
    block: 'relaciones',
    kind: 'lesson',
    title: 'Clave primaria y clave foránea',
    shortTitle: 'PK y FK',
    lesson: 'S2-L01',
    notes: {
      explain:
        'El 20 de Andrés no dice nada por sí solo: hay que buscar el 20 en DEPARTAMENTOS. Esteban tiene NULL: todavía sin área.',
      question: '¿Puede Oracle guardar un empleado del departamento 70? (No: ORA-02291.)',
      transition: 'Con dos tablas en una consulta necesitamos nombrarlas: alias.',
    },
  },
  {
    id: 'alias',
    block: 'relaciones',
    kind: 'lesson',
    title: 'Alias de tabla',
    shortTitle: 'Alias',
    lesson: 'S2-L02',
    example: 'S2-E-AMBIGUA',
    notes: {
      explain:
        'ID_DEPARTAMENTO existe en las dos tablas: sin alias, Oracle no sabe cuál mostrar. Con e. y d. desaparece la duda.',
      mistake: 'Escribir FROM empleados AS e: Oracle no acepta AS en el alias de tabla.',
      transition: 'Ahora sí: ¿cómo combina Oracle las dos tablas?',
    },
  },
  {
    id: 'modelo',
    block: 'modelo-join',
    kind: 'idea',
    title: 'Tabla A + tabla B + condición = resultado',
    shortTitle: 'Modelo',
    lesson: 'S2-L03',
    points: [
      'Cada fila de A busca en B las filas que cumplen la condición.',
      'Cada pareja forma una fila del resultado.',
      'Una fila sin pareja no aparece en un JOIN normal.',
    ],
    notes: {
      explain: 'Antes de la sintaxis, el modelo: buscar pareja por la columna que conecta.',
      transition: 'Veámoslo con cinco empleados.',
    },
  },
  {
    id: 'modelo-datos',
    block: 'modelo-join',
    kind: 'lesson',
    title: 'Cinco empleados buscan su departamento',
    shortTitle: 'Parejas',
    lesson: 'S2-L03',
    notes: {
      explain:
        'Recorre las parejas una a una: Carlos 20 → TI, María 30 → Ventas… Esteban (NULL) no encuentra pareja.',
      question: '¿Cuántas filas salen? (Cuatro.)',
      transition: 'Esa es la idea del INNER JOIN.',
    },
  },
  {
    id: 'inner',
    block: 'inner-join',
    kind: 'lesson',
    title: 'INNER JOIN con WHERE',
    shortTitle: 'INNER JOIN',
    lesson: 'S2-L06',
    notes: {
      explain:
        'ON forma las parejas; WHERE deja las de Bogotá y personas activas. ORDER BY ordena como siempre.',
      mistake: 'Un ON con columnas equivocadas no da error: devuelve parejas sin sentido.',
      transition: '¿Y si comparamos datos de las dos tablas?',
    },
  },
  {
    id: 'dos-tablas',
    block: 'inner-join',
    kind: 'lesson',
    title: '¿Quién trabaja lejos de la sede?',
    shortTitle: 'Columnas de 2 tablas',
    lesson: 'S2-L05',
    notes: {
      explain: 'El WHERE compara e.ciudad con d.sede: una columna de cada tabla en la misma fila.',
      question: '¿Aparecería Esteban? (No: no tiene departamento.)',
      transition: 'Una persona puede estar en varios proyectos: tres tablas.',
    },
  },
  {
    id: 'tres-tablas',
    block: 'inner-join',
    kind: 'lesson',
    title: 'JOIN de tres tablas',
    shortTitle: 'Tres tablas',
    lesson: 'S2-L07',
    notes: {
      explain:
        'ASIGNACIONES está en medio: un JOIN hacia EMPLEADOS y otro hacia PROYECTOS. n tablas, n − 1 condiciones.',
      mistake: 'Olvidar una condición: el resultado se multiplica.',
      transition: 'Pregunta rápida.',
    },
  },
  {
    id: 'check-on',
    block: 'inner-join',
    kind: 'check',
    title: '¿Qué condición une proyectos y departamentos?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S2-SC-ON',
      lesson: 'S2-L04',
      kind: 'choice',
      prompt: '¿Qué condición une cada proyecto con su departamento?',
      options: [
        {
          text: 'p.id_departamento = d.id_departamento',
          code: true,
          correct: true,
          feedback: 'FK de PROYECTOS con PK de DEPARTAMENTOS.',
        },
        {
          text: 'p.id_proyecto = d.id_departamento',
          code: true,
          correct: false,
          feedback: 'Compara cosas distintas: no hay ningún 10x en DEPARTAMENTOS.',
        },
        {
          text: 'd.id_departamento = d.id_departamento',
          code: true,
          correct: false,
          feedback: 'Siempre verdadera: combina todo con todo.',
        },
      ],
      hints: ['Busca la FK de PROYECTOS.', 'Las dos columnas deben significar lo mismo.'],
      explanation: 'La FK p.id_departamento se compara con la PK d.id_departamento.',
    },
    notes: {
      explain: 'Da 30 segundos y pide votar a mano alzada.',
      transition: '¿Y si queremos ver también las filas sin pareja?',
    },
  },
  {
    id: 'left',
    block: 'otros-join',
    kind: 'lesson',
    title: 'LEFT JOIN: nadie se pierde',
    shortTitle: 'LEFT JOIN',
    lesson: 'S2-L08',
    notes: {
      explain:
        'Los cinco empleados se conservan; Esteban sale con NULL en las columnas de DEPARTAMENTOS.',
      question: '¿Qué tabla es la izquierda? (La escrita antes de LEFT JOIN.)',
      transition: 'LEFT JOIN también sirve para encontrar lo que falta.',
    },
  },
  {
    id: 'left-faltantes',
    block: 'otros-join',
    kind: 'lesson',
    title: 'Departamentos sin empleados',
    shortTitle: 'Lo que falta',
    lesson: 'S2-L08',
    example: 'S2-E-LEFT-SIN-EMPLEADOS',
    notes: {
      explain:
        'LEFT JOIN desde DEPARTAMENTOS y WHERE e.id_empleado IS NULL: solo queda Investigación.',
      mistake:
        'Filtrar la tabla derecha en el WHERE con otra condición convierte el LEFT en INNER.',
      transition: 'Ahora el otro lado y los dos lados.',
    },
  },
  {
    id: 'full',
    block: 'otros-join',
    kind: 'lesson',
    title: 'RIGHT y FULL OUTER JOIN',
    shortTitle: 'FULL JOIN',
    lesson: 'S2-L09',
    example: 'S2-E-FULL',
    notes: {
      explain:
        'FULL conserva a Esteban (sin área) y a Investigación (sin personas), además de las parejas. RIGHT JOIN es un LEFT con las tablas invertidas.',
      question: '¿Cuántas filas tendría el FULL JOIN completo? (21 = 19 + 1 + 1.)',
      transition: 'Una tabla también puede unirse consigo misma.',
    },
  },
  {
    id: 'self',
    block: 'otros-join',
    kind: 'lesson',
    title: 'SELF JOIN: el jefe de cada persona',
    shortTitle: 'SELF JOIN',
    lesson: 'S2-L10',
    notes: {
      explain: 'EMPLEADOS dos veces: e es la persona y j su jefe. ON e.id_jefe = j.id_empleado.',
      mistake: 'Invertir la condición devuelve subordinados.',
      transition: '¿Y sin condición?',
    },
  },
  {
    id: 'cross',
    block: 'otros-join',
    kind: 'lesson',
    title: 'CROSS JOIN: todo con todo',
    shortTitle: 'CROSS JOIN',
    lesson: 'S2-L11',
    notes: {
      explain:
        'Dos departamentos × tres proyectos = seis filas. Completo: 6 × 7 = 42. Aparece por error con FROM a, b sin condición.',
      mistake: 'NATURAL JOIN une por nombre de columna, no por significado.',
      transition: 'Resumen de los JOIN.',
    },
  },
  {
    id: 'resumen-join',
    block: 'otros-join',
    kind: 'idea',
    title: '¿Qué filas conserva cada JOIN?',
    shortTitle: 'Resumen JOIN',
    points: [
      'INNER: solo parejas.',
      'LEFT / RIGHT: parejas + sobrantes de un lado (con NULL).',
      'FULL: parejas + sobrantes de los dos lados. CROSS: todas las combinaciones.',
    ],
    notes: {
      explain: 'Repasa con el ejemplo de la clase: Esteban y Investigación son los «sobrantes».',
      transition: 'Pasamos de combinar a resumir.',
    },
  },
  {
    id: 'fila-grupo',
    block: 'funciones-grupo',
    kind: 'lesson',
    title: 'Función de una fila frente a función de grupo',
    shortTitle: 'Fila vs grupo',
    lesson: 'S2-L12',
    example: 'S2-E-FUNCION-FILA',
    notes: {
      explain: 'UPPER devuelve tres valores (uno por persona); COUNT devuelve uno para las tres.',
      transition: 'Las cinco funciones de grupo a la vez.',
    },
  },
  {
    id: 'agregados',
    block: 'funciones-grupo',
    kind: 'lesson',
    title: 'COUNT, SUM, AVG, MIN y MAX',
    shortTitle: 'Agregados',
    lesson: 'S2-L12',
    notes: {
      explain: '17 filas activas se resumen en una sola fila con cinco cálculos.',
      question: '¿Cuántas filas devuelve sin GROUP BY? (Una.)',
      transition: 'Cuidado con los NULL.',
    },
  },
  {
    id: 'count-null',
    block: 'funciones-grupo',
    kind: 'lesson',
    title: 'COUNT y los NULL',
    shortTitle: 'COUNT y NULL',
    lesson: 'S2-L13',
    notes: {
      explain:
        'COUNT(*) = 20 filas; COUNT(bono) = 14 valores. AVG(bono) divide entre 14, no entre 20.',
      mistake: 'Creer que AVG cuenta los NULL como 0.',
      transition: 'Ahora, un resumen por grupo.',
    },
  },
  {
    id: 'group-by',
    block: 'group-by',
    kind: 'lesson',
    title: 'GROUP BY: un resumen por departamento',
    shortTitle: 'GROUP BY',
    lesson: 'S2-L14',
    notes: {
      explain:
        'Oracle reparte las filas en grupos por ID_DEPARTAMENTO y calcula COUNT y AVG en cada uno. El NULL forma su propio grupo.',
      question: '¿Cuántas filas salen? (Seis.)',
      transition: 'Varias columnas y dos errores clásicos.',
    },
  },
  {
    id: 'group-dos',
    block: 'group-by',
    kind: 'lesson',
    title: 'Agrupar por dos columnas',
    shortTitle: 'GROUP BY 2',
    lesson: 'S2-L15',
    notes: {
      explain: 'Cada combinación departamento–estado es un grupo.',
      mistake:
        'Mostrar una columna que no está agrupada (ORA-00979) o usar COUNT en el WHERE (ORA-00934).',
      transition: '¿Cómo se filtran los grupos?',
    },
  },
  {
    id: 'having',
    block: 'having',
    kind: 'lesson',
    title: 'HAVING: filtrar grupos',
    shortTitle: 'HAVING',
    lesson: 'S2-L16',
    notes: {
      explain: 'De seis grupos quedan tres: los que tienen promedio mayor que 4.500.000.',
      mistake: 'Usar el alias del SELECT en HAVING: se repite la función.',
      transition: '¿Y en qué se diferencia del WHERE?',
    },
  },
  {
    id: 'where-having',
    block: 'having',
    kind: 'lesson',
    title: 'WHERE → GROUP BY → HAVING',
    shortTitle: 'WHERE vs HAVING',
    lesson: 'S2-L17',
    notes: {
      explain:
        'WHERE deja 17 filas activas; GROUP BY forma seis grupos; HAVING deja cuatro. El orden de evaluación no es el de escritura.',
      question: '¿Dónde va estado = ACTIVO? (WHERE.) ¿Y COUNT(*) >= 3? (HAVING.)',
      transition: 'Pregunta rápida.',
    },
  },
  {
    id: 'check-where-having',
    block: 'having',
    kind: 'check',
    title: '¿WHERE o HAVING?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S2-SC-WH',
      lesson: 'S2-L17',
      kind: 'choice',
      prompt: '¿Dónde va la condición AVG(salario) > 5000000?',
      options: [
        {
          text: 'En HAVING',
          correct: true,
          feedback: 'Es una condición sobre el resumen del grupo.',
        },
        {
          text: 'En WHERE',
          correct: false,
          feedback: 'El WHERE no admite funciones de grupo: ORA-00934.',
        },
        { text: 'En ON', correct: false, feedback: 'ON decide las parejas de un JOIN.' },
      ],
      hints: ['¿Se puede evaluar mirando una sola fila?', 'AVG necesita el grupo completo.'],
      explanation: 'Las condiciones con funciones de grupo van en HAVING.',
    },
    notes: {
      explain: 'Pide justificar la respuesta con el orden de evaluación.',
      transition: 'Juntemos JOIN y agregaciones.',
    },
  },
  {
    id: 'join-count',
    block: 'join-agregacion',
    kind: 'lesson',
    title: 'Empleados por departamento, sin perder ninguno',
    shortTitle: 'JOIN + COUNT',
    lesson: 'S2-L18',
    notes: {
      explain:
        'LEFT JOIN desde DEPARTAMENTOS conserva Investigación. COUNT(e.id_empleado) le da 0; COUNT(*) le daría 1.',
      mistake: 'Usar COUNT(*) con LEFT JOIN.',
      transition: 'Un análisis con HAVING.',
    },
  },
  {
    id: 'join-having',
    block: 'join-agregacion',
    kind: 'lesson',
    title: 'Proyectos con más de 35 horas',
    shortTitle: 'JOIN + HAVING',
    lesson: 'S2-L19',
    notes: {
      explain:
        'Une, agrupa por proyecto, suma horas y filtra grupos. Dos proyectos con 35 exactas no entran.',
      transition: 'A veces el valor de comparación hay que calcularlo: subconsultas.',
    },
  },
  {
    id: 'subconsulta',
    block: 'subconsultas',
    kind: 'lesson',
    title: 'Más que el promedio',
    shortTitle: 'Subconsulta',
    lesson: 'S2-L20',
    notes: {
      explain:
        'Primero la subconsulta (4.580.000), después la externa. El número no se escribe a mano.',
      mistake: 'Usar = con una subconsulta que devuelve varias filas: ORA-01427.',
      transition: 'Cuando la subconsulta devuelve una lista.',
    },
  },
  {
    id: 'not-in',
    block: 'subconsultas',
    kind: 'lesson',
    title: 'La trampa de NOT IN con NULL',
    shortTitle: 'NOT IN y NULL',
    lesson: 'S2-L21',
    example: 'S2-E-NOT-IN-NULL',
    notes: {
      explain:
        'La lista incluye el NULL de Esteban: NOT IN no devuelve nada. Filtrar los NULL o usar NOT EXISTS lo arregla.',
      question: '¿Por qué un solo NULL vacía el resultado? (60 <> NULL es desconocido.)',
      transition: 'Subconsultas que dependen de cada fila.',
    },
  },
  {
    id: 'correlacionada',
    block: 'subconsultas',
    kind: 'lesson',
    title: 'Más que el promedio de su propia área',
    shortTitle: 'Correlacionada',
    lesson: 'S2-L22',
    notes: {
      explain:
        'La subconsulta usa e.id_departamento: calcula un promedio distinto para cada persona.',
      transition: 'Último bloque de herramientas: operadores de conjuntos.',
    },
  },
  {
    id: 'union',
    block: 'conjuntos',
    kind: 'lesson',
    title: 'UNION frente a UNION ALL',
    shortTitle: 'UNION',
    lesson: 'S2-L23',
    example: 'S2-E-UNION-ALL',
    notes: {
      explain:
        'Los conjuntos apilan filas. UNION ALL conserva las cinco; UNION deja tres. Mismas columnas, mismo orden, tipos compatibles.',
      mistake: 'Usar UNION para juntar columnas: eso es un JOIN.',
      transition: 'Lo común y lo que falta.',
    },
  },
  {
    id: 'intersect-minus',
    block: 'conjuntos',
    kind: 'lesson',
    title: 'INTERSECT y MINUS',
    shortTitle: 'INTERSECT/MINUS',
    lesson: 'S2-L24',
    example: 'S2-E-MINUS',
    notes: {
      explain:
        'Ciudades de empleados MINUS sedes = Valledupar. Con INTERSECT quedan las cuatro comunes.',
      question: '¿Da lo mismo invertir el orden de MINUS? (No.)',
      transition: 'Todo junto.',
    },
  },
  {
    id: 'integracion',
    block: 'integracion',
    kind: 'lesson',
    title: 'Consulta integradora por capas',
    shortTitle: 'Integración',
    lesson: 'S2-L25',
    notes: {
      explain:
        'JOIN (19) → WHERE (16) → GROUP BY (5) → HAVING con subconsulta (3) → ORDER BY. Cada capa responde una parte de la pregunta.',
      question: '¿Qué pasa si quitamos el WHERE? (Cambian conteos y promedios.)',
      transition: 'Cierre.',
    },
  },
  {
    id: 'cierre',
    block: 'integracion',
    kind: 'closing',
    title: 'Ideas clave',
    shortTitle: 'Cierre',
    points: [
      'JOIN combina filas relacionadas; el tipo decide qué pasa con las que no tienen pareja.',
      'GROUP BY resume; WHERE filtra filas y HAVING filtra grupos.',
      'Subconsultas y conjuntos responden lo que un JOIN no expresa con claridad.',
    ],
    notes: {
      explain: 'Invita a practicar y a hacer el Challenge de la sección.',
    },
  },
];
