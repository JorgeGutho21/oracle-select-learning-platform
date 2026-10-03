import { lines, plsql, query, source } from '../../builders';
import type { CurriculumExample, CurriculumLesson } from '../../types';

/**
 * Sección 3, bloques 7 a 11: cursores, excepciones, procedimientos, funciones y paquetes.
 */

const AUMENTAR_SALARIO = lines(
  'CREATE OR REPLACE PROCEDURE aumentar_salario (',
  '  p_id         IN empleados.id_empleado%TYPE,',
  '  p_porcentaje IN NUMBER',
  ') IS',
  'BEGIN',
  '  UPDATE empleados',
  '  SET salario = ROUND(salario * (1 + p_porcentaje / 100))',
  '  WHERE id_empleado = p_id;',
  '  IF SQL%ROWCOUNT = 0 THEN',
  "    RAISE_APPLICATION_ERROR(-20002, 'No existe el empleado ' || p_id);",
  '  END IF;',
  'END aumentar_salario;',
);

const RESUMEN_DEPARTAMENTO = lines(
  'CREATE OR REPLACE PROCEDURE resumen_departamento (',
  '  p_id_departamento IN  NUMBER,',
  '  p_empleados       OUT NUMBER,',
  '  p_promedio        OUT NUMBER',
  ') IS',
  'BEGIN',
  '  SELECT COUNT(*), ROUND(AVG(salario))',
  '  INTO p_empleados, p_promedio',
  '  FROM empleados',
  '  WHERE id_departamento = p_id_departamento;',
  'END resumen_departamento;',
);

const SALARIO_ANUAL = lines(
  'CREATE OR REPLACE FUNCTION salario_anual (',
  '  p_id IN empleados.id_empleado%TYPE',
  ') RETURN NUMBER IS',
  '  v_salario empleados.salario%TYPE;',
  '  v_bono    empleados.bono%TYPE;',
  'BEGIN',
  '  SELECT salario, bono INTO v_salario, v_bono',
  '  FROM empleados',
  '  WHERE id_empleado = p_id;',
  '  RETURN (v_salario + NVL(v_bono, 0)) * 12;',
  'END salario_anual;',
);

const PAQUETE_SPEC = lines(
  'CREATE OR REPLACE PACKAGE rrhh_pkg IS',
  '  c_tope_aumento CONSTANT NUMBER := 15;',
  '  FUNCTION salario_anual (p_id NUMBER) RETURN NUMBER;',
  '  PROCEDURE aumentar (p_id NUMBER, p_porcentaje NUMBER);',
  'END rrhh_pkg;',
);

const PAQUETE_BODY = lines(
  'CREATE OR REPLACE PACKAGE BODY rrhh_pkg IS',
  '  -- Privada: no está en la especificación, solo se usa aquí dentro.',
  '  FUNCTION redondear (p_valor NUMBER) RETURN NUMBER IS',
  '  BEGIN',
  '    RETURN ROUND(p_valor, -3);',
  '  END redondear;',
  '',
  '  FUNCTION salario_anual (p_id NUMBER) RETURN NUMBER IS',
  '    v_total NUMBER;',
  '  BEGIN',
  '    SELECT (salario + NVL(bono, 0)) * 12 INTO v_total',
  '    FROM empleados',
  '    WHERE id_empleado = p_id;',
  '    RETURN v_total;',
  '  END salario_anual;',
  '',
  '  PROCEDURE aumentar (p_id NUMBER, p_porcentaje NUMBER) IS',
  '    v_salario empleados.salario%TYPE;',
  '  BEGIN',
  '    IF p_porcentaje > c_tope_aumento THEN',
  "      RAISE_APPLICATION_ERROR(-20003, 'El aumento supera el tope de ' || c_tope_aumento || ' %');",
  '    END IF;',
  '    SELECT salario INTO v_salario FROM empleados WHERE id_empleado = p_id;',
  '    -- La función privada se usa en PL/SQL; dentro de una sentencia SQL no es visible.',
  '    v_salario := redondear(v_salario * (1 + p_porcentaje / 100));',
  '    UPDATE empleados SET salario = v_salario WHERE id_empleado = p_id;',
  '  END aumentar;',
  'END rrhh_pkg;',
);

