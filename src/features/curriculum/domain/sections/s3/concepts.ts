import { lines, plsqlRef } from '../../builders';
import type { CurriculumConcept } from '../../types';

/**
 * Fichas conceptuales de la Sección 3: la única definición de cada concepto de PL/SQL.
 * Revisadas contra Oracle Database PL/SQL Language Reference 19c y el curso Database
 * Programming with PL/SQL de Oracle Academy; cada ficha remite a un ejemplo ejecutado en Oracle.
 */

export const S3_CONCEPTS: readonly CurriculumConcept[] = [
  /* ---------- Bloques ---------- */
  {
    id: 'plsql',
    term: 'PL/SQL',
    category: 'Lenguaje',
    definition:
      'Extensión procedimental de SQL de Oracle: añade variables, condiciones, bucles, manejo de errores y programas guardados en la base de datos.',
    purpose: 'Resolver tareas de varios pasos que una sola consulta SQL no puede expresar.',
    syntax: lines('BEGIN', '  -- sentencias SQL y PL/SQL', 'END;'),
    example: 'S3-E-PRIMER-BLOQUE',
    mistake: {
      title: 'Creer que reemplaza a SQL',
      why: 'PL/SQL usa SQL para leer y modificar datos; añade la lógica alrededor.',
    },
    keyIdea: 'SQL dice qué datos; PL/SQL dice qué hacer con ellos, paso a paso.',
    reference: plsqlRef('Overview of PL/SQL'),
  },
  {
    id: 'block',
    term: 'Bloque PL/SQL',
    category: 'Estructura',
    definition:
      'Unidad básica de PL/SQL: DECLARE opcional, BEGIN obligatorio con al menos una sentencia, EXCEPTION opcional y END con punto y coma.',
    purpose: 'Agrupar declaraciones, acciones y manejo de errores en una sola unidad.',
    syntax: lines(
      'DECLARE',
      '  -- declaraciones',
      'BEGIN',
      '  -- acciones',
      'EXCEPTION',
      '  -- errores',
      'END;',
    ),
    example: 'S3-E-ESTRUCTURA',
    mistake: {
      title: 'Olvidar el punto y coma',
      why: 'Cada sentencia y el END final terminan en «;»; si falta, Oracle responde PLS-00103.',
    },
    keyIdea: 'DECLARE → BEGIN → EXCEPTION → END;',
    reference: plsqlRef('Blocks'),
  },
  {
    id: 'anonymous-block',
    term: 'Bloque anónimo',
    category: 'Estructura',
    definition:
      'Bloque sin nombre que se compila y ejecuta una vez; no queda guardado en la base de datos.',
    purpose: 'Probar lógica o ejecutar una tarea puntual.',
    syntax: lines('BEGIN', "  DBMS_OUTPUT.PUT_LINE('Hola');", 'END;'),
    example: 'S3-E-ANONIMO-VS-ALMACENADO',
    mistake: {
      title: 'Esperar volver a llamarlo por nombre',
      why: 'Para reutilizarlo hay que guardarlo como procedimiento o función.',
    },
    keyIdea: 'Anónimo = se ejecuta y desaparece.',
    reference: plsqlRef('Blocks'),
  },
  {
    id: 'dbms-output',
    term: 'DBMS_OUTPUT.PUT_LINE',
    category: 'Paquete de Oracle',
    definition:
      'Procedimiento del paquete DBMS_OUTPUT que escribe una línea en un búfer; la herramienta cliente la muestra si la salida está activada.',
    purpose: 'Ver valores intermedios y mensajes mientras se aprende o se depura.',
    syntax: "DBMS_OUTPUT.PUT_LINE('Total: ' || v_total);",
    example: 'S3-E-PRIMER-BLOQUE',
    mistake: {
      title: 'Usarlo como resultado del programa',
      why: 'Es una ayuda de depuración: otros programas no leen ese texto.',
    },
    keyIdea: 'Escribe mensajes; no devuelve datos.',
    reference: plsqlRef('DBMS_OUTPUT'),
  },

  /* ---------- Variables ---------- */
  {
    id: 'variable',
    term: 'Variable',
    category: 'Declaración',
    definition:
      'Nombre con un tipo de dato que guarda un valor durante la ejecución del bloque; empieza en NULL si no se inicializa.',
    purpose: 'Guardar datos leídos, cálculos intermedios y contadores.',
    syntax: lines('v_salario NUMBER(10) := 0;', 'v_nombre  VARCHAR2(40);'),
    example: 'S3-E-VARIABLES',
    mistake: {
      title: 'Asignar con =',
      why: 'En PL/SQL la asignación es «:=»; «=» compara.',
    },
    keyIdea: 'Declarar en DECLARE, asignar con :=',
    reference: plsqlRef('Declarations'),
  },
  {
    id: 'constant',
    term: 'CONSTANT',
    category: 'Declaración',
    definition:
      'Declaración cuyo valor se fija al declararla y no puede cambiar durante el bloque.',
    purpose: 'Nombrar valores fijos, como un porcentaje de aumento.',
    syntax: 'c_aumento CONSTANT NUMBER := 0.08;',
    example: 'S3-E-CONSTANTE',
    mistake: {
      title: 'Asignar una constante',
      why: 'Oracle no compila el bloque: PLS-00363 (no se puede usar como destino de asignación).',
    },
    keyIdea: 'CONSTANT = se inicializa una vez y no cambia.',
    reference: plsqlRef('Declarations'),
  },
  {
    id: 'anchored-type',
    term: '%TYPE y %ROWTYPE',
    category: 'Declaración',
    definition:
      '%TYPE copia el tipo de una columna o variable; %ROWTYPE crea un registro con un campo por cada columna de una tabla.',
    purpose: 'Que el código siga funcionando si cambia el tipo de la columna.',
    syntax: lines('v_salario empleados.salario%TYPE;', 'v_fila    empleados%ROWTYPE;'),
    example: 'S3-E-ROWTYPE',
    mistake: {
      title: 'Declarar un tamaño menor que la columna',
      why: 'Con VARCHAR2(3) para un nombre largo, Oracle responde ORA-06502; %TYPE evita el desajuste.',
    },
    keyIdea: 'Ancla la variable a la columna, no a un tipo escrito a mano.',
    reference: plsqlRef('%TYPE Attribute'),
  },
  {
    id: 'scope',
    term: 'Alcance',
    category: 'Regla',
    definition:
      'Parte del código donde un nombre es visible: una variable existe en su bloque y en los bloques anidados, no fuera.',
    purpose: 'Evitar conflictos de nombres y entender qué variable usa cada sentencia.',
    syntax: lines(
      'DECLARE v_a NUMBER;',
      'BEGIN',
      '  DECLARE v_b NUMBER;',
      '  BEGIN … END;  -- v_a y v_b',
      'END;          -- solo v_a',
    ),
    example: 'S3-E-ALCANCE',
    mistake: {
      title: 'Usar una variable interna fuera de su bloque',
      why: 'Fuera del bloque interno ya no existe: PLS-00201.',
    },
    keyIdea: 'Lo de afuera se ve adentro; lo de adentro no se ve afuera.',
    reference: plsqlRef('Scope and Visibility of Identifiers'),
  },

  /* ---------- SQL en PL/SQL ---------- */
  {
    id: 'select-into',
    term: 'SELECT INTO',
    category: 'SQL en PL/SQL',
    definition:
      'Consulta que guarda en variables el resultado de exactamente una fila; con cero filas lanza NO_DATA_FOUND y con varias TOO_MANY_ROWS.',
    purpose: 'Leer un dato de la base para usarlo en la lógica del bloque.',
    syntax: 'SELECT salario INTO v_salario FROM empleados WHERE id_empleado = 6;',
    example: 'S3-E-SELECT-INTO',
    mistake: {
      title: 'Un SELECT INTO que devuelve varias filas',
      why: 'Oracle responde ORA-01422; para recorrer varias filas se usa un cursor.',
    },
    keyIdea: 'SELECT INTO = una fila, ni cero ni dos.',
    reference: plsqlRef('SELECT INTO Statement'),
  },
  {
    id: 'dml-in-plsql',
    term: 'DML en PL/SQL',
    category: 'SQL en PL/SQL',
    definition:
      'INSERT, UPDATE y DELETE escritos directamente en el bloque, con variables en lugar de valores fijos; forman parte de la transacción actual.',
    purpose: 'Modificar datos como un paso dentro de un proceso.',
    syntax: 'UPDATE empleados SET salario = v_nuevo WHERE id_empleado = v_id;',
    example: 'S3-E-UPDATE-ROWCOUNT',
    mistake: {
      title: 'Creer que el bloque confirma solo',
      why: 'Los cambios quedan pendientes hasta COMMIT; ROLLBACK los deshace.',
    },
    keyIdea: 'El bloque modifica; la transacción decide si se guarda.',
    reference: plsqlRef('Static SQL'),
  },
  {
    id: 'implicit-cursor',
    term: 'Cursor implícito (SQL%)',
    category: 'SQL en PL/SQL',
    definition:
      'Área que Oracle abre para cada sentencia SQL del bloque; SQL%ROWCOUNT, SQL%FOUND y SQL%NOTFOUND describen la última.',
    purpose: 'Saber cuántas filas afectó un UPDATE o DELETE.',
    syntax: "DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' filas');",
    example: 'S3-E-IMPLICITO',
    mistake: {
      title: 'Leer SQL%ROWCOUNT tarde',
      why: 'Describe la última sentencia ejecutada: otra sentencia lo reemplaza.',
    },
    keyIdea: 'SQL%ROWCOUNT justo después de la sentencia.',
    reference: plsqlRef('Implicit Cursor Attribute'),
  },

  /* ---------- Control ---------- */
  {
    id: 'if',
    term: 'IF … ELSIF … ELSE',
    category: 'Control',
    definition:
      'Ejecuta el primer grupo de sentencias cuya condición es TRUE; si ninguna lo es, el de ELSE. Una condición NULL no es TRUE.',
    purpose: 'Tomar decisiones según los datos.',
    syntax: lines('IF cond THEN …', 'ELSIF cond THEN …', 'ELSE …', 'END IF;'),
    example: 'S3-E-IF',
    mistake: {
      title: 'Escribir ELSEIF o ELSE IF',
      why: 'La palabra es ELSIF; ELSE IF abre un IF nuevo que necesita su propio END IF.',
    },
    keyIdea: 'Primera condición TRUE gana; NULL va a ELSE.',
    reference: plsqlRef('IF Statement'),
  },
  {
    id: 'case',
    term: 'CASE',
    category: 'Control',
    definition:
      'Elige una rama comparando un valor (CASE simple) o evaluando condiciones (CASE de búsqueda); sin ELSE y sin coincidencia lanza CASE_NOT_FOUND.',
    purpose: 'Escribir decisiones con muchas opciones de forma legible.',
    syntax: lines('CASE v_departamento', '  WHEN 20 THEN …', '  ELSE …', 'END CASE;'),
    example: 'S3-E-CASE',
    mistake: {
      title: 'Omitir ELSE en una sentencia CASE',
      why: 'Si ningún WHEN coincide, Oracle responde ORA-06592.',
    },
    keyIdea: 'Sentencia CASE: incluye siempre ELSE.',
    reference: plsqlRef('CASE Statement'),
  },
  {
    id: 'loop',
    term: 'LOOP básico',
    category: 'Bucle',
    definition: 'Repite sus sentencias hasta que una instrucción EXIT o EXIT WHEN lo detiene.',
    purpose: 'Repetir cuando la condición de salida se conoce dentro del bucle.',
    syntax: lines('LOOP', '  …', '  EXIT WHEN v_anio > 3;', 'END LOOP;'),
    example: 'S3-E-LOOP',
    mistake: {
      title: 'Olvidar EXIT',
      why: 'El bucle no termina nunca.',
    },
    keyIdea: 'LOOP + EXIT WHEN.',
    reference: plsqlRef('Basic LOOP Statement'),
  },
  {
    id: 'while-loop',
    term: 'WHILE LOOP',
    category: 'Bucle',
    definition:
      'Repite mientras la condición sea TRUE; la evalúa antes de cada vuelta, así que puede no ejecutarse nunca.',
    purpose: 'Repetir cuando no se sabe cuántas vueltas habrá.',
    syntax: lines('WHILE v_total < 10000000 LOOP', '  …', 'END LOOP;'),
    example: 'S3-E-WHILE',
    mistake: {
      title: 'No cambiar la condición dentro del bucle',
      why: 'Si nada la vuelve FALSE, el bucle no termina.',
    },
    keyIdea: 'Pregunta antes de cada vuelta.',
    reference: plsqlRef('WHILE LOOP Statement'),
  },
  {
    id: 'for-loop',
    term: 'FOR LOOP numérico',
    category: 'Bucle',
    definition:
      'Repite para cada entero de un rango; el índice se declara solo, es de solo lectura y no existe fuera del bucle.',
    purpose: 'Repetir un número conocido de veces.',
    syntax: lines('FOR i IN 1..5 LOOP', '  …', 'END LOOP;'),
    example: 'S3-E-FOR',
    mistake: {
      title: 'Asignar el índice',
      why: 'El índice de un FOR no se puede modificar dentro del bucle.',
    },
    keyIdea: 'FOR = vueltas contadas.',
    reference: plsqlRef('FOR LOOP Statement'),
  },

  /* ---------- Cursores ---------- */
  {
    id: 'explicit-cursor',
    term: 'Cursor explícito',
    category: 'Cursor',
    definition:
      'Consulta con nombre declarada en DECLARE que se recorre fila por fila con OPEN, FETCH y CLOSE.',
    purpose: 'Procesar una a una las filas de una consulta que devuelve varias.',
    syntax: lines('CURSOR c IS SELECT …;', 'OPEN c;', 'FETCH c INTO v;', 'CLOSE c;'),
    example: 'S3-E-CURSOR-EXPLICITO',
    mistake: {
      title: 'Hacer FETCH después de CLOSE',
      why: 'El cursor ya no está abierto: ORA-01001 (cursor no válido).',
    },
    keyIdea: 'OPEN → FETCH (repetido) → CLOSE.',
    reference: plsqlRef('Explicit Cursor Declaration and Definition'),
  },
  {
    id: 'cursor-attributes',
    term: 'Atributos de cursor',
    category: 'Cursor',
    definition:
      '%FOUND, %NOTFOUND, %ROWCOUNT e %ISOPEN informan el estado de un cursor después de cada FETCH.',
    purpose: 'Saber cuándo terminar el recorrido y cuántas filas se leyeron.',
    syntax: 'EXIT WHEN c_personas%NOTFOUND;',
    example: 'S3-E-CURSOR-EXPLICITO',
    mistake: {
      title: 'Comprobar %NOTFOUND antes del primer FETCH',
      why: 'Antes del primer FETCH su valor es NULL: hay que leer y después preguntar.',
    },
    keyIdea: 'FETCH primero, %NOTFOUND después.',
    reference: plsqlRef('Named Cursor Attribute'),
  },
  {
    id: 'cursor-for-loop',
    term: 'Cursor FOR LOOP',
    category: 'Cursor',
    definition:
      'Bucle que abre el cursor, declara el registro, lee cada fila y cierra el cursor automáticamente.',
    purpose: 'Recorrer filas con menos código y sin olvidar CLOSE.',
    syntax: lines('FOR fila IN c_personas LOOP', '  … fila.nombre …', 'END LOOP;'),
    example: 'S3-E-CURSOR-FOR-PARAM',
    mistake: {
      title: 'Abrir el cursor antes del FOR',
      why: 'El FOR lo abre solo; abrirlo antes produce ORA-06511 (cursor ya abierto).',
    },
    keyIdea: 'Un FOR por cursor: abre, lee y cierra solo.',
    reference: plsqlRef('Cursor FOR LOOP Statement'),
  },

  /* ---------- Excepciones ---------- */
  {
    id: 'exception',
    term: 'EXCEPTION',
    category: 'Errores',
    definition:
      'Sección del bloque que atrapa errores de ejecución por nombre; el control salta allí y el resto de BEGIN no se ejecuta.',
    purpose: 'Responder a un error en lugar de que el bloque termine con un fallo.',
    syntax: lines('EXCEPTION', '  WHEN NO_DATA_FOUND THEN …', '  WHEN OTHERS THEN …'),
    example: 'S3-E-EXCEPCIONES',
    mistake: {
      title: 'WHEN OTHERS que oculta todo',
      why: 'Si solo escribe un mensaje, el error real se pierde; al menos muestra SQLERRM o vuelve a lanzarlo.',
    },
    keyIdea: 'Error → salto a EXCEPTION → manejador que coincide.',
    reference: plsqlRef('Exception Handler'),
  },
  {
    id: 'predefined-exceptions',
    term: 'Excepciones predefinidas',
    category: 'Errores',
    definition:
      'Errores de Oracle con nombre propio, como NO_DATA_FOUND (ORA-01403), TOO_MANY_ROWS (ORA-01422) y ZERO_DIVIDE (ORA-01476).',
    purpose: 'Manejar los errores frecuentes por su nombre.',
    syntax: 'WHEN TOO_MANY_ROWS THEN …',
    example: 'S3-E-NO-DATA',
    mistake: {
      title: 'Esperar NO_DATA_FOUND de un UPDATE',
      why: 'Un UPDATE que no afecta filas no es un error: se revisa con SQL%ROWCOUNT.',
    },
    keyIdea: 'Cada error frecuente tiene un nombre.',
    reference: plsqlRef('Predefined Exceptions'),
  },
  {
    id: 'user-exception',
    term: 'Excepción definida por el usuario',
    category: 'Errores',
    definition:
      'Excepción declarada en DECLARE y lanzada con RAISE cuando se incumple una regla del negocio.',
    purpose: 'Tratar una regla propia con el mismo mecanismo que los errores de Oracle.',
    syntax: lines('e_sin_bono EXCEPTION;', '…', 'RAISE e_sin_bono;'),
    example: 'S3-E-RAISE',
    mistake: {
      title: 'Declararla y no manejarla',
      why: 'Si nadie la atrapa, el bloque termina con ORA-06510 (excepción definida por el usuario no manejada).',
    },
    keyIdea: 'DECLARE la excepción, RAISE al detectar, WHEN para responder.',
    reference: plsqlRef('RAISE Statement'),
  },
  {
    id: 'raise-application-error',
    term: 'RAISE_APPLICATION_ERROR',
    category: 'Errores',
    definition:
      'Procedimiento que termina el programa con un error propio de número entre -20000 y -20999 y un mensaje.',
    purpose: 'Comunicar a quien llama, con código y texto claros, por qué se rechazó la operación.',
    syntax: "RAISE_APPLICATION_ERROR(-20001, 'Mensaje para quien llama');",
    example: 'S3-E-RAISE-APP',
    mistake: {
      title: 'Usar un número fuera del rango',
      why: 'Solo se admiten códigos entre -20000 y -20999.',
    },
    keyIdea: 'Error propio con código y mensaje.',
    reference: plsqlRef('RAISE_APPLICATION_ERROR Procedure'),
  },

  /* ---------- Subprogramas ---------- */
  {
    id: 'procedure',
    term: 'Procedimiento',
    category: 'Subprograma',
    definition:
      'Bloque con nombre y parámetros guardado en la base de datos; se ejecuta llamándolo y realiza una acción.',
    purpose: 'Reutilizar un proceso, como aplicar un aumento, desde cualquier programa.',
    syntax: lines(
      'CREATE OR REPLACE PROCEDURE nombre (p IN NUMBER) IS',
      'BEGIN',
      '  …',
      'END nombre;',
    ),
    example: 'S3-E-PROCEDIMIENTO',
    mistake: {
      title: 'Llamarlo dentro de un SELECT',
      why: 'Un procedimiento no devuelve un valor: SQL no lo acepta (ORA-00904).',
    },
    keyIdea: 'Procedimiento = acción con nombre.',
    reference: plsqlRef('CREATE PROCEDURE Statement'),
  },
  {
    id: 'parameter-modes',
    term: 'IN, OUT e IN OUT',
    category: 'Subprograma',
    definition:
      'Modos de parámetro: IN entrega un valor de solo lectura, OUT devuelve un valor e IN OUT entrega y devuelve.',
    purpose: 'Decidir qué datos entran al subprograma y cuáles salen.',
    syntax: '(p_id IN NUMBER, p_total OUT NUMBER, p_valor IN OUT NUMBER)',
    example: 'S3-E-IN-OUT',
    mistake: {
      title: 'Pasar un literal a un parámetro OUT',
      why: 'Un OUT necesita una variable donde escribir: PLS-00363.',
    },
    keyIdea: 'IN entra, OUT sale, IN OUT entra y sale.',
    reference: plsqlRef('Subprogram Parameter Modes'),
  },
  {
    id: 'function',
    term: 'Función',
    category: 'Subprograma',
    definition:
      'Subprograma con nombre que devuelve un único valor con RETURN; puede usarse en expresiones y, si no modifica datos, dentro de SQL.',
    purpose: 'Encapsular un cálculo reutilizable, como el salario anual.',
    syntax: lines(
      'CREATE OR REPLACE FUNCTION f (p NUMBER)',
      'RETURN NUMBER IS',
      'BEGIN',
      '  RETURN …;',
      'END f;',
    ),
    example: 'S3-E-FUNCION-EN-SQL',
    mistake: {
      title: 'Terminar sin RETURN',
      why: 'Si la ejecución llega al END sin devolver nada, Oracle responde ORA-06503.',
    },
    keyIdea: 'Función = cálculo con nombre que devuelve un valor.',
    reference: plsqlRef('CREATE FUNCTION Statement'),
  },
  {
    id: 'package',
    term: 'Paquete',
    category: 'Subprograma',
    definition:
      'Grupo de subprogramas relacionados con dos partes: especificación (lo público) y cuerpo (la implementación, que puede tener elementos privados).',
    purpose: 'Organizar el código de un tema y ocultar los detalles internos.',
    syntax: lines('CREATE PACKAGE rrhh_pkg IS … END;', 'CREATE PACKAGE BODY rrhh_pkg IS … END;'),
    example: 'S3-E-PAQUETE',
    mistake: {
      title: 'Llamar a un elemento privado',
      why: 'Lo que no está en la especificación no se ve desde fuera: PLS-00302.',
    },
    keyIdea: 'Especificación = qué ofrece; cuerpo = cómo lo hace.',
    reference: plsqlRef('CREATE PACKAGE Statement'),
  },

  /* ---------- Triggers ---------- */
  {
    id: 'trigger',
    term: 'Trigger',
    category: 'Trigger',
    definition:
      'Bloque guardado que Oracle ejecuta automáticamente cuando ocurre su evento (INSERT, UPDATE o DELETE) sobre una tabla.',
    purpose: 'Reaccionar a cambios de datos sin depender de cada programa.',
    syntax: lines('CREATE OR REPLACE TRIGGER nombre', 'AFTER INSERT ON tabla', 'BEGIN … END;'),
    example: 'S3-E-TRIGGER-SENTENCIA',
    mistake: {
      title: 'Intentar ejecutarlo',
      why: 'Un trigger no se llama: lo dispara la sentencia de su evento.',
    },
    keyIdea: 'Evento + momento + nivel → acción automática.',
    reference: plsqlRef('CREATE TRIGGER Statement'),
  },
  {
    id: 'trigger-timing',
    term: 'BEFORE y AFTER',
    category: 'Trigger',
    definition:
      'Momento del trigger: BEFORE actúa antes del cambio y puede corregir :NEW; AFTER actúa cuando el cambio ya se aplicó.',
    purpose: 'Corregir o validar antes; auditar o propagar después.',
    syntax: lines('BEFORE INSERT ON empleados', 'AFTER UPDATE OF salario ON empleados'),
    example: 'S3-E-TRIGGER-BEFORE',
    mistake: {
      title: 'Corregir :NEW en un trigger AFTER',
      why: 'El cambio ya ocurrió: Oracle no compila la asignación.',
    },
    keyIdea: 'BEFORE corrige, AFTER registra.',
    reference: plsqlRef('DML Triggers'),
  },
  {
    id: 'row-trigger',
    term: 'FOR EACH ROW',
    category: 'Trigger',
    definition:
      'Convierte el trigger en uno de fila: se ejecuta una vez por cada fila afectada. Sin esta cláusula es de sentencia y se ejecuta una vez.',
    purpose: 'Actuar sobre cada fila cambiada, por ejemplo para auditarla.',
    syntax: lines('AFTER UPDATE ON empleados', 'FOR EACH ROW'),
    example: 'S3-E-TRIGGER-FILAS',
    mistake: {
      title: 'Esperar una ejecución por fila sin FOR EACH ROW',
      why: 'Un trigger de sentencia se ejecuta una sola vez aunque cambien muchas filas.',
    },
    keyIdea: 'FOR EACH ROW = una vez por fila.',
    reference: plsqlRef('DML Triggers'),
  },
  {
    id: 'old-new',
    term: ':OLD y :NEW',
    category: 'Trigger',
    definition:
      'En un trigger de fila, :OLD guarda los valores antes del cambio y :NEW los valores después; en INSERT :OLD es NULL y en DELETE :NEW es NULL.',
    purpose: 'Comparar o registrar qué cambió en cada fila.',
    syntax: 'VALUES (:OLD.id_empleado, :OLD.salario, :NEW.salario, …)',
    example: 'S3-E-AUDITORIA',
    mistake: {
      title: 'Usarlos en un trigger de sentencia',
      why: 'Sin FOR EACH ROW no hay fila actual: ORA-04082.',
    },
    keyIdea: ':OLD = antes; :NEW = después.',
    reference: plsqlRef('Correlation Names and Pseudorecords'),
  },
  {
    id: 'trigger-validation',
    term: 'Trigger de validación',
    category: 'Trigger',
    definition:
      'Trigger BEFORE que rechaza un cambio con RAISE_APPLICATION_ERROR; la sentencia que lo disparó falla completa.',
    purpose: 'Imponer reglas que comparan el valor anterior y el nuevo.',
    syntax: lines(
      'IF :NEW.salario > :OLD.salario * 1.20 THEN',
      "  RAISE_APPLICATION_ERROR(-20010, '…');",
      'END IF;',
    ),
    example: 'S3-E-TRIGGER-VALIDA',
    mistake: {
      title: 'Usarlo para reglas simples',
      why: 'Una regla sobre una sola columna, como salario positivo, es más clara con CHECK.',
    },
    keyIdea: 'Si el trigger falla, la sentencia no ocurre.',
    reference: plsqlRef('DML Triggers'),
  },
  {
    id: 'trigger-limits',
    term: 'Límites de los triggers',
    category: 'Trigger',
    definition:
      'Un trigger de fila no puede leer la tabla que se modifica (ORA-04091) ni confirmar la transacción (ORA-04092).',
    purpose: 'Reconocer cuándo un trigger no es la herramienta adecuada.',
    syntax: '-- auditoría e integridad: trigger · procesos: procedimiento',
    example: 'S3-E-MUTANTE',
    mistake: {
      title: 'Esconder procesos de negocio en triggers',
      why: 'Quien ejecuta la sentencia no los ve; los efectos encadenados son difíciles de seguir.',
    },
    keyIdea: 'Triggers pequeños y para auditar; procesos en procedimientos.',
    reference: plsqlRef('Mutating-Table Restriction'),
  },
];
