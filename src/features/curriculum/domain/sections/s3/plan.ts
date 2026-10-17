import type { CurriculumBlock, TopicPlan } from '../../types';

/**
 * Ruta de la Sección 3 (S2_S3_PEDAGOGICAL_RESTRUCTURE.md). El núcleo sigue el orden que
 * pide el profesor: concepto de PL/SQL, bloque anónimo, variables e inicialización, %TYPE,
 * IF, FOR, cursor implícito, cursor explícito, funciones, procedimientos, paquetes y
 * triggers (momento, evento, nivel y cuerpo). SELECT INTO, LOOP/WHILE, DML y el cursor FOR
 * son apoyo; %ROWTYPE, alcance, CASE, excepciones, validación y límites de los triggers y el
 * integrador final son ampliación y van después.
 *
 * El orden de este archivo es el orden de estudio, de clase y de práctica.
 */

export const S3_BLOCKS: readonly CurriculumBlock[] = [
  {
    id: 'que-es-plsql',
    number: 0,
    title: 'De SQL a PL/SQL',
    summary: 'Qué añade PL/SQL a lo que ya sabes de SQL.',
    tier: 'core',
  },
  {
    id: 'bloque-anonimo',
    number: 1,
    title: 'Bloque anónimo',
    summary: 'BEGIN y END; después DECLARE y EXCEPTION, en tres versiones.',
    tier: 'core',
  },
  {
    id: 'variables',
    number: 2,
    title: 'Variables',
    summary: 'Declarar, inicializar y asignar con :=.',
    tier: 'core',
  },
  {
    id: 'type',
    number: 3,
    title: '%TYPE',
    summary: 'Una variable con el mismo tipo que una columna.',
    tier: 'core',
  },
  {
    id: 'sql-en-plsql',
    number: 4,
    title: 'SQL dentro de PL/SQL',
    summary: 'SELECT INTO: del resultado de una consulta a una variable.',
    tier: 'support',
  },
  {
    id: 'condicionales',
    number: 5,
    title: 'IF',
    summary: 'Decidir con IF, ELSIF y ELSE.',
    tier: 'core',
  },
  {
    id: 'bucles',
    number: 6,
    title: 'FOR',
    summary: 'Repetir un número conocido de veces; después LOOP y WHILE.',
    tier: 'core',
  },
  {
    id: 'cursor-implicito',
    number: 7,
    title: 'Cursor implícito',
    summary: 'El cursor que Oracle crea solo, SQL%ROWCOUNT y el DML en un bloque.',
    tier: 'core',
  },
  {
    id: 'cursor-explicito',
    number: 8,
    title: 'Cursor explícito',
    summary: 'CURSOR, OPEN, FETCH y CLOSE; después el cursor FOR.',
    tier: 'core',
  },
  {
    id: 'funciones',
    number: 9,
    title: 'Funciones',
    summary: 'Un subprograma con nombre que devuelve un valor con RETURN.',
    tier: 'core',
  },
  {
    id: 'procedimientos',
    number: 10,
    title: 'Procedimientos',
    summary: 'Un subprograma que realiza una tarea; después IN, OUT e IN OUT.',
    tier: 'core',
  },
  {
    id: 'paquetes',
    number: 11,
    title: 'Paquetes',
    summary: 'Especificación y cuerpo para agrupar funciones y procedimientos.',
    tier: 'core',
  },
  {
    id: 'triggers',
    number: 12,
    title: 'Triggers',
    summary: 'Momento, evento, nivel y cuerpo; :OLD, :NEW y la auditoría de salarios.',
    tier: 'core',
  },
  {
    id: 'ampliacion-plsql',
    number: 13,
    title: 'Ampliación · Más herramientas',
    summary: 'Siguiente nivel: %ROWTYPE, alcance de variables y CASE.',
    tier: 'extension',
  },
  {
    id: 'excepciones',
    number: 14,
    title: 'Ampliación · Excepciones',
    summary: 'Siguiente nivel: manejar errores y lanzar los propios.',
    tier: 'extension',
  },
  {
    id: 'triggers-avanzados',
    number: 15,
    title: 'Ampliación · Validar con triggers y sus límites',
    summary: 'Siguiente nivel: impedir un cambio y cuándo no usar un trigger.',
    tier: 'extension',
  },
  {
    id: 'integracion',
    number: 16,
    title: 'Ampliación · Integración final',
    summary: 'Procedimiento, cursor y trigger en un caso completo.',
    tier: 'extension',
  },
];

const EMP = 'EMPLEADOS';
const persona = (columns: readonly string[], role = 'Cada fila es una persona.') => ({
  table: EMP,
  role,
  columns,
});

const RAISE_APP = {
  term: 'RAISE_APPLICATION_ERROR',
  explanation:
    'Aparece en el código ya creado: detiene el subprograma con un mensaje propio (ORA-20xxx). No hace falta escribirlo aún; se estudia en la ampliación de excepciones.',
};