export const PROGRAMS_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloque 7: cursores ---------- */
  plsql(
    'S3-E-IMPLICITO',
    lines(
      'BEGIN',
      '  UPDATE empleados',
      '  SET salario = salario + 200000',
      '  WHERE id_departamento = 30',
      "    AND cargo = 'Representante comercial';",
      '  IF SQL%FOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('Aumento aplicado a ' || SQL%ROWCOUNT || ' personas');",
      '  END IF;',
      '  UPDATE empleados SET salario = salario + 1 WHERE id_empleado = 99;',
      '  IF SQL%NOTFOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('Ninguna fila con ID 99');",
      '  END IF;',
      'END;',
    ),
  ),
  query(
    'S3-E-CURSOR-TI',
    lines(
      'SELECT nombre, salario',
      'FROM empleados',
      'WHERE id_departamento = 20',
      'ORDER BY salario DESC, nombre;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ID_DEPARTAMENTO', 'SALARIO'])],
  ),
  plsql(
    'S3-E-CURSOR-EXPLICITO',
    lines(
      'DECLARE',
      '  CURSOR c_ti IS',
      '    SELECT nombre, salario',
      '    FROM empleados',
      '    WHERE id_departamento = 20',
      '    ORDER BY salario DESC, nombre;',
      '  v_nombre  empleados.nombre%TYPE;',
      '  v_salario empleados.salario%TYPE;',
      'BEGIN',
      '  OPEN c_ti;',
      '  LOOP',
      '    FETCH c_ti INTO v_nombre, v_salario;',
      '    EXIT WHEN c_ti%NOTFOUND;',
      "    DBMS_OUTPUT.PUT_LINE(c_ti%ROWCOUNT || '. ' || v_nombre || ': ' || v_salario);",
      '  END LOOP;',
      '  CLOSE c_ti;',
      'END;',
    ),
    {
      trace: [
        { line: 2, note: 'CURSOR declara la consulta con un nombre. Todavía no se ejecuta.' },
        {
          line: 10,
          note: 'OPEN ejecuta la consulta: el resultado tiene 4 filas y el puntero queda antes de la primera.',
          vars: { 'c_ti%ROWCOUNT': '0' },
        },
        {
          line: 12,
          note: 'FETCH lee la fila 1 en las variables y avanza el puntero.',
          vars: { v_nombre: "'Carlos'", v_salario: '7500000', 'c_ti%ROWCOUNT': '1' },
          row: 1,
        },
        {
          line: 14,
          note: 'Hubo fila (%NOTFOUND es falso): se escribe.',
          vars: { v_nombre: "'Carlos'", v_salario: '7500000', 'c_ti%ROWCOUNT': '1' },
          output: '1. Carlos: 7500000',
          row: 1,
        },
        {
          line: 14,
          note: 'Segunda vuelta: FETCH lee la fila 2.',
          vars: { v_nombre: "'Andrés'", v_salario: '4200000', 'c_ti%ROWCOUNT': '2' },
          output: '2. Andrés: 4200000',
          row: 2,
        },
        {
          line: 14,
          note: 'Fila 3 (mismo salario: el desempate es por nombre).',
          vars: { v_nombre: "'Paula'", v_salario: '4200000', 'c_ti%ROWCOUNT': '3' },
          output: '3. Paula: 4200000',
          row: 3,
        },
        {
          line: 14,
          note: 'Fila 4.',
          vars: { v_nombre: "'Oscar'", v_salario: '3800000', 'c_ti%ROWCOUNT': '4' },
          output: '4. Oscar: 3800000',
          row: 4,
        },
        {
          line: 13,
          note: 'Quinto FETCH: no quedan filas. %NOTFOUND es verdadero y EXIT WHEN sale del bucle (las variables conservan el último valor).',
          vars: { 'c_ti%NOTFOUND': 'TRUE', 'c_ti%ROWCOUNT': '4' },
        },
        { line: 16, note: 'CLOSE libera el cursor.' },
      ],
    },
  ),
  plsql(
    'S3-E-CURSOR-CERRADO',
    lines(
      'DECLARE',
      '  CURSOR c_dep IS SELECT nombre_departamento FROM departamentos;',
      '  v_nombre departamentos.nombre_departamento%TYPE;',
      'BEGIN',
      '  FETCH c_dep INTO v_nombre;',
      'END;',
    ),
    { expectError: 'ORA-01001' },
  ),
  plsql(
    'S3-E-CURSOR-FOR-PARAM',
    lines(
      'DECLARE',
      '  CURSOR c_equipo (p_proyecto NUMBER) IS',
      '    SELECT e.nombre, a.rol, a.horas_semanales',
      '    FROM asignaciones a',
      '    JOIN empleados e ON a.id_empleado = e.id_empleado',
      '    WHERE a.id_proyecto = p_proyecto',
      '    ORDER BY e.nombre;',
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Proyecto 103');",
      '  FOR fila IN c_equipo(103) LOOP',
      "    DBMS_OUTPUT.PUT_LINE('  ' || fila.nombre || ' · ' || fila.rol || ' · ' || fila.horas_semanales || ' h');",
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Proyecto 105');",
      '  FOR fila IN c_equipo(105) LOOP',
      "    DBMS_OUTPUT.PUT_LINE('  ' || fila.nombre || ' · ' || fila.rol || ' · ' || fila.horas_semanales || ' h');",
      '  END LOOP;',
      'END;',
    ),
  ),
  plsql(
    'S3-E-CURSOR-FOR-SIMPLE',
    lines(
      'BEGIN',
      '  FOR d IN (SELECT nombre_departamento, sede',
      '            FROM departamentos',
      '            ORDER BY id_departamento) LOOP',
      "    DBMS_OUTPUT.PUT_LINE(d.nombre_departamento || ' (' || d.sede || ')');",
      '  END LOOP;',
      'END;',
    ),
  ),

  /* ---------- Bloque 8: excepciones ---------- */
  plsql(
    'S3-E-EXCEPCIONES',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      "  WHERE ciudad = 'Cali';",
      "  DBMS_OUTPUT.PUT_LINE('Única persona en Cali: ' || v_nombre);",
      'EXCEPTION',
      '  WHEN NO_DATA_FOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('Nadie trabaja en Cali');",
      '  WHEN TOO_MANY_ROWS THEN',
      "    DBMS_OUTPUT.PUT_LINE('Hay varias personas en Cali: usa un cursor');",
      '  WHEN OTHERS THEN',
      "    DBMS_OUTPUT.PUT_LINE('Error inesperado: ' || SQLERRM);",
      'END;',
    ),
    {
      trace: [
        {
          line: 4,
          note: 'Problema: la consulta encuentra cinco personas en Cali y SELECT INTO solo admite una.',
        },
        {
          line: 8,
          note: 'Excepción: Oracle lanza TOO_MANY_ROWS y salta a EXCEPTION sin ejecutar la línea 7.',
        },
        { line: 9, note: 'El primer manejador no coincide (no es NO_DATA_FOUND).' },
        {
          line: 12,
          note: 'Manejo: coincide TOO_MANY_ROWS y se ejecuta su respuesta. OTHERS ya no se evalúa.',
          output: 'Hay varias personas en Cali: usa un cursor',
        },
      ],
    },
  ),
  plsql(
    'S3-E-OTHERS',
    lines(
      'DECLARE',
      '  v_resultado NUMBER;',
      'BEGIN',
      '  v_resultado := 1000000 / 0;',
      'EXCEPTION',
      '  WHEN OTHERS THEN',
      "    DBMS_OUTPUT.PUT_LINE('Error ' || SQLCODE || ': ' || SQLERRM);",
      'END;',
    ),
  ),
  plsql(
    'S3-E-SIN-MANEJO',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      "  WHERE ciudad = 'Cali';",
      'END;',
    ),
    { expectError: 'ORA-01422' },
  ),
  plsql(
    'S3-E-RAISE',
    lines(
      'DECLARE',
      '  e_salario_invalido EXCEPTION;',
      '  v_nuevo NUMBER := -500000;',
      'BEGIN',
      '  IF v_nuevo <= 0 THEN',
      '    RAISE e_salario_invalido;',
      '  END IF;',
      "  DBMS_OUTPUT.PUT_LINE('Salario válido');",
      'EXCEPTION',
      '  WHEN e_salario_invalido THEN',
      "    DBMS_OUTPUT.PUT_LINE('Rechazado: el salario debe ser positivo');",
      'END;',
    ),
  ),
  plsql(
    'S3-E-RAISE-APP',
    lines(
      'DECLARE',
      '  v_horas NUMBER;',
      'BEGIN',
      '  SELECT SUM(horas_semanales) INTO v_horas FROM asignaciones WHERE id_empleado = 6;',
      '  IF v_horas >= 30 THEN',
      "    RAISE_APPLICATION_ERROR(-20001, 'Andrés ya tiene ' || v_horas || ' horas asignadas');",
      '  END IF;',
      'END;',
    ),
    { expectError: 'ORA-20001' },
  ),

  /* ---------- Bloque 9: procedimientos ---------- */
  plsql(
    'S3-E-PROCEDIMIENTO',
    lines(
      'BEGIN',
      '  aumentar_salario(16, 10);',
      '  aumentar_salario(18, 5);',
      "  DBMS_OUTPUT.PUT_LINE('Aumentos aplicados');",
      'END;',
    ),
    {
      setup: [AUMENTAR_SALARIO],
      before: [
        'SELECT id_empleado, nombre, salario FROM empleados WHERE id_empleado IN (16, 18) ORDER BY id_empleado',
      ],
      after: [
        'SELECT id_empleado, nombre, salario FROM empleados WHERE id_empleado IN (16, 18) ORDER BY id_empleado',
      ],
    },
  ),
  plsql('S3-E-PROC-ERROR', lines('BEGIN', '  aumentar_salario(99, 10);', 'END;'), {
    setup: [AUMENTAR_SALARIO],
    expectError: 'ORA-20002',
  }),
  plsql(
    'S3-E-PROC-COMPILA',
    lines(
      'CREATE OR REPLACE PROCEDURE subir_bono (p_id IN NUMBER) IS',
      'BEGIN',
      '  UPDATE empleados',
      '  SET bono = bono + v_incremento',
      '  WHERE id_empleado = p_id;',
      'END subir_bono;',
    ),
    { expectError: 'ORA-00904' },
  ),
  plsql(
    'S3-E-PARAMETROS',
    lines(
      'DECLARE',
      '  v_total    NUMBER;',
      '  v_promedio NUMBER;',
      'BEGIN',
      '  resumen_departamento(40, v_total, v_promedio);',
      "  DBMS_OUTPUT.PUT_LINE('Finanzas: ' || v_total || ' personas, promedio ' || v_promedio);",
      'END;',
    ),
    { setup: [RESUMEN_DEPARTAMENTO] },
  ),
  plsql(
    'S3-E-IN-OUT',
    lines(
      'DECLARE',
      '  v_bono NUMBER := 900000;',
      'BEGIN',
      '  aplicar_tope(v_bono, 500000);',
      "  DBMS_OUTPUT.PUT_LINE('Bono con tope: ' || v_bono);",
      'END;',
    ),
    {
      setup: [
        lines(
          'CREATE OR REPLACE PROCEDURE aplicar_tope (',
          '  p_valor IN OUT NUMBER,',
          '  p_tope  IN     NUMBER',
          ') IS',
          'BEGIN',
          '  IF p_valor > p_tope THEN',
          '    p_valor := p_tope;',
          '  END IF;',
          'END aplicar_tope;',
        ),
      ],
    },
  ),
  plsql(
    'S3-E-OUT-LITERAL',
    lines(
      'DECLARE',
      '  v_promedio NUMBER;',
      'BEGIN',
      '  resumen_departamento(40, 5, v_promedio);',
      'END;',
    ),
    { setup: [RESUMEN_DEPARTAMENTO], expectError: 'PLS-00363' },
  ),

  /* ---------- Bloque 10: funciones ---------- */
  plsql(
    'S3-E-FUNCION',
    lines(
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Andrés: ' || salario_anual(6));",
      "  DBMS_OUTPUT.PUT_LINE('Paula: ' || salario_anual(7));",
      'END;',
    ),
    { setup: [SALARIO_ANUAL] },
  ),
  plsql('S3-E-FUNCION-EN-SQL', SALARIO_ANUAL, {
    after: [
      'SELECT nombre, salario_anual(id_empleado) AS salario_anual FROM empleados WHERE id_departamento = 50 ORDER BY id_empleado',
    ],
  }),
  plsql('S3-E-FUNCION-EN-WHERE', SALARIO_ANUAL, {
    after: [
      'SELECT nombre FROM empleados WHERE salario_anual(id_empleado) > 70000000 ORDER BY nombre',
    ],
  }),
  plsql(
    'S3-E-FUNCION-SIN-RETURN',
    lines('BEGIN', '  DBMS_OUTPUT.PUT_LINE(nivel_salarial(2100000));', 'END;'),
    {
      setup: [
        lines(
          'CREATE OR REPLACE FUNCTION nivel_salarial (p_salario NUMBER) RETURN VARCHAR2 IS',
          'BEGIN',
          '  IF p_salario >= 6000000 THEN',
          "    RETURN 'Alto';",
          '  ELSIF p_salario >= 4000000 THEN',
          "    RETURN 'Medio';",
          '  END IF;',
          'END nivel_salarial;',
        ),
      ],
      expectError: 'ORA-06503',
    },
  ),
  plsql('S3-E-PROC-EN-SQL', 'SELECT aumentar_salario(6, 5) FROM dual', {
    setup: [AUMENTAR_SALARIO],
    expectError: 'ORA-00904',
  }),

  /* ---------- Bloque 11: paquetes ---------- */
  plsql(
    'S3-E-PAQUETE',
    lines(
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Antes: ' || rrhh_pkg.salario_anual(7));",
      '  rrhh_pkg.aumentar(7, 10);',
      "  DBMS_OUTPUT.PUT_LINE('Después: ' || rrhh_pkg.salario_anual(7));",
      "  DBMS_OUTPUT.PUT_LINE('Tope vigente: ' || rrhh_pkg.c_tope_aumento || ' %');",
      'END;',
    ),
    { setup: [PAQUETE_SPEC, PAQUETE_BODY] },
  ),
  plsql('S3-E-PAQUETE-TOPE', lines('BEGIN', '  rrhh_pkg.aumentar(7, 20);', 'END;'), {
    setup: [PAQUETE_SPEC, PAQUETE_BODY],
    expectError: 'ORA-20003',
  }),
  plsql(
    'S3-E-PAQUETE-PRIVADO',
    lines('BEGIN', '  DBMS_OUTPUT.PUT_LINE(rrhh_pkg.redondear(4620000));', 'END;'),
    { setup: [PAQUETE_SPEC, PAQUETE_BODY], expectError: 'PLS-00302' },
  ),
];

