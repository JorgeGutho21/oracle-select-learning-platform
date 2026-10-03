import { lines, plsql } from '../../builders';
import type { CurriculumExample, CurriculumLesson } from '../../types';

/**
 * Sección 3, bloques 12 y 13: triggers (tema central del profesor) e integración final.
 * Cada trigger se crea en el esquema de verificación, se dispara con una sentencia real y se
 * muestran la salida y el estado de las tablas antes y después.
 */

export const AUDITORIA =
  'SELECT id_empleado, salario_anterior, salario_nuevo, operacion FROM auditoria_salarios ORDER BY id_auditoria';
const RRHH_SALARIOS =
  'SELECT id_empleado, nombre, salario FROM empleados WHERE id_departamento = 50 ORDER BY id_empleado';

export const TRIGGER_AUDITORIA = lines(
  'CREATE OR REPLACE TRIGGER trg_auditar_salario',
  'AFTER UPDATE OF salario ON empleados',
  'FOR EACH ROW',
  'BEGIN',
  '  INSERT INTO auditoria_salarios',
  '    (id_empleado, salario_anterior, salario_nuevo, operacion)',
  '  VALUES',
  "    (:OLD.id_empleado, :OLD.salario, :NEW.salario, 'UPDATE');",
  'END;',
);

const TRIGGER_VALIDA = lines(
  'CREATE OR REPLACE TRIGGER trg_validar_aumento',
  'BEFORE UPDATE OF salario ON empleados',
  'FOR EACH ROW',
  'BEGIN',
  '  IF :NEW.salario > :OLD.salario * 1.20 THEN',
  '    RAISE_APPLICATION_ERROR(-20010,',
  "      'Aumento mayor al 20 % para el empleado ' || :OLD.id_empleado);",
  '  END IF;',
  'END;',
);

/** Dos triggers sobre el mismo evento: uno de sentencia y uno de fila. */
export const TRIGGER_SENTENCIA = lines(
  'CREATE OR REPLACE TRIGGER trg_salario_sentencia',
  'AFTER UPDATE OF salario ON empleados',
  'BEGIN',
  "  DBMS_OUTPUT.PUT_LINE('Trigger de sentencia: una vez por UPDATE');",
  'END;',
);

export const TRIGGER_FILA = lines(
  'CREATE OR REPLACE TRIGGER trg_salario_fila',
  'AFTER UPDATE OF salario ON empleados',
  'FOR EACH ROW',
  'BEGIN',
  "  DBMS_OUTPUT.PUT_LINE('Trigger de fila: empleado ' || :NEW.id_empleado);",
  'END;',
);

export const APLICAR_AUMENTOS = lines(
  'CREATE OR REPLACE PROCEDURE aplicar_aumentos (',
  '  p_departamento IN  NUMBER,',
  '  p_porcentaje   IN  NUMBER,',
  '  p_actualizados OUT NUMBER',
  ') IS',
  '  e_porcentaje EXCEPTION;',
  '  CURSOR c_personas IS',
  '    SELECT id_empleado, nombre, salario',
  '    FROM empleados',
  '    WHERE id_departamento = p_departamento',
  "      AND estado = 'ACTIVO'",
  '    ORDER BY id_empleado;',
  '  v_nuevo empleados.salario%TYPE;',
  'BEGIN',
  '  IF p_porcentaje NOT BETWEEN 1 AND 15 THEN',
  '    RAISE e_porcentaje;',
  '  END IF;',
  '  p_actualizados := 0;',
  '  FOR fila IN c_personas LOOP',
  '    v_nuevo := ROUND(fila.salario * (1 + p_porcentaje / 100));',
  '    UPDATE empleados',
  '    SET salario = v_nuevo',
  '    WHERE id_empleado = fila.id_empleado;',
  '    p_actualizados := p_actualizados + 1;',
  "    DBMS_OUTPUT.PUT_LINE(fila.nombre || ': ' || fila.salario || ' -> ' || v_nuevo);",
  '  END LOOP;',
  'EXCEPTION',
  '  WHEN e_porcentaje THEN',
  "    RAISE_APPLICATION_ERROR(-20020, 'Porcentaje fuera de rango: ' || p_porcentaje);",
  'END aplicar_aumentos;',
);

