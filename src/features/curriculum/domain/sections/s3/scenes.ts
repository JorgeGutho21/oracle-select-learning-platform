import { lines } from '../../builders';
import type { CurriculumBlock, CurriculumScene } from '../../types';

/**
 * Bloques y guion de la clase de la Sección 3. Las escenas de lección proyectan el ejemplo
 * de su lección (mismo código, misma salida y mismas tablas verificadas en Oracle); aquí solo
 * se escriben las notas del profesor y las escenas de idea, pregunta y cierre.
 */

export const S3_BLOCKS: readonly CurriculumBlock[] = [
  {
    id: 'que-es-plsql',
    number: 1,
    title: 'Qué es PL/SQL',
    summary: 'Por qué un lenguaje procedimental junto a SQL y qué problemas resuelve.',
  },
  {
    id: 'bloques',
    number: 2,
    title: 'Bloques PL/SQL',
    summary: 'DECLARE, BEGIN, EXCEPTION y END; bloques anónimos y salida con DBMS_OUTPUT.',
  },
  {
    id: 'variables',
    number: 3,
    title: 'Variables y tipos',
    summary: 'Declaración, asignación, constantes, %TYPE, %ROWTYPE y alcance.',
  },
  {
    id: 'sql-en-plsql',
    number: 4,
    title: 'SQL dentro de PL/SQL',
    summary: 'SELECT INTO, DML con variables, SQL%ROWCOUNT y transacciones.',
  },
  {
    id: 'condicionales',
    number: 5,
    title: 'Condicionales',
    summary: 'IF, ELSIF, ELSE, el caso NULL y CASE.',
  },
  {
    id: 'bucles',
    number: 6,
    title: 'Bucles',
    summary: 'LOOP con EXIT WHEN, WHILE y FOR numérico.',
  },
  {
    id: 'cursores',
    number: 7,
    title: 'Cursores',
    summary: 'Cursor implícito, cursor explícito (OPEN, FETCH, CLOSE) y cursor FOR.',
  },
  {
    id: 'excepciones',
    number: 8,
    title: 'Excepciones',
    summary: 'Errores predefinidos, WHEN OTHERS, excepciones propias y RAISE_APPLICATION_ERROR.',
  },
  {
    id: 'procedimientos',
    number: 9,
    title: 'Procedimientos',
    summary: 'Bloques con nombre guardados en la base y modos de parámetro IN, OUT e IN OUT.',
  },
  {
    id: 'funciones',
    number: 10,
    title: 'Funciones',
    summary: 'RETURN, funciones en expresiones y dentro de SQL.',
  },
  {
    id: 'paquetes',
    number: 11,
    title: 'Paquetes',
    summary: 'Especificación pública, cuerpo y elementos privados.',
  },
  {
    id: 'triggers',
    number: 12,
    title: 'Triggers',
    summary: 'Evento, BEFORE/AFTER, FOR EACH ROW, :OLD/:NEW, auditoría, validación y límites.',
  },
  {
    id: 'integracion',
    number: 13,
    title: 'Integración',
    summary: 'Un procedimiento con cursor y excepciones más un trigger de auditoría.',
  },
];