export const PROGRAMS_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S3-L13',
    block: 'cursores',
    slug: 'cursor-implicito',
    title: 'Cursor implícito y atributos SQL%',
    shortTitle: 'Cursor implícito',
    summary:
      'Oracle abre un cursor implícito para cada sentencia SQL de un bloque; SQL%FOUND, SQL%NOTFOUND y SQL%ROWCOUNT dicen qué pasó.',
    concepts: ['implicit-cursor'],
    purpose: 'Comprobar si un UPDATE o DELETE afectó filas y cuántas, sin otra consulta.',
    syntax: lines('UPDATE …;', 'IF SQL%FOUND THEN … END IF;', 'SQL%ROWCOUNT   -- filas afectadas'),
    explanation: [
      'Un cursor es el área de trabajo donde Oracle procesa una sentencia y su resultado. Para cada INSERT, UPDATE, DELETE o SELECT INTO, Oracle usa uno implícito llamado SQL.',
      'SQL%FOUND es verdadero si la última sentencia afectó al menos una fila; SQL%NOTFOUND, lo contrario; SQL%ROWCOUNT, cuántas.',
      'Un UPDATE que no encuentra filas no es un error: simplemente afecta cero filas. Por eso conviene comprobarlo.',
    ],
    example: {
      question: '¿A cuántas personas se aplicó el aumento? ¿Existía el empleado 99?',
      example: 'S3-E-IMPLICITO',
      reading:
        'Aumenta el salario de los representantes comerciales de Ventas e informa cuántos fueron; luego intenta actualizar el ID 99 y detecta que no había fila.',
    },
    changed: ['El segundo UPDATE no falla: SQL%NOTFOUND revela que no cambió nada.'],
    mistakes: [
      {
        title: 'Esperar un error cuando no hay filas',
        why: 'UPDATE y DELETE sin filas no lanzan excepción (a diferencia de SELECT INTO): hay que mirar SQL%ROWCOUNT.',
      },
    ],
    check: {
      id: 'S3-L13-C',
      kind: 'choice',
      lesson: 'S3-L13',
      prompt: 'Un UPDATE no encuentra ninguna fila. ¿Qué ocurre?',
      options: [
        {
          text: 'No hay error: SQL%ROWCOUNT vale 0 y SQL%NOTFOUND es verdadero.',
          correct: true,
          feedback: 'Correcto.',
        },
        {
          text: 'Oracle lanza NO_DATA_FOUND.',
          correct: false,
          feedback: 'NO_DATA_FOUND es de SELECT INTO, no de UPDATE.',
        },
        {
          text: 'SQL%ROWCOUNT queda en NULL.',
          correct: false,
          feedback: 'Tras una sentencia vale un número: 0.',
        },
        {
          text: 'El bloque termina en silencio.',
          correct: false,
          feedback: 'El bloque continúa con la siguiente sentencia.',
        },
      ],
      hints: [
        'Compara con SELECT INTO sin filas.',
        'Los atributos SQL% describen la última sentencia.',
      ],
      explanation:
        'UPDATE sin filas no es un error; los atributos del cursor implícito lo informan.',
    },
    keyIdea: 'SQL%ROWCOUNT, SQL%FOUND y SQL%NOTFOUND describen la última sentencia.',
    topic: 'cursores',
    version: 1,
  },
  {
    id: 'S3-L14',
    block: 'cursores',
    slug: 'cursor-explicito',
    title: 'Cursor explícito: OPEN, FETCH y CLOSE',
    shortTitle: 'Cursor explícito',
    summary:
      'Un cursor explícito nombra una consulta de varias filas y la recorre fila a fila: OPEN la ejecuta, FETCH lee una fila y CLOSE la libera.',
    concepts: ['explicit-cursor', 'cursor-attributes'],
    purpose: 'Procesar una a una las filas de una consulta, algo que SELECT INTO no permite.',
    syntax: lines(
      'CURSOR c IS SELECT …;',
      'OPEN c;',
      'LOOP',
      '  FETCH c INTO variables;',
      '  EXIT WHEN c%NOTFOUND;',
      '  …',
      'END LOOP;',
      'CLOSE c;',
    ),
    explanation: [
      'El cursor se declara en DECLARE con su consulta. OPEN la ejecuta y deja un puntero antes de la primera fila.',
      'Cada FETCH copia la fila siguiente en las variables. Cuando no quedan filas, %NOTFOUND es verdadero: es la señal para salir. %ROWCOUNT cuenta las filas leídas y %ISOPEN dice si está abierto.',
      'CLOSE libera los recursos. Leer de un cursor sin abrir (o ya cerrado) da ORA-01001.',
    ],
    example: {
      question: '¿Cómo recorrer al equipo de TI, del salario más alto al más bajo?',
      example: 'S3-E-CURSOR-EXPLICITO',
      reading:
        'Abre el cursor de TI, lee cada fila, la numera con %ROWCOUNT y la escribe; cuando FETCH ya no trae filas, sale y cierra.',
      visual: { kind: 'cursor', query: 'S3-E-CURSOR-TI' },
    },
    more: [
      {
        question: 'Error: FETCH sin OPEN.',
        example: 'S3-E-CURSOR-CERRADO',
        reading: 'El cursor nunca se abrió: ORA-01001 (cursor no válido).',
      },
    ],
    changed: [
      'Cuatro filas del resultado se convierten en cuatro líneas de salida, una por vuelta.',
    ],
    mistakes: [
      {
        title: 'EXIT WHEN antes del FETCH',
        why: '%NOTFOUND refleja el último FETCH: si se comprueba antes, la primera vuelta usa un valor sin sentido.',
      },
      {
        title: 'Olvidar CLOSE',
        why: 'El cursor queda abierto y ocupa recursos hasta que termina la sesión.',
      },
    ],
    check: {
      id: 'S3-L14-C',
      kind: 'order',
      lesson: 'S3-L14',
      prompt: 'Ordena el ciclo de vida de un cursor explícito.',
      pieces: [
        'CURSOR c IS SELECT …;',
        'OPEN c;',
        'FETCH c INTO v;',
        'EXIT WHEN c%NOTFOUND;',
        'CLOSE c;',
      ],
      hints: [
        'Primero se declara, luego se abre.',
        'La salida se comprueba justo después de leer.',
      ],
      explanation: 'Declarar, abrir, leer, comprobar si quedan filas y cerrar.',
    },
    keyIdea: 'OPEN ejecuta, FETCH avanza una fila, %NOTFOUND avisa, CLOSE libera.',
    topic: 'cursores',
    version: 1,
  },
  {
    id: 'S3-L15',
    block: 'cursores',
    slug: 'cursor-for-y-parametros',
    title: 'Cursor FOR loop y cursores con parámetros',
    shortTitle: 'Cursor FOR',
    summary:
      'El cursor FOR abre, lee y cierra solo; un cursor con parámetros reutiliza la misma consulta con distintos valores.',
    concepts: ['cursor-for-loop'],
    purpose:
      'Recorrer filas con menos código y sin olvidar CLOSE, y reutilizar una consulta para varios casos.',
    syntax: lines(
      'CURSOR c (p NUMBER) IS SELECT … WHERE col = p;',
      'FOR fila IN c(valor) LOOP',
      '  … fila.columna …',
      'END LOOP;',
    ),
    explanation: [
      'FOR fila IN cursor LOOP declara un registro (fila), abre el cursor, hace FETCH en cada vuelta, sale cuando no hay más filas y cierra solo.',
      'Un parámetro del cursor funciona como una variable dentro de su consulta: c_equipo(103) y c_equipo(105) ejecutan la misma consulta para proyectos distintos.',
      'También se puede escribir la consulta directamente: FOR d IN (SELECT …) LOOP.',
    ],
    example: {
      question: '¿Quién trabaja en los proyectos 103 y 105?',
      example: 'S3-E-CURSOR-FOR-PARAM',
      reading:
        'El mismo cursor parametrizado se recorre dos veces, una por proyecto, y escribe nombre, rol y horas de cada persona.',
    },
    more: [
      {
        question: 'Cursor FOR con la consulta escrita en el propio bucle.',
        example: 'S3-E-CURSOR-FOR-SIMPLE',
        reading: 'Recorre los seis departamentos sin declarar el cursor aparte.',
      },
    ],
    changed: ['No hay OPEN, FETCH ni CLOSE escritos: el FOR los hace.'],
    mistakes: [
      {
        title: 'Declarar la variable del FOR',
        why: 'El registro (fila) lo declara el FOR; no hace falta %ROWTYPE.',
      },
      { title: 'Usar fila fuera del bucle', why: 'El registro solo existe dentro del FOR.' },
    ],
    check: {
      id: 'S3-L15-C',
      kind: 'count',
      lesson: 'S3-L15',
      prompt:
        '¿Cuántas líneas escribe en total el bloque de los proyectos 103 y 105 (incluidos los títulos)?',
      context: { example: 'S3-E-CURSOR-FOR-PARAM' },
      hints: [
        'Cada proyecto escribe un título y una línea por persona.',
        'El 103 tiene tres personas y el 105, dos.',
      ],
      explanation: 'Siete: dos títulos, tres personas del 103 y dos del 105.',
    },
    keyIdea:
      'Cursor FOR = abrir + leer + cerrar automáticos; parámetros = misma consulta, otro valor.',
    topic: 'cursores',
    version: 1,
  },
  {
    id: 'S3-L16',
    block: 'excepciones',
    slug: 'excepciones-predefinidas',
    title: 'Excepciones predefinidas: NO_DATA_FOUND, TOO_MANY_ROWS y OTHERS',
    shortTitle: 'Excepciones',
    summary:
      'Cuando algo falla, Oracle lanza una excepción y el control salta a EXCEPTION, donde un manejador WHEN la atrapa.',
    concepts: ['exception', 'predefined-exceptions'],
    purpose:
      'Responder a los fallos previsibles con un mensaje o una acción, en lugar de que el bloque termine con error.',
    syntax: lines(
      'EXCEPTION',
      '  WHEN NO_DATA_FOUND THEN …',
      '  WHEN TOO_MANY_ROWS THEN …',
      '  WHEN OTHERS THEN … SQLCODE, SQLERRM …',
    ),
    explanation: [
      'Problema → excepción → manejo: una sentencia falla, Oracle lanza la excepción correspondiente y busca un WHEN que coincida en la sección EXCEPTION. El resto de la sección ejecutable no se ejecuta.',
      'Las más usadas: NO_DATA_FOUND (SELECT INTO sin filas), TOO_MANY_ROWS (SELECT INTO con varias), ZERO_DIVIDE, DUP_VAL_ON_INDEX (clave repetida) y VALUE_ERROR (valor que no cabe).',
      'WHEN OTHERS atrapa cualquier otra; SQLCODE y SQLERRM dicen cuál fue. Debe ir al final y no debe ocultar errores (nunca WHEN OTHERS THEN NULL).',
    ],
    example: {
      question: '¿Quién trabaja en Cali? El bloque prevé los tres casos.',
      example: 'S3-E-EXCEPCIONES',
      reading:
        'La consulta encuentra varias personas; Oracle lanza TOO_MANY_ROWS y su manejador escribe un mensaje.',
      visual: { kind: 'flow' },
    },
    more: [
      {
        question: 'WHEN OTHERS con SQLCODE y SQLERRM.',
        example: 'S3-E-OTHERS',
        reading:
          'La división por cero lanza ZERO_DIVIDE; OTHERS la atrapa y muestra el código y el mensaje de Oracle.',
      },
      {
        question: 'Sin manejador, el error llega a quien ejecutó el bloque.',
        example: 'S3-E-SIN-MANEJO',
        reading:
          'La misma consulta sin EXCEPTION termina con ORA-01422; ORA-06512 indica la línea.',
      },
    ],
    changed: ['El bloque no falla: el manejador convirtió el error en un mensaje.'],
    mistakes: [
      {
        title: 'WHEN OTHERS THEN NULL',
        why: 'Oculta cualquier error, incluso los graves. Si se usa OTHERS, registra o relanza el error.',
      },
      {
        title: 'OTHERS antes de otros manejadores',
        why: 'OTHERS debe ser el último WHEN: Oracle no compila otro después.',
      },
    ],
    check: {
      id: 'S3-L16-C',
      kind: 'choice',
      lesson: 'S3-L16',
      prompt:
        'En el ejemplo de Cali, ¿se ejecuta la línea 7 (la que escribe «Única persona en Cali»)?',
      options: [
        {
          text: 'No: el error salta directamente a EXCEPTION.',
          correct: true,
          feedback: 'Correcto: tras una excepción no se vuelve a la sección ejecutable.',
        },
        {
          text: 'Sí, con el primer nombre.',
          correct: false,
          feedback: 'SELECT INTO no guarda nada si hay varias filas.',
        },
        {
          text: 'Sí, después del manejador.',
          correct: false,
          feedback: 'El control no regresa a BEGIN.',
        },
        {
          text: 'Solo si existe WHEN OTHERS.',
          correct: false,
          feedback: 'Con o sin OTHERS, la línea 7 se salta.',
        },
      ],
      hints: [
        '¿Qué hace Oracle en cuanto se lanza una excepción?',
        'EXCEPTION es el final del bloque.',
      ],
      explanation:
        'Una excepción interrumpe la sección ejecutable; el bloque continúa en el manejador y termina.',
    },
    keyIdea: 'Problema → excepción → manejador WHEN; OTHERS al final y nunca para callar errores.',
    topic: 'excepciones',
    version: 1,
  },
  {
    id: 'S3-L17',
    block: 'excepciones',
    slug: 'excepciones-de-usuario',
    title: 'Excepciones propias, RAISE y RAISE_APPLICATION_ERROR',
    shortTitle: 'RAISE',
    summary:
      'Una regla de negocio puede lanzar su propia excepción con RAISE, o un error con código y mensaje con RAISE_APPLICATION_ERROR.',
    concepts: ['user-exception', 'raise-application-error'],
    purpose:
      'Detener un proceso cuando un dato no cumple una regla («el salario debe ser positivo»).',
    syntax: lines(
      'DECLARE',
      '  e_regla EXCEPTION;',
      'BEGIN',
      '  IF condición THEN RAISE e_regla; END IF;',
      'EXCEPTION',
      '  WHEN e_regla THEN …',
      'END;',
      '',
      "RAISE_APPLICATION_ERROR(-20001, 'mensaje');",
    ),
    explanation: [
      'Una excepción de usuario se declara en DECLARE y se lanza con RAISE; se maneja con WHEN igual que las predefinidas.',
      'RAISE_APPLICATION_ERROR(código, mensaje) lanza un error con un código entre -20000 y -20999 y un mensaje propio. Llega a la aplicación o a quien llamó como un error de Oracle (ORA-20001…).',
    ],
    example: {
      question: '¿Qué pasa si se intenta guardar un salario negativo?',
      example: 'S3-E-RAISE',
      reading:
        'La validación lanza la excepción propia y su manejador rechaza el valor con un mensaje.',
    },
    more: [
      {
        question: 'RAISE_APPLICATION_ERROR: un error con mensaje propio.',
        example: 'S3-E-RAISE-APP',
        reading:
          'Andrés ya tiene 30 horas: el bloque termina con ORA-20001 y el mensaje de la regla.',
      },
    ],
    changed: ['La línea «Salario válido» nunca se escribe: RAISE interrumpe la ejecución.'],
    mistakes: [
      {
        title: 'Códigos fuera de rango',
        why: 'RAISE_APPLICATION_ERROR solo acepta códigos de -20000 a -20999.',
      },
      {
        title: 'Declarar la excepción y no lanzarla',
        why: 'Declarar no basta: hay que lanzarla con RAISE cuando se cumple la condición.',
      },
    ],
    check: {
      id: 'S3-L17-C',
      kind: 'choice',
      lesson: 'S3-L17',
      prompt: '¿Qué código es válido en RAISE_APPLICATION_ERROR?',
      options: [
        {
          text: '-20010',
          code: true,
          correct: true,
          feedback: 'Correcto: está entre -20000 y -20999.',
        },
        {
          text: '-1403',
          code: true,
          correct: false,
          feedback: 'Es el código de NO_DATA_FOUND: reservado por Oracle.',
        },
        { text: '20010', code: true, correct: false, feedback: 'Debe ser negativo.' },
        { text: '-30000', code: true, correct: false, feedback: 'Fuera del rango permitido.' },
      ],
      hints: ['Los códigos de usuario son negativos.', 'El rango empieza en -20000.'],
      explanation: 'Los errores de aplicación usan -20000 a -20999.',
    },
    keyIdea:
      'RAISE lanza una excepción propia; RAISE_APPLICATION_ERROR, un error ORA-20xxx con mensaje.',
    topic: 'excepciones',
    version: 1,
  },
  {
    id: 'S3-L18',
    block: 'procedimientos',
    slug: 'procedimientos',
    title: 'CREATE PROCEDURE y su llamada',
    shortTitle: 'Procedimientos',
    summary:
      'Un procedimiento es un bloque con nombre y parámetros guardado en la base; se llama como una sentencia.',
    concepts: ['procedure'],
    purpose:
      'Encapsular una tarea repetible («aumentar el salario de una persona») en un solo lugar.',
    syntax: lines(
      'CREATE OR REPLACE PROCEDURE nombre (',
      '  p_param IN tipo',
      ') IS',
      '  -- declaraciones locales',
      'BEGIN',
      '  …',
      'END nombre;',
      '',
      'BEGIN nombre(valor); END;   -- llamada',
    ),
    explanation: [
      'CREATE OR REPLACE compila el procedimiento y lo guarda (o lo reemplaza si ya existía). La parte después de IS funciona como el DECLARE de un bloque.',
      'Se llama por su nombre con sus parámetros, desde un bloque o desde otro programa. Si no compila, Oracle lo guarda como inválido y muestra los errores (en SQL*Plus, SHOW ERRORS).',
    ],
    example: {
      question: 'Aplicar aumentos con un procedimiento reutilizable.',
      example: 'S3-E-PROCEDIMIENTO',
      reading:
        'El procedimiento aumenta el salario de una persona en el porcentaje pedido; el bloque lo llama dos veces con valores distintos.',
    },
    more: [
      {
        question: 'El procedimiento valida que la persona exista.',
        example: 'S3-E-PROC-ERROR',
        reading: 'Con el ID 99, SQL%ROWCOUNT es 0 y el procedimiento lanza ORA-20002.',
      },
      {
        question: 'Error de compilación: una variable sin declarar.',
        example: 'S3-E-PROC-COMPILA',
        reading:
          'Oracle crea el procedimiento con errores (queda inválido) y los muestra con su línea y columna: v_incremento no está declarada, y dentro de la sentencia SQL eso se informa como ORA-00904.',
      },
    ],
    changed: ['Julián y Felipe cambian de salario; el resto de la tabla no.'],
    mistakes: [
      {
        title: 'Olvidar OR REPLACE',
        why: 'Sin él, volver a crear el procedimiento da error porque ya existe.',
      },
      {
        title: 'Ignorar los errores de compilación',
        why: 'Un procedimiento inválido falla al llamarlo. Revisa SHOW ERRORS (o USER_ERRORS).',
      },
    ],
    check: {
      id: 'S3-L18-C',
      kind: 'choice',
      lesson: 'S3-L18',
      prompt: '¿Cómo se ejecuta el procedimiento aumentar_salario para la persona 6 con un 5 %?',
      options: [
        {
          text: 'BEGIN aumentar_salario(6, 5); END;',
          code: true,
          correct: true,
          feedback: 'Correcto.',
        },
        {
          text: 'SELECT aumentar_salario(6, 5) FROM dual;',
          code: true,
          correct: false,
          feedback: 'Un procedimiento no devuelve valor: no se usa en un SELECT (ORA-00904).',
        },
        {
          text: 'v := aumentar_salario(6, 5);',
          code: true,
          correct: false,
          feedback: 'Asignar el resultado es propio de una función.',
        },
        {
          text: 'CREATE aumentar_salario(6, 5);',
          code: true,
          correct: false,
          feedback: 'CREATE define el procedimiento; no lo ejecuta.',
        },
      ],
      hints: [
        'Un procedimiento se llama como una sentencia.',
        'No devuelve un valor que se pueda asignar.',
      ],
      explanation: 'Se llama como sentencia dentro de un bloque (o con EXECUTE en SQL*Plus).',
    },
    keyIdea: 'Procedimiento = bloque con nombre y parámetros, guardado y reutilizable.',
    topic: 'subprogramas',
    version: 1,
  },
  {
    id: 'S3-L19',
    block: 'procedimientos',
    slug: 'parametros-in-out',
    title: 'Parámetros IN, OUT e IN OUT',
    shortTitle: 'IN, OUT, IN OUT',
    summary:
      'IN entra al procedimiento y no se modifica; OUT sale con un resultado; IN OUT entra con un valor y sale cambiado.',
    concepts: ['parameter-modes'],
    purpose: 'Que un procedimiento reciba datos y también devuelva resultados a quien lo llama.',
    syntax: lines(
      'PROCEDURE p (',
      '  p_entrada IN     NUMBER,   -- solo lectura (por defecto)',
      '  p_salida  OUT    NUMBER,   -- se asigna dentro',
      '  p_ambos   IN OUT NUMBER    -- se lee y se cambia',
      ')',
    ),
    explanation: [
      'IN es el modo por defecto: el valor entra y dentro es de solo lectura.',
      'OUT empieza vacío (NULL) dentro del procedimiento; lo que se le asigne vuelve a la variable de quien llama. Por eso el argumento debe ser una variable, nunca un literal.',
      'IN OUT combina ambos: entra con un valor, se puede cambiar y el cambio vuelve.',
    ],
    example: {
      question:
        '¿Cuántas personas y qué promedio tiene Finanzas? Dos resultados con parámetros OUT.',
      example: 'S3-E-PARAMETROS',
      reading:
        'El procedimiento recibe el departamento (IN) y devuelve el conteo y el promedio en dos parámetros OUT, que el bloque escribe.',
    },
    more: [
      {
        question: 'IN OUT: el valor entra y sale modificado.',
        example: 'S3-E-IN-OUT',
        reading: 'aplicar_tope recibe 900.000 y lo deja en 500.000 porque supera el tope.',
      },
      {
        question: 'Error: un literal en un parámetro OUT.',
        example: 'S3-E-OUT-LITERAL',
        reading:
          'El 5 no puede recibir un resultado: PLS-00363 (no puede ser destino de una asignación).',
      },
    ],
    changed: ['Las variables v_total y v_promedio estaban vacías y salen con valores.'],
    mistakes: [
      {
        title: 'Pasar un literal a OUT',
        why: 'OUT e IN OUT necesitan una variable donde escribir.',
      },
      {
        title: 'Asignar a un parámetro IN',
        why: 'IN es de solo lectura: Oracle no compila la asignación.',
      },
    ],
    check: {
      id: 'S3-L19-C',
      kind: 'choice',
      lesson: 'S3-L19',
      prompt:
        '¿Qué modo usarías para un parámetro que debe devolver un resultado y no necesita valor de entrada?',
      options: [
        { text: 'OUT', code: true, correct: true, feedback: 'Correcto.' },
        { text: 'IN', code: true, correct: false, feedback: 'IN solo entra: no devuelve nada.' },
        {
          text: 'IN OUT',
          code: true,
          correct: false,
          feedback: 'Funciona, pero solo hace falta si el valor de entrada importa.',
        },
        {
          text: 'RETURN',
          code: true,
          correct: false,
          feedback: 'RETURN es de las funciones, no un modo de parámetro.',
        },
      ],
      hints: ['El valor solo viaja en un sentido.', 'Del procedimiento hacia quien lo llama.'],
      explanation: 'OUT: el procedimiento asigna el valor y quien llama lo recibe.',
    },
    keyIdea: 'IN entra, OUT sale, IN OUT entra y sale.',
    topic: 'subprogramas',
    version: 1,
  },
  {
    id: 'S3-L20',
    block: 'funciones',
    slug: 'funciones',
    title: 'CREATE FUNCTION y RETURN',
    shortTitle: 'Funciones',
    summary:
      'Una función calcula y devuelve un valor con RETURN; se usa dentro de expresiones de PL/SQL y también de SQL.',
    concepts: ['function'],
    purpose:
      'Encapsular un cálculo («salario anual con bono») y usarlo en cualquier expresión o consulta.',
    syntax: lines(
      'CREATE OR REPLACE FUNCTION nombre (p IN tipo)',
      'RETURN tipo_resultado IS',
      'BEGIN',
      '  …',
      '  RETURN valor;',
      'END nombre;',
    ),
    explanation: [
      'RETURN tipo, en la cabecera, dice qué devuelve. Dentro, la sentencia RETURN valor termina la función y entrega el resultado.',
      'Todo camino de ejecución debe llegar a un RETURN. Si la función termina sin él, Oracle lanza ORA-06503 al ejecutarla.',
      'Una función sin efectos en los datos puede llamarse desde SQL: en el SELECT, en el WHERE o en el ORDER BY.',
    ],
    example: {
      question: '¿Cuánto gana al año cada persona, con su bono?',
      example: 'S3-E-FUNCION',
      reading:
        'La función calcula (salario + bono) × 12, tratando el bono NULL como 0; el bloque la llama para dos personas.',
    },
    more: [
      {
        question: 'La misma función dentro de una consulta SQL.',
        example: 'S3-E-FUNCION-EN-SQL',
        reading:
          'Después de crearla, una consulta la usa como una columna calculada para Recursos Humanos.',
      },
      {
        question: 'Error: un camino sin RETURN.',
        example: 'S3-E-FUNCION-SIN-RETURN',
        reading:
          'Para 2.100.000 ninguna rama del IF devuelve nada: ORA-06503 (la función terminó sin valor).',
      },
    ],
    changed: ['Una sola definición sirve en PL/SQL y en SQL.'],
    mistakes: [
      {
        title: 'Olvidar un RETURN',
        why: 'Si algún camino llega a END sin RETURN, ORA-06503 al ejecutar.',
      },
      {
        title: 'Modificar datos en una función usada en SQL',
        why: 'Una función que hace UPDATE no puede llamarse desde un SELECT (Oracle lo impide).',
      },
    ],
    check: {
      id: 'S3-L20-C',
      kind: 'choice',
      lesson: 'S3-L20',
      prompt:
        'salario_anual(7) devuelve 50400000 para Paula (salario 4.200.000, bono NULL). ¿Por qué no devuelve NULL?',
      options: [
        {
          text: 'Porque la función convierte el bono NULL en 0 con NVL antes de sumar.',
          correct: true,
          feedback: 'Correcto: sin NVL, 4200000 + NULL sería NULL.',
        },
        {
          text: 'Porque RETURN convierte NULL en 0.',
          correct: false,
          feedback: 'RETURN devuelve lo que recibe, también NULL.',
        },
        {
          text: 'Porque las funciones nunca devuelven NULL.',
          correct: false,
          feedback: 'Una función puede devolver NULL.',
        },
        {
          text: 'Porque SELECT INTO ignora el bono.',
          correct: false,
          feedback: 'Sí lo lee: llega como NULL.',
        },
      ],
      hints: ['Mira la línea del RETURN.', '¿Qué función de la Sección 1 trata los NULL?'],
      explanation: 'NVL(v_bono, 0) evita que el NULL anule toda la suma.',
    },
    keyIdea: 'Función = cálculo con RETURN, utilizable en expresiones y en SQL.',
    topic: 'subprogramas',
    version: 1,
  },
  {
    id: 'S3-L21',
    block: 'funciones',
    slug: 'procedimiento-o-funcion',
    title: '¿Procedimiento o función?',
    shortTitle: 'Procedimiento o función',
    summary:
      'Una función devuelve un valor y se usa en expresiones; un procedimiento realiza una acción y se llama como sentencia.',
    concepts: ['function', 'procedure'],
    purpose: 'Elegir la forma correcta según la tarea: calcular algo o hacer algo.',
    syntax: lines(
      'v := mi_funcion(x);          -- función: en una expresión',
      'mi_procedimiento(x, y);      -- procedimiento: como sentencia',
    ),
    explanation: [
      'Si la tarea responde una pregunta con un valor (¿cuánto gana al año?), es una función: se puede usar en un SELECT, en un WHERE o en una asignación.',
      'Si la tarea cambia datos o devuelve varios resultados (aumentar salarios, calcular conteo y promedio), es un procedimiento, con parámetros OUT si hace falta devolver algo.',
      'Un procedimiento no puede usarse dentro de una consulta: Oracle no lo reconoce como expresión (ORA-00904).',
    ],
    example: {
      question: '¿Quién gana más de 70.000.000 al año? Una función en el WHERE.',
      example: 'S3-E-FUNCION-EN-WHERE',
      reading:
        'La consulta filtra con la función: solo una función puede aparecer dentro de SQL así.',
    },
    more: [
      {
        question: 'Error: un procedimiento dentro de un SELECT.',
        example: 'S3-E-PROC-EN-SQL',
        reading:
          'aumentar_salario no devuelve valor: en un SELECT Oracle responde ORA-00904 (identificador no válido).',
      },
    ],
    changed: ['La condición del WHERE usa un cálculo encapsulado.'],
    mistakes: [
      {
        title: 'Usar una función para modificar datos',
        why: 'Las acciones van en procedimientos; las funciones, para calcular.',
      },
    ],
    check: {
      id: 'S3-L21-C',
      kind: 'choice',
      lesson: 'S3-L21',
      prompt:
        'Necesitas «aplicar un aumento a todo un departamento y saber a cuántas personas se aplicó». ¿Qué escribes?',
      options: [
        {
          text: 'Un procedimiento con un parámetro OUT para el conteo.',
          correct: true,
          feedback: 'Correcto: es una acción que también devuelve un dato.',
        },
        {
          text: 'Una función que haga el UPDATE y devuelva el conteo.',
          correct: false,
          feedback: 'Posible en PL/SQL, pero no se podría usar en SQL y mezcla cálculo con acción.',
        },
        { text: 'Una consulta SELECT.', correct: false, feedback: 'SELECT no modifica datos.' },
        {
          text: 'Un cursor sin procedimiento.',
          correct: false,
          feedback: 'El cursor recorre filas; no encapsula la tarea.',
        },
      ],
      hints: ['¿La tarea calcula o actúa?', 'Un procedimiento puede devolver datos con OUT.'],
      explanation: 'Acción + resultado → procedimiento con parámetro OUT.',
    },
    keyIdea: 'Calcular → función. Hacer → procedimiento.',
    topic: 'subprogramas',
    version: 1,
  },
  {
    id: 'S3-L22',
    block: 'paquetes',
    slug: 'paquetes',
    title: 'Paquetes: especificación y cuerpo',
    shortTitle: 'Paquetes',
    summary:
      'Un paquete agrupa funciones, procedimientos y constantes relacionados: la especificación dice qué es público y el cuerpo lo implementa.',
    concepts: ['package'],
    purpose:
      'Organizar y encapsular la lógica de un tema (por ejemplo, Recursos Humanos) en una sola unidad.',
    syntax: lines(
      'CREATE OR REPLACE PACKAGE p IS        -- especificación (pública)',
      '  FUNCTION f (…) RETURN tipo;',
      '  PROCEDURE q (…);',
      'END p;',
      '',
      'CREATE OR REPLACE PACKAGE BODY p IS   -- cuerpo (implementación)',
      '  FUNCTION f … END f;',
      '  PROCEDURE q … END q;',
      'END p;',
    ),
    explanation: [
      'La especificación (PACKAGE) es el contrato: lo que otros programas pueden usar. El cuerpo (PACKAGE BODY) contiene el código y puede tener elementos privados que solo usa el propio paquete.',
      'Desde fuera, todo se nombra con el prefijo del paquete: rrhh_pkg.salario_anual(7). Un elemento privado no es visible fuera (PLS-00302).',
      'En este curso los paquetes son una introducción: sirven para ordenar y encapsular; sus usos avanzados quedan como ampliación.',
    ],
    example: {
      question: 'Un paquete de Recursos Humanos con una constante, una función y un procedimiento.',
      example: 'S3-E-PAQUETE',
      reading:
        'El bloque consulta el salario anual de Paula, le aplica un 10 % a través del paquete y lee de nuevo; también muestra la constante pública del tope.',
    },
    more: [
      {
        question: 'El paquete aplica su regla: tope del 15 %.',
        example: 'S3-E-PAQUETE-TOPE',
        reading: 'Un aumento del 20 % supera el tope: ORA-20003.',
      },
      {
        question: 'Error: usar un elemento privado.',
        example: 'S3-E-PAQUETE-PRIVADO',
        reading: 'redondear solo está en el cuerpo: fuera del paquete, Oracle responde PLS-00302.',
      },
    ],
    changed: [
      'El salario de Paula cambia a través del paquete; nadie fuera usa redondear directamente.',
    ],
    mistakes: [
      {
        title: 'Crear el cuerpo sin la especificación',
        why: 'Primero se crea PACKAGE y después PACKAGE BODY.',
      },
      {
        title: 'Cabeceras distintas',
        why: 'Cada subprograma público debe tener la misma cabecera en la especificación y en el cuerpo.',
      },
    ],
    check: {
      id: 'S3-L22-C',
      kind: 'choice',
      lesson: 'S3-L22',
      prompt: '¿Qué parte de un paquete decide qué pueden usar otros programas?',
      options: [
        {
          text: 'La especificación (PACKAGE).',
          correct: true,
          feedback: 'Correcto: es la parte pública.',
        },
        {
          text: 'El cuerpo (PACKAGE BODY).',
          correct: false,
          feedback: 'El cuerpo implementa; lo que solo está ahí es privado.',
        },
        {
          text: 'Cada procedimiento por separado.',
          correct: false,
          feedback: 'La visibilidad la define la especificación.',
        },
        {
          text: 'El GRANT del paquete.',
          correct: false,
          feedback: 'GRANT da permiso sobre el paquete; no decide sus elementos públicos.',
        },
      ],
      hints: [
        'Hay una parte pública y otra de implementación.',
        'redondear no estaba en la especificación.',
      ],
      explanation:
        'Lo declarado en la especificación es público; lo que solo está en el cuerpo, privado.',
    },
    keyIdea: 'Especificación = qué se ofrece; cuerpo = cómo se hace (y lo privado).',
    topic: 'paquetes',
    version: 1,
  },
];
