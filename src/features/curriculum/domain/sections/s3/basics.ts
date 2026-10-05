import { lines, plsql, query, source } from '../../builders';
import type { CurriculumExample, CurriculumLesson } from '../../types';

/**
 * Sección 3, bloques 1 a 6: qué es PL/SQL, estructura de bloques, variables y tipos, SQL
 * dentro de PL/SQL, condicionales y bucles. Cada bloque se ejecuta en Oracle (esquema de
 * verificación con el dataset empresa-relacional-v1) y su salida de DBMS_OUTPUT queda
 * verificada; los recorridos paso a paso deben imprimir exactamente lo mismo.
 */

const EMPLEADOS_DEP_50 =
  'SELECT id_empleado, nombre, bono FROM empleados WHERE id_departamento = 50 ORDER BY id_empleado';

export const BASICS_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloque 1: qué es PL/SQL ---------- */
  plsql(
    'S3-E-PRIMER-BLOQUE',
    lines(
      'DECLARE',
      '  v_total NUMBER;',
      'BEGIN',
      '  SELECT COUNT(*) INTO v_total',
      '  FROM empleados',
      "  WHERE estado = 'ACTIVO';",
      '  IF v_total > 15 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Plantilla amplia: ' || v_total || ' personas activas');",
      '  ELSE',
      "    DBMS_OUTPUT.PUT_LINE('Plantilla reducida: ' || v_total || ' personas activas');",
      '  END IF;',
      'END;',
    ),
    {
      trace: [
        {
          line: 2,
          note: 'DECLARE reserva la variable v_total. Todavía no tiene valor.',
          vars: { v_total: 'NULL' },
        },
        {
          line: 4,
          note: 'SELECT … INTO ejecuta una consulta SQL y guarda su único valor en la variable.',
          vars: { v_total: '17' },
        },
        { line: 7, note: 'IF evalúa la condición: 17 > 15 es verdadero.', vars: { v_total: '17' } },
        {
          line: 8,
          note: 'Se ejecuta la rama THEN y DBMS_OUTPUT escribe una línea de salida.',
          vars: { v_total: '17' },
          output: 'Plantilla amplia: 17 personas activas',
        },
        {
          line: 12,
          note: 'END cierra el bloque. La rama ELSE no se ejecutó.',
          vars: { v_total: '17' },
        },
      ],
    },
  ),
  query(
    'S3-E-SQL-SOLO',
    lines('SELECT COUNT(*) AS activos', 'FROM empleados', "WHERE estado = 'ACTIVO';"),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'ESTADO'])],
  ),

  /* ---------- Bloque 2: estructura ---------- */
  plsql(
    'S3-E-ESTRUCTURA',
    lines(
      'DECLARE',
      '  v_nombre VARCHAR2(40);',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      '  WHERE id_empleado = 99;',
      "  DBMS_OUTPUT.PUT_LINE('Encontrado: ' || v_nombre);",
      'EXCEPTION',
      '  WHEN NO_DATA_FOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('No existe el empleado 99');",
      'END;',
    ),
    {
      trace: [
        {
          line: 2,
          note: 'Sección declarativa: la variable v_nombre existe, vacía.',
          vars: { v_nombre: 'NULL' },
        },
        {
          line: 4,
          note: 'Sección ejecutable: la consulta no encuentra el empleado 99 y Oracle lanza NO_DATA_FOUND.',
          vars: { v_nombre: 'NULL' },
        },
        {
          line: 9,
          note: 'La línea 7 nunca se ejecuta: el control salta a la sección EXCEPTION y busca un manejador.',
          vars: { v_nombre: 'NULL' },
        },
        {
          line: 10,
          note: 'El manejador de NO_DATA_FOUND responde con un mensaje. El bloque termina sin error.',
          vars: { v_nombre: 'NULL' },
          output: 'No existe el empleado 99',
        },
      ],
    },
  ),
  plsql('S3-E-SOLO-BEGIN', lines('BEGIN', "  DBMS_OUTPUT.PUT_LINE('Hola desde PL/SQL');", 'END;')),
  plsql(
    'S3-E-SIN-PUNTO-Y-COMA',
    lines('BEGIN', "  DBMS_OUTPUT.PUT_LINE('Hola desde PL/SQL')", 'END;'),
    { expectError: 'PLS-00103' },
  ),
  plsql('S3-E-ANONIMO-VS-ALMACENADO', lines('BEGIN', '  saludar;', '  saludar;', 'END;'), {
    setup: [
      lines(
        'CREATE OR REPLACE PROCEDURE saludar IS',
        'BEGIN',
        "  DBMS_OUTPUT.PUT_LINE('Hola desde un procedimiento guardado en la base');",
        'END saludar;',
      ),
    ],
  }),

  /* ---------- Bloque 3: variables y tipos ---------- */
  plsql(
    'S3-E-VARIABLES',
    lines(
      'DECLARE',
      '  c_aumento CONSTANT NUMBER := 0.10;',
      '  v_salario NUMBER(10) := 4200000;',
      "  v_nombre  VARCHAR2(40) := 'Andrés';",
      "  v_ingreso DATE := DATE '2019-04-08';",
      '  v_activo  BOOLEAN := TRUE;',
      '  v_nuevo   NUMBER(10);',
      'BEGIN',
      '  v_nuevo := v_salario + v_salario * c_aumento;',
      "  DBMS_OUTPUT.PUT_LINE(v_nombre || ' pasaría de ' || v_salario || ' a ' || v_nuevo);",
      "  DBMS_OUTPUT.PUT_LINE('Ingresó el ' || TO_CHAR(v_ingreso, 'YYYY-MM-DD'));",
      '  IF v_activo THEN',
      "    DBMS_OUTPUT.PUT_LINE('Estado: activo');",
      '  END IF;',
      'END;',
    ),
    {
      trace: [
        {
          line: 2,
          note: 'Cada declaración tiene nombre, tipo y, si se quiere, valor inicial con :=. CONSTANT no podrá cambiar.',
          vars: {
            c_aumento: '0.10',
            v_salario: '4200000',
            v_nombre: "'Andrés'",
            v_ingreso: '2019-04-08',
            v_activo: 'TRUE',
            v_nuevo: 'NULL',
          },
        },
        {
          line: 9,
          note: 'La asignación := calcula 4200000 + 4200000 × 0,10.',
          vars: { v_nuevo: '4620000' },
        },
        {
          line: 10,
          note: '|| concatena textos y números en una sola línea.',
          vars: { v_nuevo: '4620000' },
          output: 'Andrés pasaría de 4200000 a 4620000',
        },
        {
          line: 11,
          note: 'TO_CHAR da formato explícito a la fecha (no depende de la configuración de la sesión).',
          output: 'Ingresó el 2019-04-08',
        },
        {
          line: 12,
          note: 'Un BOOLEAN se usa directamente como condición.',
          vars: { v_activo: 'TRUE' },
        },
        { line: 13, note: 'La condición es verdadera.', output: 'Estado: activo' },
      ],
    },
  ),
  plsql(
    'S3-E-CONSTANTE',
    lines(
      'DECLARE',
      '  c_aumento CONSTANT NUMBER := 0.10;',
      'BEGIN',
      '  c_aumento := 0.20;',
      'END;',
    ),
    { expectError: 'PLS-00363' },
  ),
  plsql('S3-E-NO-DECLARADA', lines('BEGIN', '  v_total := 10;', 'END;'), {
    expectError: 'PLS-00201',
  }),
  plsql(
    'S3-E-ROWTYPE',
    lines(
      'DECLARE',
      '  v_emp     empleados%ROWTYPE;',
      '  v_salario empleados.salario%TYPE;',
      'BEGIN',
      '  SELECT * INTO v_emp',
      '  FROM empleados',
      '  WHERE id_empleado = 7;',
      '  v_salario := v_emp.salario;',
      "  DBMS_OUTPUT.PUT_LINE(v_emp.nombre || ' ' || v_emp.apellido || ' · ' || v_emp.cargo);",
      "  DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario);",
      "  DBMS_OUTPUT.PUT_LINE('Bono: ' || NVL(TO_CHAR(v_emp.bono), 'sin bono'));",
      'END;',
    ),
    {
      before: [
        'SELECT id_empleado, nombre, apellido, cargo, salario, bono FROM empleados WHERE id_empleado = 7',
      ],
    },
  ),
  plsql(
    'S3-E-TYPE-TAMANO',
    lines(
      'DECLARE',
      '  v_nombre VARCHAR2(3);',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      '  WHERE id_empleado = 7;',
      'END;',
    ),
    { expectError: 'ORA-06502' },
  ),
  plsql(
    'S3-E-ALCANCE',
    lines(
      'DECLARE',
      "  v_mensaje VARCHAR2(40) := 'externo';",
      'BEGIN',
      '  DECLARE',
      "    v_mensaje VARCHAR2(40) := 'interno';",
      '  BEGIN',
      "    DBMS_OUTPUT.PUT_LINE('Dentro: ' || v_mensaje);",
      '  END;',
      "  DBMS_OUTPUT.PUT_LINE('Fuera: ' || v_mensaje);",
      'END;',
    ),
    {
      trace: [
        {
          line: 2,
          note: 'El bloque externo declara v_mensaje.',
          vars: { 'v_mensaje (externa)': "'externo'" },
        },
        {
          line: 5,
          note: 'El bloque anidado declara otra variable con el mismo nombre: dentro de él, oculta a la externa.',
          vars: { 'v_mensaje (externa)': "'externo'", 'v_mensaje (interna)': "'interno'" },
        },
        {
          line: 7,
          note: 'Dentro del bloque anidado, v_mensaje es la interna.',
          vars: { 'v_mensaje (externa)': "'externo'", 'v_mensaje (interna)': "'interno'" },
          output: 'Dentro: interno',
        },
        {
          line: 8,
          note: 'Al terminar el bloque anidado, su variable deja de existir.',
          vars: { 'v_mensaje (externa)': "'externo'" },
        },
        {
          line: 9,
          note: 'Fuera, v_mensaje vuelve a ser la externa.',
          vars: { 'v_mensaje (externa)': "'externo'" },
          output: 'Fuera: externo',
        },
      ],
    },
  ),
  plsql(
    'S3-E-ALCANCE-ERROR',
    lines(
      'BEGIN',
      '  DECLARE',
      '    v_interno NUMBER := 1;',
      '  BEGIN',
      '    NULL;',
      '  END;',
      "  DBMS_OUTPUT.PUT_LINE('Valor: ' || v_interno);",
      'END;',
    ),
    { expectError: 'PLS-00201' },
  ),

  /* ---------- Bloque 4: SQL dentro de PL/SQL ---------- */
  plsql(
    'S3-E-SELECT-INTO',
    lines(
      'DECLARE',
      '  v_nombre  empleados.nombre%TYPE;',
      '  v_salario empleados.salario%TYPE;',
      '  v_area    departamentos.nombre_departamento%TYPE;',
      'BEGIN',
      '  SELECT e.nombre, e.salario, d.nombre_departamento',
      '  INTO v_nombre, v_salario, v_area',
      '  FROM empleados e',
      '  JOIN departamentos d ON e.id_departamento = d.id_departamento',
      '  WHERE e.id_empleado = 13;',
      "  DBMS_OUTPUT.PUT_LINE(v_nombre || ' trabaja en ' || v_area || ' y gana ' || v_salario);",
      'END;',
    ),
  ),
  plsql(
    'S3-E-TOO-MANY',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      '  WHERE id_departamento = 20;',
      'END;',
    ),
    { expectError: 'ORA-01422' },
  ),
  plsql(
    'S3-E-NO-DATA',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      '  WHERE id_empleado = 99;',
      'END;',
    ),
    { expectError: 'ORA-01403' },
  ),
  plsql(
    'S3-E-UPDATE-ROWCOUNT',
    lines(
      'BEGIN',
      '  UPDATE empleados',
      '  SET bono = NVL(bono, 0) + 100000',
      '  WHERE id_departamento = 50;',
      "  DBMS_OUTPUT.PUT_LINE('Filas actualizadas: ' || SQL%ROWCOUNT);",
      'END;',
    ),
    { before: [EMPLEADOS_DEP_50], after: [EMPLEADOS_DEP_50] },
  ),
  plsql(
    'S3-E-ROLLBACK',
    lines(
      'BEGIN',
      '  DELETE FROM asignaciones WHERE id_proyecto = 101;',
      "  DBMS_OUTPUT.PUT_LINE('Borradas: ' || SQL%ROWCOUNT);",
      '  ROLLBACK;',
      "  DBMS_OUTPUT.PUT_LINE('Deshecho con ROLLBACK');",
      'END;',
    ),
    {
      after: ['SELECT COUNT(*) AS asignaciones_101 FROM asignaciones WHERE id_proyecto = 101'],
    },
  ),

  /* ---------- Bloque 5: condicionales ---------- */
  plsql(
    'S3-E-IF',
    lines(
      'DECLARE',
      '  v_salario empleados.salario%TYPE;',
      '  v_nivel   VARCHAR2(20);',
      'BEGIN',
      '  SELECT salario INTO v_salario',
      '  FROM empleados',
      '  WHERE id_empleado = 6;',
      '  IF v_salario >= 6000000 THEN',
      "    v_nivel := 'Alto';",
      '  ELSIF v_salario >= 4000000 THEN',
      "    v_nivel := 'Medio';",
      '  ELSE',
      "    v_nivel := 'Inicial';",
      '  END IF;',
      "  DBMS_OUTPUT.PUT_LINE('Andrés: ' || v_salario || ' -> nivel ' || v_nivel);",
      'END;',
    ),
    {
      trace: [
        {
          line: 5,
          note: 'SELECT INTO trae el salario de Andrés.',
          vars: { v_salario: '4200000', v_nivel: 'NULL' },
        },
        {
          line: 8,
          note: 'Primera condición: 4200000 >= 6000000 es falsa. Se pasa a ELSIF.',
          vars: { v_salario: '4200000', v_nivel: 'NULL' },
        },
        {
          line: 10,
          note: 'Segunda condición: 4200000 >= 4000000 es verdadera.',
          vars: { v_salario: '4200000', v_nivel: 'NULL' },
        },
        {
          line: 11,
          note: 'Se ejecuta solo esta rama; ELSE ya no se evalúa.',
          vars: { v_salario: '4200000', v_nivel: "'Medio'" },
        },
        {
          line: 15,
          note: 'Después de END IF el programa sigue normalmente.',
          vars: { v_salario: '4200000', v_nivel: "'Medio'" },
          output: 'Andrés: 4200000 -> nivel Medio',
        },
      ],
    },
  ),
  plsql(
    'S3-E-IF-NULL',
    lines(
      'DECLARE',
      '  v_bono empleados.bono%TYPE;',
      'BEGIN',
      '  SELECT bono INTO v_bono FROM empleados WHERE id_empleado = 7;',
      '  IF v_bono > 0 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Tiene bono');",
      '  ELSE',
      "    DBMS_OUTPUT.PUT_LINE('Sin bono o bono desconocido');",
      '  END IF;',
      'END;',
    ),
  ),
  plsql(
    'S3-E-SIN-END-IF',
    lines(
      'DECLARE',
      '  v_total NUMBER := 5;',
      'BEGIN',
      '  IF v_total > 3 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Mayor que 3');",
      'END;',
    ),
    { expectError: 'PLS-00103' },
  ),
  plsql(
    'S3-E-CASE',
    lines(
      'DECLARE',
      '  v_area    departamentos.nombre_departamento%TYPE;',
      '  v_mensaje VARCHAR2(60);',
      'BEGIN',
      '  SELECT d.nombre_departamento INTO v_area',
      '  FROM empleados e',
      '  JOIN departamentos d ON e.id_departamento = d.id_departamento',
      '  WHERE e.id_empleado = 9;',
      '  v_mensaje := CASE v_area',
      "                 WHEN 'Ventas' THEN 'Meta comercial trimestral'",
      "                 WHEN 'TI'     THEN 'Entrega de proyectos'",
      "                 ELSE 'Plan general del área'",
      '               END;',
      "  DBMS_OUTPUT.PUT_LINE(v_area || ': ' || v_mensaje);",
      'END;',
    ),
  ),
  plsql(
    'S3-E-CASE-BUSQUEDA',
    lines(
      'DECLARE',
      '  v_horas NUMBER;',
      'BEGIN',
      '  SELECT SUM(horas_semanales) INTO v_horas',
      '  FROM asignaciones',
      '  WHERE id_empleado = 7;',
      '  CASE',
      "    WHEN v_horas > 40 THEN DBMS_OUTPUT.PUT_LINE('Sobrecarga: ' || v_horas || ' h');",
      "    WHEN v_horas >= 30 THEN DBMS_OUTPUT.PUT_LINE('Carga alta: ' || v_horas || ' h');",
      "    ELSE DBMS_OUTPUT.PUT_LINE('Carga normal: ' || v_horas || ' h');",
      '  END CASE;',
      'END;',
    ),
  ),
  plsql(
    'S3-E-CASE-NOT-FOUND',
    lines(
      'DECLARE',
      '  v_horas NUMBER;',
      'BEGIN',
      '  SELECT SUM(horas_semanales) INTO v_horas',
      '  FROM asignaciones',
      '  WHERE id_empleado = 12;',
      '  CASE',
      "    WHEN v_horas > 40 THEN DBMS_OUTPUT.PUT_LINE('Sobrecarga');",
      "    WHEN v_horas >= 30 THEN DBMS_OUTPUT.PUT_LINE('Carga alta');",
      '  END CASE;',
      'END;',
    ),
    { expectError: 'ORA-06592' },
  ),

  /* ---------- Bloque 6: bucles ---------- */
  plsql(
    'S3-E-LOOP',
    lines(
      'DECLARE',
      '  v_salario empleados.salario%TYPE;',
      '  v_anios   NUMBER := 0;',
      'BEGIN',
      '  SELECT salario INTO v_salario FROM empleados WHERE id_empleado = 18;',
      '  LOOP',
      '    v_salario := ROUND(v_salario * 1.08);',
      '    v_anios := v_anios + 1;',
      "    DBMS_OUTPUT.PUT_LINE('Año ' || v_anios || ': ' || v_salario);",
      '    EXIT WHEN v_salario >= 2600000;',
      '  END LOOP;',
      'END;',
    ),
    {
      trace: [
        {
          line: 5,
          note: 'Felipe gana 2100000. La pregunta: ¿cuántos años con aumentos del 8 % para llegar a 2600000?',
          vars: { v_salario: '2100000', v_anios: '0' },
        },
        {
          line: 7,
          note: 'Primera vuelta: aumenta el salario.',
          vars: { v_salario: '2268000', v_anios: '0' },
        },
        {
          line: 9,
          note: 'Cuenta el año y lo escribe.',
          vars: { v_salario: '2268000', v_anios: '1' },
          output: 'Año 1: 2268000',
        },
        {
          line: 10,
          note: 'EXIT WHEN: 2268000 >= 2600000 es falso, el bucle continúa.',
          vars: { v_salario: '2268000', v_anios: '1' },
        },
        {
          line: 9,
          note: 'Segunda vuelta.',
          vars: { v_salario: '2449440', v_anios: '2' },
          output: 'Año 2: 2449440',
        },
        {
          line: 9,
          note: 'Tercera vuelta.',
          vars: { v_salario: '2645395', v_anios: '3' },
          output: 'Año 3: 2645395',
        },
        {
          line: 10,
          note: 'EXIT WHEN: 2645395 >= 2600000 es verdadero. El bucle termina.',
          vars: { v_salario: '2645395', v_anios: '3' },
        },
      ],
    },
  ),
  plsql(
    'S3-E-FOR',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  FOR i IN 2..5 LOOP',
      '    SELECT nombre INTO v_nombre FROM empleados WHERE id_empleado = i;',
      "    DBMS_OUTPUT.PUT_LINE('Líder ' || i || ': ' || v_nombre);",
      '  END LOOP;',
      'END;',
    ),
    {
      trace: [
        {
          line: 4,
          note: 'FOR declara el contador i y le da el primer valor del rango.',
          vars: { i: '2' },
        },
        {
          line: 6,
          note: 'Primera vuelta.',
          vars: { i: '2', v_nombre: "'Carlos'" },
          output: 'Líder 2: Carlos',
        },
        {
          line: 6,
          note: 'El contador sube solo.',
          vars: { i: '3', v_nombre: "'María'" },
          output: 'Líder 3: María',
        },
        {
          line: 6,
          note: 'Tercera vuelta.',
          vars: { i: '4', v_nombre: "'Jorge'" },
          output: 'Líder 4: Jorge',
        },
        {
          line: 6,
          note: 'Última vuelta: i llega al final del rango.',
          vars: { i: '5', v_nombre: "'Laura'" },
          output: 'Líder 5: Laura',
        },
        { line: 7, note: 'END LOOP: el rango terminó. Fuera del bucle, i ya no existe.' },
      ],
    },
  ),
  plsql(
    'S3-E-CHECK-FOR',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  FOR i IN 2..3 LOOP',
      '    SELECT nombre INTO v_nombre FROM empleados WHERE id_empleado = i;',
      "    DBMS_OUTPUT.PUT_LINE('Líder ' || i || ': ' || v_nombre);",
      '  END LOOP;',
      'END;',
    ),
  ),
  plsql(
    'S3-E-WHILE',
    lines(
      'DECLARE',
      '  v_presupuesto proyectos.presupuesto%TYPE;',
      '  v_mes         NUMBER := 0;',
      'BEGIN',
      '  SELECT presupuesto INTO v_presupuesto FROM proyectos WHERE id_proyecto = 104;',
      '  WHILE v_presupuesto > 0 LOOP',
      '    v_mes := v_mes + 1;',
      '    v_presupuesto := v_presupuesto - 12000000;',
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Con 12000000 al mes, el presupuesto se agota en el mes ' || v_mes);",
      'END;',
    ),
  ),
];