export const S3_SCENES: readonly CurriculumScene[] = [
  {
    id: 'portada',
    block: 'que-es-plsql',
    kind: 'cover',
    title: 'PL/SQL y automatización',
    shortTitle: 'Portada',
    notes: {
      explain:
        'Presenta la meta: pasar de preguntar a la base de datos a programar procesos que se ejecutan dentro de ella.',
      question:
        '¿Qué tareas de una empresa se repiten cada mes y siguen reglas fijas? (Nómina, aumentos, auditoría.)',
      transition: 'Primero, el mapa de la clase.',
    },
  },
  {
    id: 'ruta',
    block: 'que-es-plsql',
    kind: 'agenda',
    title: 'Ruta de la clase',
    shortTitle: 'Ruta',
    notes: {
      explain:
        'Trece bloques: estructura, variables, SQL dentro de PL/SQL, control, cursores, errores, programas guardados y triggers.',
      transition: 'Empecemos por la diferencia entre SQL y PL/SQL.',
    },
  },
  {
    id: 'sql-vs-plsql',
    block: 'que-es-plsql',
    kind: 'idea',
    title: 'SQL pregunta; PL/SQL decide y repite',
    shortTitle: 'SQL y PL/SQL',
    lesson: 'S3-L01',
    points: [
      'SQL responde una pregunta sobre datos en una sentencia.',
      'PL/SQL añade variables, decisiones, bucles y manejo de errores.',
      'El código PL/SQL se ejecuta dentro de Oracle, junto a los datos.',
    ],
    code: lines('SELECT COUNT(*) …          → 17', 'IF v_activos > 15 THEN …   → decide qué hacer'),
    notes: {
      explain:
        'SQL sigue siendo la forma de leer y modificar datos; PL/SQL organiza los pasos alrededor de esas sentencias.',
      mistake: 'Pensar que PL/SQL reemplaza a SQL: lo usa en cada paso.',
      transition: 'Veamos el primer bloque.',
    },
  },
  {
    id: 'primer-bloque',
    block: 'que-es-plsql',
    kind: 'lesson',
    title: 'El primer bloque',
    shortTitle: 'Primer bloque',
    lesson: 'S3-L01',
    notes: {
      explain:
        'Avanza línea a línea: el SELECT INTO guarda 17 en la variable y el IF elige el mensaje.',
      question: '¿Qué escribiría si hubiera 10 personas activas?',
      transition: '¿Qué partes tiene un bloque?',
    },
  },
  {
    id: 'estructura',
    block: 'bloques',
    kind: 'lesson',
    title: 'DECLARE, BEGIN, EXCEPTION, END',
    shortTitle: 'Estructura',
    lesson: 'S3-L02',
    notes: {
      explain:
        'El empleado 99 no existe: el error salta a EXCEPTION y el bloque termina con un mensaje en lugar de fallar.',
      mistake: 'Olvidar el punto y coma del END: PLS-00103.',
      transition: '¿Y si el bloque no tiene nombre?',
    },
  },
  {
    id: 'anonimo',
    block: 'bloques',
    kind: 'lesson',
    title: 'Bloque anónimo y procedimiento guardado',
    shortTitle: 'Anónimo',
    lesson: 'S3-L03',
    notes: {
      explain:
        'El bloque anónimo se ejecuta y desaparece; el procedimiento queda guardado y se llama por su nombre las veces que haga falta.',
      transition: 'Una pregunta rápida.',
    },
  },
  {
    id: 'check-bloque',
    block: 'bloques',
    kind: 'check',
    title: '¿Qué es obligatorio?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S3-SC-BLOQUE',
      lesson: 'S3-L02',
      kind: 'choice',
      prompt: '¿Cuál es el bloque PL/SQL válido más pequeño?',
      options: [
        {
          text: 'BEGIN NULL; END;',
          code: true,
          correct: true,
          feedback: 'Correcto: BEGIN, una sentencia y END;.',
        },
        {
          text: 'DECLARE BEGIN END;',
          code: true,
          correct: false,
          feedback: 'BEGIN necesita al menos una sentencia.',
        },
        {
          text: 'BEGIN END',
          code: true,
          correct: false,
          feedback: 'Falta una sentencia y el punto y coma final.',
        },
      ],
      hints: ['DECLARE y EXCEPTION son opcionales.', 'Entre BEGIN y END debe haber una sentencia.'],
      explanation: 'NULL; es una sentencia que no hace nada: basta para un bloque válido.',
    },
    notes: {
      explain: 'Pide a la clase que vote antes de revelar.',
      transition: 'Ahora, los datos que maneja el bloque: variables.',
    },
  },
  {
    id: 'variables',
    block: 'variables',
    kind: 'lesson',
    title: 'Variables y constantes',
    shortTitle: 'Variables',
    lesson: 'S3-L04',
    notes: {
      explain: 'Cada variable tiene tipo; la asignación es «:=». La constante no puede cambiar.',
      mistake: 'Escribir = para asignar: en PL/SQL «=» compara.',
      transition: '¿Cómo evitar escribir el tipo a mano?',
    },
  },
  {
    id: 'rowtype',
    block: 'variables',
    kind: 'lesson',
    title: '%TYPE y %ROWTYPE',
    shortTitle: '%ROWTYPE',
    lesson: 'S3-L05',
    notes: {
      explain:
        'La variable copia el tipo de la columna o la forma de la fila completa. Si la tabla cambia, el código sigue funcionando.',
      question: '¿Qué pasa si declaro VARCHAR2(3) para el nombre? (ORA-06502.)',
      transition: '¿Dónde existe cada variable?',
    },
  },
  {
    id: 'alcance',
    block: 'variables',
    kind: 'lesson',
    title: 'Alcance de las variables',
    shortTitle: 'Alcance',
    lesson: 'S3-L06',
    notes: {
      explain: 'Lo de afuera se ve adentro; lo de adentro no se ve afuera.',
      transition: 'Con variables listas, traigamos datos de la base.',
    },
  },
  {
    id: 'select-into',
    block: 'sql-en-plsql',
    kind: 'lesson',
    title: 'SELECT INTO: exactamente una fila',
    shortTitle: 'SELECT INTO',
    lesson: 'S3-L07',
    notes: {
      explain:
        'SELECT INTO guarda una fila en variables. Cero filas: NO_DATA_FOUND; varias: TOO_MANY_ROWS.',
      question: '¿Qué pasa con WHERE id_departamento = 20? (Cuatro filas: ORA-01422.)',
      transition: 'También podemos modificar datos.',
    },
  },
  {
    id: 'dml',
    block: 'sql-en-plsql',
    kind: 'lesson',
    title: 'DML dentro del bloque y SQL%ROWCOUNT',
    shortTitle: 'DML',
    lesson: 'S3-L08',
    notes: {
      explain:
        'Compara antes y después: tres bonos cambian y SQL%ROWCOUNT informa 3. El cambio queda pendiente hasta COMMIT.',
      mistake: 'Creer que el bloque confirma solo: ROLLBACK lo deshace.',
      transition: 'Pregunta.',
    },
  },
  {
    id: 'check-select-into',
    block: 'sql-en-plsql',
    kind: 'check',
    title: '¿Una fila, ninguna o varias?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S3-SC-SELECT-INTO',
      lesson: 'S3-L07',
      kind: 'choice',
      prompt: 'SELECT nombre INTO v_nombre FROM empleados WHERE id_departamento = 60; ¿Qué ocurre?',
      options: [
        {
          text: 'NO_DATA_FOUND (ORA-01403)',
          correct: true,
          feedback: 'Correcto: Investigación no tiene personas.',
        },
        {
          text: 'TOO_MANY_ROWS (ORA-01422)',
          correct: false,
          feedback: 'No hay varias filas: no hay ninguna.',
        },
        {
          text: 'v_nombre queda en NULL sin error',
          correct: false,
          feedback: 'SELECT INTO sin filas sí es un error.',
        },
      ],
      hints: [
        '¿Cuántas personas tiene el departamento 60?',
        'SELECT INTO exige exactamente una fila.',
      ],
      explanation: 'Sin filas, SELECT INTO lanza NO_DATA_FOUND.',
    },
    notes: {
      explain: 'Recuerda el caso de Investigación de la Sección 2: un departamento sin personas.',
      transition: 'Ahora, decisiones.',
    },
  },
  {
    id: 'if',
    block: 'condicionales',
    kind: 'lesson',
    title: 'IF, ELSIF, ELSE',
    shortTitle: 'IF',
    lesson: 'S3-L09',
    notes: {
      explain:
        'La primera condición verdadera gana. Con NULL, ninguna es verdadera y se ejecuta ELSE.',
      mistake: 'Poner primero la condición menos exigente: la más exigente nunca se alcanza.',
      transition: 'Con muchas opciones, CASE es más claro.',
    },
  },
  {
    id: 'case',
    block: 'condicionales',
    kind: 'lesson',
    title: 'CASE',
    shortTitle: 'CASE',
    lesson: 'S3-L10',
    notes: {
      explain:
        'CASE simple compara un valor; CASE de búsqueda evalúa condiciones. Sin ELSE y sin coincidencia: ORA-06592.',
      transition: 'Ahora, repetir.',
    },
  },
  {
    id: 'loop',
    block: 'bucles',
    kind: 'lesson',
    title: 'LOOP con EXIT WHEN',
    shortTitle: 'LOOP',
    lesson: 'S3-L11',
    notes: {
      explain:
        'Avanza vuelta a vuelta mirando las variables: el salario crece y el año sube hasta superar la meta.',
      mistake: 'Olvidar EXIT: el bucle no termina.',
      transition: 'Cuando se conoce el número de vueltas, FOR.',
    },
  },
  {
    id: 'for',
    block: 'bucles',
    kind: 'lesson',
    title: 'WHILE y FOR',
    shortTitle: 'FOR',
    lesson: 'S3-L12',
    notes: {
      explain:
        'FOR declara su índice y recorre el rango completo. WHILE pregunta antes de cada vuelta.',
      transition: 'Pregunta trampa.',
    },
  },
  {
    id: 'check-for',
    block: 'bucles',
    kind: 'check',
    title: '¿Cuántas vueltas?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S3-SC-FOR',
      lesson: 'S3-L12',
      kind: 'count',
      prompt: '¿Cuántas líneas escribe este bloque?',
      context: { example: 'S3-P-FOR-VACIO' },
      hints: ['Mira el orden de los límites.', 'Para contar hacia atrás se necesita REVERSE.'],
      explanation: 'Una: el rango 3..1 está vacío y solo se escribe «Fin».',
    },
    notes: {
      explain: 'Muchos responden 3. El rango 3..1 no tiene valores.',
      transition: 'Ahora unimos bucles y consultas: cursores.',
    },
  },
  {
    id: 'modelo-cursor',
    block: 'cursores',
    kind: 'idea',
    title: 'Un cursor recorre una consulta fila por fila',
    shortTitle: 'Modelo',
    lesson: 'S3-L14',
    points: [
      'OPEN ejecuta la consulta y deja el puntero antes de la primera fila.',
      'FETCH trae una fila a las variables y avanza.',
      '%NOTFOUND indica que ya no quedan filas; CLOSE libera el cursor.',
    ],
    code: lines('OPEN c ──▶ FETCH ──▶ FETCH ──▶ … ──▶ %NOTFOUND ──▶ CLOSE'),
    notes: {
      explain: 'SELECT INTO admite una fila; para varias filas se necesita un cursor.',
      transition: 'Veámoslo con TI.',
    },
  },
  {
    id: 'cursor-explicito',
    block: 'cursores',
    kind: 'lesson',
    title: 'OPEN, FETCH, CLOSE',
    shortTitle: 'Cursor',
    lesson: 'S3-L14',
    notes: {
      explain: 'Señala la fila actual en cada paso. %ROWCOUNT numera las filas leídas.',
      mistake: 'Preguntar %NOTFOUND antes del primer FETCH.',
      transition: 'Todo esto, en menos líneas: cursor FOR.',
    },
  },
  {
    id: 'cursor-for',
    block: 'cursores',
    kind: 'lesson',
    title: 'Cursor FOR con parámetros',
    shortTitle: 'Cursor FOR',
    lesson: 'S3-L15',
    notes: {
      explain:
        'El FOR abre, lee y cierra solo. El parámetro permite reutilizar el cursor para otro proyecto.',
      transition: '¿Y si algo sale mal?',
    },
  },
  {
    id: 'excepciones',
    block: 'excepciones',
    kind: 'lesson',
    title: 'Excepciones predefinidas',
    shortTitle: 'Excepciones',
    lesson: 'S3-L16',
    notes: {
      explain:
        'Al ocurrir el error, el control salta a EXCEPTION; el manejador que coincide responde.',
      mistake: 'WHEN OTHERS que solo escribe «error»: se pierde la causa. Muestra SQLERRM.',
      transition: 'También podemos lanzar errores propios.',
    },
  },
  {
    id: 'raise',
    block: 'excepciones',
    kind: 'lesson',
    title: 'RAISE y RAISE_APPLICATION_ERROR',
    shortTitle: 'RAISE',
    lesson: 'S3-L17',
    notes: {
      explain:
        'Una regla del negocio se convierte en error con código propio (-20000 a -20999) y un mensaje claro.',
      transition: 'Pregunta.',
    },
  },
  {
    id: 'check-excepcion',
    block: 'excepciones',
    kind: 'check',
    title: '¿Qué líneas se ejecutan?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S3-SC-EXCEPCION',
      lesson: 'S3-L16',
      kind: 'count',
      prompt: '¿Cuántas líneas escribe este bloque?',
      context: { example: 'S3-P-EXC-SALTO' },
      hints: ['El error interrumpe BEGIN.', 'El manejador escribe su propia línea.'],
      explanation: 'Dos: «Inicio» y «No existe»; «Encontrado» nunca se ejecuta.',
    },
    notes: {
      explain: 'La línea después del error no se ejecuta: el control ya está en EXCEPTION.',
      transition: 'Ahora guardemos el código en la base: procedimientos.',
    },
  },
  {
    id: 'procedimiento',
    block: 'procedimientos',
    kind: 'lesson',
    title: 'Procedimientos',
    shortTitle: 'Procedimiento',
    lesson: 'S3-L18',
    notes: {
      explain:
        'Se crea una vez y se llama muchas: dos aumentos con una línea cada uno. Compara antes y después.',
      mistake: 'Llamarlo dentro de un SELECT: ORA-00904.',
      transition: '¿Cómo entran y salen los datos?',
    },
  },
  {
    id: 'parametros',
    block: 'procedimientos',
    kind: 'lesson',
    title: 'Parámetros IN, OUT e IN OUT',
    shortTitle: 'Parámetros',
    lesson: 'S3-L19',
    notes: {
      explain: 'IN entra, OUT sale, IN OUT entra y sale. Un OUT necesita una variable.',
      transition: 'Si lo que necesito es un valor, uso una función.',
    },
  },
  {
    id: 'funcion',
    block: 'funciones',
    kind: 'lesson',
    title: 'Funciones dentro de SQL',
    shortTitle: 'Función',
    lesson: 'S3-L20',
    example: 'S3-E-FUNCION-EN-SQL',
    notes: {
      explain:
        'La función devuelve un valor con RETURN y por eso puede usarse como una columna calculada.',
      question: '¿Podría usar aumentar_salario así? (No: es un procedimiento.)',
      transition: 'Muchos subprogramas del mismo tema se agrupan en un paquete.',
    },
  },
  {
    id: 'paquete',
    block: 'paquetes',
    kind: 'lesson',
    title: 'Paquetes: especificación y cuerpo',
    shortTitle: 'Paquete',
    lesson: 'S3-L22',
    notes: {
      explain:
        'La especificación es el contrato público; el cuerpo, la implementación. redondear es privada.',
      transition: 'Llegamos al tema central: triggers.',
    },
  },
  {
    id: 'modelo-trigger',
    block: 'triggers',
    kind: 'idea',
    title: 'Evento + momento + nivel = acción automática',
    shortTitle: 'Modelo',
    lesson: 'S3-L23',
    points: [
      'Evento: INSERT, UPDATE o DELETE sobre una tabla.',
      'Momento: BEFORE (antes del cambio) o AFTER (después).',
      'Nivel: una vez por sentencia, o FOR EACH ROW una vez por fila.',
    ],
    code: lines(
      'UPDATE empleados …',
      '   │ dispara',
      '   ▼',
      'TRIGGER  →  acción (auditar, validar, completar)',
    ),
    notes: {
      explain: 'Un trigger no se llama: se dispara. Quien escribe el UPDATE ni siquiera lo ve.',
      transition: 'El trigger más simple.',
    },
  },
  {
    id: 'trigger-sentencia',
    block: 'triggers',
    kind: 'lesson',
    title: 'Un trigger AFTER INSERT',
    shortTitle: 'Trigger',
    lesson: 'S3-L23',
    notes: {
      explain: 'Se crea el trigger; después un INSERT normal lo dispara y aparece su mensaje.',
      transition: '¿Una vez o una vez por fila?',
    },
  },
  {
    id: 'trigger-filas',
    block: 'triggers',
    kind: 'lesson',
    title: 'De sentencia o FOR EACH ROW',
    shortTitle: 'Por fila',
    lesson: 'S3-L24',
    notes: {
      explain:
        'Tres filas cambiadas: el trigger de fila se ejecuta tres veces; el de sentencia, una.',
      question: '¿Y si el UPDATE no cambia ninguna fila?',
      transition: 'Respondamos con datos.',
    },
  },
  {
    id: 'check-trigger',
    block: 'triggers',
    kind: 'check',
    title: '¿Cero filas, cuántas ejecuciones?',
    shortTitle: 'Pregunta',
    activity: {
      id: 'S3-SC-TRIGGER',
      lesson: 'S3-L24',
      kind: 'count',
      prompt:
        'Con los dos triggers, ¿cuántas líneas escribe un UPDATE sobre Investigación, que no tiene personas?',
      context: { example: 'S3-P-TRIGGER-CERO' },
      hints: ['El trigger de fila depende de las filas afectadas.', 'El de sentencia, no.'],
      explanation: 'Una: el trigger de sentencia se ejecuta aunque no cambie ninguna fila.',
    },
    notes: {
      explain: 'El trigger de sentencia se dispara una vez por sentencia, afecte cero o mil filas.',
      transition: 'Ahora el caso real: auditar salarios con :OLD y :NEW.',
    },
  },
  {
    id: 'auditoria',
    block: 'triggers',
    kind: 'lesson',
    title: ':OLD y :NEW: auditoría de salarios',
    shortTitle: 'Auditoría',
    lesson: 'S3-L25',
    notes: {
      explain:
        'Muestra las tres tablas: salarios antes, salarios después y AUDITORIA_SALARIOS con :OLD y :NEW de cada persona.',
      mistake: ':OLD y :NEW en un trigger sin FOR EACH ROW: ORA-04082.',
      transition: 'Un trigger también puede impedir un cambio.',
    },
  },
  {
    id: 'validacion',
    block: 'triggers',
    kind: 'lesson',
    title: 'Validar con BEFORE',
    shortTitle: 'Validación',
    lesson: 'S3-L26',
    notes: {
      explain: 'El aumento del 30 % se rechaza con ORA-20010 y el salario de Valentina no cambia.',
      transition: 'Los triggers tienen límites.',
    },
  },
  {
    id: 'limites',
    block: 'triggers',
    kind: 'lesson',
    title: 'Cuándo no usar un trigger',
    shortTitle: 'Límites',
    lesson: 'S3-L27',
    notes: {
      explain:
        'Tabla mutante (ORA-04091) y COMMIT prohibido (ORA-04092). Regla práctica: triggers para auditar e integridad; procesos en procedimientos.',
      mistake: 'Esconder lógica de negocio en triggers que nadie ve.',
      transition: 'Juntemos todo en un caso.',
    },
  },
  {
    id: 'integrador',
    block: 'integracion',
    kind: 'lesson',
    title: 'Caso integrador: aumento con auditoría',
    shortTitle: 'Integración',
    lesson: 'S3-L28',
    notes: {
      explain:
        'Señala cada pieza: parámetros, validación, cursor FOR, variable, UPDATE, contador OUT y el trigger que audita cada fila.',
      question: '¿Qué pasa con un 30 %? (ORA-20020 y ningún cambio.)',
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
      'Un bloque organiza variables, SQL, decisiones, bucles y errores.',
      'Los cursores recorren filas; las excepciones mantienen el control.',
      'Procedimientos, funciones y paquetes guardan la lógica; los triggers reaccionan a los cambios.',
    ],
    notes: {
      explain: 'Invita a practicar y a hacer el Challenge de la sección.',
    },
  },
];
