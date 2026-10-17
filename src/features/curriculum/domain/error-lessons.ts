import { lines } from './builders';
import type { CurriculumExample } from './types';

/**
 * «Error para aprender»: cada ejemplo que falla a propósito explica en lenguaje humano qué
 * ocurrió, por qué y cómo se corrige, y enseña el ejemplo correcto. El código ORA o PLS queda
 * como detalle técnico (S2_S3_FINAL_QA.md).
 *
 * El ejemplo correcto es otro ejemplo verificado en Oracle: uno que ya existe (`example`) o uno
 * nuevo (`code`) que se registra con el identificador `<error>-OK` y se ejecuta igual que el
 * resto. Un identificador `-OK` que ya existe se referencia con `example`. Sin `setup`, reutiliza la preparación del ejemplo con error.
 */
export interface ErrorLesson {
  readonly what: string;
  readonly why: string;
  readonly fix: string;
  readonly correct:
    { readonly example: string } | { readonly code: string; readonly setup?: readonly string[] };
}

const AUMENTAR_SALARIO_OK = lines(
  'BEGIN',
  '  aumentar_salario(6, 10);',
  "  DBMS_OUTPUT.PUT_LINE('Salario actualizado');",
  'END;',
);

export const ERROR_LESSONS: Readonly<Record<string, ErrorLesson>> = {
  /* ---------- Sección 2 ---------- */
  'S2-E-FK-VIOLADA': {
    what: 'Oracle no guardó a Nora: el departamento 70 no existe.',
    why: 'ID_DEPARTAMENTO es una clave foránea: su valor debe existir como clave primaria en DEPARTAMENTOS, que solo tiene 10, 20, 30, 40, 50 y 60.',
    fix: 'Usa un departamento que exista (por ejemplo, 20) o crea antes el departamento 70.',
    correct: {
      code: lines(
        'INSERT INTO empleados',
        '  (id_empleado, nombre, apellido, cargo, id_departamento,',
        '   ciudad, salario, fecha_ingreso, estado)',
        "VALUES (21, 'Nora', 'Peña', 'Analista', 20,",
        "        'Cali', 4000000, DATE '2026-09-01', 'ACTIVO');",
      ),
    },
  },
  'S2-E-PK-DUPLICADA': {
    what: 'Oracle no guardó Soporte: ya hay un departamento con la clave 20 (TI).',
    why: 'La clave primaria identifica cada fila. Si se repitiera, el 20 significaría dos áreas y nadie sabría a cuál apunta cada persona.',
    fix: 'Usa una clave que todavía no exista, como 70.',
    correct: {
      code: lines(
        'INSERT INTO departamentos (id_departamento, nombre_departamento, sede)',
        "VALUES (70, 'Soporte', 'Cali');",
      ),
    },
  },
  'S2-E-AMBIGUA': {
    what: 'Hay una columna ambigua: ID_DEPARTAMENTO.',
    why: 'Las dos tablas tienen ID_DEPARTAMENTO. Como la consulta no indica a cuál se refiere, Oracle no puede decidir cuál usar.',
    fix: 'Escribe el alias delante: e.id_departamento (la de EMPLEADOS) o d.id_departamento (la de DEPARTAMENTOS).',
    correct: { example: 'S2-E-COLUMNA-CALIFICADA' },
  },
  'S2-E-JOIN-SIN-ON': {
    what: 'Falta la condición que une las dos tablas.',
    why: 'JOIN necesita saber qué filas forman pareja. Sin ON (o USING), Oracle no sabe con qué área va cada persona.',
    fix: 'Añade ON e.id_departamento = d.id_departamento. Si de verdad quieres todas las combinaciones, escribe CROSS JOIN.',
    correct: {
      code: lines(
        'SELECT e.nombre, d.nombre_departamento',
        'FROM empleados e',
        'JOIN departamentos d',
        '  ON e.id_departamento = d.id_departamento',
        'ORDER BY e.id_empleado;',
      ),
    },
  },
  'S2-E-SIN-GRUPO': {
    what: 'Falta decir cómo agrupar.',
    why: 'Sin GROUP BY, COUNT(*) resume todas las filas en un solo número, pero ID_DEPARTAMENTO cambia de una fila a otra: Oracle no sabe qué departamento poner junto al total.',
    fix: 'Añade GROUP BY id_departamento para contar por área, o quita id_departamento si quieres un único total.',
    correct: {
      code: lines(
        'SELECT id_departamento, COUNT(*)',
        'FROM empleados',
        'GROUP BY id_departamento',
        'ORDER BY id_departamento;',
      ),
    },
  },
  'S2-E-GROUP-INCOMPLETO': {
    what: 'CARGO aparece en el SELECT, pero no está agrupado.',
    why: 'Cada departamento reúne personas con cargos distintos. Una fila por departamento no puede mostrar un único cargo.',
    fix: 'Añade cargo al GROUP BY (un grupo por área y cargo) o quítalo del SELECT.',
    correct: {
      code: lines(
        'SELECT id_departamento, cargo, COUNT(*)',
        'FROM empleados',
        'GROUP BY id_departamento, cargo',
        'ORDER BY id_departamento, cargo;',
      ),
    },
  },
  'S2-E-WHERE-AGREGADO': {
    what: 'Una función de grupo está en el WHERE.',
    why: 'WHERE revisa una fila cada vez, antes de formar los grupos. En ese momento todavía no existe un COUNT(*) que comparar.',
    fix: 'Pasa la condición sobre el resumen a HAVING, después de GROUP BY.',
    correct: {
      code: lines(
        'SELECT id_departamento, COUNT(*)',
        'FROM empleados',
        'GROUP BY id_departamento',
        'HAVING COUNT(*) > 3',
        'ORDER BY id_departamento;',
      ),
    },
  },
  'S2-E-SUB-VARIAS': {
    what: 'La subconsulta devuelve varias filas y se comparó con =.',
    why: 'Tres departamentos tienen sede en Bogotá (10, 20 y 50). El signo = compara con un solo valor, no con una lista.',
    fix: 'Haz que la subconsulta devuelva un solo valor, por ejemplo buscando el área por su nombre. Para comparar con una lista se usa IN (lección siguiente).',
    correct: { example: 'S2-E-SUB-VENTAS' },
  },
  'S2-E-UNION-COLUMNAS': {
    what: 'Las dos consultas no tienen el mismo número de columnas.',
    why: 'UNION pone las filas de la segunda consulta debajo de las de la primera. Arriba hay dos columnas (nombre y ciudad) y abajo solo una.',
    fix: 'Haz que las dos consultas devuelvan las mismas columnas, en el mismo orden: añade sede a la segunda.',
    correct: {
      code: lines(
        'SELECT nombre, ciudad FROM empleados',
        'UNION',
        'SELECT nombre_departamento, sede FROM departamentos',
        'ORDER BY nombre;',
      ),
    },
  },
  'S2-E-UNION-TIPOS': {
    what: 'Una columna es de texto y la otra es un número.',
    why: 'En UNION, cada columna de abajo continúa la columna de arriba. NOMBRE es texto e ID_DEPARTAMENTO es un número: no pueden formar una misma columna.',
    fix: 'Usa columnas del mismo tipo: nombre_departamento en lugar de id_departamento.',
    correct: {
      code: lines(
        'SELECT nombre FROM empleados',
        'UNION',
        'SELECT nombre_departamento FROM departamentos',
        'ORDER BY nombre;',
      ),
    },
  },

  /* ---------- Sección 3 ---------- */
  'S3-E-SIN-PUNTO-Y-COMA': {
    what: 'Falta un punto y coma.',
    why: 'En PL/SQL cada instrucción termina en ;. Después de PUT_LINE(…), Oracle encontró END cuando todavía esperaba el ;.',
    fix: "Escribe ; al final de DBMS_OUTPUT.PUT_LINE('Hola desde PL/SQL').",
    correct: {
      code: lines('BEGIN', "  DBMS_OUTPUT.PUT_LINE('Hola desde PL/SQL');", 'END;'),
    },
  },
  'S3-E-NO-DECLARADA': {
    what: 'La variable v_total no existe.',
    why: 'Una variable se declara en DECLARE antes de usarla. Este bloque no tiene DECLARE, así que Oracle no sabe qué es v_total.',
    fix: 'Declárala antes de BEGIN: DECLARE v_total NUMBER;',
    correct: {
      code: lines(
        'DECLARE',
        '  v_total NUMBER;',
        'BEGIN',
        '  v_total := 10;',
        "  DBMS_OUTPUT.PUT_LINE('Total: ' || v_total);",
        'END;',
      ),
    },
  },
  'S3-E-CONSTANTE': {
    what: 'Se intentó cambiar una constante.',
    why: 'c_aumento se declaró CONSTANT: su valor se fija al declararla y ya no admite :=.',
    fix: 'Si el valor tiene que cambiar, declara una variable normal, sin CONSTANT.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_aumento NUMBER := 0.10;',
        'BEGIN',
        '  v_aumento := 0.20;',
        "  DBMS_OUTPUT.PUT_LINE('Aumento: ' || v_aumento);",
        'END;',
      ),
    },
  },
  'S3-E-TYPE-CORTO': {
    what: 'El texto no cabe en la variable.',
    why: "v_nombre se declaró VARCHAR2(3): solo caben tres caracteres y 'Paula' tiene cinco.",
    fix: 'Declara la variable con el tipo de la columna: v_nombre empleados.nombre%TYPE.',
    correct: {
      code: lines(
        'DECLARE',
        "  v_nombre empleados.nombre%TYPE := 'Paula';",
        'BEGIN',
        '  DBMS_OUTPUT.PUT_LINE(v_nombre);',
        'END;',
      ),
    },
  },
  'S3-E-TYPE-TAMANO': {
    what: 'El nombre leído no cabe en la variable.',
    why: 'SELECT INTO copia el nombre de la persona 7 (Paula, cinco letras) en una variable de tres caracteres.',
    fix: 'Ancla la variable a la columna: v_nombre empleados.nombre%TYPE.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_nombre empleados.nombre%TYPE;',
        'BEGIN',
        '  SELECT nombre INTO v_nombre',
        '  FROM empleados',
        '  WHERE id_empleado = 7;',
        '  DBMS_OUTPUT.PUT_LINE(v_nombre);',
        'END;',
      ),
    },
  },
  'S3-E-TOO-MANY': {
    what: 'SELECT INTO encontró varias filas.',
    why: 'Una variable guarda un solo valor, pero el departamento 20 tiene cuatro personas.',
    fix: 'Filtra por la clave primaria para leer exactamente una fila (WHERE id_empleado = 2). Para recorrer varias filas se usa un cursor (bloque 8).',
    correct: {
      code: lines(
        'DECLARE',
        '  v_nombre empleados.nombre%TYPE;',
        'BEGIN',
        '  SELECT nombre INTO v_nombre',
        '  FROM empleados',
        '  WHERE id_empleado = 2;',
        '  DBMS_OUTPUT.PUT_LINE(v_nombre);',
        'END;',
      ),
    },
  },
  'S3-E-NO-DATA': {
    what: 'SELECT INTO no encontró ninguna fila.',
    why: 'No existe la persona 99. La variable no puede quedar sin valor, así que Oracle detiene el bloque.',
    fix: 'Busca un ID que exista. Si la fila puede faltar, atrapa NO_DATA_FOUND en la sección EXCEPTION.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_nombre empleados.nombre%TYPE;',
        'BEGIN',
        '  SELECT nombre INTO v_nombre',
        '  FROM empleados',
        '  WHERE id_empleado = 7;',
        '  DBMS_OUTPUT.PUT_LINE(v_nombre);',
        'END;',
      ),
    },
  },
  'S3-E-SIN-END-IF': {
    what: 'Falta END IF para cerrar el IF.',
    why: 'Cada IF se cierra con END IF;. Oracle llegó al END; del bloque con el IF todavía abierto.',
    fix: 'Escribe END IF; después de la última acción del IF.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_total NUMBER := 5;',
        'BEGIN',
        '  IF v_total > 3 THEN',
        "    DBMS_OUTPUT.PUT_LINE('Mayor que 3');",
        '  END IF;',
        'END;',
      ),
    },
  },
  'S3-E-CURSOR-CERRADO': {
    what: 'Se leyó un cursor sin abrirlo.',
    why: 'FETCH lee la fila actual de un cursor abierto. Sin OPEN, la consulta del cursor todavía no se ha ejecutado y no hay filas que leer.',
    fix: 'Abre el cursor con OPEN antes de FETCH y ciérralo con CLOSE al terminar.',
    correct: {
      code: lines(
        'DECLARE',
        '  CURSOR c_dep IS',
        '    SELECT nombre_departamento FROM departamentos ORDER BY id_departamento;',
        '  v_nombre departamentos.nombre_departamento%TYPE;',
        'BEGIN',
        '  OPEN c_dep;',
        '  FETCH c_dep INTO v_nombre;',
        '  DBMS_OUTPUT.PUT_LINE(v_nombre);',
        '  CLOSE c_dep;',
        'END;',
      ),
    },
  },
  'S3-E-PROC-ERROR': {
    what: 'El procedimiento no encontró al empleado 99.',
    why: 'El UPDATE no modificó ninguna fila (SQL%ROWCOUNT = 0) y el procedimiento avisa con su propio error, el -20002.',
    fix: 'Es la validación del procedimiento funcionando. Llámalo con un ID que exista, como 6.',
    correct: { code: AUMENTAR_SALARIO_OK },
  },
  'S3-E-PROC-COMPILA': {
    what: 'El procedimiento no compila: v_incremento no existe.',
    why: 'Dentro de un procedimiento solo existen sus parámetros y las variables que declara. v_incremento no es ninguna de las dos.',
    fix: 'Recibe el valor como parámetro (p_incremento IN NUMBER) o declara la variable entre IS y BEGIN.',
    correct: {
      code: lines(
        'CREATE OR REPLACE PROCEDURE subir_bono (',
        '  p_id         IN NUMBER,',
        '  p_incremento IN NUMBER',
        ') IS',
        'BEGIN',
        '  UPDATE empleados',
        '  SET bono = bono + p_incremento',
        '  WHERE id_empleado = p_id;',
        'END subir_bono;',
      ),
    },
  },
  'S3-E-OUT-LITERAL': {
    what: 'Un parámetro OUT recibió un número fijo.',
    why: 'p_empleados es OUT: el procedimiento escribe en él. Un número escrito a mano, como 5, no es un lugar donde guardar un valor.',
    fix: 'Pasa una variable: resumen_departamento(40, v_empleados, v_promedio).',
    correct: {
      code: lines(
        'DECLARE',
        '  v_empleados NUMBER;',
        '  v_promedio  NUMBER;',
        'BEGIN',
        '  resumen_departamento(40, v_empleados, v_promedio);',
        "  DBMS_OUTPUT.PUT_LINE(v_empleados || ' personas, promedio ' || v_promedio);",
        'END;',
      ),
    },
  },
  'S3-E-FUNCION-SIN-RETURN': {
    what: 'La función terminó sin devolver un valor.',
    why: 'Con 2.100.000 no se cumple ninguna condición, y la función llega a END sin pasar por ningún RETURN.',
    fix: "Asegura un RETURN en todos los caminos: añade ELSE RETURN 'Base';",
    correct: {
      setup: [
        lines(
          'CREATE OR REPLACE FUNCTION nivel_salarial (p_salario NUMBER) RETURN VARCHAR2 IS',
          'BEGIN',
          '  IF p_salario >= 6000000 THEN',
          "    RETURN 'Alto';",
          '  ELSIF p_salario >= 4000000 THEN',
          "    RETURN 'Medio';",
          '  ELSE',
          "    RETURN 'Base';",
          '  END IF;',
          'END nivel_salarial;',
        ),
      ],
      code: lines('BEGIN', '  DBMS_OUTPUT.PUT_LINE(nivel_salarial(2100000));', 'END;'),
    },
  },
  'S3-E-PROC-EN-SQL': {
    what: 'Un procedimiento no se puede usar dentro de SELECT.',
    why: 'Un procedimiento realiza una tarea y no devuelve un valor. SELECT solo puede llamar a funciones.',
    fix: 'Llámalo como una instrucción dentro de un bloque: BEGIN aumentar_salario(6, 5); END;',
    correct: { code: AUMENTAR_SALARIO_OK },
  },
  'S3-E-PAQUETE-TOPE': {
    what: 'El paquete rechazó un aumento del 20 %.',
    why: 'aumentar compara el porcentaje con la constante c_tope_aumento (15) y lanza su propio error, el -20003.',
    fix: 'Es la regla del paquete funcionando. Un porcentaje de hasta 15 se aplica.',
    correct: {
      code: lines(
        'BEGIN',
        '  rrhh_pkg.aumentar(7, 10);',
        "  DBMS_OUTPUT.PUT_LINE('Aumento aplicado');",
        'END;',
      ),
    },
  },
  'S3-E-PAQUETE-PRIVADO': {
    what: 'redondear no se puede usar desde fuera del paquete.',
    why: 'Solo es público lo que aparece en la especificación. redondear está únicamente en el cuerpo: es privada.',
    fix: 'Usa los elementos públicos (salario_anual o aumentar) o añade redondear a la especificación.',
    correct: {
      code: lines('BEGIN', '  DBMS_OUTPUT.PUT_LINE(rrhh_pkg.salario_anual(7));', 'END;'),
    },
  },
  'S3-E-NEW-SENTENCIA': {
    what: ':NEW no existe en un trigger de sentencia.',
    why: 'Sin FOR EACH ROW, el trigger se ejecuta una vez por sentencia y no por fila: no hay una fila concreta cuyo :NEW leer.',
    fix: 'Añade FOR EACH ROW para que el trigger sea de fila.',
    correct: {
      code: lines(
        'CREATE OR REPLACE TRIGGER trg_mal_nivel',
        'AFTER UPDATE OF salario ON empleados',
        'FOR EACH ROW',
        'BEGIN',
        "  DBMS_OUTPUT.PUT_LINE('Nuevo salario: ' || :NEW.salario);",
        'END;',
      ),
    },
  },

  /* ---------- Sección 3 · ampliación ---------- */
  'S3-E-ALCANCE-ERROR': {
    what: 'v_interno no se ve fuera de su bloque.',
    why: 'Se declaró en el bloque interior. Cuando ese bloque termina, la variable deja de existir.',
    fix: 'Usa la variable dentro del bloque interior o declárala en el bloque exterior.',
    correct: {
      code: lines(
        'BEGIN',
        '  DECLARE',
        '    v_interno NUMBER := 1;',
        '  BEGIN',
        "    DBMS_OUTPUT.PUT_LINE('Valor: ' || v_interno);",
        '  END;',
        'END;',
      ),
    },
  },
  'S3-E-CASE-NOT-FOUND': {
    what: 'Ningún WHEN se cumplió y el CASE no tiene ELSE.',
    why: 'La persona 12 no tiene horas asignadas (SUM devuelve NULL). Ninguna condición es verdadera y una sentencia CASE sin ELSE no sabe qué hacer.',
    fix: 'Añade ELSE … para el resto de casos.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_horas NUMBER;',
        'BEGIN',
        '  SELECT SUM(horas_semanales) INTO v_horas',
        '  FROM asignaciones',
        '  WHERE id_empleado = 12;',
        '  CASE',
        "    WHEN v_horas > 40 THEN DBMS_OUTPUT.PUT_LINE('Sobrecarga');",
        "    WHEN v_horas >= 30 THEN DBMS_OUTPUT.PUT_LINE('Carga alta');",
        "    ELSE DBMS_OUTPUT.PUT_LINE('Carga normal o sin horas');",
        '  END CASE;',
        'END;',
      ),
    },
  },
  'S3-E-SIN-MANEJO': {
    what: 'El error no se atrapó y el bloque terminó.',
    why: 'Hay varias personas en Cali: SELECT INTO lanza TOO_MANY_ROWS y, sin un manejador en EXCEPTION, el bloque se detiene con error.',
    fix: 'Añade EXCEPTION WHEN TOO_MANY_ROWS THEN … para responder con un mensaje.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_nombre empleados.nombre%TYPE;',
        'BEGIN',
        '  SELECT nombre INTO v_nombre',
        '  FROM empleados',
        "  WHERE ciudad = 'Cali';",
        'EXCEPTION',
        '  WHEN TOO_MANY_ROWS THEN',
        "    DBMS_OUTPUT.PUT_LINE('Hay varias personas en Cali');",
        'END;',
      ),
    },
  },
  'S3-E-RAISE-APP': {
    what: 'El bloque rechazó la operación a propósito.',
    why: 'Andrés ya tiene 30 horas. El IF lanza RAISE_APPLICATION_ERROR(-20001, …) con un mensaje propio.',
    fix: 'No es un fallo del código: es la regla funcionando. Con una persona por debajo de 30 horas, como Sofía (25), el bloque termina sin error.',
    correct: {
      code: lines(
        'DECLARE',
        '  v_horas NUMBER;',
        'BEGIN',
        '  SELECT SUM(horas_semanales) INTO v_horas FROM asignaciones WHERE id_empleado = 9;',
        '  IF v_horas >= 30 THEN',
        "    RAISE_APPLICATION_ERROR(-20001, 'Ya tiene ' || v_horas || ' horas asignadas');",
        '  END IF;',
        "  DBMS_OUTPUT.PUT_LINE('Puede recibir más horas: tiene ' || v_horas);",
        'END;',
      ),
    },
  },
  'S3-E-TRIGGER-VALIDA': {
    what: 'El trigger de validación detuvo el UPDATE.',
    why: 'El aumento del 30 % supera el 20 % permitido. El trigger lanza el error -20010 y Oracle deshace el cambio de esa sentencia.',
    fix: 'Es la validación funcionando. Un aumento de hasta el 20 % se guarda.',
    correct: { example: 'S3-E-TRIGGER-VALIDA-OK' },
  },
  'S3-E-MUTANTE': {
    what: 'El trigger consultó la tabla que se está modificando.',
    why: 'Un trigger de fila sobre EMPLEADOS no puede leer EMPLEADOS mientras el UPDATE la cambia: la tabla está «mutando» y el resultado no sería fiable.',
    fix: 'Usa :OLD y :NEW de la fila, o calcula el promedio fuera del trigger.',
    correct: {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_promedio_area',
          'AFTER UPDATE OF salario ON empleados',
          'FOR EACH ROW',
          'BEGIN',
          "  DBMS_OUTPUT.PUT_LINE('Salario: ' || :OLD.salario || ' -> ' || :NEW.salario);",
          'END;',
        ),
      ],
      code: lines('UPDATE empleados', 'SET salario = salario + 100000', 'WHERE id_empleado = 6;'),
    },
  },
  'S3-E-COMMIT-TRIGGER': {
    what: 'Un trigger no puede confirmar la transacción.',
    why: 'El trigger forma parte de la sentencia que lo disparó. Un COMMIT confirmaría a medias una operación que todavía no terminó.',
    fix: 'Quita el COMMIT del trigger. La confirma (o la deshace) quien ejecuta el INSERT.',
    correct: {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_confirmar',
          'AFTER INSERT ON departamentos',
          'BEGIN',
          "  DBMS_OUTPUT.PUT_LINE('Departamento registrado');",
          'END;',
        ),
      ],
      code: lines(
        'INSERT INTO departamentos (id_departamento, nombre_departamento, sede)',
        "VALUES (70, 'Calidad', 'Cali');",
      ),
    },
  },
  'S3-E-INTEGRADOR-ERROR': {
    what: 'El procedimiento rechazó un aumento del 30 %.',
    why: 'aplicar_aumentos solo acepta porcentajes entre 1 y 15. Con 30 lanza su excepción e_porcentaje y la convierte en el error -20020.',
    fix: 'Es la validación funcionando. Llámalo con un porcentaje de 1 a 15.',
    correct: { example: 'S3-E-INTEGRADOR' },
  },
};

export function errorLesson(example: string): ErrorLesson | undefined {
  return ERROR_LESSONS[example];
}

/** Identificador del ejemplo correcto de un error. */
export function correctExampleId(example: string): string | undefined {
  const lesson = ERROR_LESSONS[example];
  if (!lesson) return undefined;
  return 'example' in lesson.correct ? lesson.correct.example : `${example}-OK`;
}

/** Ejemplos correctos nuevos de una sección: misma forma y preparación que su error. */
export function errorFixExamples(
  examples: readonly CurriculumExample[],
): readonly CurriculumExample[] {
  return examples.flatMap((example): CurriculumExample[] => {
    const lesson = ERROR_LESSONS[example.id];
    if (!lesson || 'example' in lesson.correct) return [];
    const id = `${example.id}-OK`;
    const { code, setup } = lesson.correct;
    if (example.kind === 'query') {
      return [{ id, kind: 'query', dataset: example.dataset, sql: code, sources: example.sources }];
    }
    const prepared = setup ?? example.setup;
    return [{ id, kind: 'plsql', code, ...(prepared ? { setup: prepared } : {}) }];
  });
}
