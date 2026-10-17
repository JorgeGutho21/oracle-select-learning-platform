import type { CurriculumBlock, TopicPlan } from '../../types';

/**
 * Ruta de la Sección 2 (S2_S3_PEDAGOGICAL_RESTRUCTURE.md). El núcleo es lo que pide el
 * profesor: INNER JOIN y funciones de grupo con GROUP BY, hasta combinarlos (bloque 11).
 * Los bloques 0–2 preparan el JOIN; OUTER, SELF y CROSS profundizan; subconsultas y
 * operadores de conjuntos van después, como ampliación.
 *
 * El orden de este archivo es el orden de estudio, de clase y de práctica.
 */

export const S2_BLOCKS: readonly CurriculumBlock[] = [
  {
    id: 'relaciones',
    number: 0,
    title: 'De una tabla a varias tablas',
    summary: 'Por qué los datos se reparten: relación, clave primaria y clave foránea.',
    tier: 'support',
  },
  {
    id: 'alias',
    number: 1,
    title: 'Alias de tabla',
    summary: 'Un nombre corto para cada tabla antes de escribir el primer JOIN.',
    tier: 'support',
  },
  {
    id: 'modelo-join',
    number: 2,
    title: 'Modelo mental del JOIN',
    summary: 'Cada fila busca su pareja: JOIN combina y ON dice cómo se relacionan.',
    tier: 'support',
  },
  {
    id: 'inner-join',
    number: 3,
    title: 'INNER JOIN',
    summary: 'Núcleo: parejas que cumplen ON, filtro con WHERE y columnas con el mismo nombre.',
    tier: 'core',
  },
  {
    id: 'joins-multiples',
    number: 4,
    title: 'JOIN de más de dos tablas',
    summary: 'PROYECTOS y ASIGNACIONES: unir tres y cuatro tablas paso a paso.',
    tier: 'core',
  },
  {
    id: 'outer-join',
    number: 5,
    title: 'OUTER JOIN',
    summary: 'Conservar las filas sin pareja: LEFT primero; RIGHT y FULL después.',
    tier: 'support',
  },
  {
    id: 'self-join',
    number: 6,
    title: 'SELF JOIN',
    summary: 'La misma tabla en dos papeles: empleado y jefe.',
    tier: 'extension',
  },
  {
    id: 'cross-join',
    number: 7,
    title: 'CROSS JOIN',
    summary: 'Todas las combinaciones; NATURAL JOIN y USING como comparación.',
    tier: 'extension',
  },
  {
    id: 'funciones-grupo',
    number: 8,
    title: 'Funciones de grupo',
    summary: 'Núcleo: COUNT, SUM, AVG, MIN y MAX, y cómo tratan los NULL.',
    tier: 'core',
  },
  {
    id: 'group-by',
    number: 9,
    title: 'GROUP BY',
    summary: 'Núcleo: un resumen por grupo y la regla de las columnas del SELECT.',
    tier: 'core',
  },
  {
    id: 'having',
    number: 10,
    title: 'WHERE frente a HAVING',
    summary: 'Núcleo: WHERE filtra filas antes de agrupar; HAVING filtra grupos después.',
    tier: 'core',
  },
  {
    id: 'join-agregacion',
    number: 11,
    title: 'JOIN + agregaciones',
    summary: 'Culminación del núcleo: resúmenes por departamento y proyecto con nombres legibles.',
    tier: 'core',
  },
  {
    id: 'subconsultas',
    number: 12,
    title: 'Ampliación · Subconsultas',
    summary: 'Siguiente nivel: de una fila, de varias filas, correlacionadas y EXISTS.',
    tier: 'extension',
  },
  {
    id: 'conjuntos',
    number: 13,
    title: 'Ampliación · Operadores de conjuntos',
    summary: 'Siguiente nivel: UNION, UNION ALL, INTERSECT y MINUS.',
    tier: 'extension',
  },
  {
    id: 'integracion',
    number: 14,
    title: 'Ampliación · Integración final',
    summary: 'Una consulta completa, construida y comprobada por capas.',
    tier: 'extension',
  },
];

const EMP = 'EMPLEADOS';
const DEP = 'DEPARTAMENTOS';
const PRO = 'PROYECTOS';
const ASI = 'ASIGNACIONES';

const personas = (columns: readonly string[], role = 'Cada fila es una persona.') => ({
  table: EMP,
  role,
  columns,
});
const areas = (
  columns: readonly string[],
  role = 'Cada fila es un departamento, guardado una sola vez.',
) => ({
  table: DEP,
  role,
  columns,
});
const relacion = [
  personas(
    ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'],
    'Cada fila es una persona; ID_DEPARTAMENTO (FK) guarda el número de su área.',
  ),
  areas(
    ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'],
    'Cada fila es un área; ID_DEPARTAMENTO (PK) la identifica y NOMBRE_DEPARTAMENTO la nombra.',
  ),
];