export const TRIGGER_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloque 12: triggers ---------- */
  plsql(
    'S3-E-TRIGGER-SENTENCIA',
    lines(
      'INSERT INTO departamentos (id_departamento, nombre_departamento, sede)',
      "VALUES (70, 'Calidad', 'Cali');",
    ),
    {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_aviso_departamentos',
          'AFTER INSERT ON departamentos',
          'BEGIN',
          "  DBMS_OUTPUT.PUT_LINE('Trigger: se insertó en DEPARTAMENTOS');",
          'END;',
        ),
      ],
      after: [
        'SELECT id_departamento, nombre_departamento, sede FROM departamentos ORDER BY id_departamento',
      ],
    },
  ),
  plsql(
    'S3-E-TRIGGER-FILAS',
    lines('UPDATE empleados', 'SET salario = salario + 100000', 'WHERE id_departamento = 50;'),
    {
      setup: [TRIGGER_SENTENCIA, TRIGGER_FILA],
    },
  ),
  plsql(
    'S3-E-TRIGGER-BEFORE',
    lines(
      'INSERT INTO empleados',
      '  (id_empleado, nombre, apellido, cargo, id_departamento,',
      '   ciudad, salario, fecha_ingreso, estado)',
      "VALUES (21, 'nora', 'PEÑA', 'Analista', 60,",
      "        'Barranquilla', 4000000, DATE '2026-09-01', 'ACTIVO');",
    ),
    {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_normalizar_empleado',
          'BEFORE INSERT ON empleados',
          'FOR EACH ROW',
          'BEGIN',
          '  :NEW.nombre   := INITCAP(:NEW.nombre);',
          '  :NEW.apellido := INITCAP(:NEW.apellido);',
          '  IF :NEW.bono IS NULL THEN',
          '    :NEW.bono := 0;',
          '  END IF;',
          'END;',
        ),
      ],
      after: ['SELECT id_empleado, nombre, apellido, bono FROM empleados WHERE id_empleado = 21'],
    },
  ),
  plsql(
    'S3-E-AUDITORIA',
    lines('UPDATE empleados', 'SET salario = salario * 1.10', 'WHERE id_departamento = 50;'),
    { setup: [TRIGGER_AUDITORIA], before: [RRHH_SALARIOS], after: [RRHH_SALARIOS, AUDITORIA] },
  ),
  plsql(
    'S3-E-AUDITORIA-DML',
    lines(
      'BEGIN',
      '  INSERT INTO empleados',
      '    (id_empleado, nombre, apellido, cargo, id_departamento,',
      '     ciudad, salario, fecha_ingreso, estado)',
      "  VALUES (21, 'Nora', 'Peña', 'Analista', 60,",
      "          'Barranquilla', 4000000, DATE '2026-09-01', 'ACTIVO');",
      '  UPDATE empleados SET salario = 4300000 WHERE id_empleado = 21;',
      '  DELETE FROM empleados WHERE id_empleado = 21;',
      'END;',
    ),
    {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_auditar_cambios',
          'AFTER INSERT OR UPDATE OF salario OR DELETE ON empleados',
          'FOR EACH ROW',
          'DECLARE',
          '  v_operacion VARCHAR2(10);',
          'BEGIN',
          '  IF INSERTING THEN',
          "    v_operacion := 'INSERT';",
          '  ELSIF UPDATING THEN',
          "    v_operacion := 'UPDATE';",
          '  ELSE',
          "    v_operacion := 'DELETE';",
          '  END IF;',
          '  INSERT INTO auditoria_salarios',
          '    (id_empleado, salario_anterior, salario_nuevo, operacion)',
          '  VALUES',
          '    (NVL(:NEW.id_empleado, :OLD.id_empleado), :OLD.salario, :NEW.salario, v_operacion);',
          'END;',
        ),
      ],
      after: [AUDITORIA],
    },
  ),
  plsql(
    'S3-E-NEW-SENTENCIA',
    lines(
      'CREATE OR REPLACE TRIGGER trg_mal_nivel',
      'AFTER UPDATE OF salario ON empleados',
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Nuevo salario: ' || :NEW.salario);",
      'END;',
    ),
    { expectError: 'ORA-04082' },
  ),
  plsql(
    'S3-E-TRIGGER-VALIDA',
    lines('UPDATE empleados', 'SET salario = salario * 1.30', 'WHERE id_empleado = 11;'),
    {
      setup: [TRIGGER_VALIDA],
      after: ['SELECT id_empleado, nombre, salario FROM empleados WHERE id_empleado = 11'],
      expectError: 'ORA-20010',
    },
  ),
  plsql(
    'S3-E-TRIGGER-VALIDA-OK',
    lines('UPDATE empleados', 'SET salario = salario * 1.10', 'WHERE id_empleado = 11;'),
    {
      setup: [TRIGGER_VALIDA],
      after: ['SELECT id_empleado, nombre, salario FROM empleados WHERE id_empleado = 11'],
    },
  ),
  plsql(
    'S3-E-MUTANTE',
    lines('UPDATE empleados', 'SET salario = salario + 100000', 'WHERE id_empleado = 6;'),
    {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_promedio_area',
          'AFTER UPDATE OF salario ON empleados',
          'FOR EACH ROW',
          'DECLARE',
          '  v_promedio NUMBER;',
          'BEGIN',
          '  SELECT AVG(salario) INTO v_promedio',
          '  FROM empleados',
          '  WHERE id_departamento = :NEW.id_departamento;',
          "  DBMS_OUTPUT.PUT_LINE('Promedio del área: ' || v_promedio);",
          'END;',
        ),
      ],
      expectError: 'ORA-04091',
    },
  ),
  plsql(
    'S3-E-COMMIT-TRIGGER',
    lines(
      'INSERT INTO departamentos (id_departamento, nombre_departamento, sede)',
      "VALUES (70, 'Calidad', 'Cali');",
    ),
    {
      setup: [
        lines(
          'CREATE OR REPLACE TRIGGER trg_confirmar',
          'AFTER INSERT ON departamentos',
          'BEGIN',
          '  COMMIT;',
          'END;',
        ),
      ],
      expectError: 'ORA-04092',
    },
  ),

  /* ---------- Bloque 13: integración ---------- */
  plsql(
    'S3-E-INTEGRADOR',
    lines(
      'DECLARE',
      '  v_total NUMBER;',
      'BEGIN',
      '  aplicar_aumentos(10, 5, v_total);',
      "  DBMS_OUTPUT.PUT_LINE('Personas actualizadas: ' || v_total);",
      'END;',
    ),
    { setup: [TRIGGER_AUDITORIA, APLICAR_AUMENTOS], after: [AUDITORIA] },
  ),
  plsql(
    'S3-E-INTEGRADOR-ERROR',
    lines('DECLARE', '  v_total NUMBER;', 'BEGIN', '  aplicar_aumentos(10, 30, v_total);', 'END;'),
    { setup: [TRIGGER_AUDITORIA, APLICAR_AUMENTOS], after: [AUDITORIA], expectError: 'ORA-20020' },
  ),
];

