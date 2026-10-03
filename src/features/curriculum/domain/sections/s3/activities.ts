import { lines, plsql, query, source } from '../../builders';
import type { Activity, CurriculumExample, Mission } from '../../types';
import {
  APLICAR_AUMENTOS,
  AUDITORIA,
  TRIGGER_AUDITORIA,
  TRIGGER_FILA,
  TRIGGER_SENTENCIA,
} from './triggers';

/**
 * Sección 3: prácticas guiadas (Practicar) y misiones (Challenge). Las preguntas «¿cuántas
 * líneas escribe?» se responden con la salida de DBMS_OUTPUT obtenida en Oracle; las de
 * «¿qué filas recorre el cursor?», con resultados de consultas verificadas.
 */

const OPS_KEY = ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO', 'ESTADO'] as const;

export const ACTIVITY_EXAMPLES: readonly CurriculumExample[] = [
  plsql(
    'S3-P-NULL-SUMA',
    lines(
      'DECLARE',
      '  v_total NUMBER;',
      'BEGIN',
      '  v_total := v_total + 10;',
      "  DBMS_OUTPUT.PUT_LINE('Total: ' || v_total);",
      'END;',
    ),
  ),
  plsql(
    'S3-P-DELETE-ROWCOUNT',
    lines(
      'BEGIN',
      '  DELETE FROM asignaciones',
      '  WHERE horas_semanales < 15;',
      "  DBMS_OUTPUT.PUT_LINE('Asignaciones borradas: ' || SQL%ROWCOUNT);",
      'END;',
    ),
    { after: ['SELECT COUNT(*) AS asignaciones FROM asignaciones'] },
  ),
  plsql(
    'S3-P-IF-ORDEN',
    lines(
      'DECLARE',
      '  v_salario empleados.salario%TYPE;',
      'BEGIN',
      '  SELECT salario INTO v_salario',
      '  FROM empleados',
      '  WHERE id_empleado = 2;',
      '  IF v_salario >= 4000000 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Nivel Medio');",
      '  ELSIF v_salario >= 6000000 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Nivel Alto');",
      '  ELSE',
      "    DBMS_OUTPUT.PUT_LINE('Nivel Inicial');",
      '  END IF;',
      'END;',
    ),
  ),
  plsql(
    'S3-P-WHILE-CERO',
    lines(
      'DECLARE',
      '  v_saldo NUMBER := 5000000;',
      '  v_meses NUMBER := 0;',
      'BEGIN',
      '  WHILE v_saldo > 6000000 LOOP',
      '    v_saldo := v_saldo - 1000000;',
      '    v_meses := v_meses + 1;',
      "    DBMS_OUTPUT.PUT_LINE('Mes ' || v_meses);",
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Meses: ' || v_meses);",
      'END;',
    ),
  ),
  plsql(
    'S3-P-FOR-VACIO',
    lines(
      'BEGIN',
      '  FOR i IN 3..1 LOOP',
      "    DBMS_OUTPUT.PUT_LINE('Vuelta ' || i);",
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Fin');",
      'END;',
    ),
  ),
  plsql(
    'S3-P-CURSOR-VENTAS',
    lines(
      'BEGIN',
      '  FOR fila IN (SELECT nombre, bono',
      '               FROM empleados',
      '               WHERE id_departamento = 30',
      '                 AND bono > 0',
      '               ORDER BY id_empleado) LOOP',
      "    DBMS_OUTPUT.PUT_LINE(fila.nombre || ': ' || fila.bono);",
      '  END LOOP;',
      'END;',
    ),
  ),
  plsql(
    'S3-P-EXC-SALTO',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Inicio');",
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      '  WHERE id_empleado = 99;',
      "  DBMS_OUTPUT.PUT_LINE('Encontrado: ' || v_nombre);",
      'EXCEPTION',
      '  WHEN NO_DATA_FOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('No existe');",
      'END;',
    ),
  ),
  plsql(
    'S3-P-TRIGGER-CERO',
    lines('UPDATE empleados', 'SET salario = salario + 100000', 'WHERE id_departamento = 60;'),
    { setup: [TRIGGER_SENTENCIA, TRIGGER_FILA] },
  ),
  plsql(
    'S3-P-INTEGRADOR-VENTAS',
    lines(
      'DECLARE',
      '  v_total NUMBER;',
      'BEGIN',
      '  aplicar_aumentos(30, 10, v_total);',
      "  DBMS_OUTPUT.PUT_LINE('Personas actualizadas: ' || v_total);",
      'END;',
    ),
    { setup: [TRIGGER_AUDITORIA, APLICAR_AUMENTOS], after: [AUDITORIA] },
  ),
  query(
    'S3-P-CURSOR-OPS',
    lines(
      'SELECT id_empleado, nombre, salario',
      'FROM empleados',
      'WHERE id_departamento = 10',
      "  AND estado = 'ACTIVO'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', OPS_KEY, [1, 18, 19])],
  ),
  query(
    'S3-P-CURSOR-OPS-TODOS',
    lines(
      'SELECT id_empleado, nombre, salario',
      'FROM empleados',
      'WHERE id_departamento = 10',
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', OPS_KEY, [1, 18, 19])],
  ),
  query(
    'S3-P-CURSOR-OPS-INACTIVOS',
    lines(
      'SELECT id_empleado, nombre, salario',
      'FROM empleados',
      'WHERE id_departamento = 10',
      "  AND estado = 'INACTIVO'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', OPS_KEY, [1, 18, 19])],
  ),
];

export const S3_PRACTICE: readonly Activity[] = [
  /* ---------- Bloques ---------- */
  {
    id: 'S3-P01',
    lesson: 'S3-L01',
    kind: 'choice',
    prompt: '¿Qué tarea necesita PL/SQL y no se resuelve con una sola consulta SQL?',
    options: [
      {
        text: 'Recorrer a las personas de un área, aplicar un aumento distinto según su salario y avisar si alguna no existe.',
        correct: true,
        feedback: 'Correcto: hay pasos, decisiones y manejo de errores.',
      },
      {
        text: 'Listar las personas de TI ordenadas por salario.',
        correct: false,
        feedback: 'Es un SELECT con WHERE y ORDER BY.',
      },
      {
        text: 'Contar cuántas personas están activas.',
        correct: false,
        feedback: 'COUNT(*) con WHERE lo resuelve en una consulta.',
      },
      {
        text: 'Mostrar cada persona con el nombre de su departamento.',
        correct: false,
        feedback: 'Es un JOIN de la Sección 2.',
      },
    ],
    hints: [
      'SQL responde una pregunta sobre datos de una vez.',
      'Busca la tarea con pasos y decisiones.',
    ],
    explanation:
      'PL/SQL añade variables, condiciones, bucles y manejo de errores alrededor de las sentencias SQL.',
  },
  {
    id: 'S3-P02',
    lesson: 'S3-L02',
    kind: 'order',
    prompt: 'Ordena el bloque que busca al empleado 99 y avisa si no existe.',
    pieces: [
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre FROM empleados WHERE id_empleado = 99;',
      'EXCEPTION',
      "  WHEN NO_DATA_FOUND THEN DBMS_OUTPUT.PUT_LINE('No existe');",
      'END;',
    ],
    hints: ['Las declaraciones van antes de las acciones.', 'DECLARE → BEGIN → EXCEPTION → END;'],
    explanation:
      'La variable se declara en DECLARE, la consulta va en BEGIN y el manejador del error en EXCEPTION.',
  },
  {
    id: 'S3-P03',
    lesson: 'S3-L03',
    kind: 'choice',
    prompt: '¿Qué parte de un bloque PL/SQL es obligatoria?',
    options: [
      {
        text: 'BEGIN … END; con al menos una sentencia',
        correct: true,
        feedback: 'Correcto: DECLARE y EXCEPTION son opcionales.',
      },
      {
        text: 'DECLARE',
        code: true,
        correct: false,
        feedback: 'Solo hace falta si declaras algo.',
      },
      {
        text: 'EXCEPTION',
        code: true,
        correct: false,
        feedback: 'Es opcional: sin ella el error sale del bloque.',
      },
      {
        text: 'Una llamada a DBMS_OUTPUT.PUT_LINE',
        correct: false,
        feedback: 'Es útil para ver mensajes, pero no es parte de la estructura.',
      },
    ],
    hints: ['Recuerda el bloque «Hola desde PL/SQL».', 'Ese bloque no tenía DECLARE.'],
    explanation: 'El bloque mínimo es BEGIN, una sentencia y END;.',
  },

  /* ---------- Variables ---------- */
  {
    id: 'S3-P04',
    lesson: 'S3-L04',
    kind: 'choice',
    prompt: '¿Qué escribe este bloque?',
    context: { example: 'S3-P-NULL-SUMA' },
    options: [
      {
        text: 'Total: ',
        code: true,
        correct: true,
        feedback: 'Correcto: NULL + 10 es NULL y se concatena como vacío.',
      },
      {
        text: 'Total: 10',
        code: true,
        correct: false,
        feedback: 'v_total empieza en NULL, no en 0.',
      },
      {
        text: 'Total: 0',
        code: true,
        correct: false,
        feedback: 'Una variable sin valor inicial es NULL.',
      },
      {
        text: 'Un error por variable sin valor',
        correct: false,
        feedback: 'Oracle no falla: opera con NULL y el resultado es NULL.',
      },
    ],
    hints: [
      '¿Con qué valor empieza una variable sin «:=»?',
      'Cualquier operación aritmética con NULL da NULL.',
    ],
    explanation:
      'v_total empieza en NULL; NULL + 10 es NULL y al concatenarlo no añade nada. Inicializa con := 0.',
  },
  {
    id: 'S3-P05',
    lesson: 'S3-L05',
    kind: 'choice',
    prompt: '¿Por qué declarar v_nombre empleados.nombre%TYPE en lugar de VARCHAR2(10)?',
    options: [
      {
        text: 'La variable toma el tipo y el tamaño de la columna, aunque la columna cambie.',
        correct: true,
        feedback: 'Correcto: el código no queda desalineado con la tabla.',
      },
      {
        text: 'Porque %TYPE llena la variable con el nombre automáticamente.',
        correct: false,
        feedback: '%TYPE solo define el tipo; el valor se asigna con SELECT INTO o :=.',
      },
      {
        text: 'Porque VARCHAR2 no existe en PL/SQL.',
        correct: false,
        feedback: 'Sí existe; el problema es fijar un tamaño a mano.',
      },
      {
        text: 'Porque %TYPE hace que la variable sea constante.',
        correct: false,
        feedback: 'Eso lo hace CONSTANT.',
      },
    ],
    hints: ['Piensa en «Valentina» dentro de VARCHAR2(3).', 'NOMBRE es VARCHAR2(40 CHAR).'],
    explanation: '%TYPE ancla la variable a la columna: evita ORA-06502 por tamaños distintos.',
  },

  /* ---------- SQL en PL/SQL ---------- */
  {
    id: 'S3-P06',
    lesson: 'S3-L07',
    kind: 'multi',
    prompt: '¿Cuáles de estos SELECT INTO lanzan una excepción?',
    options: [
      {
        text: 'SELECT nombre INTO v FROM empleados WHERE id_departamento = 50;',
        code: true,
        correct: true,
        feedback: 'Tres personas: TOO_MANY_ROWS (ORA-01422).',
      },
      {
        text: 'SELECT nombre INTO v FROM empleados WHERE id_departamento = 60;',
        code: true,
        correct: true,
        feedback: 'Investigación no tiene personas: NO_DATA_FOUND (ORA-01403).',
      },
      {
        text: 'SELECT nombre INTO v FROM empleados WHERE id_empleado = 6;',
        code: true,
        correct: false,
        feedback: 'Exactamente una fila: funciona.',
      },
      {
        text: 'SELECT COUNT(*) INTO v FROM empleados WHERE id_departamento = 60;',
        code: true,
        correct: false,
        feedback: 'COUNT(*) siempre devuelve una fila (aquí con 0).',
      },
    ],
    hints: [
      'SELECT INTO necesita exactamente una fila.',
      'Una función de grupo sin GROUP BY devuelve una fila aunque no haya datos.',
    ],
    explanation:
      'Con varias filas, TOO_MANY_ROWS; con ninguna, NO_DATA_FOUND. COUNT(*) devuelve una fila con 0.',
  },
  {
    id: 'S3-P07',
    lesson: 'S3-L08',
    kind: 'choice',
    prompt: '¿Qué número escribe el bloque?',
    context: { example: 'S3-P-DELETE-ROWCOUNT' },
    options: [
      {
        text: '5',
        code: true,
        correct: true,
        feedback: 'Correcto: cinco asignaciones tienen menos de 15 horas.',
      },
      { text: '6', code: true, correct: false, feedback: 'Las de 15 horas no cumplen «< 15».' },
      {
        text: '17',
        code: true,
        correct: false,
        feedback: 'Ese es el total de asignaciones, no las borradas.',
      },
      {
        text: '1',
        code: true,
        correct: false,
        feedback: 'SQL%ROWCOUNT cuenta todas las filas afectadas por el DELETE.',
      },
    ],
    hints: [
      'SQL%ROWCOUNT cuenta las filas que afectó la última sentencia.',
      'Busca horas 5 y 10 en ASIGNACIONES.',
    ],
    explanation:
      'Hay cinco asignaciones con 5 o 10 horas; SQL%ROWCOUNT informa 5 y quedan 12 filas.',
  },

  /* ---------- Control ---------- */
  {
    id: 'S3-P08',
    lesson: 'S3-L09',
    kind: 'choice',
    prompt: 'Carlos gana 7.500.000. ¿Qué escribe este bloque?',
    context: { example: 'S3-P-IF-ORDEN' },
    options: [
      {
        text: 'Nivel Medio',
        code: true,
        correct: true,
        feedback: 'Correcto: la primera condición verdadera gana.',
      },
      {
        text: 'Nivel Alto',
        code: true,
        correct: false,
        feedback: 'Nunca se evalúa: la primera condición ya fue TRUE.',
      },
      { text: 'Nivel Alto y Nivel Medio', correct: false, feedback: 'IF ejecuta una sola rama.' },
      {
        text: 'Nivel Inicial',
        code: true,
        correct: false,
        feedback: 'ELSE solo corre si ninguna condición es TRUE.',
      },
    ],
    hints: ['IF se detiene en la primera condición verdadera.', '¿7.500.000 >= 4.000.000?'],
    explanation:
      'El orden importa: la condición más exigente (>= 6.000.000) debe ir primero, o nunca se alcanza.',
  },
  {
    id: 'S3-P09',
    lesson: 'S3-L10',
    kind: 'choice',
    prompt: 'El bloque de Ricardo termina con ORA-06592. ¿Qué cambio lo corrige?',
    context: { example: 'S3-E-CASE-NOT-FOUND' },
    options: [
      {
        text: "Añadir ELSE DBMS_OUTPUT.PUT_LINE('Carga normal');",
        code: true,
        correct: true,
        feedback: 'Correcto: siempre habrá una rama que ejecutar.',
      },
      {
        text: 'Usar NVL(SUM(horas_semanales), 0)',
        code: true,
        correct: false,
        feedback: '0 tampoco cumple ninguna condición: sigue sin rama.',
      },
      {
        text: 'Añadir EXCEPTION WHEN NO_DATA_FOUND',
        code: true,
        correct: false,
        feedback: 'SUM devuelve una fila (con NULL): el error es CASE_NOT_FOUND.',
      },
      {
        text: 'Cambiar >= 30 por > 30',
        code: true,
        correct: false,
        feedback: 'NULL sigue sin cumplir ninguna condición.',
      },
    ],
    hints: [
      '¿Qué valor tiene v_horas para Ricardo?',
      'Busca la opción que garantiza una rama para cualquier valor.',
    ],
    explanation:
      'La sentencia CASE necesita una rama para todo valor posible: ELSE cubre NULL y cualquier caso no previsto.',
  },
  {
    id: 'S3-P10',
    lesson: 'S3-L12',
    kind: 'count',
    prompt: '¿Cuántas líneas escribe este bloque?',
    context: { example: 'S3-P-WHILE-CERO' },
    hints: ['WHILE pregunta antes de cada vuelta.', '¿5.000.000 > 6.000.000?'],
    explanation:
      'Una: la condición es falsa desde el principio, el bucle no da vueltas y solo se escribe «Meses: 0».',
  },
  {
    id: 'S3-P11',
    lesson: 'S3-L12',
    kind: 'count',
    prompt: '¿Cuántas líneas escribe este bloque?',
    context: { example: 'S3-P-FOR-VACIO' },
    hints: ['El rango va de 3 a 1.', 'Para contar hacia atrás se necesita REVERSE.'],
    explanation: 'Una: el rango 3..1 está vacío, el FOR no da vueltas y solo se escribe «Fin».',
  },

  /* ---------- Cursores ---------- */
  {
    id: 'S3-P12',
    lesson: 'S3-L13',
    kind: 'choice',
    prompt: 'Un UPDATE … WHERE id_empleado = 99 no encuentra filas. ¿Qué ocurre?',
    options: [
      {
        text: 'No hay error: SQL%ROWCOUNT vale 0 y SQL%NOTFOUND es TRUE.',
        correct: true,
        feedback: 'Correcto: un DML sin filas no es un error.',
      },
      {
        text: 'Oracle lanza NO_DATA_FOUND.',
        correct: false,
        feedback: 'Eso solo ocurre con SELECT INTO.',
      },
      {
        text: 'SQL%ROWCOUNT vale NULL.',
        correct: false,
        feedback: 'Después de la sentencia vale 0.',
      },
      {
        text: 'Oracle deshace la transacción.',
        correct: false,
        feedback: 'No pasa nada con los cambios anteriores.',
      },
    ],
    hints: ['Recuerda el ejemplo del ID 99 en el cursor implícito.', '¿Quién lanza NO_DATA_FOUND?'],
    explanation:
      'Para saber si un UPDATE o DELETE cambió algo, se consulta SQL%ROWCOUNT o SQL%NOTFOUND.',
  },
  {
    id: 'S3-P13',
    lesson: 'S3-L14',
    kind: 'order',
    prompt: 'Ordena el recorrido de un cursor explícito.',
    pieces: [
      'OPEN c_personas;',
      'LOOP',
      '  FETCH c_personas INTO v_nombre, v_salario;',
      '  EXIT WHEN c_personas%NOTFOUND;',
      "  DBMS_OUTPUT.PUT_LINE(v_nombre || ': ' || v_salario);",
      'END LOOP;',
      'CLOSE c_personas;',
    ],
    hints: [
      'Primero se abre y al final se cierra.',
      'Se lee (FETCH) antes de preguntar %NOTFOUND.',
    ],
    explanation:
      'OPEN ejecuta la consulta; FETCH trae una fila; EXIT WHEN %NOTFOUND sale cuando ya no hay más; CLOSE libera el cursor.',
  },
  {
    id: 'S3-P14',
    lesson: 'S3-L14',
    kind: 'result',
    prompt:
      "El cursor c_personas se declara con esta consulta (departamento 10, estado 'ACTIVO'). ¿Qué filas recorrerá?",
    context: { example: 'S3-P-CURSOR-OPS' },
    distractors: [
      {
        example: 'S3-P-CURSOR-OPS-TODOS',
        feedback: 'Incluye a Alicia: falta aplicar el filtro de estado.',
      },
      {
        example: 'S3-P-CURSOR-OPS-INACTIVOS',
        feedback: 'Es la condición contraria: solo inactivos.',
      },
    ],
    hints: ['El cursor recorre exactamente las filas de su consulta.', 'Alicia está INACTIVO.'],
    explanation: 'Ana y Felipe: Operaciones tiene tres personas, pero Alicia está inactiva.',
  },
  {
    id: 'S3-P15',
    lesson: 'S3-L15',
    kind: 'count',
    prompt: '¿Cuántas líneas escribe el cursor FOR?',
    context: { example: 'S3-P-CURSOR-VENTAS' },
    hints: ['Ventas tiene cinco personas.', 'Mario tiene bono 0 y Ricardo bono NULL.'],
    explanation: 'Tres: María, Sofía y Valentina. 0 no es mayor que 0 y NULL > 0 no es verdadero.',
  },

  /* ---------- Excepciones ---------- */
  {
    id: 'S3-P16',
    lesson: 'S3-L16',
    kind: 'count',
    prompt: '¿Cuántas líneas escribe este bloque?',
    context: { example: 'S3-P-EXC-SALTO' },
    hints: [
      'Cuando ocurre el error, el control salta a EXCEPTION.',
      '¿Se ejecuta la línea «Encontrado»?',
    ],
    explanation:
      'Dos: «Inicio» y «No existe». Tras NO_DATA_FOUND, el resto de BEGIN no se ejecuta.',
  },
  {
    id: 'S3-P17',
    lesson: 'S3-L17',
    kind: 'multi',
    prompt: '¿Cuáles de estas sentencias son válidas para lanzar un error?',
    options: [
      {
        text: "RAISE_APPLICATION_ERROR(-20005, 'Horas fuera de rango');",
        code: true,
        correct: true,
        feedback: 'Código dentro del rango -20000…-20999.',
      },
      {
        text: 'RAISE e_sin_horas;  -- declarada como EXCEPTION',
        code: true,
        correct: true,
        feedback: 'Lanza una excepción propia declarada.',
      },
      {
        text: "RAISE_APPLICATION_ERROR(-1476, 'División');",
        code: true,
        correct: false,
        feedback: 'El número debe estar entre -20000 y -20999.',
      },
      {
        text: "RAISE 'Horas fuera de rango';",
        code: true,
        correct: false,
        feedback: 'RAISE recibe el nombre de una excepción, no un texto.',
      },
    ],
    hints: [
      'RAISE necesita una excepción con nombre.',
      'Los errores propios usan -20000 a -20999.',
    ],
    explanation:
      'RAISE lanza una excepción declarada; RAISE_APPLICATION_ERROR, un error propio con código válido y mensaje.',
  },

  /* ---------- Subprogramas ---------- */
  {
    id: 'S3-P18',
    lesson: 'S3-L19',
    kind: 'choice',
    prompt: 'resumen_departamento(p_id IN, p_total OUT, p_promedio OUT). ¿Qué llamada es válida?',
    options: [
      {
        text: 'resumen_departamento(40, v_total, v_promedio);',
        code: true,
        correct: true,
        feedback: 'Correcto: el IN admite un literal; los OUT, variables.',
      },
      {
        text: 'resumen_departamento(40, 0, 0);',
        code: true,
        correct: false,
        feedback: 'Un OUT necesita una variable donde escribir (PLS-00363).',
      },
      {
        text: 'v_total := resumen_departamento(40);',
        code: true,
        correct: false,
        feedback: 'Es un procedimiento: no devuelve un valor con RETURN.',
      },
      {
        text: 'SELECT resumen_departamento(40) FROM dual;',
        code: true,
        correct: false,
        feedback: 'Un procedimiento no se usa dentro de SQL.',
      },
    ],
    hints: ['¿Qué puede recibir un parámetro OUT?', 'Un procedimiento se llama como sentencia.'],
    explanation:
      'Los parámetros OUT reciben variables; el procedimiento se llama como una sentencia.',
  },
  {
    id: 'S3-P19',
    lesson: 'S3-L21',
    kind: 'choice',
    prompt: 'Necesitas calcular el salario anual y usarlo en un SELECT. ¿Qué creas?',
    options: [
      {
        text: 'Una función que devuelva el valor con RETURN.',
        correct: true,
        feedback: 'Correcto: una función puede usarse dentro de SQL.',
      },
      {
        text: 'Un procedimiento con un parámetro OUT.',
        correct: false,
        feedback: 'Funciona en PL/SQL, pero no puede aparecer en un SELECT.',
      },
      {
        text: 'Un trigger AFTER SELECT.',
        correct: false,
        feedback: 'No existen triggers sobre SELECT.',
      },
      {
        text: 'Un bloque anónimo.',
        correct: false,
        feedback: 'No queda guardado ni puede llamarse desde SQL.',
      },
    ],
    hints: [
      '¿Qué subprograma devuelve un valor?',
      'Recuerda salario_anual en la consulta de Recursos Humanos.',
    ],
    explanation: 'Cálculo que devuelve un valor → función; acción → procedimiento.',
  },
  {
    id: 'S3-P20',
    lesson: 'S3-L22',
    kind: 'multi',
    prompt: 'En rrhh_pkg, ¿qué se puede usar desde fuera del paquete?',
    options: [
      {
        text: 'rrhh_pkg.salario_anual',
        code: true,
        correct: true,
        feedback: 'Está en la especificación.',
      },
      {
        text: 'rrhh_pkg.aumentar',
        code: true,
        correct: true,
        feedback: 'Está en la especificación.',
      },
      {
        text: 'rrhh_pkg.c_tope_aumento',
        code: true,
        correct: true,
        feedback: 'Es una constante pública de la especificación.',
      },
      {
        text: 'rrhh_pkg.redondear',
        code: true,
        correct: false,
        feedback: 'Solo existe en el cuerpo: PLS-00302 desde fuera.',
      },
    ],
    hints: ['La especificación es la parte pública.', 'redondear solo aparece en el cuerpo.'],
    explanation:
      'Lo declarado en la especificación es público; lo que solo está en el cuerpo es privado.',
  },

  /* ---------- Triggers ---------- */
  {
    id: 'S3-P21',
    lesson: 'S3-L24',
    kind: 'count',
    prompt:
      'Con los dos triggers (de sentencia y de fila), ¿cuántas líneas escribe un UPDATE sobre Investigación, que no tiene personas?',
    context: { example: 'S3-P-TRIGGER-CERO' },
    hints: ['El UPDATE no afecta ninguna fila.', 'El trigger de sentencia se ejecuta igual.'],
    explanation:
      'Una: el trigger de fila no se ejecuta (cero filas) y el de sentencia se ejecuta una vez.',
  },
  {
    id: 'S3-P22',
    lesson: 'S3-L25',
    kind: 'choice',
    prompt: 'En un trigger AFTER INSERT FOR EACH ROW sobre EMPLEADOS, ¿qué vale :OLD.salario?',
    options: [
      {
        text: 'NULL',
        code: true,
        correct: true,
        feedback: 'Correcto: antes de insertar no había fila.',
      },
      { text: 'El salario insertado', correct: false, feedback: 'Ese valor está en :NEW.salario.' },
      { text: '0', code: true, correct: false, feedback: 'No hay valor por defecto: es NULL.' },
      {
        text: 'Error ORA-04082',
        correct: false,
        feedback: 'Ese error es para triggers sin FOR EACH ROW.',
      },
    ],
    hints: ['¿Existía la fila antes del INSERT?', 'Mira la auditoría del INSERT de Nora.'],
    explanation: 'En INSERT, :OLD es NULL; en DELETE, :NEW es NULL; en UPDATE ambos tienen valor.',
  },
  {
    id: 'S3-P23',
    lesson: 'S3-L26',
    kind: 'choice',
    prompt:
      'trg_validar_aumento rechaza aumentos de más del 20 %. Un UPDATE sube 10 % a Valentina y 30 % a Mario en la misma sentencia. ¿Qué queda?',
    options: [
      {
        text: 'Ningún cambio: la sentencia falla completa.',
        correct: true,
        feedback: 'Correcto: si el trigger falla en una fila, la sentencia se deshace entera.',
      },
      {
        text: 'Solo el aumento de Valentina.',
        correct: false,
        feedback: 'Una sentencia no queda a medias.',
      },
      {
        text: 'Los dos aumentos y un aviso.',
        correct: false,
        feedback: 'RAISE_APPLICATION_ERROR detiene la sentencia.',
      },
      {
        text: 'Solo el aumento de Mario.',
        correct: false,
        feedback: 'Es justamente el que viola la regla.',
      },
    ],
    hints: ['El trigger se ejecuta por cada fila.', '¿Una sentencia SQL puede quedar a medias?'],
    explanation:
      'El error del trigger es el error de la sentencia: Oracle deshace todas sus filas.',
  },
  {
    id: 'S3-P24',
    lesson: 'S3-L27',
    kind: 'multi',
    prompt: '¿Qué hace fallar a un trigger de fila sobre EMPLEADOS?',
    options: [
      {
        text: 'Consultar AVG(salario) de EMPLEADOS dentro del trigger.',
        correct: true,
        feedback: 'Tabla mutante: ORA-04091.',
      },
      { text: 'Ejecutar COMMIT dentro del trigger.', correct: true, feedback: 'ORA-04092.' },
      {
        text: 'Insertar en AUDITORIA_SALARIOS.',
        correct: false,
        feedback: 'Es otra tabla: es el uso típico de auditoría.',
      },
      {
        text: 'Asignar :NEW.nombre en un trigger BEFORE INSERT.',
        correct: false,
        feedback: 'Está permitido: así se normalizan datos.',
      },
    ],
    hints: [
      'La tabla que se está modificando no puede leerse desde su trigger de fila.',
      'El trigger no controla la transacción.',
    ],
    explanation:
      'Leer la tabla mutante y hacer COMMIT están prohibidos; escribir en otra tabla y corregir :NEW en BEFORE, no.',
  },
  {
    id: 'S3-P25',
    lesson: 'S3-L28',
    kind: 'order',
    prompt: 'Ordena los pasos de aplicar_aumentos.',
    pieces: [
      'Validar el porcentaje (RAISE si no está entre 1 y 15)',
      'p_actualizados := 0',
      'Recorrer con el cursor FOR a las personas activas del departamento',
      'Calcular v_nuevo y ejecutar el UPDATE de la fila',
      'El trigger guarda :OLD y :NEW en AUDITORIA_SALARIOS',
      'Sumar 1 a p_actualizados y escribir el cambio',
    ],
    hints: ['La validación va antes de modificar nada.', 'El trigger se dispara con cada UPDATE.'],
    explanation:
      'Validar, inicializar, recorrer, actualizar (el trigger audita en ese momento) y contar.',
  },
  {
    id: 'S3-P26',
    lesson: 'S3-L06',
    kind: 'choice',
    prompt: 'Un bloque anidado declara v_interno. ¿Dónde se puede usar?',
    options: [
      {
        text: 'Solo dentro del bloque anidado.',
        correct: true,
        feedback: 'Correcto: fuera de él no existe (PLS-00201).',
      },
      {
        text: 'En todo el bloque externo.',
        correct: false,
        feedback: 'Lo de adentro no se ve afuera.',
      },
      {
        text: 'En toda la sesión.',
        correct: false,
        feedback: 'Las variables de un bloque desaparecen al terminar.',
      },
      {
        text: 'En cualquier procedimiento.',
        correct: false,
        feedback: 'Cada bloque tiene su propio alcance.',
      },
    ],
    hints: ['Lo de afuera se ve adentro.', '¿Y al revés?'],
    explanation: 'Una variable existe en su bloque y en los bloques que contiene, no fuera.',
  },
];

export const S3_MISSIONS: readonly Mission[] = [
  {
    id: 'S3-M01',
    title: 'Primer bloque',
    skill: 'Reconocer la estructura de un bloque PL/SQL',
    scenario:
      'Recursos Humanos te pide un pequeño programa que avise si alguien no existe. Antes de escribirlo, arma su estructura.',
    steps: [
      {
        id: 'S3-M01-1',
        lesson: 'S3-L02',
        kind: 'order',
        prompt: 'Ordena las secciones de un bloque completo.',
        pieces: ['DECLARE', 'BEGIN', 'EXCEPTION', 'END;'],
        hints: ['Lo que se declara va primero.', 'Los errores se manejan al final, antes de END.'],
        explanation: 'DECLARE → BEGIN → EXCEPTION → END;',
      },
      {
        id: 'S3-M01-2',
        lesson: 'S3-L02',
        kind: 'choice',
        prompt:
          'Al bloque le falta el punto y coma al final de una sentencia. ¿Qué responde Oracle?',
        options: [
          {
            text: 'PLS-00103 al compilar',
            correct: true,
            feedback: 'Correcto: error de sintaxis.',
          },
          {
            text: 'Ejecuta igual',
            correct: false,
            feedback: 'El punto y coma es obligatorio en PL/SQL.',
          },
          {
            text: 'ORA-01403',
            code: true,
            correct: false,
            feedback: 'Ese es NO_DATA_FOUND, de ejecución.',
          },
        ],
        hints: ['Es un error de escritura, no de datos.', 'Lo detecta el compilador.'],
        explanation: 'Oracle encuentra un símbolo inesperado y responde PLS-00103.',
      },
    ],
  },
  {
    id: 'S3-M02',
    title: 'Variables con ancla',
    skill: 'Declarar variables, constantes y tipos anclados',
    scenario: 'Vas a calcular aumentos: necesitas variables seguras frente a cambios en la tabla.',
    steps: [
      {
        id: 'S3-M02-1',
        lesson: 'S3-L04',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe este bloque?',
        context: { example: 'S3-E-VARIABLES' },
        hints: ['Cuenta los PUT_LINE que se ejecutan.', 'El IF se cumple: v_activo es TRUE.'],
        explanation: 'Tres: el aumento, la fecha y el estado.',
      },
      {
        id: 'S3-M02-2',
        lesson: 'S3-L05',
        kind: 'choice',
        prompt: '¿Qué declaración guarda una fila completa de EMPLEADOS?',
        options: [
          { text: 'v_fila empleados%ROWTYPE;', code: true, correct: true, feedback: 'Correcto.' },
          {
            text: 'v_fila empleados%TYPE;',
            code: true,
            correct: false,
            feedback: '%TYPE es para una columna o variable.',
          },
          {
            text: 'v_fila empleados.*;',
            code: true,
            correct: false,
            feedback: 'No es una declaración válida.',
          },
        ],
        hints: ['Una fila tiene varias columnas.', 'ROW = fila.'],
        explanation: '%ROWTYPE crea un registro con un campo por columna.',
      },
    ],
  },
  {
    id: 'S3-M03',
    title: 'Leer una fila',
    skill: 'Usar SELECT INTO y DML dentro de un bloque',
    scenario: 'Necesitas leer datos de una persona y actualizar un área sin errores inesperados.',
    steps: [
      {
        id: 'S3-M03-1',
        lesson: 'S3-L07',
        kind: 'choice',
        prompt:
          'SELECT salario INTO v_salario FROM empleados WHERE id_departamento = 20; ¿Qué ocurre?',
        options: [
          {
            text: 'ORA-01422 (TOO_MANY_ROWS)',
            correct: true,
            feedback: 'Correcto: TI tiene cuatro personas.',
          },
          {
            text: 'Guarda el primer salario',
            correct: false,
            feedback: 'SELECT INTO no elige una fila por ti.',
          },
          {
            text: 'ORA-01403 (NO_DATA_FOUND)',
            correct: false,
            feedback: 'Sí hay filas: demasiadas.',
          },
        ],
        hints: ['¿Cuántas personas hay en TI?', 'SELECT INTO admite exactamente una fila.'],
        explanation: 'Con varias filas, Oracle lanza TOO_MANY_ROWS.',
      },
      {
        id: 'S3-M03-2',
        lesson: 'S3-L08',
        kind: 'choice',
        prompt: 'El bloque borró asignaciones y después ejecutó ROLLBACK. ¿Qué queda en la tabla?',
        options: [
          {
            text: 'Las filas originales',
            correct: true,
            feedback: 'Correcto: ROLLBACK deshace lo no confirmado.',
          },
          {
            text: 'Nada: se borraron',
            correct: false,
            feedback: 'El borrado no estaba confirmado.',
          },
          {
            text: 'Solo la primera fila borrada',
            correct: false,
            feedback: 'ROLLBACK deshace todo lo pendiente.',
          },
        ],
        hints: ['Sin COMMIT, el cambio está pendiente.', 'ROLLBACK lo deshace.'],
        explanation: 'Los DML de un bloque forman parte de la transacción: ROLLBACK los deshace.',
      },
    ],
  },
  {
    id: 'S3-M04',
    title: 'Decisiones',
    skill: 'Elegir el camino correcto con IF y CASE',
    scenario: 'El área de Compensación clasifica salarios y no quiere sorpresas con los NULL.',
    steps: [
      {
        id: 'S3-M04-1',
        lesson: 'S3-L09',
        kind: 'choice',
        prompt: 'IF v_bono > 0 THEN … ELSE … END IF; con v_bono NULL. ¿Qué rama se ejecuta?',
        options: [
          { text: 'ELSE', code: true, correct: true, feedback: 'Correcto: NULL > 0 no es TRUE.' },
          {
            text: 'THEN',
            code: true,
            correct: false,
            feedback: 'La condición es desconocida, no verdadera.',
          },
          { text: 'Ninguna: error', correct: false, feedback: 'No hay error; se toma ELSE.' },
        ],
        hints: ['Una comparación con NULL es desconocida.', 'Solo TRUE entra en THEN.'],
        explanation: 'NULL > 0 es desconocido: se ejecuta ELSE.',
      },
      {
        id: 'S3-M04-2',
        lesson: 'S3-L10',
        kind: 'choice',
        prompt: '¿Qué escribe este bloque?',
        context: { example: 'S3-E-CASE-BUSQUEDA' },
        options: [
          { text: 'Carga alta: 35 h', code: true, correct: true, feedback: 'Correcto.' },
          {
            text: 'Carga normal: 35 h',
            code: true,
            correct: false,
            feedback: 'Revisa qué condición es la primera verdadera.',
          },
          {
            text: 'Sobrecarga: 35 h',
            code: true,
            correct: false,
            feedback: '35 no supera ese límite.',
          },
        ],
        hints: ['Paula tiene 20 + 15 horas.', 'CASE se queda con el primer WHEN verdadero.'],
        explanation: 'Paula suma 35 horas: el primer WHEN verdadero es el de carga alta.',
      },
    ],
  },
  {
    id: 'S3-M05',
    title: 'Repetir',
    skill: 'Elegir y controlar bucles',
    scenario: 'Finanzas proyecta salarios y presupuestos mes a mes.',
    steps: [
      {
        id: 'S3-M05-1',
        lesson: 'S3-L11',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe el LOOP de la proyección de Felipe?',
        context: { example: 'S3-E-LOOP' },
        hints: ['Cada vuelta escribe un año.', 'El bucle sale al superar la meta.'],
        explanation: 'Tres: años 1, 2 y 3.',
      },
      {
        id: 'S3-M05-2',
        lesson: 'S3-L12',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe este bloque?',
        context: { example: 'S3-P-FOR-VACIO' },
        hints: [
          'Mira los límites del rango.',
          'Un rango con el inicio mayor que el final está vacío.',
        ],
        explanation: 'Una: el FOR no da vueltas y solo se escribe «Fin».',
      },
    ],
  },
  {
    id: 'S3-M06',
    title: 'Recorrer filas',
    skill: 'Procesar consultas de varias filas con cursores',
    scenario: 'Operaciones quiere procesar a su equipo activo persona por persona.',
    steps: [
      {
        id: 'S3-M06-1',
        lesson: 'S3-L14',
        kind: 'result',
        prompt: '¿Qué filas recorrerá el cursor de personas activas de Operaciones?',
        context: { example: 'S3-P-CURSOR-OPS' },
        distractors: [
          {
            example: 'S3-P-CURSOR-OPS-TODOS',
            feedback: 'Falta el filtro de estado: aparece Alicia.',
          },
          { example: 'S3-P-CURSOR-OPS-INACTIVOS', feedback: 'Es la condición contraria.' },
        ],
        hints: ['El cursor recorre las filas de su consulta.', 'Alicia está inactiva.'],
        explanation: 'Ana y Felipe.',
      },
      {
        id: 'S3-M06-2',
        lesson: 'S3-L15',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe el cursor FOR parametrizado (proyectos 103 y 105)?',
        context: { example: 'S3-E-CURSOR-FOR-PARAM' },
        hints: ['Cada proyecto escribe un título.', 'El 103 tiene tres personas y el 105, dos.'],
        explanation: 'Siete: dos títulos y cinco personas.',
      },
    ],
  },
  {
    id: 'S3-M07',
    title: 'Errores bajo control',
    skill: 'Manejar excepciones predefinidas y propias',
    scenario: 'El proceso de horas no debe detenerse con un error críptico.',
    steps: [
      {
        id: 'S3-M07-1',
        lesson: 'S3-L16',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe este bloque?',
        context: { example: 'S3-P-EXC-SALTO' },
        hints: ['El error interrumpe BEGIN.', 'El manejador escribe su propia línea.'],
        explanation: 'Dos: «Inicio» y «No existe».',
      },
      {
        id: 'S3-M07-2',
        lesson: 'S3-L17',
        kind: 'choice',
        prompt: '¿Qué código es válido en RAISE_APPLICATION_ERROR?',
        options: [
          { text: '-20001', code: true, correct: true, feedback: 'Correcto.' },
          {
            text: '-1403',
            code: true,
            correct: false,
            feedback: 'Ese número pertenece a un error de Oracle.',
          },
          { text: '20001', code: true, correct: false, feedback: 'Debe ser negativo.' },
        ],
        hints: ['El rango es negativo.', 'Va de -20000 a -20999.'],
        explanation: 'Los errores propios usan -20000 a -20999.',
      },
    ],
  },
  {
    id: 'S3-M08',
    title: 'Programas guardados',
    skill: 'Elegir y llamar procedimientos y funciones',
    scenario: 'El equipo quiere reutilizar el cálculo del salario anual y el proceso de aumento.',
    steps: [
      {
        id: 'S3-M08-1',
        lesson: 'S3-L21',
        kind: 'choice',
        prompt: 'SELECT aumentar_salario(6, 5) FROM dual; ¿Qué responde Oracle?',
        options: [
          {
            text: 'ORA-00904: un procedimiento no es válido dentro de SQL',
            correct: true,
            feedback: 'Correcto: solo las funciones pueden usarse en SQL.',
          },
          {
            text: 'Aumenta el salario y devuelve 1',
            correct: false,
            feedback: 'Un procedimiento no devuelve valor.',
          },
          {
            text: 'Devuelve NULL',
            correct: false,
            feedback: 'La consulta ni siquiera se ejecuta.',
          },
        ],
        hints: ['¿aumentar_salario devuelve un valor?', 'SQL solo puede llamar funciones.'],
        explanation:
          'aumentar_salario es un procedimiento: en un SELECT Oracle responde ORA-00904.',
      },
      {
        id: 'S3-M08-2',
        lesson: 'S3-L20',
        kind: 'choice',
        prompt: 'nivel_salarial no tiene ELSE y recibe 2.100.000. ¿Qué pasa?',
        options: [
          {
            text: 'ORA-06503: la función terminó sin RETURN',
            correct: true,
            feedback: 'Correcto.',
          },
          {
            text: 'Devuelve NULL',
            correct: false,
            feedback: 'Una función debe ejecutar RETURN siempre.',
          },
          {
            text: "Devuelve 'Medio'",
            code: true,
            correct: false,
            feedback: '2.100.000 no llega a 4.000.000.',
          },
        ],
        hints: ['Ninguna rama del IF se cumple.', 'Toda función debe terminar con RETURN.'],
        explanation: 'Si la ejecución llega al END sin RETURN, Oracle responde ORA-06503.',
      },
    ],
  },
  {
    id: 'S3-M09',
    title: 'Auditoría automática',
    skill: 'Diseñar triggers con :OLD y :NEW',
    scenario:
      'Auditoría interna exige registrar cada cambio de salario sin depender de las aplicaciones.',
    steps: [
      {
        id: 'S3-M09-1',
        lesson: 'S3-L24',
        kind: 'choice',
        prompt: '¿Qué trigger registra cada cambio de salario con su valor anterior y nuevo?',
        options: [
          {
            text: 'AFTER UPDATE OF salario ON empleados FOR EACH ROW',
            code: true,
            correct: true,
            feedback: 'Correcto: de fila, para tener :OLD y :NEW de cada persona.',
          },
          {
            text: 'AFTER UPDATE OF salario ON empleados',
            code: true,
            correct: false,
            feedback: 'De sentencia: no tiene :OLD ni :NEW (ORA-04082).',
          },
          {
            text: 'BEFORE INSERT ON empleados FOR EACH ROW',
            code: true,
            correct: false,
            feedback: 'Se dispara al insertar, no al cambiar salarios.',
          },
        ],
        hints: ['Se necesita una ejecución por persona.', 'El evento es el cambio de salario.'],
        explanation: 'AFTER UPDATE … FOR EACH ROW: una auditoría por fila cambiada.',
      },
      {
        id: 'S3-M09-2',
        lesson: 'S3-L24',
        kind: 'count',
        prompt:
          'Con los dos triggers (sentencia y fila), ¿cuántas líneas escribe un UPDATE sobre Investigación?',
        context: { example: 'S3-P-TRIGGER-CERO' },
        hints: [
          'Investigación no tiene personas.',
          'El trigger de sentencia no depende de las filas.',
        ],
        explanation: 'Una: solo la del trigger de sentencia.',
      },
    ],
  },
  {
    id: 'S3-M10',
    title: 'PL/SQL Master',
    skill: 'Integrar cursor, subprograma, excepción y trigger',
    scenario:
      'Fin de año: Ventas recibe un aumento del 10 % con aplicar_aumentos y el trigger de auditoría activo.',
    steps: [
      {
        id: 'S3-M10-1',
        lesson: 'S3-L28',
        kind: 'count',
        prompt: '¿Cuántas líneas escribe el bloque?',
        context: { example: 'S3-P-INTEGRADOR-VENTAS' },
        hints: [
          'Ventas tiene cinco personas, todas activas.',
          'El bloque añade la línea del total.',
        ],
        explanation: 'Seis: una por cada una de las cinco personas y la del total.',
      },
      {
        id: 'S3-M10-2',
        lesson: 'S3-L28',
        kind: 'choice',
        prompt: 'Después de ejecutarlo, ¿cuántas filas nuevas tiene AUDITORIA_SALARIOS?',
        context: { example: 'S3-P-INTEGRADOR-VENTAS' },
        options: [
          {
            text: '5',
            code: true,
            correct: true,
            feedback: 'Correcto: una por cada UPDATE de fila.',
          },
          { text: '1', code: true, correct: false, feedback: 'El trigger es FOR EACH ROW.' },
          {
            text: '6',
            code: true,
            correct: false,
            feedback: 'La línea del total no es un UPDATE.',
          },
        ],
        hints: [
          'El trigger se dispara por cada fila actualizada.',
          '¿Cuántos UPDATE hizo el cursor?',
        ],
        explanation: 'Cinco UPDATE de fila → cinco filas de auditoría.',
      },
      {
        id: 'S3-M10-3',
        lesson: 'S3-L28',
        kind: 'choice',
        prompt: 'Si se llama con un 30 %, ¿qué queda en la auditoría?',
        options: [
          {
            text: 'Nada: la validación lanza ORA-20020 antes del primer UPDATE.',
            correct: true,
            feedback: 'Correcto.',
          },
          { text: 'Una fila por persona', correct: false, feedback: 'El cursor nunca empieza.' },
          {
            text: 'Las filas hasta llegar al tope',
            correct: false,
            feedback: 'La validación está antes del bucle.',
          },
        ],
        hints: ['¿Dónde está la validación?', 'Recuerda el caso integrador con 30 %.'],
        explanation: 'Validar antes de modificar evita cambios a medias: la auditoría sigue vacía.',
      },
    ],
  },
];
