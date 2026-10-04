import { lines, plsql } from '../../builders';
import type { CurriculumExample } from '../../types';
import { AUDITORIA, TRIGGER_AUDITORIA, TRIGGER_FILA, TRIGGER_SENTENCIA } from './triggers';

/**
 * Sección 3: bloques propios del banco de evaluación (S3-B-*). No aparecen en las lecciones,
 * pero se ejecutan en Oracle como el resto: el banco (features/assessments) toma de aquí la
 * salida de DBMS_OUTPUT, los errores y las tablas posteriores que cita.
 */

const BONO_DE = (id: number, etiqueta: string) =>
  plsql(
    etiqueta,
    lines(
      'DECLARE',
      '  v_bono empleados.bono%TYPE;',
      'BEGIN',
      '  SELECT bono INTO v_bono',
      '  FROM empleados',
      `  WHERE id_empleado = ${id};`,
      '  IF v_bono > 0 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Con bono');",
      '  ELSIF v_bono = 0 THEN',
      "    DBMS_OUTPUT.PUT_LINE('Bono en cero');",
      '  ELSE',
      "    DBMS_OUTPUT.PUT_LINE('Sin bono registrado');",
      '  END IF;',
      'END;',
    ),
  );

export const S3_ASSESSMENT_EXAMPLES: readonly CurriculumExample[] = [
  /* ---------- Bloques y variables ---------- */
  plsql(
    'S3-B-CONCAT-NULL',
    lines(
      'BEGIN',
      "  DBMS_OUTPUT.PUT_LINE('Inicio');",
      "  DBMS_OUTPUT.PUT_LINE('A' || NULL || 'B');",
      'END;',
    ),
  ),
  plsql(
    'S3-B-NVL-VAR',
    lines(
      'DECLARE',
      '  v_bono  empleados.bono%TYPE;',
      '  v_total NUMBER;',
      'BEGIN',
      '  SELECT bono INTO v_bono',
      '  FROM empleados',
      '  WHERE id_empleado = 7;',
      '  v_total := 4200000 + v_bono;',
      "  DBMS_OUTPUT.PUT_LINE('Sin NVL: ' || v_total);",
      '  v_total := 4200000 + NVL(v_bono, 0);',
      "  DBMS_OUTPUT.PUT_LINE('Con NVL: ' || v_total);",
      'END;',
    ),
  ),
  plsql(
    'S3-B-MAX-VACIO',
    lines(
      'DECLARE',
      '  v_max NUMBER;',
      'BEGIN',
      '  SELECT MAX(salario) INTO v_max',
      '  FROM empleados',
      '  WHERE id_departamento = 60;',
      "  DBMS_OUTPUT.PUT_LINE('Máximo: ' || NVL(TO_CHAR(v_max), 'sin datos'));",
      'END;',
    ),
  ),

  /* ---------- Control ---------- */
  BONO_DE(10, 'S3-B-IF-BONO-CERO'),
  BONO_DE(7, 'S3-B-IF-BONO-NULL'),
  plsql(
    'S3-B-CASE-SIMPLE',
    lines(
      'DECLARE',
      '  v_depto empleados.id_departamento%TYPE;',
      '  v_texto VARCHAR2(30);',
      'BEGIN',
      '  SELECT id_departamento INTO v_depto',
      '  FROM empleados',
      '  WHERE id_empleado = 13;',
      '  v_texto := CASE v_depto',
      "               WHEN 20 THEN 'Tecnología'",
      "               WHEN 40 THEN 'Finanzas'",
      "               ELSE 'Otra área'",
      '             END;',
      "  DBMS_OUTPUT.PUT_LINE('Camila: ' || v_texto);",
      'END;',
    ),
  ),
  plsql(
    'S3-B-CASE-EXPR',
    lines(
      'DECLARE',
      '  v_texto VARCHAR2(30);',
      'BEGIN',
      '  v_texto := CASE 60',
      "               WHEN 20 THEN 'TI'",
      "               WHEN 40 THEN 'Finanzas'",
      '             END;',
      "  DBMS_OUTPUT.PUT_LINE('Área: ' || NVL(v_texto, 'sin nombre'));",
      'END;',
    ),
  ),

  /* ---------- Bucles y cursores ---------- */
  plsql(
    'S3-B-LOOP-EXIT',
    lines(
      'DECLARE',
      '  v_i NUMBER := 0;',
      'BEGIN',
      '  LOOP',
      '    v_i := v_i + 2;',
      '    EXIT WHEN v_i > 6;',
      "    DBMS_OUTPUT.PUT_LINE('Vuelta ' || v_i);",
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Fin con ' || v_i);",
      'END;',
    ),
  ),
  plsql(
    'S3-B-FOR-REVERSE',
    lines(
      'BEGIN',
      '  FOR i IN REVERSE 1..3 LOOP',
      '    DBMS_OUTPUT.PUT_LINE(i);',
      '  END LOOP;',
      'END;',
    ),
  ),
  plsql(
    'S3-B-CURSOR-ROWCOUNT',
    lines(
      'DECLARE',
      '  CURSOR c_analistas IS',
      '    SELECT nombre',
      '    FROM empleados',
      "    WHERE cargo = 'Analista'",
      "      AND estado = 'ACTIVO'",
      '    ORDER BY id_empleado;',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  OPEN c_analistas;',
      '  LOOP',
      '    FETCH c_analistas INTO v_nombre;',
      '    EXIT WHEN c_analistas%NOTFOUND;',
      '  END LOOP;',
      "  DBMS_OUTPUT.PUT_LINE('Leídas: ' || c_analistas%ROWCOUNT);",
      '  CLOSE c_analistas;',
      'END;',
    ),
  ),

  /* ---------- Excepciones ---------- */
  plsql(
    'S3-B-EXC-VARIAS',
    lines(
      'DECLARE',
      '  v_nombre empleados.nombre%TYPE;',
      'BEGIN',
      '  SELECT nombre INTO v_nombre',
      '  FROM empleados',
      "  WHERE ciudad = 'Medellín';",
      "  DBMS_OUTPUT.PUT_LINE('Una persona: ' || v_nombre);",
      'EXCEPTION',
      '  WHEN NO_DATA_FOUND THEN',
      "    DBMS_OUTPUT.PUT_LINE('Nadie en Medellín');",
      '  WHEN TOO_MANY_ROWS THEN',
      "    DBMS_OUTPUT.PUT_LINE('Varias personas en Medellín');",
      '  WHEN OTHERS THEN',
      "    DBMS_OUTPUT.PUT_LINE('Otro error');",
      'END;',
    ),
  ),
  plsql(
    'S3-B-EXC-NO-MANEJADA',
    lines('DECLARE', '  e_sin_horas EXCEPTION;', 'BEGIN', '  RAISE e_sin_horas;', 'END;'),
    { expectError: 'ORA-06510' },
  ),

  /* ---------- Triggers ---------- */
  plsql(
    'S3-B-TRIGGER-VENTAS',
    lines('UPDATE empleados', 'SET salario = salario + 50000', 'WHERE id_departamento = 30;'),
    { setup: [TRIGGER_SENTENCIA, TRIGGER_FILA] },
  ),
  plsql(
    'S3-B-AUDIT-PAULA',
    lines('UPDATE empleados', 'SET salario = salario * 1.10', 'WHERE id_empleado = 7;'),
    { setup: [TRIGGER_AUDITORIA], after: [AUDITORIA] },
  ),
];