export const TRIGGER_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S3-L23',
    block: 'triggers',
    slug: 'que-es-un-trigger',
    title: 'Qué es un trigger: evento, momento y acción',
    shortTitle: 'Qué es un trigger',
    summary:
      'Un trigger es un bloque guardado que Oracle ejecuta solo cuando ocurre un evento sobre una tabla (INSERT, UPDATE o DELETE).',
    concepts: ['trigger'],
    purpose:
      'Reaccionar automáticamente a los cambios de datos: auditar, validar o completar valores sin depender de que cada aplicación lo recuerde.',
    syntax: lines(
      'CREATE OR REPLACE TRIGGER nombre',
      'BEFORE | AFTER                  -- momento',
      'INSERT OR UPDATE OR DELETE      -- evento',
      'ON tabla',
      '[FOR EACH ROW]                  -- nivel',
      'BEGIN',
      '  …                             -- acción',
      'END;',
    ),
    explanation: [
      'Un trigger no se llama: se dispara. Se define con tres decisiones: el evento (qué sentencia lo activa), el momento (BEFORE o AFTER la sentencia) y el nivel (una vez por sentencia o una vez por fila con FOR EACH ROW).',
      'Sin FOR EACH ROW es un trigger de sentencia: se ejecuta una sola vez aunque la sentencia afecte muchas filas, o ninguna.',
    ],
    example: {
      question: '¿Qué pasa al insertar un departamento si hay un trigger AFTER INSERT?',
      example: 'S3-E-TRIGGER-SENTENCIA',
      reading:
        'Primero se crea el trigger. Después, un INSERT normal lo dispara: el trigger escribe su mensaje y la fila queda insertada.',
      visual: {
        kind: 'trigger',
        event: 'INSERT ON departamentos',
        timing: 'AFTER, una vez por sentencia',
      },
    },
    changed: [
      'Nadie llamó al trigger: el INSERT lo disparó.',
      'Aparece el departamento 70 en la tabla.',
    ],
    mistakes: [
      {
        title: 'Intentar ejecutar un trigger',
        why: 'No se llama como un procedimiento: se dispara con la sentencia de su evento.',
      },
    ],
    check: {
      id: 'S3-L23-C',
      kind: 'choice',
      lesson: 'S3-L23',
      prompt:
        'Un trigger AFTER INSERT ON departamentos (sin FOR EACH ROW). Se ejecuta un INSERT … SELECT que inserta tres filas. ¿Cuántas veces se ejecuta el trigger?',
      options: [
        { text: 'Una', correct: true, feedback: 'Correcto: es de sentencia, una vez por INSERT.' },
        { text: 'Tres', correct: false, feedback: 'Eso pasaría con FOR EACH ROW.' },
        { text: 'Ninguna', correct: false, feedback: 'El INSERT es justamente su evento.' },
        { text: 'Cuatro', correct: false, feedback: 'No hay una ejecución extra.' },
      ],
      hints: ['¿Tiene FOR EACH ROW?', 'Sin él, el nivel es la sentencia.'],
      explanation:
        'Un trigger de sentencia se ejecuta una vez por sentencia, afecte las filas que afecte.',
    },
    keyIdea: 'Evento + momento + nivel → acción automática.',
    topic: 'triggers',
    version: 1,
  },
  {
    id: 'S3-L24',
    block: 'triggers',
    slug: 'before-after-for-each-row',
    title: 'BEFORE y AFTER, por sentencia o FOR EACH ROW',
    shortTitle: 'BEFORE/AFTER y filas',
    summary:
      'BEFORE actúa antes del cambio (puede corregir los valores nuevos); AFTER, después. FOR EACH ROW se ejecuta una vez por cada fila afectada.',
    concepts: ['trigger-timing', 'row-trigger'],
    purpose:
      'Elegir el momento y el nivel según la tarea: corregir antes de guardar o registrar después de guardar.',
    syntax: lines(
      'BEFORE INSERT ON t FOR EACH ROW   -- puede cambiar :NEW',
      'AFTER UPDATE ON t FOR EACH ROW    -- ve el cambio hecho',
      'AFTER UPDATE ON t                 -- una vez por sentencia',
    ),
    explanation: [
      'Un trigger BEFORE de fila puede modificar los valores que se van a guardar asignando a :NEW: sirve para normalizar o completar datos.',
      'Un trigger AFTER de fila ve el cambio ya aplicado: sirve para auditar o propagar. Con una sentencia que cambia tres filas, un trigger de fila se ejecuta tres veces; uno de sentencia, una.',
      'Cuando conviven, Oracle ejecuta los de fila durante la sentencia y el de sentencia AFTER al final.',
    ],
    example: {
      question: '¿Cuántas veces se dispara cada trigger con un UPDATE de tres filas?',
      example: 'S3-E-TRIGGER-FILAS',
      reading:
        'Un UPDATE sobre Recursos Humanos (tres personas) dispara tres veces el trigger de fila y una vez el de sentencia.',
      visual: {
        kind: 'trigger',
        event: 'UPDATE OF salario ON empleados',
        timing: 'AFTER: de fila y de sentencia',
      },
    },
    more: [
      {
        question: 'BEFORE INSERT corrige los datos antes de guardarlos.',
        example: 'S3-E-TRIGGER-BEFORE',
        reading:
          'El trigger pone en mayúscula inicial el nombre y el apellido y cambia el bono NULL por 0 antes de guardar la fila.',
        visual: { kind: 'trigger', event: 'INSERT ON empleados', timing: 'BEFORE, FOR EACH ROW' },
      },
    ],
    changed: ['Cuatro líneas de salida: tres de fila y una de sentencia.'],
    mistakes: [
      {
        title: 'Asignar :NEW en un trigger AFTER',
        why: 'Después del cambio ya no se puede corregir la fila: Oracle no compila la asignación. Para corregir, BEFORE.',
      },
    ],
    check: {
      id: 'S3-L24-C',
      kind: 'count',
      lesson: 'S3-L24',
      prompt:
        '¿Cuántas líneas escribe en total el UPDATE de Recursos Humanos con los dos triggers?',
      context: { example: 'S3-E-TRIGGER-FILAS' },
      hints: [
        'Recursos Humanos tiene tres personas.',
        'El trigger de sentencia se ejecuta una vez.',
      ],
      explanation: 'Cuatro: tres del trigger de fila y una del de sentencia.',
    },
    keyIdea: 'BEFORE corrige, AFTER registra; FOR EACH ROW = una vez por fila.',
    topic: 'triggers',
    version: 1,
  },
  {
    id: 'S3-L25',
    block: 'triggers',
    slug: 'old-y-new',
    title: ':OLD y :NEW: auditoría de salarios',
    shortTitle: ':OLD y :NEW',
    summary:
      'En un trigger de fila, :OLD es la fila antes del cambio y :NEW la fila después; con ellos se registra qué cambió.',
    concepts: ['old-new'],
    purpose: 'Guardar un historial: quién cambió de salario, de cuánto a cuánto y cuándo.',
    syntax: lines(
      'AFTER UPDATE OF salario ON empleados',
      'FOR EACH ROW',
      'BEGIN',
      '  INSERT INTO auditoria_salarios (…)',
      '  VALUES (:OLD.id_empleado, :OLD.salario, :NEW.salario, …);',
      'END;',
    ),
    explanation: [
      'En un UPDATE, :OLD.salario es el valor antes y :NEW.salario el valor después. En un INSERT no hay fila anterior: :OLD es NULL. En un DELETE no hay fila nueva: :NEW es NULL.',
      'Solo existen en triggers de fila (FOR EACH ROW). En un trigger de sentencia, Oracle rechaza su uso (ORA-04082).',
      'INSERTING, UPDATING y DELETING dicen qué evento disparó un trigger que escucha varios.',
    ],
    example: {
      question: 'Aumento del 10 % a Recursos Humanos: ¿qué queda en la auditoría?',
      example: 'S3-E-AUDITORIA',
      reading:
        'El UPDATE cambia tres salarios; el trigger se dispara por cada fila e inserta en AUDITORIA_SALARIOS el valor anterior (:OLD) y el nuevo (:NEW).',
      visual: {
        kind: 'trigger',
        event: 'UPDATE OF salario ON empleados',
        timing: 'AFTER, FOR EACH ROW',
      },
    },
    more: [
      {
        question: 'Un trigger para INSERT, UPDATE y DELETE: ¿qué guarda :OLD y :NEW en cada caso?',
        example: 'S3-E-AUDITORIA-DML',
        reading:
          'Al insertar, :OLD.salario es NULL; al actualizar, ambos tienen valor; al borrar, :NEW.salario es NULL.',
        visual: {
          kind: 'trigger',
          event: 'INSERT OR UPDATE OR DELETE ON empleados',
          timing: 'AFTER, FOR EACH ROW',
        },
      },
      {
        question: 'Error: :NEW en un trigger de sentencia.',
        example: 'S3-E-NEW-SENTENCIA',
        reading: 'Sin FOR EACH ROW no hay «fila actual»: Oracle responde ORA-04082.',
      },
    ],
    changed: [
      'EMPLEADOS: tres salarios suben un 10 %.',
      'AUDITORIA_SALARIOS: de vacía a tres filas, una por persona, con el antes y el después.',
    ],
    mistakes: [
      { title: ':NEW en un DELETE', why: 'En un borrado no hay fila nueva: :NEW vale NULL.' },
      {
        title: 'Usar :OLD y :NEW sin FOR EACH ROW',
        why: 'Solo existen en triggers de fila (ORA-04082).',
      },
    ],
    check: {
      id: 'S3-L25-C',
      kind: 'choice',
      lesson: 'S3-L25',
      prompt: 'En un trigger AFTER DELETE FOR EACH ROW, ¿qué vale :NEW.salario?',
      options: [
        {
          text: 'NULL',
          code: true,
          correct: true,
          feedback: 'Correcto: después de borrar no hay fila nueva.',
        },
        { text: 'El salario borrado', correct: false, feedback: 'Ese valor está en :OLD.salario.' },
        {
          text: '0',
          code: true,
          correct: false,
          feedback: 'No hay un valor por defecto: es NULL.',
        },
        {
          text: 'Error de compilación',
          correct: false,
          feedback: 'Se puede usar; simplemente vale NULL.',
        },
      ],
      hints: ['¿Existe una fila «después» de un borrado?', 'El valor anterior se guarda en :OLD.'],
      explanation: 'En DELETE, :OLD tiene la fila borrada y :NEW es NULL.',
    },
    keyIdea: ':OLD = antes; :NEW = después; solo en triggers FOR EACH ROW.',
    topic: 'triggers',
    version: 1,
  },
  {
    id: 'S3-L26',
    block: 'triggers',
    slug: 'trigger-de-validacion',
    title: 'Validar con un trigger BEFORE',
    shortTitle: 'Trigger de validación',
    summary:
      'Un trigger BEFORE puede rechazar un cambio con RAISE_APPLICATION_ERROR; la sentencia completa se deshace.',
    concepts: ['trigger-validation'],
    purpose:
      'Imponer una regla que deben cumplir todos los programas: un aumento no puede superar el 20 %.',
    syntax: lines(
      'BEFORE UPDATE OF salario ON empleados',
      'FOR EACH ROW',
      'BEGIN',
      '  IF :NEW.salario > :OLD.salario * 1.20 THEN',
      "    RAISE_APPLICATION_ERROR(-20010, '…');",
      '  END IF;',
      'END;',
    ),
    explanation: [
      'Si el trigger lanza un error, la sentencia que lo disparó falla entera: ninguna de sus filas queda modificada.',
      'Oracle informa el error del trigger (ORA-20010), la línea (ORA-06512) y que falló un trigger (ORA-04088).',
      'Las reglas simples sobre una columna se expresan mejor con una restricción CHECK; el trigger sirve cuando la regla compara :OLD con :NEW.',
    ],
    example: {
      question: '¿Qué pasa si alguien intenta subir un 30 % el salario de Valentina?',
      example: 'S3-E-TRIGGER-VALIDA',
      reading:
        'El trigger compara el salario nuevo con el anterior, rechaza el cambio y la fila queda como estaba.',
      visual: {
        kind: 'trigger',
        event: 'UPDATE OF salario ON empleados',
        timing: 'BEFORE, FOR EACH ROW',
      },
    },
    more: [
      {
        question: 'Con un 10 % la regla se cumple.',
        example: 'S3-E-TRIGGER-VALIDA-OK',
        reading: 'El trigger no lanza nada y el salario cambia.',
      },
    ],
    changed: ['El salario de Valentina no cambia: el UPDATE se deshizo completo.'],
    mistakes: [
      {
        title: 'Validar en AFTER',
        why: 'Funciona, pero el cambio ya se hizo y se deshace después: BEFORE detecta el problema antes.',
      },
    ],
    check: {
      id: 'S3-L26-C',
      kind: 'choice',
      lesson: 'S3-L26',
      prompt:
        'Un UPDATE afecta cinco filas y el trigger BEFORE rechaza la tercera. ¿Qué queda guardado?',
      options: [
        {
          text: 'Nada: la sentencia completa se deshace.',
          correct: true,
          feedback: 'Correcto: una sentencia es atómica.',
        },
        {
          text: 'Las dos primeras filas.',
          correct: false,
          feedback: 'Oracle deshace también las filas ya procesadas.',
        },
        {
          text: 'Las cuatro filas válidas.',
          correct: false,
          feedback: 'La sentencia no continúa tras el error.',
        },
        {
          text: 'Las cinco: el trigger solo avisa.',
          correct: false,
          feedback: 'RAISE_APPLICATION_ERROR detiene la sentencia.',
        },
      ],
      hints: [
        '¿Una sentencia SQL puede quedar a medias?',
        'El error del trigger es el error de la sentencia.',
      ],
      explanation: 'Si un trigger falla, la sentencia que lo disparó falla completa.',
    },
    keyIdea: 'BEFORE + RAISE_APPLICATION_ERROR = el cambio no ocurre.',
    topic: 'triggers',
    version: 1,
  },
  {
    id: 'S3-L27',
    block: 'triggers',
    slug: 'limites-de-los-triggers',
    title: 'Cuándo no usar un trigger',
    shortTitle: 'Límites',
    summary:
      'Los triggers son invisibles para quien ejecuta la sentencia: úsalos para auditoría e integridad, no para la lógica general del negocio.',
    concepts: ['trigger-limits'],
    purpose: 'Evitar diseños difíciles de entender y errores clásicos como la tabla mutante.',
    syntax: lines(
      '-- Prefiere:',
      '--   restricciones (PK, FK, CHECK) para reglas simples;',
      '--   procedimientos para procesos de negocio;',
      '--   triggers para auditar y reglas que comparan :OLD y :NEW.',
    ),
    explanation: [
      'Quien escribe un UPDATE no ve el trigger: si el trigger hace demasiado (llama a otros procesos, modifica otras tablas, dispara otros triggers), el comportamiento se vuelve difícil de seguir y de probar.',
      'Un trigger de fila no puede consultar la misma tabla que se está modificando: Oracle responde ORA-04091 (tabla mutante).',
      'Un trigger no puede confirmar ni deshacer la transacción: COMMIT dentro de un trigger da ORA-04092.',
    ],
    example: {
      question: '¿Qué pasa si un trigger de fila calcula el promedio de la misma tabla?',
      example: 'S3-E-MUTANTE',
      reading:
        'Mientras se actualiza EMPLEADOS, el trigger intenta leer EMPLEADOS: Oracle lo impide con ORA-04091 y el UPDATE falla.',
      visual: {
        kind: 'trigger',
        event: 'UPDATE OF salario ON empleados',
        timing: 'AFTER, FOR EACH ROW',
      },
    },
    more: [
      {
        question: 'Error: COMMIT dentro de un trigger.',
        example: 'S3-E-COMMIT-TRIGGER',
        reading:
          'El trigger forma parte de la transacción de quien hizo el INSERT: no puede confirmarla (ORA-04092).',
      },
    ],
    changed: ['El UPDATE no se aplica: el error del trigger lo detiene.'],
    mistakes: [
      {
        title: 'Lógica de negocio escondida en triggers',
        why: 'Ponla en un procedimiento que se llama de forma explícita.',
      },
      {
        title: 'Triggers en cascada',
        why: 'Un trigger que modifica otra tabla con triggers encadena efectos difíciles de depurar.',
      },
    ],
    check: {
      id: 'S3-L27-C',
      kind: 'choice',
      lesson: 'S3-L27',
      prompt: '¿Cuál es un buen uso de un trigger?',
      options: [
        {
          text: 'Registrar en una tabla de auditoría cada cambio de salario.',
          correct: true,
          feedback: 'Correcto: es automático, local y fácil de entender.',
        },
        {
          text: 'Calcular la nómina mensual completa cada vez que alguien cambia de ciudad.',
          correct: false,
          feedback: 'Es un proceso de negocio: va en un procedimiento.',
        },
        {
          text: 'Confirmar con COMMIT cada inserción.',
          correct: false,
          feedback: 'Un trigger no puede hacer COMMIT (ORA-04092).',
        },
        {
          text: 'Garantizar que el salario sea positivo.',
          correct: false,
          feedback: 'Funciona, pero una restricción CHECK es más simple y clara.',
        },
      ],
      hints: [
        'Piensa en tareas pequeñas ligadas a un cambio de fila.',
        'Las reglas simples tienen herramientas más sencillas.',
      ],
      explanation:
        'Auditar cambios es el uso típico; los procesos van en procedimientos y las reglas simples en CHECK.',
    },
    keyIdea: 'Trigger para auditar e imponer reglas de cambio; procesos en procedimientos.',
    topic: 'triggers',
    version: 1,
  },
  {
    id: 'S3-L28',
    block: 'integracion',
    slug: 'caso-integrador',
    title: 'Caso integrador: aumento anual con auditoría',
    shortTitle: 'Integración',
    summary:
      'Un procedimiento con cursor, variables, validación y parámetro OUT aplica aumentos; un trigger audita cada cambio.',
    concepts: ['procedure', 'trigger', 'cursor-for-loop'],
    purpose:
      'Ver cómo encajan las piezas de la sección en un caso pequeño y completo, sin construir un sistema entero.',
    syntax: lines(
      'PROCEDURE aplicar_aumentos (p_departamento IN, p_porcentaje IN, p_actualizados OUT)',
      '  validación → RAISE',
      '  cursor FOR → UPDATE por fila → DBMS_OUTPUT',
      'TRIGGER trg_auditar_salario  → AUDITORIA_SALARIOS',
    ),
    explanation: [
      'El procedimiento valida el porcentaje (excepción propia convertida en RAISE_APPLICATION_ERROR), recorre con un cursor FOR a las personas activas del departamento, calcula el salario nuevo en una variable y lo actualiza.',
      'Cada UPDATE dispara el trigger de auditoría, que guarda :OLD y :NEW. El parámetro OUT devuelve cuántas personas se actualizaron.',
      'Si el porcentaje no es válido, nada cambia y la auditoría queda vacía.',
    ],
    example: {
      question: 'Aumento del 5 % para Operaciones: ¿qué se escribe y qué queda auditado?',
      example: 'S3-E-INTEGRADOR',
      reading:
        'El procedimiento procesa a Ana y Felipe (Alicia está inactiva), escribe cada cambio y devuelve 2; el trigger registra las dos actualizaciones.',
      visual: {
        kind: 'trigger',
        event: 'UPDATE dentro del procedimiento',
        timing: 'AFTER, FOR EACH ROW',
      },
    },
    more: [
      {
        question: 'Con un 30 % la validación detiene todo.',
        example: 'S3-E-INTEGRADOR-ERROR',
        reading:
          'El procedimiento lanza ORA-20020 antes de tocar ninguna fila: la auditoría sigue vacía.',
      },
    ],
    changed: [
      'Dos salarios cambian; Alicia no, porque el cursor solo trae personas activas.',
      'AUDITORIA_SALARIOS recibe una fila por cada UPDATE.',
    ],
    mistakes: [
      {
        title: 'Validar después de modificar',
        why: 'La validación va antes del bucle: así un dato inválido no deja cambios a medias.',
      },
    ],
    check: {
      id: 'S3-L28-C',
      kind: 'count',
      lesson: 'S3-L28',
      prompt: '¿Cuántas líneas escribe DBMS_OUTPUT en el caso del 5 % para Operaciones?',
      context: { example: 'S3-E-INTEGRADOR' },
      hints: [
        'El procedimiento escribe una línea por persona activa procesada.',
        'El bloque escribe además el total.',
      ],
      explanation: 'Tres: Ana, Felipe y la línea final con el total.',
    },
    keyIdea:
      'Variables + control + cursor + subprograma + excepción + trigger = un proceso completo.',
    topic: 'triggers',
    version: 1,
  },
];