export const BASICS_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S3-L01',
    block: 'que-es-plsql',
    slug: 'sql-y-plsql',
    title: 'SQL y PL/SQL: de pedir datos a programar con ellos',
    shortTitle: 'SQL y PL/SQL',
    summary:
      'SQL dice qué datos quieres; PL/SQL añade variables, decisiones y repeticiones alrededor de SQL, dentro de Oracle.',
    concepts: ['plsql', 'block', 'anonymous-block', 'dbms-output'],
    purpose:
      'Automatizar tareas que una sola consulta no puede resolver: decidir según un dato, recorrer filas, validar y reaccionar a cambios.',
    syntax: lines('BEGIN', "  DBMS_OUTPUT.PUT_LINE('Hola desde PL/SQL');", 'END;'),
    explanation: [
      'SQL es declarativo: describes el resultado («cuenta las personas activas») y Oracle decide cómo obtenerlo. PL/SQL permite organizar varias acciones en un programa.',
      'PL/SQL (Procedural Language/SQL) es el lenguaje de programación de Oracle. Ejecuta sentencias SQL y, alrededor de ellas, usa variables, condiciones (IF), bucles (LOOP) y manejo de errores. Se ejecuta dentro de la base de datos, cerca de los datos.',
      'Sirve para automatizar procesos, validar reglas, procesar fila a fila, encapsular lógica en procedimientos y funciones, y reaccionar a eventos con triggers.',
    ],
    example: {
      question: '¿Cuál es el programa más pequeño que escribe un saludo?',
      example: 'S3-E-SOLO-BEGIN',
      reading:
        'BEGIN inicia la parte ejecutable. PUT_LINE añade el saludo al búfer de DBMS_OUTPUT. END; cierra el bloque.',
    },
    more: [
      {
        question: 'Con SQL obtenemos una tabla de resultados.',
        example: 'S3-E-SQL-SOLO',
        reading:
          'La consulta cuenta 17 personas activas y devuelve una fila. SQL también tiene expresiones condicionales; PL/SQL coordina acciones alrededor de SQL.',
      },
    ],
    changed: [
      'El bloque ejecuta una acción: añade el saludo al búfer de DBMS_OUTPUT.',
      'En el saludo no se lee ninguna tabla ni cambia ningún dato. La salida se muestra cuando el cliente recoge DBMS_OUTPUT.',
    ],
    mistakes: [
      {
        title: 'Creer que PL/SQL reemplaza a SQL',
        why: 'PL/SQL no consulta datos por sí mismo: ejecuta SQL. Si algo se resuelve con una sola consulta, la consulta es la mejor opción.',
      },
    ],
    check: {
      id: 'S3-L01-C',
      kind: 'choice',
      lesson: 'S3-L01',
      prompt: '¿Qué puede hacer un bloque PL/SQL que una consulta SELECT sola no hace?',
      options: [
        {
          text: 'Guardar un valor en una variable y decidir qué hacer según ese valor.',
          correct: true,
          feedback: 'Correcto: variables y control de flujo son lo que PL/SQL añade.',
        },
        {
          text: 'Filtrar filas con una condición.',
          correct: false,
          feedback: 'Eso ya lo hace SQL con WHERE.',
        },
        {
          text: 'Unir dos tablas.',
          correct: false,
          feedback: 'Eso lo hace SQL con JOIN.',
        },
        {
          text: 'Leer datos sin escribir ninguna sentencia SQL.',
          correct: false,
          feedback: 'PL/SQL lee datos ejecutando SQL; no tiene otra forma de consultarlos.',
        },
      ],
      hints: [
        'Compara obtener una tabla de resultados con organizar varias acciones.',
        'El saludo usa BEGIN y END; más adelante aprenderás variables e IF.',
      ],
      explanation:
        'PL/SQL añade variables, condiciones, bucles y manejo de errores alrededor de SQL.',
    },
    keyIdea: 'SQL pide datos; PL/SQL programa con ellos dentro de Oracle.',
    topic: 'bloques',
    version: 2,
  },
  {
    id: 'S3-L02',
    block: 'bloques',
    slug: 'estructura-de-un-bloque',
    title: 'Estructura de un bloque: DECLARE, BEGIN, EXCEPTION y END',
    shortTitle: 'Estructura',
    summary:
      'Un bloque tiene una parte declarativa opcional, una ejecutable obligatoria y una de manejo de errores opcional.',
    concepts: ['block'],
    purpose:
      'Saber dónde va cada cosa: declarar antes de usar, ejecutar en BEGIN y responder a errores en EXCEPTION.',
    syntax: lines(
      'DECLARE      -- opcional: variables, constantes, cursores',
      'BEGIN        -- obligatorio: sentencias',
      'EXCEPTION    -- opcional: qué hacer si algo falla',
      'END;',
    ),
    explanation: [
      'DECLARE abre la sección declarativa: ahí se crean variables, constantes, cursores y excepciones. Es opcional.',
      'BEGIN abre la sección ejecutable, la única obligatoria: sentencias SQL y PL/SQL, cada una terminada en punto y coma.',
      'EXCEPTION abre la sección de manejo de errores: si una sentencia falla, el control salta aquí. END; cierra el bloque.',
    ],
    example: {
      question: '¿Podemos ejecutar un bloque sin DECLARE ni EXCEPTION?',
      example: 'S3-E-SOLO-BEGIN',
      reading:
        'BEGIN empieza las acciones. DBMS_OUTPUT.PUT_LINE escribe una línea. END; termina el bloque. DECLARE y EXCEPTION no son obligatorios.',
    },
    more: [
      {
        question: 'Ampliación: un bloque con manejo de errores (lo estudiarás en Excepciones).',
        example: 'S3-E-ESTRUCTURA',
        reading:
          'Busca al empleado 99; SELECT INTO no encuentra ninguna fila y el control salta al manejador NO_DATA_FOUND. Este ejemplo integra conceptos que se desarrollan más adelante.',
      },
      {
        question: 'Error: falta un punto y coma.',
        example: 'S3-E-SIN-PUNTO-Y-COMA',
        reading:
          'Oracle encuentra END donde esperaba el final de la sentencia y responde PLS-00103. El error se señala en la línea siguiente a la que le falta el punto y coma.',
      },
    ],
    changed: [
      'El bloque mínimo ejecuta PUT_LINE sin declarar variables.',
      'DECLARE y EXCEPTION se añaden cuando necesitamos preparar datos o manejar un error.',
    ],
    mistakes: [
      {
        title: 'Olvidar el punto y coma',
        why: 'Cada sentencia termina en punto y coma, también END. Oracle responde PLS-00103 (encontró un símbolo inesperado).',
      },
      {
        title: 'Declarar después de BEGIN',
        why: 'Las variables se declaran en DECLARE. Dentro de BEGIN solo se usan.',
      },
    ],
    check: {
      id: 'S3-L02-C',
      kind: 'order',
      lesson: 'S3-L02',
      prompt: 'Ordena las palabras de un bloque completo.',
      pieces: ['DECLARE', 'BEGIN', 'EXCEPTION', 'END;'],
      hints: [
        'Primero se declara, después se ejecuta.',
        'El manejo de errores va al final, antes de cerrar.',
      ],
      explanation: 'DECLARE, BEGIN, EXCEPTION y END; en ese orden.',
    },
    keyIdea: 'Declarar → ejecutar → manejar errores → cerrar.',
    topic: 'bloques',
    version: 1,
  },
  {
    id: 'S3-L03',
    block: 'bloques',
    slug: 'bloque-anonimo-y-dbms-output',
    title: 'Bloque anónimo, objeto almacenado y DBMS_OUTPUT',
    shortTitle: 'Anónimo y DBMS_OUTPUT',
    summary:
      'Un bloque anónimo se ejecuta una vez y no se guarda; un procedimiento se guarda en la base y se llama por su nombre. DBMS_OUTPUT escribe mensajes de diagnóstico.',
    concepts: ['anonymous-block', 'dbms-output', 'procedure'],
    purpose:
      'Distinguir un script de prueba de un programa reutilizable, y entender qué es (y qué no es) la salida de DBMS_OUTPUT.',
    syntax: lines(
      'BEGIN                          -- bloque anónimo',
      "  DBMS_OUTPUT.PUT_LINE('texto');",
      'END;',
      '',
      'CREATE OR REPLACE PROCEDURE nombre IS   -- objeto almacenado',
      'BEGIN',
      '  ...',
      'END nombre;',
    ),
    explanation: [
      'El bloque anónimo no tiene nombre: se envía, se ejecuta y desaparece. Es útil para pruebas y scripts.',
      'Un objeto almacenado (procedimiento, función, paquete o trigger) se compila y se guarda en la base de datos con un nombre; después cualquiera con permiso puede ejecutarlo.',
      'DBMS_OUTPUT.PUT_LINE escribe una línea en un búfer que herramientas como SQL Developer, SQL*Plus o Live SQL muestran al terminar. Es salida de diagnóstico para quien programa, no la interfaz de una aplicación: una aplicación real devuelve datos, no imprime mensajes.',
    ],
    example: {
      question: 'Un procedimiento guardado se puede llamar varias veces.',
      example: 'S3-E-ANONIMO-VS-ALMACENADO',
      reading:
        'Primero se crea el procedimiento saludar (queda guardado). Después, un bloque anónimo lo llama dos veces.',
    },
    changed: [
      'El procedimiento sigue en la base después de ejecutarse el bloque; el bloque anónimo no.',
      'Las dos líneas de salida vienen de dos llamadas al mismo código guardado.',
    ],
    mistakes: [
      {
        title: 'No ver la salida',
        why: 'DBMS_OUTPUT solo se muestra si la herramienta lo activa (SET SERVEROUTPUT ON en SQL*Plus o la pestaña de salida en SQL Developer).',
      },
      {
        title: 'Usar DBMS_OUTPUT como interfaz',
        why: 'El búfer es para diagnóstico. Una aplicación obtiene resultados con consultas, parámetros OUT o funciones.',
      },
    ],
    check: {
      id: 'S3-L03-C',
      kind: 'choice',
      lesson: 'S3-L03',
      prompt: '¿Qué diferencia un procedimiento almacenado de un bloque anónimo?',
      options: [
        {
          text: 'El procedimiento queda guardado en la base con un nombre y se puede volver a ejecutar.',
          correct: true,
          feedback: 'Correcto: CREATE PROCEDURE lo compila y lo guarda.',
        },
        {
          text: 'El bloque anónimo no puede ejecutar SQL.',
          correct: false,
          feedback: 'Un bloque anónimo ejecuta SQL igual que un procedimiento.',
        },
        {
          text: 'El procedimiento no puede usar DBMS_OUTPUT.',
          correct: false,
          feedback: 'Puede usarlo; el ejemplo lo hace.',
        },
        {
          text: 'El bloque anónimo se ejecuta más rápido siempre.',
          correct: false,
          feedback: 'La diferencia es de reutilización, no de velocidad garantizada.',
        },
      ],
      hints: [
        'Piensa en qué existe después de ejecutar cada uno.',
        'CREATE crea un objeto en la base.',
      ],
      explanation:
        'El anónimo se ejecuta una vez; el almacenado se guarda y se llama por su nombre.',
    },
    keyIdea: 'Anónimo = se ejecuta y desaparece. Almacenado = se guarda y se reutiliza.',
    topic: 'bloques',
    version: 1,
  },
  {
    id: 'S3-L04',
    block: 'variables',
    slug: 'variables-y-constantes',
    title: 'Variables, constantes y tipos de datos',
    shortTitle: 'Variables y tipos',
    summary:
      'Una variable tiene nombre, tipo y valor; se le asigna con := y una constante no puede cambiar.',
    concepts: ['variable', 'constant'],
    purpose:
      'Guardar datos intermedios (un salario, un nombre, una fecha) para calcular y decidir.',
    syntax: lines(
      'DECLARE',
      '  nombre_variable TIPO [:= valor_inicial];',
      '  nombre_constante CONSTANT TIPO := valor;',
      'BEGIN',
      '  nombre_variable := expresión;',
      'END;',
    ),
    explanation: [
      'NUMBER guarda números; VARCHAR2(n), texto hasta el límite indicado; DATE, fecha y hora. BOOLEAN guarda TRUE, FALSE o NULL. En Oracle 19c BOOLEAN es un tipo de PL/SQL; las versiones actuales también lo admiten en SQL.',
      'Una variable sin valor inicial vale NULL. La asignación usa := (el = solo compara).',
      'CONSTANT obliga a dar un valor inicial y prohíbe cambiarlo: Oracle detecta el intento al compilar (PLS-00363).',
    ],
    example: {
      question: '¿Cuánto ganaría Andrés con un aumento del 10 %?',
      example: 'S3-E-VARIABLES',
      reading:
        'Declara una constante y cinco variables de cuatro tipos, calcula el salario nuevo y escribe tres líneas.',
      visual: { kind: 'flow' },
    },
    more: [
      {
        question: 'Error: cambiar una constante.',
        example: 'S3-E-CONSTANTE',
        reading:
          'Oracle no compila el bloque: una constante no puede ser destino de una asignación (PLS-00363).',
      },
      {
        question: 'Error: usar una variable sin declararla.',
        example: 'S3-E-NO-DECLARADA',
        reading: 'v_total no existe: PLS-00201 (el identificador debe declararse).',
      },
    ],
    changed: [
      'v_nuevo empieza en NULL y termina en 4620000.',
      'El BOOLEAN no se imprime: se usa como condición.',
    ],
    mistakes: [
      {
        title: 'Usar = para asignar',
        why: 'En PL/SQL = compara. Para asignar se usa :=.',
        wrong: 'v_nuevo = v_salario * 1.10;',
        right: 'v_nuevo := v_salario * 1.10;',
      },
      {
        title: 'VARCHAR2 sin longitud',
        why: 'Una variable VARCHAR2 necesita tamaño máximo: VARCHAR2(40).',
      },
    ],
    check: {
      id: 'S3-L04-C',
      kind: 'choice',
      lesson: 'S3-L04',
      prompt: '¿Qué valor tiene una variable NUMBER declarada sin valor inicial?',
      options: [
        {
          text: 'NULL',
          code: true,
          correct: true,
          feedback: 'Correcto: sin asignación, vale NULL.',
        },
        {
          text: '0',
          code: true,
          correct: false,
          feedback: 'NULL no es 0: es la ausencia de valor.',
        },
        { text: "''", code: true, correct: false, feedback: 'Es un NUMBER, no un texto.' },
        {
          text: 'Oracle no permite declararla sin valor.',
          correct: false,
          feedback: 'Solo las constantes (y las NOT NULL) exigen valor inicial.',
        },
      ],
      hints: ['Recuerda qué representa NULL en la Sección 1.', 'Nadie le asignó nada.'],
      explanation: 'Toda variable sin valor inicial empieza en NULL.',
    },
    keyIdea: 'Nombre + tipo + valor; := asigna, CONSTANT no cambia.',
    topic: 'variables',
    version: 1,
  },
  {
    id: 'S3-L05',
    block: 'variables',
    slug: 'type-y-rowtype',
    title: '%TYPE y %ROWTYPE',
    shortTitle: '%TYPE y %ROWTYPE',
    summary:
      '%TYPE copia el tipo de una columna; %ROWTYPE crea una variable con todas las columnas de una fila.',
    concepts: ['anchored-type'],
    purpose:
      'Declarar variables que siempre coinciden con la tabla, aunque una columna cambie de tamaño o de tipo.',
    syntax: lines(
      'v_salario empleados.salario%TYPE;',
      'v_emp     empleados%ROWTYPE;   -- v_emp.nombre, v_emp.salario…',
    ),
    explanation: [
      'empleados.salario%TYPE significa «del mismo tipo que la columna SALARIO». Si la columna cambia, la variable cambia con ella al recompilar.',
      'empleados%ROWTYPE es un registro con un campo por columna; se lee con punto: v_emp.nombre. Es ideal para SELECT * INTO.',
      'Sin %TYPE es fácil equivocarse de tamaño: guardar «Paula» en un VARCHAR2(3) falla con ORA-06502.',
    ],
    example: {
      question: '¿Cómo leer toda la fila de Paula Castro de una vez?',
      example: 'S3-E-ROWTYPE',
      reading:
        'Declara un registro con la forma de una fila de EMPLEADOS, lo llena con SELECT * INTO y escribe sus campos. NVL muestra «sin bono» cuando el bono es NULL.',
    },
    more: [
      {
        question: 'Error: una variable demasiado pequeña.',
        example: 'S3-E-TYPE-TAMANO',
        reading:
          '«Paula» no cabe en VARCHAR2(3): ORA-06502 (error de valor). Con %TYPE no ocurriría.',
      },
    ],
    changed: ['Un solo SELECT llena todos los campos del registro.'],
    mistakes: [
      {
        title: 'Escribir el tipo a mano',
        why: 'Si la columna cambia de tamaño, la variable queda desactualizada. %TYPE la mantiene sincronizada.',
      },
      {
        title: 'Usar el registro sin punto',
        why: 'v_emp es la fila entera; para un dato se escribe v_emp.nombre.',
      },
    ],
    check: {
      id: 'S3-L05-C',
      kind: 'choice',
      lesson: 'S3-L05',
      prompt:
        '¿Qué declaración crea una variable con el mismo tipo que la columna NOMBRE de EMPLEADOS?',
      options: [
        {
          text: 'v_nombre empleados.nombre%TYPE;',
          code: true,
          correct: true,
          feedback: 'Correcto.',
        },
        {
          text: 'v_nombre empleados%ROWTYPE;',
          code: true,
          correct: false,
          feedback: 'Eso crea un registro con todas las columnas, no un solo dato.',
        },
        {
          text: 'v_nombre %TYPE(empleados.nombre);',
          code: true,
          correct: false,
          feedback: 'La sintaxis es tabla.columna%TYPE.',
        },
        {
          text: 'v_nombre empleados.nombre;',
          code: true,
          correct: false,
          feedback: 'Falta %TYPE: así no es un tipo válido.',
        },
      ],
      hints: ['El atributo va pegado a tabla.columna.', 'ROWTYPE es para filas completas.'],
      explanation: 'tabla.columna%TYPE copia el tipo de una columna.',
    },
    keyIdea: '%TYPE = tipo de una columna; %ROWTYPE = forma de una fila.',
    topic: 'variables',
    version: 1,
  },
  {
    id: 'S3-L06',
    block: 'variables',
    slug: 'alcance-de-variables',
    title: 'Bloques anidados y alcance de las variables',
    shortTitle: 'Alcance',
    summary:
      'Una variable existe en el bloque que la declara y en sus bloques internos; un bloque interno puede ocultarla con otra del mismo nombre.',
    concepts: ['scope'],
    purpose:
      'Entender qué variable se usa en cada punto y por qué una variable interna «desaparece» fuera de su bloque.',
    syntax: lines(
      'DECLARE',
      '  v_x …;          -- visible en todo el bloque',
      'BEGIN',
      '  DECLARE',
      '    v_y …;        -- visible solo aquí dentro',
      '  BEGIN',
      '    …',
      '  END;',
      'END;',
    ),
    explanation: [
      'Un bloque puede contener otros bloques. Las variables del bloque externo son visibles dentro; las del interno, solo dentro de él.',
      'Si el bloque interno declara una variable con el mismo nombre, dentro de él se usa la interna (la externa queda oculta). Al salir, la externa vuelve a ser la visible.',
    ],
    example: {
      question: '¿Qué v_mensaje se usa en cada línea?',
      example: 'S3-E-ALCANCE',
      reading: 'Dentro del bloque anidado se usa la variable interna; fuera, la externa.',
      visual: { kind: 'flow' },
    },
    more: [
      {
        question: 'Error: usar fuera una variable interna.',
        example: 'S3-E-ALCANCE-ERROR',
        reading:
          'v_interno solo existe dentro del bloque anidado: fuera, Oracle responde PLS-00201.',
      },
    ],
    changed: ['El mismo nombre da dos valores distintos según el bloque.'],
    mistakes: [
      {
        title: 'Repetir nombres sin querer',
        why: 'Una variable interna con el mismo nombre oculta la externa y el cálculo usa la que no esperabas. Usa nombres distintos.',
      },
    ],
    check: {
      id: 'S3-L06-C',
      kind: 'choice',
      lesson: 'S3-L06',
      context: { example: 'S3-E-ALCANCE' },
      prompt: '¿Qué escribe la línea 9 (fuera del bloque anidado)?',
      options: [
        {
          text: 'Fuera: externo',
          correct: true,
          feedback: 'Correcto: la variable interna ya no existe.',
        },
        {
          text: 'Fuera: interno',
          correct: false,
          feedback: 'La asignación interna fue a otra variable, la del bloque anidado.',
        },
        {
          text: 'Error PLS-00201',
          correct: false,
          feedback: 'v_mensaje sí está declarada en el bloque externo.',
        },
        { text: 'Fuera: ', correct: false, feedback: 'La variable externa tiene valor inicial.' },
      ],
      hints: [
        '¿Qué variable es visible en la línea 9?',
        'El bloque anidado terminó en la línea 8.',
      ],
      explanation: 'Fuera del bloque anidado, v_mensaje es la externa: «externo».',
    },
    keyIdea: 'Cada variable vive en su bloque; la interna oculta a la externa.',
    topic: 'variables',
    version: 1,
  },
  {
    id: 'S3-L07',
    block: 'sql-en-plsql',
    slug: 'select-into',
    title: 'SELECT INTO: de la tabla a la variable',
    shortTitle: 'SELECT INTO',
    summary:
      'SELECT … INTO guarda en variables los valores de exactamente una fila; con cero o varias filas, Oracle lanza una excepción.',
    concepts: ['select-into'],
    purpose: 'Traer datos de la base a variables PL/SQL para calcular, decidir o mostrar.',
    syntax: lines(
      'SELECT col1, col2',
      'INTO   var1, var2',
      'FROM   tabla',
      'WHERE  condición_que_devuelve_una_fila;',
    ),
    explanation: [
      'INTO va después de la lista de columnas: una variable por columna, en el mismo orden y con tipos compatibles.',
      'La consulta debe devolver exactamente una fila. Si no devuelve ninguna, Oracle lanza NO_DATA_FOUND (ORA-01403); si devuelve más de una, TOO_MANY_ROWS (ORA-01422).',
      'Las funciones de grupo sin GROUP BY (COUNT, SUM…) siempre devuelven una fila: son seguras con INTO. Para recorrer varias filas se usa un cursor (bloque 7).',
    ],
    example: {
      question: '¿Dónde trabaja Camila y cuánto gana?',
      example: 'S3-E-SELECT-INTO',
      reading:
        'Une EMPLEADOS y DEPARTAMENTOS para la persona 13 y guarda nombre, salario y área en tres variables.',
    },
    more: [
      {
        question: 'Error: la consulta devuelve varias filas.',
        example: 'S3-E-TOO-MANY',
        reading: 'Hay cuatro personas en el departamento 20: ORA-01422 (TOO_MANY_ROWS).',
      },
      {
        question: 'Error: la consulta no devuelve ninguna fila.',
        example: 'S3-E-NO-DATA',
        reading: 'No existe el empleado 99: ORA-01403 (NO_DATA_FOUND).',
      },
    ],
    changed: ['Una fila de un JOIN se convierte en tres variables.'],
    mistakes: [
      {
        title: 'Usar SELECT INTO para varias filas',
        why: 'INTO admite una sola fila. Para varias, un cursor.',
      },
      {
        title: 'Distinto número de columnas y variables',
        why: 'Cada columna necesita su variable: tres columnas, tres variables.',
      },
    ],
    check: {
      id: 'S3-L07-C',
      kind: 'choice',
      lesson: 'S3-L07',
      prompt: "SELECT nombre INTO v_nombre FROM empleados WHERE ciudad = 'Cali'; ¿Qué ocurre?",
      options: [
        {
          text: 'ORA-01422: hay varias personas en Cali (TOO_MANY_ROWS).',
          correct: true,
          feedback: 'Correcto: cinco personas trabajan en Cali.',
        },
        {
          text: 'Guarda el primer nombre alfabético.',
          correct: false,
          feedback: 'INTO no elige una fila: exige exactamente una.',
        },
        {
          text: 'ORA-01403 (NO_DATA_FOUND).',
          correct: false,
          feedback: 'Sí hay filas; el problema es que hay demasiadas.',
        },
        {
          text: 'Guarda todos los nombres separados por comas.',
          correct: false,
          feedback: 'Una variable VARCHAR2 recibe un solo valor.',
        },
      ],
      hints: ['¿Cuántas personas trabajan en Cali?', 'SELECT INTO necesita exactamente una fila.'],
      explanation: 'Con más de una fila, SELECT INTO lanza TOO_MANY_ROWS (ORA-01422).',
    },
    keyIdea: 'SELECT INTO = exactamente una fila → variables.',
    topic: 'variables',
    version: 1,
  },
  {
    id: 'S3-L08',
    block: 'sql-en-plsql',
    slug: 'dml-en-plsql',
    title: 'INSERT, UPDATE y DELETE en un bloque; SQL%ROWCOUNT',
    shortTitle: 'DML y SQL%ROWCOUNT',
    summary:
      'Un bloque ejecuta sentencias que modifican datos; SQL%ROWCOUNT dice cuántas filas afectó la última. COMMIT confirma y ROLLBACK deshace.',
    concepts: ['dml-in-plsql', 'implicit-cursor'],
    purpose: 'Automatizar cambios de datos y comprobar cuántas filas se modificaron.',
    syntax: lines(
      'BEGIN',
      '  UPDATE tabla SET … WHERE …;',
      '  DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT);',
      '  COMMIT;   -- o ROLLBACK;',
      'END;',
    ),
    explanation: [
      'INSERT, UPDATE y DELETE se escriben igual que en SQL. Pueden usar variables en sus valores y condiciones.',
      'Después de cada sentencia, SQL%ROWCOUNT guarda cuántas filas afectó (atributo del cursor implícito, bloque 7).',
      'Los cambios no son definitivos hasta COMMIT; ROLLBACK los deshace. En los ejemplos de DB LAB todo se deshace al terminar para que el dataset no cambie.',
    ],
    example: {
      question:
        'Sumar 100.000 al bono de Recursos Humanos, contando también a quien no tenía bono.',
      example: 'S3-E-UPDATE-ROWCOUNT',
      reading:
        'Actualiza el bono de las tres personas del departamento 50 (NVL convierte el NULL de Julián en 0 antes de sumar) e informa cuántas filas cambió.',
    },
    more: [
      {
        question: 'ROLLBACK deshace lo que la transacción no confirmó.',
        example: 'S3-E-ROLLBACK',
        reading:
          'Borra las cuatro asignaciones del proyecto 101 y luego las restaura con ROLLBACK: al final siguen ahí.',
      },
    ],
    changed: [
      'Julián pasa de NULL a 100000 gracias a NVL; sin NVL seguiría en NULL (NULL + 100000 = NULL).',
      'SQL%ROWCOUNT confirma las tres filas.',
    ],
    mistakes: [
      {
        title: 'Sumar a un NULL',
        why: 'NULL + 100000 da NULL: hay que usar NVL(bono, 0) + 100000.',
      },
      {
        title: 'Leer SQL%ROWCOUNT demasiado tarde',
        why: 'Refleja solo la última sentencia SQL ejecutada: léelo justo después.',
      },
    ],
    check: {
      id: 'S3-L08-C',
      kind: 'choice',
      lesson: 'S3-L08',
      prompt:
        'Después de UPDATE empleados SET bono = bono + 100000 WHERE id_departamento = 50; ¿qué bono tiene Julián (que tenía NULL)?',
      options: [
        { text: 'NULL', code: true, correct: true, feedback: 'Correcto: NULL + 100000 es NULL.' },
        {
          text: '100000',
          code: true,
          correct: false,
          feedback: 'Eso pasaría con NVL(bono, 0) + 100000.',
        },
        {
          text: '0',
          code: true,
          correct: false,
          feedback: 'NULL no se convierte en 0 automáticamente.',
        },
        {
          text: 'Oracle rechaza el UPDATE.',
          correct: false,
          feedback: 'El UPDATE es válido; solo da NULL en esa fila.',
        },
      ],
      hints: [
        '¿Qué resultado da una operación aritmética con NULL?',
        'La Sección 1 explicó NULL + número.',
      ],
      explanation: 'Cualquier operación aritmética con NULL da NULL. Por eso se usa NVL.',
    },
    keyIdea: 'DML en bloques + SQL%ROWCOUNT para comprobar; COMMIT o ROLLBACK para cerrar.',
    topic: 'variables',
    version: 1,
  },
  {
    id: 'S3-L09',
    block: 'condicionales',
    slug: 'if-elsif-else',
    title: 'IF, ELSIF y ELSE',
    shortTitle: 'IF',
    summary:
      'IF ejecuta la primera rama cuya condición es verdadera; ELSE recoge todo lo demás, incluidas las condiciones desconocidas por NULL.',
    concepts: ['if'],
    purpose:
      'Tomar decisiones con datos reales: clasificar un salario, validar un valor, elegir una acción.',
    syntax: lines(
      'IF condición1 THEN',
      '  …',
      'ELSIF condición2 THEN',
      '  …',
      'ELSE',
      '  …',
      'END IF;',
    ),
    explanation: [
      'Las condiciones se evalúan en orden; se ejecuta la primera verdadera y el resto se ignora. ELSIF (sin la segunda E) y ELSE son opcionales.',
      'Una condición con NULL no es verdadera: es desconocida. Por eso, si el bono es NULL, IF v_bono > 0 no entra y el control va a ELSE.',
      'Todo IF termina con END IF; (dos palabras).',
    ],
    example: {
      question: '¿En qué nivel salarial está Andrés?',
      example: 'S3-E-IF',
      reading:
        'Lee el salario de Andrés y lo clasifica: Alto desde 6.000.000, Medio desde 4.000.000 e Inicial por debajo.',
      visual: { kind: 'flow' },
    },
    more: [
      {
        question: 'Con NULL, la condición no es verdadera.',
        example: 'S3-E-IF-NULL',
        reading: 'El bono de Paula es NULL: v_bono > 0 es desconocido y se ejecuta ELSE.',
      },
      {
        question: 'Ahora sí: SQL y una decisión juntos.',
        example: 'S3-E-PRIMER-BLOQUE',
        reading:
          'SELECT INTO guarda la cantidad de personas activas en v_total. IF compara con 15. PUT_LINE escribe el mensaje de la rama elegida.',
        visual: { kind: 'flow' },
      },
      {
        question: 'Error: falta END IF.',
        example: 'S3-E-SIN-END-IF',
        reading:
          'Oracle llega a «END;» esperando «END IF;»: PLS-00103 señala el punto y coma donde esperaba la palabra IF.',
      },
    ],
    changed: ['Solo una rama se ejecuta: la de ELSIF.'],
    mistakes: [
      {
        title: 'Escribir ELSEIF o ELSE IF',
        why: 'La palabra es ELSIF. ELSE IF abre un IF nuevo que necesita su propio END IF.',
      },
      { title: 'Olvidar END IF', why: 'Cada IF se cierra con END IF;. Sin él: PLS-00103.' },
    ],
    check: {
      id: 'S3-L09-C',
      kind: 'choice',
      lesson: 'S3-L09',
      prompt: 'Con v_salario = 6000000, ¿qué nivel asigna el IF del ejemplo?',
      options: [
        { text: 'Alto', correct: true, feedback: 'Correcto: 6000000 >= 6000000 es verdadero.' },
        {
          text: 'Medio',
          correct: false,
          feedback: 'La primera condición ya es verdadera: ELSIF no se evalúa.',
        },
        {
          text: 'Alto y Medio',
          correct: false,
          feedback: 'Solo se ejecuta la primera rama verdadera.',
        },
        {
          text: 'Inicial',
          correct: false,
          feedback: 'ELSE solo se usa si ninguna condición fue verdadera.',
        },
      ],
      hints: [
        '¿La primera condición usa > o >=?',
        'IF se detiene en la primera condición verdadera.',
      ],
      explanation: '>= incluye el límite: 6000000 entra en Alto y el resto de ramas se ignora.',
    },
    keyIdea: 'Primera condición verdadera gana; NULL nunca es verdadero.',
    topic: 'control',
    version: 1,
  },
  {
    id: 'S3-L10',
    block: 'condicionales',
    slug: 'case',
    title: 'CASE: expresión y sentencia',
    shortTitle: 'CASE',
    summary:
      'CASE elige entre varias opciones: como expresión devuelve un valor; como sentencia ejecuta una rama, y sin ELSE puede fallar.',
    concepts: ['case'],
    purpose: 'Escribir decisiones de varias opciones de forma más legible que una cadena de IF.',
    syntax: lines(
      'v := CASE expresión            -- expresión CASE simple',
      '       WHEN valor1 THEN r1',
      '       ELSE r_defecto',
      '     END;',
      '',
      'CASE                           -- sentencia CASE de búsqueda',
      '  WHEN condición1 THEN sentencias;',
      '  ELSE sentencias;',
      'END CASE;',
    ),
    explanation: [
      'La expresión CASE devuelve un valor y se usa en una asignación (o en SQL). Termina con END.',
      'La sentencia CASE ejecuta sentencias y termina con END CASE. Si ninguna rama coincide y no hay ELSE, Oracle lanza CASE_NOT_FOUND (ORA-06592).',
    ],
    example: {
      question: '¿Qué objetivo tiene el área de Sofía?',
      example: 'S3-E-CASE',
      reading: 'Busca el área de Sofía y una expresión CASE elige el mensaje según su nombre.',
    },
    more: [
      {
        question: 'CASE de búsqueda: cada WHEN tiene su propia condición.',
        example: 'S3-E-CASE-BUSQUEDA',
        reading:
          'Paula suma 35 horas en sus proyectos: la segunda condición es la primera verdadera.',
      },
      {
        question: 'Error: ninguna rama coincide y no hay ELSE.',
        example: 'S3-E-CASE-NOT-FOUND',
        reading:
          'Ricardo no tiene asignaciones: la suma es NULL, ninguna condición es verdadera y, sin ELSE, Oracle lanza ORA-06592 (CASE_NOT_FOUND).',
      },
    ],
    changed: ['Una sola asignación reemplaza tres ramas IF.'],
    mistakes: [
      {
        title: 'Sentencia CASE sin ELSE',
        why: 'Si nada coincide, ORA-06592. Añade ELSE aunque sea para avisar.',
      },
      {
        title: 'Cerrar una sentencia CASE con END',
        why: 'La sentencia termina en END CASE; la expresión, en END.',
      },
    ],
    check: {
      id: 'S3-L10-C',
      kind: 'choice',
      lesson: 'S3-L10',
      prompt: 'Una sentencia CASE sin ELSE no encuentra ninguna rama verdadera. ¿Qué pasa?',
      options: [
        {
          text: 'Oracle lanza CASE_NOT_FOUND (ORA-06592).',
          correct: true,
          feedback: 'Correcto: la sentencia exige que alguna rama se ejecute.',
        },
        {
          text: 'No hace nada y sigue.',
          correct: false,
          feedback: 'Eso pasa con IF sin ELSE, no con la sentencia CASE.',
        },
        {
          text: 'Ejecuta la primera rama.',
          correct: false,
          feedback: 'Solo se ejecuta una rama verdadera.',
        },
        {
          text: 'Devuelve NULL.',
          correct: false,
          feedback: 'Eso pasa con la expresión CASE, no con la sentencia.',
        },
      ],
      hints: [
        'Compara con IF sin ELSE.',
        'Es una diferencia entre la expresión y la sentencia CASE.',
      ],
      explanation:
        'La sentencia CASE sin rama aplicable lanza CASE_NOT_FOUND; la expresión CASE devolvería NULL.',
    },
    keyIdea: 'CASE expresión → valor (END). CASE sentencia → acción (END CASE), con ELSE.',
    topic: 'control',
    version: 1,
  },
  {
    id: 'S3-L11',
    block: 'bucles',
    slug: 'loop-y-exit-when',
    title: 'LOOP y EXIT WHEN',
    shortTitle: 'LOOP',
    summary:
      'LOOP repite sus sentencias hasta que EXIT WHEN encuentra la condición de salida; sin ella el bucle no termina.',
    concepts: ['loop'],
    purpose: 'Repetir un cálculo cuando no se sabe de antemano cuántas vueltas hacen falta.',
    syntax: lines('LOOP', '  sentencias;', '  EXIT WHEN condición_de_salida;', 'END LOOP;'),
    explanation: [
      'El bucle básico se ejecuta al menos una vez y se repite hasta que se cumple EXIT WHEN.',
      'La condición de salida debe depender de algo que cambia dentro del bucle; si no cambia nunca, el bucle es infinito.',
    ],
    example: {
      question: '¿Cuántos años de aumentos del 8 % necesita Felipe para llegar a 2.600.000?',
      example: 'S3-E-LOOP',
      reading:
        'Lee el salario de Felipe y, en cada vuelta, aplica el aumento, cuenta un año y lo escribe, hasta superar la meta.',
      visual: { kind: 'flow' },
    },
    changed: ['Tres vueltas: el número de repeticiones lo decidió el dato, no el programador.'],
    mistakes: [
      {
        title: 'Bucle infinito',
        why: 'Si la variable de la condición no cambia dentro del bucle, EXIT WHEN nunca se cumple.',
      },
    ],
    check: {
      id: 'S3-L11-C',
      kind: 'choice',
      lesson: 'S3-L11',
      prompt:
        'Si la meta fuera 2.200.000 en lugar de 2.600.000, ¿cuántas líneas escribiría el bucle?',
      options: [
        {
          text: '1',
          correct: true,
          feedback: 'Correcto: tras la primera vuelta el salario es 2268000 ≥ 2200000.',
        },
        {
          text: '0',
          correct: false,
          feedback: 'LOOP ejecuta al menos una vuelta antes de llegar a EXIT WHEN.',
        },
        { text: '3', correct: false, feedback: 'Eso es con la meta original.' },
        {
          text: 'Ninguna, el bucle no termina',
          correct: false,
          feedback: 'La condición se cumple en la primera vuelta.',
        },
      ],
      hints: [
        '¿Cuánto vale el salario después de la primera vuelta?',
        'EXIT WHEN se evalúa después del PUT_LINE.',
      ],
      explanation: 'La primera vuelta escribe «Año 1: 2268000» y la condición ya se cumple.',
    },
    keyIdea: 'LOOP repite; EXIT WHEN decide cuándo parar.',
    topic: 'cursores',
    version: 1,
  },
  {
    id: 'S3-L12',
    block: 'bucles',
    slug: 'while-y-for',
    title: 'WHILE LOOP y FOR LOOP',
    shortTitle: 'WHILE y FOR',
    summary:
      'WHILE comprueba la condición antes de cada vuelta; FOR recorre un rango de números con un contador que declara él mismo.',
    concepts: ['while-loop', 'for-loop'],
    purpose:
      'Elegir el bucle más claro: FOR cuando se conoce el rango, WHILE cuando depende de una condición.',
    syntax: lines(
      'WHILE condición LOOP',
      '  …',
      'END LOOP;',
      '',
      'FOR i IN inicio..fin LOOP',
      '  …',
      'END LOOP;',
    ),
    explanation: [
      'WHILE evalúa la condición antes de entrar: si es falsa desde el principio, no ejecuta ninguna vuelta.',
      'FOR i IN 1..5 declara i automáticamente, le da cada valor del rango y lo descarta al terminar. REVERSE recorre el rango al revés. Dentro del bucle, i no se puede modificar. Si el primer límite es mayor que el segundo (5..1), el bucle no da ninguna vuelta.',
      'Los bucles anidados (un bucle dentro de otro) son una ampliación: útiles, pero fáciles de volver lentos si cada vuelta consulta la base.',
    ],
    example: {
      question: '¿Quiénes son los líderes con ID del 2 al 5?',
      example: 'S3-E-FOR',
      reading: 'Recorre los números del 2 al 5, busca el nombre de cada uno y lo escribe.',
      visual: { kind: 'flow' },
    },
    more: [
      {
        question: 'WHILE: ¿en qué mes se agota el presupuesto del proyecto 104?',
        example: 'S3-E-WHILE',
        reading: 'Resta 12.000.000 cada mes mientras quede presupuesto y cuenta los meses.',
      },
    ],
    changed: ['Cuatro vueltas exactas: el rango 2..5 las fija.'],
    mistakes: [
      {
        title: 'Declarar el contador de FOR',
        why: 'FOR declara su contador; una variable con el mismo nombre queda oculta dentro del bucle.',
      },
      {
        title: 'Cambiar el contador dentro del FOR',
        why: 'Es de solo lectura: Oracle no compila la asignación.',
      },
    ],
    check: {
      id: 'S3-L12-C',
      kind: 'count',
      lesson: 'S3-L12',
      prompt: 'Este bloque usa el rango 2..3. ¿Cuántas líneas escribe DBMS_OUTPUT?',
      context: { example: 'S3-E-CHECK-FOR' },
      hints: [
        'FOR recorre todos los valores del rango, incluidos los extremos.',
        '2..3 son dos valores.',
      ],
      explanation: 'Dos: i = 2 (Carlos) e i = 3 (María).',
    },
    keyIdea: 'FOR = rango conocido; WHILE = mientras se cumpla; LOOP = hasta EXIT.',
    topic: 'cursores',
    version: 1,
  },
];