export const S3_PLAN: readonly (TopicPlan & { readonly block: string })[] = [
  {
    lesson: 'S3-L01',
    block: 'que-es-plsql',
    tier: 'core',
    problem:
      'Con SQL obtenemos el salario de Andrés. ¿Y si además queremos guardarlo, decidir algo según su valor y repetir la acción para varias personas?',
    prerequisites: [],
    prior: 'De las secciones 1 y 2: SELECT, WHERE, COUNT y JOIN. No necesitas saber programar.',
    model:
      'SQL     →  consultar o modificar datos: una sentencia, un resultado\nPL/SQL  →  SQL + variables + decisiones + repetición + programas guardados\n«Procedural»: indicamos los pasos, en orden, que el programa debe seguir.',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ESTADO'])],
    parts: [
      {
        code: 'SELECT salario FROM empleados WHERE id_empleado = 6;',
        meaning: 'SQL: describe qué dato queremos; Oracle lo devuelve.',
      },
      {
        code: 'BEGIN … END;',
        meaning: 'PL/SQL: un bloque que agrupa pasos. Se estudia en el bloque 1.',
      },
    ],
    reading:
      'SQL pide un resultado; PL/SQL es la extensión procedural de SQL en Oracle: ejecuta SQL y, alrededor, guarda valores, decide y repite.',
    unchanged: [
      'La consulta SQL se escribe igual dentro de PL/SQL.',
      'PL/SQL no reemplaza a SQL: lo usa.',
    ],
    previews: [
      {
        term: 'BEGIN … END',
        explanation:
          'Solo se muestra la forma de un bloque para compararla con SQL; cómo se escribe y qué hace cada parte es el tema del bloque 1.',
      },
    ],
  },
  {
    lesson: 'S3-L02',
    block: 'bloque-anonimo',
    tier: 'core',
    problem: '¿Cuál es el programa PL/SQL más pequeño posible, y qué partes se le pueden añadir?',
    prerequisites: ['S3-L01'],
    model:
      'Versión 1:            BEGIN … END;\nVersión 2:  DECLARE … BEGIN … END;\nVersión 3:  DECLARE … BEGIN … EXCEPTION … END;\nObligatorio: BEGIN y END. Opcionales: DECLARE (preparar) y EXCEPTION (responder a un error).',
    tables: [],
    parts: [
      {
        code: 'DECLARE',
        meaning:
          'Opcional: prepara nombres (variables) antes de usarlos. Se estudia a fondo en el bloque 2.',
      },
      { code: 'BEGIN', meaning: 'Obligatorio: aquí empiezan las instrucciones.' },
      {
        code: "DBMS_OUTPUT.PUT_LINE('Hola');",
        meaning: 'Muestra un texto en la salida del programa. Cada instrucción termina en ;',
      },
      { code: 'EXCEPTION', meaning: 'Opcional: qué hacer si algo falla.' },
      { code: 'END;', meaning: 'Obligatorio: aquí termina el bloque.' },
    ],
    reading:
      'Un bloque anónimo prepara (opcional), ejecuta sus instrucciones entre BEGIN y END, y responde a los errores en EXCEPTION (opcional). No tiene nombre: se ejecuta una vez.',
    unchanged: [
      'Ningún bloque de esta lección lee ni cambia tablas.',
      'BEGIN y END están en las tres versiones.',
    ],
    previews: [
      {
        term: ':= (asignar)',
        explanation:
          'En la versión 2, := da a v_mensaje su valor inicial. Asignar valores a variables es el tema del bloque 2.',
      },
    ],
  },
  {
    lesson: 'S3-L04',
    block: 'variables',
    tier: 'core',
    problem:
      'Para calcular o decidir necesitamos recordar un dato mientras el programa se ejecuta. ¿Dónde lo guardamos?',
    prerequisites: ['S3-L02'],
    model:
      "v_nombre   VARCHAR2(30)   := 'Ana'\n  nombre        tipo        valor inicial\n:= asigna (PL/SQL)     = compara (SQL y condiciones)\nSin valor inicial, la variable vale NULL.",
    tables: [],
    parts: [
      { code: 'v_nombre', meaning: 'Nombre de la variable (por convención, empieza por v_).' },
      {
        code: 'VARCHAR2(30)',
        meaning: 'Tipo: texto de hasta 30 caracteres. NUMBER guarda números y DATE fechas.',
      },
      { code: ":= 'Ana'", meaning: 'Inicialización: el valor con que empieza.' },
      { code: 'v_bono := 300000;', meaning: 'Asignación en BEGIN: cambia el valor.' },
      { code: 'CONSTANT', meaning: 'Una constante debe inicializarse y ya no puede cambiar.' },
    ],
    reading:
      'Declara una variable con nombre y tipo, dale un valor inicial si lo necesitas y cámbialo después con :=.',
    unchanged: [
      'Las variables existen solo mientras se ejecuta el bloque: no se guardan en ninguna tabla.',
    ],
  },
  {
    lesson: 'S3-L05',
    block: 'type',
    tier: 'core',
    problem:
      '¿Qué tipo debería tener una variable que guardará un SALARIO? ¿Y si mañana la columna cambia de tamaño?',
    prerequisites: ['S3-L04'],
    model: 'EMPLEADOS.SALARIO  (NUMBER(10))\n        ↓ tipo\nv_salario empleados.salario%TYPE',
    tables: [
      persona(
        ['NOMBRE', 'SALARIO'],
        'Solo se usa el tipo de sus columnas; no se lee ninguna fila.',
      ),
    ],
    parts: [
      { code: 'v_salario', meaning: 'La variable.' },
      { code: 'empleados.salario', meaning: 'La columna de la que copia el tipo.' },
      { code: '%TYPE', meaning: 'Toma el tipo de esa columna (no su valor).' },
    ],
    reading: 'Declara v_salario con el mismo tipo que la columna SALARIO de EMPLEADOS.',
    unchanged: [
      '%TYPE copia el tipo, no el valor: la variable empieza en NULL si no se inicializa.',
    ],
  },
  {
    lesson: 'S3-L07',
    block: 'sql-en-plsql',
    tier: 'support',
    problem:
      'Ya sabemos consultar el salario de Andrés y declarar una variable. ¿Cómo guardamos ese resultado en la variable?',
    prerequisites: ['S3-L05'],
    model:
      'resultado SQL (una fila)\n        ↓ INTO\nv_salario\nAntes: variable vacía (NULL) → ejecución → después: variable con el valor',
    tables: [
      persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ID_DEPARTAMENTO']),
      {
        table: 'DEPARTAMENTOS',
        role: 'Cada fila es un área; el ejemplo la une con EMPLEADOS para leer el nombre del área.',
        columns: ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'],
      },
    ],
    parts: [
      { code: 'SELECT salario', meaning: 'La columna que queremos leer.' },
      {
        code: 'INTO v_salario',
        meaning: 'Dónde se guarda: una variable por columna, en el mismo orden.',
      },
      {
        code: 'FROM empleados WHERE id_empleado = 6',
        meaning: 'La condición debe devolver exactamente una fila.',
      },
    ],
    reading: 'Lee el salario de la persona 6 y guárdalo en la variable v_salario.',
    unchanged: ['SELECT INTO no cambia la tabla: solo copia un valor a la variable.'],
  },
  {
    lesson: 'S3-L09',
    block: 'condicionales',
    tier: 'core',
    problem:
      '¿El salario supera los 6.000.000? Según la respuesta, el programa debe hacer una cosa u otra.',
    prerequisites: ['S3-L04', 'S3-L07'],
    model:
      '            condición\n           /         \\\n        verdadera   no verdadera\n           |            |\n        THEN …       ELSIF … / ELSE …',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'BONO'])],
    parts: [
      {
        code: 'IF v_salario >= 6000000 THEN',
        meaning: 'Si la condición es verdadera, ejecuta lo que sigue.',
      },
      {
        code: 'ELSIF v_salario >= 4000000 THEN',
        meaning: 'Si no, prueba otra condición (se escribe ELSIF).',
      },
      { code: 'ELSE', meaning: 'Si ninguna fue verdadera.' },
      { code: 'END IF;', meaning: 'Cierra la decisión.' },
    ],
    reading:
      'Si el salario es al menos 6.000.000 el nivel es Alto; si no, si es al menos 4.000.000, Medio; en otro caso, Inicial.',
    unchanged: ['Solo se ejecuta una rama.', 'Una condición con NULL no es verdadera: va a ELSE.'],
  },
  {
    lesson: 'S3-L12',
    block: 'bucles',
    tier: 'core',
    problem:
      'Queremos repetir una acción cinco veces, o para los IDs del 2 al 5, sin escribirla cinco veces.',
    prerequisites: ['S3-L04', 'S3-L07'],
    model:
      'FOR i IN 1..5 LOOP\n  i = 1 → acción\n  i = 2 → acción\n  i = 3 → acción\n  i = 4 → acción\n  i = 5 → acción\nEND LOOP',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE'])],
    parts: [
      { code: 'FOR i', meaning: 'i es el contador; FOR lo crea solo (no se declara).' },
      { code: 'IN 1..5', meaning: 'El rango: de 1 a 5, de uno en uno.' },
      { code: 'LOOP … END LOOP;', meaning: 'Las instrucciones que se repiten en cada vuelta.' },
    ],
    reading:
      'Para i desde 1 hasta 5, ejecuta las instrucciones del bucle; en cada vuelta i vale uno más.',
    unchanged: ['El contador i solo existe dentro del bucle y no se puede modificar.'],
  },
  {
    lesson: 'S3-L11',
    block: 'bucles',
    tier: 'support',
    problem:
      'A veces no sabemos cuántas vueltas hacen falta: repetir hasta que el salario alcance una meta.',
    prerequisites: ['S3-L12'],
    model:
      'FOR    → número de vueltas conocido\nLOOP   → repetir hasta EXIT WHEN\nWHILE  → repetir mientras la condición sea verdadera (se pregunta antes de cada vuelta)',
    tables: [
      persona(['ID_EMPLEADO', 'SALARIO']),
      {
        table: 'PROYECTOS',
        role: 'Cada fila es un proyecto con su presupuesto.',
        columns: ['ID_PROYECTO', 'PRESUPUESTO'],
      },
    ],
    parts: [
      { code: 'LOOP … END LOOP;', meaning: 'Repite sin límite fijo.' },
      { code: 'EXIT WHEN condición;', meaning: 'Sale del bucle cuando la condición es verdadera.' },
      { code: 'WHILE condición LOOP', meaning: 'Comprueba la condición antes de cada vuelta.' },
    ],
    reading: 'Repite las instrucciones y termina cuando se cumple la condición de salida.',
    unchanged: ['El cuerpo del bucle es igual que en FOR; solo cambia quién decide cuándo parar.'],
  },
  {
    lesson: 'S3-L13',
    block: 'cursor-implicito',
    tier: 'core',
    problem: 'Cuando PL/SQL ejecuta una sentencia SQL, ¿cómo sabemos cuántas filas procesó?',
    prerequisites: ['S3-L07', 'S3-L09'],
    model:
      'Oracle ejecuta una sentencia SQL\n  ↓ procesa su resultado en un cursor\n  ↓ SQL%ROWCOUNT, SQL%FOUND describen lo que hizo\nCursor = el mecanismo con el que PL/SQL trabaja con el resultado de una sentencia.\nImplícito: Oracle lo crea y lo administra solo.',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'BONO', 'ID_DEPARTAMENTO'])],
    parts: [
      {
        code: 'SELECT … INTO … / UPDATE …',
        meaning: 'Cada sentencia usa un cursor implícito llamado SQL.',
      },
      { code: 'SQL%ROWCOUNT', meaning: 'Cuántas filas procesó la última sentencia.' },
      { code: 'SQL%FOUND / SQL%NOTFOUND', meaning: 'Si procesó alguna fila o ninguna.' },
    ],
    reading:
      'Ejecuta la sentencia y, justo después, consulta cuántas filas procesó su cursor implícito.',
    unchanged: ['Una sentencia que no encuentra filas no es un error: SQL%ROWCOUNT vale 0.'],
    previews: [
      {
        term: 'UPDATE',
        explanation:
          'UPDATE tabla SET columna = valor WHERE condición cambia valores de filas existentes. Aquí sirve para ver el cursor implícito; la lección siguiente lo estudia junto a INSERT y DELETE.',
      },
    ],
  },
  {
    lesson: 'S3-L08',
    block: 'cursor-implicito',
    tier: 'support',
    problem: '¿Cómo cambiamos datos desde un bloque y cómo deshacemos un cambio de prueba?',
    prerequisites: ['S3-L13'],
    model:
      'INSERT / UPDATE / DELETE\n  ↓ filas cambiadas (SQL%ROWCOUNT)\n  ↓ COMMIT confirma  ·  ROLLBACK deshace',
    tables: [
      persona(['ID_EMPLEADO', 'BONO']),
      {
        table: 'ASIGNACIONES',
        role: 'Una fila por persona y proyecto.',
        columns: ['ID_EMPLEADO', 'ID_PROYECTO'],
      },
    ],
    parts: [
      { code: 'UPDATE … SET … WHERE …;', meaning: 'Cambia filas existentes.' },
      { code: 'DELETE FROM … WHERE …;', meaning: 'Borra filas.' },
      { code: 'ROLLBACK;', meaning: 'Deshace los cambios no confirmados.' },
    ],
    reading: 'Ejecuta un cambio, comprueba cuántas filas afectó y deshazlo con ROLLBACK.',
    unchanged: ['Tras ROLLBACK, la tabla vuelve a su estado anterior.'],
  },
  {
    lesson: 'S3-L14',
    block: 'cursor-explicito',
    tier: 'core',
    problem:
      'SELECT INTO solo admite una fila. ¿Cómo procesamos una a una las cuatro personas de TI?',
    prerequisites: ['S3-L13', 'S3-L11'],
    model:
      'CURSOR c_ti IS SELECT …   (definir la consulta)\n  ↓ OPEN     ejecuta la consulta; el puntero queda antes de la fila 1\n  ↓ FETCH    fila 1 → variables → procesar\n  ↓ FETCH    fila 2 → variables → procesar\n  ↓ …        (una vuelta por fila)\n  ↓ FETCH    no hay más filas: %NOTFOUND = TRUE → salir\n  ↓ CLOSE    cerrar el cursor\nImplícito: lo administra Oracle. Explícito: lo declaramos y controlamos nosotros.',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ID_DEPARTAMENTO'])],
    parts: [
      { code: 'CURSOR c IS SELECT …;', meaning: 'Define la consulta (en DECLARE).' },
      { code: 'OPEN c;', meaning: 'Ejecuta la consulta y se coloca antes de la primera fila.' },
      { code: 'FETCH c INTO variables;', meaning: 'Obtiene la siguiente fila.' },
      { code: 'EXIT WHEN c%NOTFOUND;', meaning: 'Sale cuando ya no quedan filas.' },
      { code: 'CLOSE c;', meaning: 'Cierra el cursor.' },
    ],
    reading: 'Define la consulta, ábrela, lee las filas una a una hasta que no queden y ciérrala.',
    unchanged: ['La consulta del cursor no cambia datos: solo se recorre su resultado.'],
  },
  {
    lesson: 'S3-L15',
    block: 'cursor-explicito',
    tier: 'support',
    problem: 'OPEN, FETCH y CLOSE funcionan, pero son muchas líneas. ¿Hay una forma más cómoda?',
    prerequisites: ['S3-L14'],
    model:
      'FOR fila IN cursor LOOP   hace, automáticamente:\n  OPEN\n  FETCH en cada vuelta → fila\n  salir cuando no quedan filas\n  CLOSE',
    tables: [
      {
        table: 'DEPARTAMENTOS',
        role: 'Cada fila es un área.',
        columns: ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'],
      },
      {
        table: 'ASIGNACIONES',
        role: 'Persona, proyecto, rol y horas.',
        columns: ['ID_EMPLEADO', 'ID_PROYECTO', 'ROL', 'HORAS_SEMANALES'],
      },
    ],
    parts: [
      {
        code: 'FOR fila IN (SELECT …) LOOP',
        meaning: 'Recorre el resultado; fila contiene la fila actual.',
      },
      { code: 'fila.columna', meaning: 'Lee una columna de la fila actual.' },
      { code: 'c(valor)', meaning: 'Un cursor con parámetro: misma consulta, otro valor.' },
    ],
    reading: 'Para cada fila del resultado, ejecuta el cuerpo del bucle usando fila.columna.',
    unchanged: ['Recorre las mismas filas que el cursor explícito con OPEN, FETCH y CLOSE.'],
  },
  {
    lesson: 'S3-L20',
    block: 'funciones',
    tier: 'core',
    problem:
      'Calculamos muchas veces el salario anual con bono. ¿Podemos guardar ese cálculo con un nombre y pedirle el resultado?',
    prerequisites: ['S3-L07', 'S3-L09'],
    model:
      'doble(3)   →   la función calcula 3 * 2   →   RETURN 6\n        ↑ entra un dato              ↓ sale un valor\nFUNCIÓN = subprograma con nombre que devuelve un valor: se usa dentro de una expresión.',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'BONO'])],
    parts: [
      {
        code: 'CREATE OR REPLACE FUNCTION doble(p_numero NUMBER)',
        meaning: 'Nombre de la función y su dato de entrada (parámetro).',
      },
      { code: 'RETURN NUMBER IS', meaning: 'Qué tipo de valor devuelve.' },
      { code: 'RETURN p_numero * 2;', meaning: 'Entrega el resultado y termina la función.' },
      { code: 'doble(3)', meaning: 'Llamada: se usa como un valor dentro de una expresión.' },
    ],
    reading:
      'Crea una función con nombre que recibe un número y devuelve su doble; después se usa como un valor.',
    unchanged: ['La función calcula: no cambia ninguna tabla.'],
    previews: [
      {
        term: 'IN en un parámetro',
        explanation:
          'p_id IN … indica que el dato solo entra a la función. Los modos de parámetro (IN, OUT, IN OUT) se estudian en Procedimientos.',
      },
    ],
  },
  {
    lesson: 'S3-L18',
    block: 'procedimientos',
    tier: 'core',
    problem:
      '«Aumentar el salario de una persona» es una tarea, no un valor. ¿Cómo la guardamos para ejecutarla cuando haga falta?',
    prerequisites: ['S3-L20', 'S3-L08'],
    model:
      'FUNCIÓN        → devuelve un valor   (se usa en una expresión)\nPROCEDIMIENTO  → realiza una tarea   (se llama como una instrucción)',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO'])],
    parts: [
      {
        code: 'CREATE OR REPLACE PROCEDURE saludar IS',
        meaning: 'Guarda en la base un procedimiento con nombre.',
      },
      { code: 'BEGIN … END;', meaning: 'Las instrucciones de la tarea.' },
      { code: 'BEGIN saludar; END;', meaning: 'Llamada: se ejecuta como una instrucción.' },
    ],
    reading:
      'Crea un procedimiento con nombre y llámalo desde un bloque para que realice su tarea.',
    unchanged: [
      'El procedimiento queda guardado: se puede llamar muchas veces.',
      'Solo cambian las filas que su tarea modifica.',
    ],
    previews: [RAISE_APP],
  },
  {
    lesson: 'S3-L19',
    block: 'procedimientos',
    tier: 'core',
    problem: 'Un procedimiento puede recibir datos. ¿Cómo devuelve resultados a quien lo llama?',
    prerequisites: ['S3-L18'],
    model:
      'IN      → el dato entra (solo lectura)\nOUT     → el dato sale (se asigna dentro)\nIN OUT  → entra con un valor y sale cambiado',
    tables: [persona(['ID_EMPLEADO', 'ID_DEPARTAMENTO', 'SALARIO'])],
    parts: [
      { code: 'p_entrada IN NUMBER', meaning: 'Recibe un valor.' },
      { code: 'p_salida OUT NUMBER', meaning: 'Devuelve un valor a una variable de quien llama.' },
      { code: 'p_ambos IN OUT NUMBER', meaning: 'Recibe un valor y lo devuelve modificado.' },
    ],
    reading:
      'Llama al procedimiento con un dato de entrada y una variable donde recibirá el resultado.',
    unchanged: ['Un parámetro IN no cambia dentro del procedimiento.'],
  },
  {
    lesson: 'S3-L03',
    block: 'procedimientos',
    tier: 'support',
    problem:
      '¿Qué diferencia hay entre el bloque anónimo del bloque 1 y un procedimiento guardado?',
    prerequisites: ['S3-L02', 'S3-L18'],
    model:
      'Bloque anónimo → se ejecuta una vez y desaparece\nProcedimiento  → se guarda con nombre y se reutiliza',
    tables: [],
    parts: [
      { code: 'BEGIN … END;', meaning: 'Bloque anónimo: sin nombre.' },
      {
        code: 'CREATE OR REPLACE PROCEDURE nombre IS …',
        meaning: 'Objeto almacenado: con nombre.',
      },
    ],
    reading:
      'El bloque anónimo se envía y se ejecuta; el procedimiento queda guardado y se llama por su nombre.',
    unchanged: ['Las instrucciones dentro de BEGIN y END son las mismas.'],
  },
  {
    lesson: 'S3-L21',
    block: 'procedimientos',
    tier: 'support',
    problem: 'Ya conocemos funciones y procedimientos. ¿Cuál elegimos para cada tarea?',
    prerequisites: ['S3-L20', 'S3-L18'],
    model:
      'Calcular un valor → función (en SELECT, WHERE o una asignación)\nHacer una tarea   → procedimiento (como instrucción)',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'BONO'])],
    parts: [
      { code: 'v := mi_funcion(x);', meaning: 'Una función se usa como un valor.' },
      { code: 'mi_procedimiento(x);', meaning: 'Un procedimiento se llama como instrucción.' },
    ],
    reading:
      'Usa una función cuando necesitas un valor y un procedimiento cuando necesitas realizar una tarea.',
    unchanged: ['Los dos son subprogramas guardados con nombre.'],
    previews: [RAISE_APP],
  },
  {
    lesson: 'S3-L22',
    block: 'paquetes',
    tier: 'core',
    problem: 'Tenemos varias funciones y procedimientos de nómina. ¿Cómo los organizamos juntos?',
    prerequisites: ['S3-L20', 'S3-L18'],
    model:
      'PAQUETE rrhh_pkg\n├── salario_anual()   (función pública)\n├── aumentar()        (procedimiento público)\n└── redondear()       (privada, solo en el cuerpo)\nEspecificación = qué ofrece · Cuerpo = cómo lo hace',
    tables: [persona(['ID_EMPLEADO', 'SALARIO', 'BONO'])],
    parts: [
      {
        code: 'CREATE OR REPLACE PACKAGE p IS … END p;',
        meaning: 'Especificación: lo que otros programas pueden usar.',
      },
      {
        code: 'CREATE OR REPLACE PACKAGE BODY p IS … END p;',
        meaning: 'Cuerpo: la implementación.',
      },
      { code: 'p.f(x)', meaning: 'Desde fuera, cada elemento se nombra con el paquete delante.' },
    ],
    reading:
      'Declara en la especificación lo que el paquete ofrece y escríbelo en el cuerpo; después úsalo con paquete.elemento.',
    unchanged: ['Las funciones y procedimientos funcionan igual que sueltos.'],
    previews: [RAISE_APP],
  },
  {
    lesson: 'S3-L23',
    block: 'triggers',
    tier: 'core',
    problem:
      'Queremos que algo ocurra automáticamente cada vez que se inserta un departamento, sin que nadie tenga que acordarse de llamarlo.',
    prerequisites: ['S3-L02', 'S3-L08'],
    model:
      'TRIGGER\n├── MOMENTO   BEFORE · AFTER\n├── EVENTO    INSERT · UPDATE · DELETE  (ON tabla)\n├── NIVEL     sentencia · fila (FOR EACH ROW)\n└── CUERPO    BEGIN … END;  (bloque PL/SQL)',
    tables: [
      {
        table: 'DEPARTAMENTOS',
        role: 'La tabla que vigila el trigger: el evento es un INSERT sobre ella.',
        columns: ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO', 'SEDE'],
      },
    ],
    parts: [
      {
        code: 'CREATE OR REPLACE TRIGGER nombre',
        meaning: 'Un bloque PL/SQL guardado que Oracle ejecuta solo.',
      },
      { code: 'AFTER', meaning: 'Momento: ¿antes (BEFORE) o después (AFTER) de la operación?' },
      {
        code: 'INSERT ON departamentos',
        meaning: 'Evento: ¿qué operación, sobre qué tabla, lo activa?',
      },
      {
        code: '[FOR EACH ROW]',
        meaning: 'Nivel: sin esta cláusula, una vez por sentencia; con ella, una vez por fila.',
      },
      { code: 'BEGIN … END;', meaning: 'Cuerpo: lo que hace cuando se dispara.' },
    ],
    reading:
      'Después de cada INSERT en DEPARTAMENTOS, ejecuta una vez el bloque del trigger, sin que nadie lo llame.',
    unchanged: ['El INSERT se escribe igual: el trigger no se ve en la sentencia.'],
  },
  {
    lesson: 'S3-L24',
    block: 'triggers',
    tier: 'core',
    problem: 'Un UPDATE cambia tres filas. ¿El trigger se ejecuta una vez o tres?',
    prerequisites: ['S3-L23'],
    model:
      'UPDATE afecta 3 filas\nTrigger de sentencia → 1 ejecución\nTrigger de fila (FOR EACH ROW) → 3 ejecuciones\nBEFORE: antes de guardar · AFTER: después de guardar',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ID_DEPARTAMENTO'])],
    parts: [
      { code: 'AFTER UPDATE OF salario ON empleados', meaning: 'Momento y evento.' },
      { code: 'FOR EACH ROW', meaning: 'Nivel de fila: una ejecución por cada fila afectada.' },
      { code: '(sin FOR EACH ROW)', meaning: 'Nivel de sentencia: una ejecución por UPDATE.' },
    ],
    reading:
      'Con FOR EACH ROW el trigger se ejecuta una vez por cada fila que cambia; sin ella, una vez por sentencia.',
    unchanged: [
      'El UPDATE y sus filas son los mismos; solo cambia cuántas veces reacciona el trigger.',
    ],
  },
  {
    lesson: 'S3-L25',
    block: 'triggers',
    tier: 'core',
    problem:
      '¿Cómo guardamos un historial de cada cambio de salario, con el valor de antes y el de después?',
    prerequisites: ['S3-L24'],
    model:
      'ANTES        DESPUÉS\nSALARIO      SALARIO\n2.300.000 →  2.530.000\n:OLD.salario = valor anterior\n:NEW.salario = valor nuevo\nAUDITORIA_SALARIOS: vacía\n  ↓ UPDATE\n  ↓ el trigger detecta el cambio\n  ↓ una fila por persona',
    tables: [
      persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ID_DEPARTAMENTO']),
      {
        table: 'AUDITORIA_SALARIOS',
        role: 'Historial de cambios de salario. Empieza vacía: solo el trigger escribe en ella.',
        columns: [
          'ID_AUDITORIA',
          'ID_EMPLEADO',
          'SALARIO_ANTERIOR',
          'SALARIO_NUEVO',
          'OPERACION',
          'FECHA_CAMBIO',
        ],
      },
    ],
    parts: [
      {
        code: 'AFTER UPDATE OF salario ON empleados FOR EACH ROW',
        meaning: 'Momento, evento y nivel de fila.',
      },
      { code: ':OLD.salario', meaning: 'El valor de la fila antes del cambio.' },
      { code: ':NEW.salario', meaning: 'El valor de la fila después del cambio.' },
      { code: 'INSERT INTO auditoria_salarios …', meaning: 'Cuerpo: registra el cambio.' },
    ],
    reading:
      'Después de cada cambio de salario, fila por fila, inserta en AUDITORIA_SALARIOS el salario anterior y el nuevo.',
    unchanged: [
      'Las demás columnas de EMPLEADOS no cambian.',
      'Nadie escribe en AUDITORIA_SALARIOS a mano.',
    ],
  },
  {
    lesson: 'S3-L29',
    block: 'ampliacion-plsql',
    tier: 'extension',
    problem:
      '¿Y si queremos guardar una fila completa de EMPLEADOS, con todas sus columnas, en una sola variable?',
    prerequisites: ['S3-L05', 'S3-L07'],
    model:
      'EMPLEADOS (fila completa)\n        ↓ forma\nv_emp empleados%ROWTYPE   →   v_emp.nombre, v_emp.salario, …',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'APELLIDO', 'CARGO', 'SALARIO', 'BONO'])],
    parts: [
      {
        code: 'v_emp empleados%ROWTYPE;',
        meaning: 'Una variable con un campo por cada columna de EMPLEADOS.',
      },
      { code: 'SELECT * INTO v_emp', meaning: 'Llena todos los campos con una fila.' },
      { code: 'v_emp.nombre', meaning: 'Lee un campo con punto.' },
    ],
    reading:
      'Declara un registro con la forma de una fila de EMPLEADOS, llénalo con una fila y lee sus campos.',
    unchanged: ['La tabla no cambia: el registro es una copia de la fila.'],
  },
  {
    lesson: 'S3-L06',
    block: 'ampliacion-plsql',
    tier: 'extension',
    problem: 'Si un bloque contiene otro bloque, ¿qué variables se ven en cada uno?',
    prerequisites: ['S3-L04'],
    model:
      'Bloque exterior → bloque interior\nLo declarado dentro solo existe dentro; la variable interior oculta a la exterior del mismo nombre.',
    tables: [],
    parts: [
      { code: 'DECLARE v_x … BEGIN', meaning: 'Variable visible en todo el bloque exterior.' },
      { code: 'DECLARE v_y … BEGIN … END;', meaning: 'Bloque interior: v_y solo existe aquí.' },
    ],
    reading: 'Cada variable vive en el bloque donde se declara y en los bloques que contiene.',
    unchanged: ['Al salir del bloque interior, la variable exterior conserva su valor.'],
  },
  {
    lesson: 'S3-L10',
    block: 'ampliacion-plsql',
    tier: 'extension',
    problem: 'Con muchas opciones, una cadena de IF se vuelve larga. ¿Hay una forma más legible?',
    prerequisites: ['S3-L09'],
    model: 'Valor o condiciones → primera rama WHEN que coincide → su resultado o su acción',
    tables: [
      {
        table: 'DEPARTAMENTOS',
        role: 'Nombre del área de una persona.',
        columns: ['ID_DEPARTAMENTO', 'NOMBRE_DEPARTAMENTO'],
      },
      {
        table: 'ASIGNACIONES',
        role: 'Horas semanales por persona y proyecto.',
        columns: ['ID_EMPLEADO', 'HORAS_SEMANALES'],
      },
    ],
    parts: [
      { code: 'CASE expresión WHEN valor THEN …', meaning: 'Compara un valor con cada WHEN.' },
      { code: 'CASE WHEN condición THEN …', meaning: 'Prueba condiciones en orden.' },
      { code: 'ELSE …', meaning: 'Si ninguna rama coincide.' },
    ],
    reading: 'Elige la primera rama cuyo WHEN coincide y ejecuta su resultado o su acción.',
    unchanged: ['Decide lo mismo que un IF equivalente; solo cambia la forma de escribirlo.'],
  },
  {
    lesson: 'S3-L16',
    block: 'excepciones',
    tier: 'extension',
    problem:
      'Un SELECT INTO que no encuentra filas termina el bloque con error. ¿Podemos responder con un mensaje en su lugar?',
    prerequisites: ['S3-L02', 'S3-L07'],
    model:
      'Error al ejecutar\n  ↓ se abandona el resto de BEGIN\n  ↓ se busca un WHEN en EXCEPTION\n  ↓ se ejecuta su manejador',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'CIUDAD'])],
    parts: [
      { code: 'WHEN NO_DATA_FOUND THEN', meaning: 'SELECT INTO no encontró ninguna fila.' },
      { code: 'WHEN TOO_MANY_ROWS THEN', meaning: 'SELECT INTO encontró varias filas.' },
      { code: 'WHEN OTHERS THEN … SQLERRM', meaning: 'Cualquier otro error; va al final.' },
    ],
    reading:
      'Si una instrucción falla, busca el manejador de esa excepción y ejecútalo en lugar de terminar con error.',
    unchanged: ['Las instrucciones anteriores al error ya se ejecutaron.'],
  },
  {
    lesson: 'S3-L17',
    block: 'excepciones',
    tier: 'extension',
    problem:
      '¿Cómo detenemos un proceso cuando un dato no cumple una regla, como «el salario debe ser positivo»?',
    prerequisites: ['S3-L16', 'S3-L09'],
    model: 'Detectar regla incumplida → RAISE → manejar o comunicar el error',
    tables: [
      {
        table: 'ASIGNACIONES',
        role: 'Horas semanales de cada persona.',
        columns: ['ID_EMPLEADO', 'HORAS_SEMANALES'],
      },
    ],
    parts: [
      { code: 'e_regla EXCEPTION;', meaning: 'Declara una excepción propia.' },
      { code: 'RAISE e_regla;', meaning: 'La lanza.' },
      {
        code: "RAISE_APPLICATION_ERROR(-20001, 'mensaje');",
        meaning: 'Lanza un error con código y mensaje propios.',
      },
    ],
    reading:
      'Si la regla no se cumple, lanza una excepción y deja que un manejador o quien llamó la reciba.',
    unchanged: ['Las instrucciones posteriores al RAISE no se ejecutan.'],
  },
  {
    lesson: 'S3-L26',
    block: 'triggers-avanzados',
    tier: 'extension',
    problem: 'Queremos impedir que cualquier programa suba un salario más del 20 %.',
    prerequisites: ['S3-L25', 'S3-L17'],
    model:
      'BEFORE UPDATE (fila)\n  ↓ compara :OLD y :NEW\n  ↓ regla aceptada → la fila se guarda\n  ↓ regla rechazada → la sentencia falla entera',
    tables: [persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO'])],
    parts: [
      {
        code: 'BEFORE UPDATE OF salario ON empleados FOR EACH ROW',
        meaning: 'Revisa cada fila antes de guardar.',
      },
      {
        code: 'IF :NEW.salario > :OLD.salario * 1.20 THEN',
        meaning: 'La regla compara el antes y el después.',
      },
      { code: 'RAISE_APPLICATION_ERROR(-20010, …);', meaning: 'Rechaza el cambio.' },
    ],
    reading:
      'Antes de guardar cada cambio de salario, comprueba la regla y rechaza el UPDATE si no se cumple.',
    unchanged: ['Si el trigger rechaza, ninguna fila de la sentencia cambia.'],
  },
  {
    lesson: 'S3-L27',
    block: 'triggers-avanzados',
    tier: 'extension',
    problem: '¿Cuándo es mala idea usar un trigger?',
    prerequisites: ['S3-L26'],
    model:
      'Regla simple → restricción (PK, FK, CHECK)\nProceso explícito → procedimiento\nAuditoría o regla que compara :OLD y :NEW → trigger',
    tables: [persona(['ID_EMPLEADO', 'SALARIO', 'ID_DEPARTAMENTO'])],
    parts: [
      {
        code: 'SELECT … FROM empleados (dentro de su trigger de fila)',
        meaning: 'Tabla mutante: ORA-04091.',
      },
      { code: 'COMMIT (dentro de un trigger)', meaning: 'No se permite: ORA-04092.' },
    ],
    reading:
      'Usa triggers para auditar y para reglas de cambio; deja los procesos de negocio a los procedimientos.',
    unchanged: ['Si el trigger falla, la sentencia que lo disparó no se aplica.'],
  },
  {
    lesson: 'S3-L28',
    block: 'integracion',
    tier: 'extension',
    problem:
      '¿Cómo encajan juntos un procedimiento, un cursor y un trigger en un aumento anual con auditoría?',
    prerequisites: ['S3-L25', 'S3-L19', 'S3-L15', 'S3-L17'],
    model:
      'Procedimiento: valida y aumenta (cursor FOR)\n  ↓ cada UPDATE dispara el trigger\n  ↓ AUDITORIA_SALARIOS registra cada cambio',
    tables: [
      persona(['ID_EMPLEADO', 'NOMBRE', 'SALARIO', 'ESTADO', 'ID_DEPARTAMENTO']),
      {
        table: 'AUDITORIA_SALARIOS',
        role: 'Recibe una fila por cada cambio.',
        columns: ['ID_EMPLEADO', 'SALARIO_ANTERIOR', 'SALARIO_NUEVO'],
      },
    ],
    parts: [
      {
        code: 'aplicar_aumentos(p_departamento, p_porcentaje, p_actualizados)',
        meaning: 'El procedimiento con IN y OUT.',
      },
      {
        code: 'FOR fila IN (…) LOOP UPDATE … END LOOP;',
        meaning: 'Recorre a las personas activas y actualiza cada una.',
      },
      {
        code: 'trg_auditar_salario',
        meaning: 'Registra cada cambio sin que el procedimiento lo pida.',
      },
    ],
    reading:
      'Llama al procedimiento; él actualiza fila a fila y el trigger deja constancia de cada cambio.',
    unchanged: ['Si el porcentaje no es válido, nada cambia y la auditoría queda vacía.'],
  },
];