/** Contrato pedagógico de cada tema, en el orden de la ruta. */
export const S2_PLAN: readonly (TopicPlan & { readonly block: string })[] = [
  {
    lesson: 'S2-L01',
    block: 'relaciones',
    tier: 'support',
    problem:
      'En la Sección 1, EMPLEADOS repetía el texto del departamento en cada persona. ¿Cómo guardamos el nombre del área una sola vez y aun así sabemos a qué área pertenece cada persona?',
    prerequisites: [],
    prior: 'De la Sección 1: leer una tabla (filas y columnas), SELECT, FROM, WHERE e IN.',
    model:
      'Antes (Sección 1):  EMPLEADOS · Carlos · TI   ← el texto se repite en cada persona\nAhora:              EMPLEADOS.ID_DEPARTAMENTO = 20  ──►  DEPARTAMENTOS.ID_DEPARTAMENTO = 20 · TI\n                    (clave foránea, FK)                     (clave primaria, PK · tabla padre)',
    tables: [
      areas(
        ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'],
        'Guarda una sola vez la información de cada departamento. Es la tabla padre: su PK es ID_DEPARTAMENTO.',
      ),
      personas(
        ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO'],
        'Cada fila representa una persona. ID_DEPARTAMENTO es una FK: apunta al área en DEPARTAMENTOS. Es la tabla relacionada.',
      ),
    ],
    parts: [
      {
        code: 'id_empleado NUMBER(4) PRIMARY KEY',
        meaning: 'PK: identifica cada fila; no se repite ni queda vacía.',
      },
      {
        code: 'id_departamento NUMBER(4)',
        meaning: 'Columna de EMPLEADOS que guarda solo el número del área.',
      },
      {
        code: 'REFERENCES departamentos (id_departamento)',
        meaning:
          'La convierte en FK: su valor debe existir como PK en DEPARTAMENTOS (o quedar NULL).',
      },
    ],
    reading:
      'La tabla EMPLEADOS tiene una clave primaria, ID_EMPLEADO, y una columna ID_DEPARTAMENTO que hace referencia a la clave primaria de DEPARTAMENTOS.',
    unchanged: [
      'Las 20 personas de la Sección 1 siguen siendo las mismas.',
      'El nombre del área no se pierde: vive una sola vez en DEPARTAMENTOS.',
    ],
    previews: [
      {
        term: 'CREATE TABLE',
        explanation:
          'Crea una tabla. Aquí solo se lee para ver dónde se declaran la PK y la FK; no tendrás que escribirla.',
      },
      {
        term: 'INSERT',
        explanation:
          'Añade una fila. Se usa solo para ver cómo Oracle protege la relación: rechaza un área inexistente o una clave repetida.',
      },
    ],
  },
  {
    lesson: 'S2-L02',
    block: 'alias',
    tier: 'support',
    problem:
      'Cuando una consulta use dos tablas, escribir empleados.nombre y departamentos.nombre_departamento en cada columna será largo. ¿Cómo nombramos cada tabla de forma corta y clara?',
    prerequisites: ['S2-L01'],
    model:
      'FROM empleados e   →   e significa EMPLEADOS dentro de esta consulta\nempleados.nombre   =   e.nombre',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'SALARIO', 'ID_DEPARTAMENTO'])],
    parts: [
      {
        code: 'FROM empleados e',
        meaning: 'e es un nombre corto y temporal para EMPLEADOS, solo en esta consulta.',
      },
      { code: 'e.nombre', meaning: 'Columna NOMBRE de la tabla que se llama e (EMPLEADOS).' },
    ],
    reading: 'Muestra el nombre de la tabla EMPLEADOS, a la que en esta consulta llamamos e.',
    unchanged: [
      'El alias no cambia el nombre real de la tabla: sigue llamándose EMPLEADOS.',
      'Las filas del resultado son las mismas que sin alias.',
    ],
  },
  {
    lesson: 'S2-L03',
    block: 'modelo-join',
    tier: 'support',
    problem:
      'Sabemos que Carlos tiene ID_DEPARTAMENTO 20 y que el 20 es TI. ¿Cómo le pedimos a Oracle que junte esos dos datos en una sola fila?',
    prerequisites: ['S2-L01', 'S2-L02'],
    model:
      'EMPLEADOS                 DEPARTAMENTOS\nAna      10  ──────────►  10  Operaciones\nCarlos   20  ──────────►  20  TI\nEsteban  NULL    (sin pareja)  30  Ventas\nJOIN combina las filas relacionadas; ON dice qué columnas deben coincidir.',
    tables: relacion,
    parts: [
      { code: 'FROM empleados e', meaning: 'Punto de partida: las personas.' },
      { code: 'JOIN departamentos d', meaning: 'JOIN: trae también las filas de otra tabla.' },
      {
        code: 'ON e.id_departamento = d.id_departamento',
        meaning: 'ON: indica cómo se relacionan; una persona va con el área de su mismo número.',
      },
    ],
    reading:
      'Toma cada persona, busca el departamento cuyo número coincide con el suyo y forma una fila con datos de las dos tablas.',
    unchanged: [
      'EMPLEADOS y DEPARTAMENTOS no cambian: el JOIN solo forma un resultado nuevo.',
      'Esteban sigue en EMPLEADOS aunque no aparezca en el resultado.',
    ],
  },
  {
    lesson: 'S2-L04',
    block: 'inner-join',
    tier: 'core',
    problem:
      'Queremos el nombre de cada persona junto al nombre de su departamento. ¿Qué filas devuelve Oracle y qué pasa con quien no tiene departamento?',
    prerequisites: ['S2-L02', 'S2-L03'],
    model:
      'Antes:   EMPLEADOS (20 personas)  +  DEPARTAMENTOS (6 áreas)\nOperación: cada persona busca su área con ON\nDespués: una fila por pareja encontrada · Esteban (NULL) no encuentra pareja y no sale',
    tables: relacion,
    parts: [
      {
        code: 'SELECT e.nombre, d.nombre_departamento',
        meaning: 'Columnas del resultado: una de cada tabla, con su alias.',
      },
      { code: 'FROM empleados e', meaning: 'Primera tabla: las personas, con alias e.' },
      {
        code: 'INNER JOIN departamentos d',
        meaning: 'Segunda tabla: las áreas, con alias d. INNER: solo parejas.',
      },
      {
        code: 'ON e.id_departamento = d.id_departamento',
        meaning: 'Condición de unión: la FK de la persona igual a la PK del área.',
      },
    ],
    reading:
      'Muestra el nombre de cada persona y el de su departamento, uniendo cada persona con el departamento que tiene su mismo ID_DEPARTAMENTO; quien no tenga pareja no aparece.',
    unchanged: [
      'Las tablas originales no cambian.',
      'Cada persona con área aparece una sola vez: su FK apunta a un único departamento.',
    ],
  },
  {
    lesson: 'S2-L06',
    block: 'inner-join',
    tier: 'core',
    problem:
      'Ya tenemos las parejas persona–área. ¿Cómo nos quedamos solo con algunas, por ejemplo las personas activas de las áreas con sede en Bogotá?',
    prerequisites: ['S2-L04'],
    model:
      'Tablas  →  ON: forma las parejas  →  WHERE: conserva las parejas que cumplen  →  resultado\nON decide cómo se relacionan las tablas; WHERE decide qué filas del resultado se conservan.',
    tables: [
      personas(['ID_EMPLEADO', 'NOMBRE', 'ESTADO', 'ID_DEPARTAMENTO']),
      areas(['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
    parts: [
      {
        code: 'JOIN … ON e.id_departamento = d.id_departamento',
        meaning: 'Primero se forman las parejas.',
      },
      {
        code: "WHERE d.sede = 'Bogotá'",
        meaning: 'Después se filtran: puede usar columnas de cualquiera de las dos tablas.',
      },
      { code: 'ORDER BY …', meaning: 'Ordena el resultado, igual que en la Sección 1.' },
    ],
    reading:
      'Une cada persona con su área y, de esas parejas, conserva solo las que cumplen la condición del WHERE.',
    unchanged: [
      'La condición ON es la misma que en INNER JOIN: WHERE no cambia cómo se emparejan las filas.',
      'Las columnas mostradas no cambian; solo cuántas filas quedan.',
    ],
  },
  {
    lesson: 'S2-L05',
    block: 'inner-join',
    tier: 'core',
    problem:
      'EMPLEADOS y DEPARTAMENTOS tienen las dos una columna llamada ID_DEPARTAMENTO. Si escribimos solo id_departamento, ¿de cuál de las dos hablamos?',
    prerequisites: ['S2-L04', 'S2-L06'],
    model:
      'EMPLEADOS.ID_DEPARTAMENTO   y   DEPARTAMENTOS.ID_DEPARTAMENTO   → mismo nombre, dos orígenes\nid_departamento  →  ambiguo        e.id_departamento  →  claro',
    tables: [
      personas(['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'ID_DEPARTAMENTO']),
      areas(['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE']),
    ],
    parts: [
      { code: 'e.id_departamento', meaning: 'El número de área guardado en la persona (FK).' },
      {
        code: 'd.id_departamento',
        meaning: 'La clave del área (PK). En un INNER JOIN, en cada pareja valen lo mismo.',
      },
      {
        code: 'WHERE e.ciudad <> d.sede',
        meaning: 'Compara un dato de cada tabla en la misma fila.',
      },
    ],
    reading:
      'Une personas y áreas, indica con el alias de qué tabla sale cada columna y compara la ciudad de la persona con la sede de su área.',
    unchanged: [
      'Calificar una columna con su alias no cambia su valor.',
      'Las parejas son las mismas que en INNER JOIN.',
    ],
  },
  {
    lesson: 'S2-L07',
    block: 'joins-multiples',
    tier: 'core',
    problem:
      'Una persona puede trabajar en varios proyectos y un proyecto tiene varias personas. ¿Cómo sabemos quién trabaja en qué proyecto y cuántas horas?',
    prerequisites: ['S2-L04', 'S2-L05'],
    model:
      'EMPLEADOS ──► ASIGNACIONES ◄── PROYECTOS ──► DEPARTAMENTOS\n(persona)      (persona + proyecto + horas)   (proyecto)     (área responsable)\nPaso 1: EMPLEADOS + ASIGNACIONES  →  Paso 2: + PROYECTOS  →  Paso 3: + DEPARTAMENTOS',
    tables: [
      {
        table: PRO,
        role: 'Cada fila representa un proyecto. ID_PROYECTO es su PK; ID_DEPARTAMENTO (FK) es el área responsable.',
        columns: ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO', 'PRESUPUESTO'],
      },
      {
        table: ASI,
        role: 'Conecta empleados con proyectos: una fila por cada pareja persona–proyecto (relación muchos a muchos). Su PK es la pareja ID_EMPLEADO + ID_PROYECTO.',
        columns: ['ID_EMPLEADO', 'ID_PROYECTO', 'ROL', 'HORAS_SEMANALES'],
      },
      personas(['ID_EMPLEADO', 'NOMBRE']),
    ],
    parts: [
      { code: 'FROM empleados e', meaning: 'Paso 1: las personas.' },
      {
        code: 'JOIN asignaciones a ON a.id_empleado = e.id_empleado',
        meaning: 'Paso 2: sus asignaciones (la tabla puente).',
      },
      {
        code: 'JOIN proyectos p ON p.id_proyecto = a.id_proyecto',
        meaning: 'Paso 3: el proyecto de cada asignación.',
      },
    ],
    reading:
      'Une cada persona con sus asignaciones y cada asignación con su proyecto; cada JOIN necesita su propia condición ON.',
    unchanged: [
      'Ninguna tabla cambia: el resultado es una tabla nueva.',
      'Las condiciones de cada JOIN siguen siendo FK = PK, una por relación.',
    ],
  },
  {
    lesson: 'S2-L08',
    block: 'outer-join',
    tier: 'support',
    problem:
      'Con INNER JOIN, Esteban —que no tiene departamento— desaparece del resultado. ¿Cómo listamos a todas las personas, tengan o no área?',
    prerequisites: ['S2-L04', 'S2-L06'],
    model:
      'EMPLEADOS (izquierda)          resultado\nCarlos  20  ✓ pareja  →  Carlos  · TI\nAndrés  20  ✓ pareja  →  Andrés  · TI\nEsteban NULL ✗ sin pareja  →  Esteban · NULL   (se conserva)',
    tables: relacion,
    parts: [
      { code: 'FROM empleados e', meaning: 'La tabla izquierda: todas sus filas se conservan.' },
      {
        code: 'LEFT JOIN departamentos d',
        meaning: 'Busca pareja en la tabla derecha; si no la hay, pone NULL.',
      },
      {
        code: 'ON e.id_departamento = d.id_departamento',
        meaning: 'La misma condición de unión que en INNER JOIN.',
      },
    ],
    reading:
      'Muestra todas las personas; las que encuentran departamento llevan su nombre y las que no, NULL en las columnas del departamento.',
    unchanged: [
      'Las parejas encontradas son las mismas que con INNER JOIN.',
      'NULL en el resultado no crea un departamento: indica que no hubo pareja.',
    ],
  },
  {
    lesson: 'S2-L09',
    block: 'outer-join',
    tier: 'extension',
    problem:
      'LEFT JOIN conserva la izquierda. ¿Y si queremos conservar la derecha, o las filas sin pareja de los dos lados?',
    prerequisites: ['S2-L08'],
    model:
      'LEFT  JOIN → conserva la izquierda\nRIGHT JOIN → conserva la derecha  (A RIGHT JOIN B = B LEFT JOIN A)\nFULL  JOIN → conserva lo que sobra en los dos lados',
    tables: relacion,
    parts: [
      {
        code: 'RIGHT JOIN departamentos d',
        meaning: 'Conserva todas las áreas, aunque no tengan personas.',
      },
      {
        code: 'FULL JOIN departamentos d',
        meaning: 'Conserva personas sin área y áreas sin personas, con NULL en el otro lado.',
      },
    ],
    reading: 'Une personas y áreas conservando también las filas sin pareja del lado indicado.',
    unchanged: ['Las parejas encontradas son las mismas que con INNER JOIN.'],
    previews: [
      {
        term: 'Funciones de grupo',
        explanation:
          'COUNT(*) cuenta las filas del resultado. Aquí solo sirve para comparar cuántas filas da cada JOIN; las funciones de grupo se estudian en el bloque 8.',
      },
    ],
  },
  {
    lesson: 'S2-L10',
    block: 'self-join',
    tier: 'extension',
    problem: '¿Quién es el jefe de Carlos? El jefe también es una persona de EMPLEADOS.',
    prerequisites: ['S2-L04', 'S2-L08'],
    model:
      'EMPLEADOS como persona e          EMPLEADOS como jefe j\n2 Carlos  ID_JEFE 1  ──────────►  1 Ana\n6 Andrés  ID_JEFE 2  ──────────►  2 Carlos\n1 Ana     ID_JEFE NULL   (sin jefe)',
    tables: [
      personas(
        ['ID_EMPLEADO', 'NOMBRE', 'ID_JEFE'],
        'La misma tabla cumple dos papeles. ID_JEFE es una FK que apunta a EMPLEADOS.ID_EMPLEADO.',
      ),
    ],
    parts: [
      { code: 'FROM empleados e', meaning: 'Primer papel: la persona.' },
      {
        code: 'JOIN empleados j',
        meaning: 'Segundo papel: su jefe; la misma tabla con otro alias.',
      },
      {
        code: 'ON e.id_jefe = j.id_empleado',
        meaning: 'El ID_JEFE de la persona es el ID_EMPLEADO del jefe.',
      },
    ],
    reading: 'Une cada persona con la fila de EMPLEADOS que corresponde a su jefe.',
    unchanged: ['Es un JOIN normal: solo cambia que las dos tablas son la misma.'],
  },
  {
    lesson: 'S2-L11',
    block: 'cross-join',
    tier: 'extension',
    problem:
      'Si tenemos 2 personas y 3 proyectos, ¿cuántas combinaciones persona–proyecto existen? 2 × 3 = 6.',
    prerequisites: ['S2-L04'],
    model:
      '2 personas × 3 proyectos = 6 combinaciones\nCROSS JOIN no busca una clave común: combina cada fila con todas las de la otra tabla (producto cartesiano).\nNATURAL JOIN une solo por las columnas con el mismo nombre: depende de los nombres, no del significado.',
    tables: [
      areas(['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO']),
      {
        table: PRO,
        role: 'Cada fila representa un proyecto.',
        columns: ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'ID_DEPARTAMENTO'],
      },
    ],
    parts: [
      {
        code: 'FROM tabla_a CROSS JOIN tabla_b',
        meaning: 'Producto cartesiano: filas de A × filas de B.',
      },
      {
        code: 'NATURAL JOIN',
        meaning: 'Ampliación: une por todas las columnas con el mismo nombre, sin escribir ON.',
      },
      {
        code: 'USING (columna)',
        meaning:
          'Ampliación: une por la columna indicada, que debe llamarse igual en las dos tablas.',
      },
    ],
    reading: 'Combina cada fila de la primera tabla con cada fila de la segunda, sin condición.',
    unchanged: ['Las tablas no cambian; el resultado crece por multiplicación.'],
    previews: [
      {
        term: 'Funciones de grupo',
        explanation:
          'COUNT(*) cuenta las filas del resultado; aquí confirma que salen filas de A × filas de B. Las funciones de grupo se estudian en el bloque 8.',
      },
    ],
  },
  {
    lesson: 'S2-L12',
    block: 'funciones-grupo',
    tier: 'core',
    problem:
      '¿Cuántas personas hay, cuánto suma la nómina, cuál es el salario promedio, el menor y el mayor?',
    prerequisites: [],
    prior: 'De la Sección 1: SELECT, WHERE y funciones de una fila como UPPER o ROUND.',
    model:
      'Salarios: 7.500.000 (Carlos) y 4.200.000 (Andrés)\nCOUNT → 2    SUM → 11.700.000    AVG → 5.850.000    MIN → 4.200.000    MAX → 7.500.000\nMuchas filas entran; una fila de resumen sale.',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ESTADO'])],
    parts: [
      { code: 'COUNT(*)', meaning: 'Cuenta filas.' },
      { code: 'SUM(salario)', meaning: 'Suma los valores.' },
      { code: 'AVG(salario)', meaning: 'Promedio: la suma dividida entre los valores no NULL.' },
      { code: 'MIN(salario) / MAX(salario)', meaning: 'El menor y el mayor valor.' },
    ],
    reading:
      'De las filas que cumplen el WHERE, cuenta cuántas son y calcula la suma, el promedio, el mínimo y el máximo del salario.',
    unchanged: [
      'La tabla EMPLEADOS no cambia: las funciones de grupo solo calculan.',
      'El WHERE sigue eligiendo filas igual que en la Sección 1.',
    ],
  },
  {
    lesson: 'S2-L13',
    block: 'funciones-grupo',
    tier: 'core',
    problem:
      'Seis personas tienen el bono en NULL. ¿Cuentan en COUNT? ¿Bajan el promedio de bonos como si fueran cero?',
    prerequisites: ['S2-L12'],
    model:
      'Andrés: bono 300.000    Paula: bono NULL\nCOUNT(*) → 2 filas    COUNT(bono) → 1 valor conocido\nSUM, AVG, MIN y MAX también ignoran el NULL.',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'BONO', 'ID_DEPARTAMENTO'])],
    parts: [
      { code: 'COUNT(*)', meaning: 'Filas, tengan o no NULL.' },
      { code: 'COUNT(bono)', meaning: 'Solo los valores no NULL de BONO.' },
      { code: 'COUNT(DISTINCT id_departamento)', meaning: 'Valores distintos no NULL.' },
      {
        code: 'NVL(bono, 0)',
        meaning: 'Convierte el NULL en 0 antes de calcular, si así lo queremos.',
      },
    ],
    reading:
      'Cuenta las filas, cuenta los bonos registrados y calcula su suma y su promedio sin tener en cuenta los NULL.',
    unchanged: ['Un bono 0 no es NULL: sí cuenta.', 'Los datos no cambian; solo cómo se cuentan.'],
  },
  {
    lesson: 'S2-L14',
    block: 'group-by',
    tier: 'core',
    problem:
      'El promedio de toda la empresa no dice nada de cada área. ¿Cómo obtenemos un promedio por departamento?',
    prerequisites: ['S2-L12', 'S2-L13'],
    model:
      'Sin GROUP BY:  todas las filas → un promedio\nCon GROUP BY id_departamento:\n  [20: Carlos, Andrés, Paula…]  → promedio de 20\n  [30: María, Sofía…]           → promedio de 30\n1) Oracle forma los grupos  2) la función opera dentro de cada grupo  3) una fila resumen por grupo',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'CARGO'])],
    parts: [
      {
        code: 'SELECT id_departamento, AVG(salario)',
        meaning: 'La columna del grupo y el cálculo por grupo.',
      },
      { code: 'FROM empleados', meaning: 'Las filas que se van a agrupar.' },
      {
        code: 'GROUP BY id_departamento',
        meaning: 'Reúne en un grupo todas las filas con el mismo departamento.',
      },
    ],
    reading:
      'Reúne a las personas por departamento y, para cada grupo, muestra el departamento y el salario promedio.',
    unchanged: [
      'Las filas de EMPLEADOS no cambian; GROUP BY solo las reúne para resumir.',
      'Los NULL forman su propio grupo: Esteban, sin área, sigue contando.',
    ],
  },
  {
    lesson: 'S2-L15',
    block: 'group-by',
    tier: 'core',
    problem:
      '¿Cuántas personas activas e inactivas hay en cada departamento? Hace falta agrupar por dos columnas.',
    prerequisites: ['S2-L14'],
    model:
      'Grupo = (departamento, estado)\n(20, ACTIVO)  (20, INACTIVO)  (30, ACTIVO) …\nRegla: toda columna del SELECT fuera de una función de grupo va en el GROUP BY.',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'ESTADO'])],
    parts: [
      {
        code: 'SELECT id_departamento, estado, COUNT(*)',
        meaning: 'Dos columnas de grupo y un cálculo.',
      },
      {
        code: 'GROUP BY id_departamento, estado',
        meaning: 'Un grupo por cada pareja que existe en los datos.',
      },
    ],
    reading:
      'Forma un grupo por cada combinación de departamento y estado, y cuenta las personas de cada uno.',
    unchanged: ['Agrupar por más columnas no cambia las filas: solo hace grupos más pequeños.'],
  },
  {
    lesson: 'S2-L16',
    block: 'having',
    tier: 'core',
    problem:
      '¿Qué departamentos tienen un salario promedio superior a 4.500.000? La condición es sobre un resumen, no sobre una persona.',
    prerequisites: ['S2-L14'],
    model:
      'Grupos ya calculados:  [20: promedio …]  [30: promedio …]  [40: promedio …]\nHAVING AVG(salario) > 4500000  →  ✓ conservar  /  ✗ descartar el grupo completo',
    tables: [personas(['ID_EMPLEADO', 'ID_DEPARTAMENTO', 'SALARIO'])],
    parts: [
      { code: 'GROUP BY id_departamento', meaning: 'Primero se forman los grupos.' },
      {
        code: 'HAVING AVG(salario) > 4500000',
        meaning: 'Después se conservan los grupos cuyo resumen cumple.',
      },
    ],
    reading:
      'Agrupa por departamento y conserva solo los grupos cuyo salario promedio supera 4.500.000.',
    unchanged: ['Los grupos que quedan tienen el mismo resumen que sin HAVING.'],
  },
  {
    lesson: 'S2-L17',
    block: 'having',
    tier: 'core',
    problem:
      '¿Dónde va cada condición? «Solo personas activas» y «solo áreas con al menos tres personas» no se filtran en el mismo momento.',
    prerequisites: ['S2-L16'],
    model:
      'TABLA\n  ↓ WHERE      filtra FILAS (antes de agrupar)\nFILAS\n  ↓ GROUP BY   forma grupos\nGRUPOS\n  ↓ HAVING     filtra GRUPOS (después de agrupar)\nGRUPOS QUE CUMPLEN',
    tables: [personas(['ID_EMPLEADO', 'ID_DEPARTAMENTO', 'ESTADO'])],
    parts: [
      {
        code: "WHERE estado = 'ACTIVO'",
        meaning: 'Condición sobre cada fila: va antes de agrupar.',
      },
      { code: 'GROUP BY id_departamento', meaning: 'Forma los grupos con las filas que quedaron.' },
      {
        code: 'HAVING COUNT(*) >= 3',
        meaning: 'Condición sobre un resumen: va después de agrupar.',
      },
    ],
    reading:
      'Toma solo las personas activas, agrúpalas por departamento y conserva los departamentos con al menos tres de ellas.',
    unchanged: [
      'El orden de evaluación es siempre el mismo, aunque la consulta se escriba empezando por SELECT.',
    ],
  },
  {
    lesson: 'S2-L18',
    block: 'join-agregacion',
    tier: 'core',
    problem:
      '¿Cuántas personas tiene cada departamento, mostrado con su nombre y sin perder los departamentos vacíos?',
    prerequisites: ['S2-L04', 'S2-L08', 'S2-L14'],
    model:
      'Paso 1 ¿Qué tablas?        EMPLEADOS + DEPARTAMENTOS\nPaso 2 ¿Cómo se unen?      ON e.id_departamento = d.id_departamento\nPaso 3 ¿Qué calculo?       COUNT(e.id_empleado), AVG(e.salario)\nPaso 4 ¿Por qué GROUP BY?  Queremos una fila por departamento',
    tables: relacion,
    parts: [
      {
        code: 'FROM departamentos d LEFT JOIN empleados e ON …',
        meaning: 'Une áreas y personas sin perder las áreas vacías.',
      },
      {
        code: 'COUNT(e.id_empleado)',
        meaning: 'Cuenta personas (ignora el NULL de un área sin personas).',
      },
      { code: 'GROUP BY d.nombre_departamento', meaning: 'Una fila de resumen por departamento.' },
    ],
    reading:
      'Une cada departamento con sus personas, agrúpalos por nombre de departamento y cuenta las personas de cada uno.',
    unchanged: ['El JOIN es el mismo de siempre; GROUP BY actúa sobre sus filas.'],
  },
  {
    lesson: 'S2-L19',
    block: 'join-agregacion',
    tier: 'core',
    problem:
      '¿Cuánto cuesta la nómina de cada departamento y cuántas personas tiene? ¿Y si solo queremos los que superan una meta?',
    prerequisites: ['S2-L18', 'S2-L17'],
    model:
      'Une → filtra filas (WHERE) → agrupa (GROUP BY) → calcula (SUM, COUNT) → filtra grupos (HAVING) → ordena',
    tables: [
      ...relacion,
      {
        table: PRO,
        role: 'Cada fila es un proyecto.',
        columns: ['ID_PROYECTO', 'NOMBRE_PROYECTO'],
      },
      {
        table: ASI,
        role: 'Una fila por persona y proyecto, con sus horas semanales.',
        columns: ['ID_PROYECTO', 'HORAS_SEMANALES'],
      },
    ],
    parts: [
      { code: 'JOIN … ON …', meaning: 'Reúne los datos de las tablas relacionadas.' },
      {
        code: 'GROUP BY p.nombre_proyecto',
        meaning: 'Un resumen por proyecto (o por departamento).',
      },
      {
        code: 'SUM(a.horas_semanales)',
        meaning: 'El cálculo puede usar columnas de cualquier tabla unida.',
      },
      { code: 'HAVING SUM(…) > 35', meaning: 'Conserva solo los grupos que superan la meta.' },
    ],
    reading:
      'Une los datos, agrúpalos, calcula la suma y el conteo de cada grupo y conserva los grupos que superan la meta.',
    unchanged: ['Cada cláusula hace lo mismo que cuando se estudió sola.'],
  },
  {
    lesson: 'S2-L20',
    block: 'subconsultas',
    tier: 'extension',
    problem: '¿Quién gana más que el promedio de la empresa, sin escribir el promedio a mano?',
    prerequisites: ['S2-L12'],
    model:
      'Consulta interior → un valor (el promedio) → la consulta exterior compara con ese valor',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'SALARIO'])],
    parts: [
      {
        code: '(SELECT AVG(salario) FROM empleados)',
        meaning: 'Subconsulta: se resuelve primero y devuelve un valor.',
      },
      {
        code: 'WHERE salario > (…)',
        meaning: 'La consulta exterior compara cada fila con ese valor.',
      },
    ],
    reading:
      'Muestra las personas cuyo salario es mayor que el promedio calculado por la subconsulta.',
    unchanged: ['La subconsulta no cambia datos: solo calcula un valor para comparar.'],
  },
  {
    lesson: 'S2-L21',
    block: 'subconsultas',
    tier: 'extension',
    problem: '¿Quién trabaja en algún proyecto? La lista de IDs no la queremos escribir a mano.',
    prerequisites: ['S2-L20', 'S2-L07'],
    model: 'Consulta interior → varios valores → IN comprueba si el valor está en esa lista',
    tables: [
      personas(['ID_EMPLEADO', 'NOMBRE']),
      {
        table: ASI,
        role: 'Una fila por persona y proyecto.',
        columns: ['ID_EMPLEADO', 'ID_PROYECTO'],
      },
    ],
    parts: [
      {
        code: 'WHERE id_empleado IN (SELECT id_empleado FROM asignaciones)',
        meaning: 'La lista la calcula la subconsulta.',
      },
      { code: 'NOT IN (…)', meaning: 'Distinto de todos; cuidado si la lista tiene NULL.' },
    ],
    reading: 'Muestra a las personas cuyo ID aparece en la lista que devuelve la subconsulta.',
    unchanged: ['Es el mismo IN de la Sección 1; solo cambia de dónde sale la lista.'],
  },
  {
    lesson: 'S2-L22',
    block: 'subconsultas',
    tier: 'extension',
    problem:
      '¿Quién gana más que el promedio de su propio departamento? Cada persona se compara con un valor distinto.',
    prerequisites: ['S2-L20', 'S2-L21'],
    model:
      'Para cada fila exterior → la consulta interior usa su departamento → un promedio propio · EXISTS: ¿hay alguna fila?',
    tables: [personas(['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'])],
    parts: [
      {
        code: 'WHERE i.id_departamento = e.id_departamento',
        meaning: 'La subconsulta usa una columna de la fila exterior.',
      },
      {
        code: 'EXISTS (subconsulta)',
        meaning: 'Verdadero si la subconsulta devuelve al menos una fila.',
      },
    ],
    reading:
      'Para cada persona, calcula el promedio de su departamento y conserva a quien lo supera.',
    unchanged: ['La consulta exterior es una consulta normal de la Sección 1.'],
  },
  {
    lesson: 'S2-L23',
    block: 'conjuntos',
    tier: 'extension',
    problem:
      '¿En qué ciudades hay personas o sedes? Son dos listas de tablas distintas que queremos apilar.',
    prerequisites: ['S2-L01'],
    model:
      'Resultado A\n+ Resultado B (debajo)\nUNION elimina repetidos; UNION ALL conserva todos. Un JOIN une columnas; UNION une filas.',
    tables: [personas(['ID_EMPLEADO', 'CIUDAD']), areas(['ID_DEPARTAMENTO', 'SEDE'])],
    parts: [
      { code: 'SELECT ciudad FROM empleados', meaning: 'Primera lista.' },
      {
        code: 'UNION [ALL]',
        meaning: 'Apila la segunda lista debajo (sin repetidos, o con todos).',
      },
      {
        code: 'SELECT sede FROM departamentos',
        meaning: 'Segunda lista: mismo número de columnas y tipos compatibles.',
      },
    ],
    reading: 'Muestra las ciudades de las personas y las sedes de las áreas en una sola lista.',
    unchanged: ['Cada consulta se ejecuta igual que sola; ORDER BY va una vez, al final.'],
  },
  {
    lesson: 'S2-L24',
    block: 'conjuntos',
    tier: 'extension',
    problem:
      '¿Qué ciudades son a la vez sede y lugar de trabajo? ¿Qué personas no tienen asignaciones?',
    prerequisites: ['S2-L23'],
    model:
      'INTERSECT → lo que está en las dos listas\nA MINUS B → lo que está en A y no en B (el orden importa)',
    tables: [personas(['ID_EMPLEADO', 'CIUDAD']), areas(['ID_DEPARTAMENTO', 'SEDE'])],
    parts: [
      { code: 'INTERSECT', meaning: 'Filas presentes en los dos resultados.' },
      { code: 'MINUS', meaning: 'Filas del primero que no aparecen en el segundo.' },
    ],
    reading:
      'Compara dos listas y conserva lo común (INTERSECT) o lo que solo está en la primera (MINUS).',
    unchanged: ['Las dos consultas no cambian; el operador decide qué filas se conservan.'],
  },
  {
    lesson: 'S2-L25',
    block: 'integracion',
    tier: 'extension',
    problem:
      '¿Qué departamentos tienen un salario promedio de personas activas superior al promedio general? Una pregunta, varias capas.',
    prerequisites: ['S2-L19', 'S2-L20'],
    model:
      '20 personas → JOIN → WHERE activas → GROUP BY departamento → HAVING > promedio general → ORDER BY',
    tables: relacion,
    parts: [
      { code: 'FROM … JOIN … ON …', meaning: 'Capa 1: las parejas.' },
      { code: "WHERE e.estado = 'ACTIVO'", meaning: 'Capa 2: las filas que importan.' },
      { code: 'GROUP BY …', meaning: 'Capa 3: los grupos y su resumen.' },
      {
        code: 'HAVING AVG(…) > (SELECT AVG(…) …)',
        meaning: 'Capa 4: el filtro de grupos con un valor calculado.',
      },
    ],
    reading: 'Construye la respuesta por capas, comprobando cada una antes de añadir la siguiente.',
    unchanged: ['Ninguna cláusula cambia su significado al combinarse.'],
  },
];
