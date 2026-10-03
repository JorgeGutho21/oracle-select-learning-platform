// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  analyzeExpression,
  analyzeSql,
  conditionColumns,
  sourceColumns,
} from '@/domain/sql/analyzer';
import { describeAnatomy } from '@/domain/sql/anatomy';
import { runEducational } from '@/domain/sql/educational-run';
import { evaluateExpression } from '@/domain/sql/evaluator';
import { lex } from '@/domain/sql/lexer';
import { renderStatement } from '@/domain/sql/render';
import { positionAt } from '@/domain/sql/source';
import { translateStatement } from '@/domain/sql/translator';
import { likeSegments } from '@/domain/sql/values';
import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { isSortedBy } from '@/domain/results/result-table';

const firstError = (sql: string) => analyzeSql(sql).errors[0];
const run = (sql: string) => {
  const outcome = runEducational(sql);
  if (!outcome.result)
    throw new Error(
      `Sin resultado: ${(outcome.analysis.errors[0] ?? outcome.runtimeError)?.message}`,
    );
  return outcome;
};
const result = (sql: string) => run(sql).result!;
const column = (sql: string, name: string) => {
  const { table } = result(sql);
  const index = table.columns.indexOf(name);
  return table.rows.map((row) => row[index]);
};
const names = (sql: string) => column(sql, 'NOMBRE');
const rowOf = (sql: string, name: string) => {
  const { table } = result(sql);
  const nameIndex = table.columns.indexOf('NOMBRE');
  return table.rows.find((row) => row[nameIndex] === name);
};

describe('Léxico', () => {
  it('reconoce palabras, números, operadores, textos, comparaciones y comentarios', () => {
    const { tokens, comments } = lex(
      "SELECT nombre || ' ' AS \"Nombre\" -- nota\nFROM empleados WHERE salario >= 3000000 AND ciudad <> 'O''Neil';",
    );
    expect(tokens.map((token) => token.kind)).toEqual([
      'identifier',
      'identifier',
      'concat',
      'string',
      'identifier',
      'quoted-identifier',
      'identifier',
      'identifier',
      'identifier',
      'identifier',
      'comparison',
      'number',
      'identifier',
      'identifier',
      'comparison',
      'string',
      'semicolon',
      'eof',
    ]);
    expect(tokens[15]).toMatchObject({ value: "O'Neil" });
    expect(tokens[10]).toMatchObject({ text: '>=' });
    expect(tokens[14]).toMatchObject({ text: '<>' });
    expect(comments).toHaveLength(1);
  });

  it('reconoce los tres operadores de distinto de Oracle', () => {
    expect(
      lex('a <> b != c ^= d').tokens.filter((token) => token.kind === 'comparison'),
    ).toHaveLength(3);
  });

  it('calcula línea y columna desde 1', () => {
    expect(positionAt('SELECT\n  nombre', 9)).toEqual({ line: 2, column: 3 });
  });
});

describe('Proyección (LAB01–LAB10 con el dataset v2)', () => {
  it('LAB01: SELECT * devuelve las 12 columnas en orden del esquema y las 20 filas', () => {
    const { table } = result('SELECT * FROM empleados;');
    expect(table.columns).toEqual([...EMPLEADOS_COLUMNS]);
    expect(table.rows).toHaveLength(20);
  });

  it('LAB02: caja libre y orden de columnas respetado', () => {
    expect(result('select ciudad, nombre from EMPLEADOS').table.columns).toEqual([
      'CIUDAD',
      'NOMBRE',
    ]);
  });

  it('LAB03: salario mensual × 12 con alias', () => {
    const sql = 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;';
    expect(result(sql).table.columns).toEqual(['NOMBRE', 'SALARIO_ANUAL']);
    expect(rowOf(sql, 'Ana')).toEqual(['Ana', 108000000]);
    expect(rowOf(sql, 'Felipe')).toEqual(['Felipe', 25200000]);
  });

  it('LAB04 y LAB05: DISTINCT compara la fila completa', () => {
    expect(result('SELECT ciudad FROM empleados').table.rows).toHaveLength(20);
    expect(result('SELECT DISTINCT ciudad FROM empleados;').table.rows).toHaveLength(5);
    expect(result('SELECT DISTINCT departamento FROM empleados').table.rows).toHaveLength(5);
    expect(result('SELECT DISTINCT ciudad, departamento FROM empleados;').table.rows).toHaveLength(
      16,
    );
    expect(
      result('SELECT DISTINCT ciudad, departamento FROM empleados').trace.duplicateRows,
    ).toEqual([6, 9, 13, 18].map((id) => id - 1));
  });

  it('precedencia aritmética: salario + bono * 12 frente a (salario + bono) * 12', () => {
    const without = 'SELECT nombre, salario + bono * 12 AS total FROM empleados';
    const withParentheses = 'SELECT nombre, (salario + bono) * 12 AS total FROM empleados';
    expect(rowOf(without, 'Ana')).toEqual(['Ana', 19800000]);
    expect(rowOf(withParentheses, 'Ana')).toEqual(['Ana', 118800000]);
    // BONO NULL: el cálculo entero es NULL.
    expect(rowOf(without, 'Jorge')).toEqual(['Jorge', null]);
    expect(rowOf(withParentheses, 'Jorge')).toEqual(['Jorge', null]);
  });

  it('LAB08: división exacta', () => {
    expect(rowOf('SELECT nombre, salario / 2 AS mitad FROM empleados;', 'Ana')).toEqual([
      'Ana',
      4500000,
    ]);
  });

  it('LAB09: alias entre comillas conserva caja y espacios', () => {
    expect(result('SELECT nombre AS "Nombre empleado" FROM empleados;').table.columns).toEqual([
      'Nombre empleado',
    ]);
  });

  it('LAB10: sin coma es un alias implícito válido, con aviso y corrección posible', () => {
    const analysis = analyzeSql('SELECT nombre salario FROM empleados;');
    expect(analysis.ok).toBe(true);
    expect(analysis.warnings[0]).toMatchObject({
      code: 'possible-missing-comma',
      line: 1,
      column: 15,
      fix: { span: { start: 13, end: 13 }, text: ',' },
    });
    expect(result('SELECT nombre salario FROM empleados;').table.columns).toEqual(['SALARIO']);
  });

  it('literales y concatenación con ||, con NULL como texto vacío', () => {
    const sql = "SELECT nombre || ' ' || apellido AS nombre_completo FROM empleados";
    expect(result(sql).table.rows[0]).toEqual(['Ana Rojas']);
    expect(result("SELECT 'Empleado' AS tipo, nombre FROM empleados").table.rows[0]).toEqual([
      'Empleado',
      'Ana',
    ]);
    expect(rowOf('SELECT nombre, nombre || bono AS texto FROM empleados', 'Jorge')).toEqual([
      'Jorge',
      'Jorge',
    ]);
    expect(result("SELECT '' AS vacio FROM empleados").table.rows[0]).toEqual([null]);
  });

  it('un texto vacío es NULL, como en Oracle', () => {
    expect(result("SELECT nombre FROM empleados WHERE '' IS NULL").table.rows).toHaveLength(20);
  });
});

describe('WHERE y operadores', () => {
  it('filtra con = y cuenta las filas que cumplen', () => {
    const outcome = result("SELECT nombre FROM empleados WHERE ciudad = 'Bogotá'");
    expect(outcome.table.rows).toHaveLength(7);
    expect(outcome.trace.keptRows).toHaveLength(7);
    expect(outcome.trace.conditions).toHaveLength(20);
  });

  it.each([
    ["ciudad <> 'Bogotá'", 13],
    ["ciudad != 'Bogotá'", 13],
    ["ciudad ^= 'Bogotá'", 13],
    ['salario > 5000000', 7],
    ['salario >= 6000000', 5],
    ['salario < 3000000', 4],
    ['salario <= 3000000', 5],
    ["estado = 'ACTIVO'", 17],
    ["NOT ciudad = 'Bogotá'", 13],
    ["fecha_ingreso >= DATE '2020-01-01'", 9],
  ])('%s deja %i filas', (condition, count) => {
    expect(result(`SELECT nombre FROM empleados WHERE ${condition}`).table.rows).toHaveLength(
      count,
    );
  });

  it('AND exige ambas; OR, al menos una', () => {
    expect(
      result("SELECT nombre FROM empleados WHERE ciudad = 'Bogotá' AND salario > 5000000").table
        .rows,
    ).toHaveLength(4);
    expect(
      result("SELECT nombre FROM empleados WHERE ciudad = 'Cali' OR ciudad = 'Barranquilla'").table
        .rows,
    ).toHaveLength(7);
  });

  it('AND va antes que OR: los paréntesis cambian el resultado', () => {
    const without =
      "SELECT nombre FROM empleados WHERE ciudad = 'Bogotá' OR ciudad = 'Medellín' AND salario > 5000000";
    const grouped =
      "SELECT nombre FROM empleados WHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín') AND salario > 5000000";
    expect(result(without).table.rows).toHaveLength(9);
    expect(result(grouped).table.rows).toHaveLength(6);
    expect(analyzeSql(without).warnings.map(({ code }) => code)).toContain('and-or-precedence');
    expect(analyzeSql(grouped).warnings.map(({ code }) => code)).not.toContain('and-or-precedence');
  });

  it('un paréntesis puede abrir una expresión en la condición', () => {
    expect(
      result('SELECT nombre FROM empleados WHERE (salario + bono) * 12 > 100000000').table.rows,
    ).toHaveLength(1);
  });

  it('BETWEEN incluye los dos límites y equivale a >= AND <=', () => {
    const inside = names('SELECT nombre FROM empleados WHERE salario BETWEEN 3000000 AND 6000000');
    expect(inside).toHaveLength(12);
    expect(inside).toContain('Sofía'); // 3.000.000, límite inferior
    expect(inside).toContain('María'); // 6.000.000, límite superior
    expect(inside).not.toContain('Valentina'); // 2.900.000
    expect(inside).not.toContain('Daniela'); // 6.100.000
    expect(
      names('SELECT nombre FROM empleados WHERE salario >= 3000000 AND salario <= 6000000'),
    ).toEqual(inside);
    expect(
      result('SELECT nombre FROM empleados WHERE salario NOT BETWEEN 3000000 AND 6000000').table
        .rows,
    ).toHaveLength(8);
  });

  it('IN equivale a una cadena de OR; NOT IN descarta los NULL', () => {
    const list = names(
      "SELECT nombre FROM empleados WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')",
    );
    expect(list).toHaveLength(17);
    expect(
      names(
        "SELECT nombre FROM empleados WHERE ciudad = 'Bogotá' OR ciudad = 'Medellín' OR ciudad = 'Cali'",
      ),
    ).toEqual(list);
    const notIn = names('SELECT nombre FROM empleados WHERE id_jefe NOT IN (1, 2)');
    expect(notIn).toHaveLength(9);
    expect(notIn).not.toContain('Ana'); // ID_JEFE NULL
    expect(notIn).not.toContain('Esteban'); // ID_JEFE NULL
  });

  it('NOT IN con NULL en la lista no devuelve filas', () => {
    const outcome = run('SELECT nombre FROM empleados WHERE id_jefe NOT IN (1, NULL)');
    expect(outcome.result!.table.rows).toHaveLength(0);
    expect(outcome.analysis.warnings[0]).toMatchObject({ code: 'not-in-null' });
  });

  it('LIKE con % y _ distingue mayúsculas', () => {
    expect(names("SELECT nombre FROM empleados WHERE nombre LIKE 'A%'")).toEqual([
      'Ana',
      'Andrés',
      'Alicia',
    ]);
    expect(names("SELECT nombre FROM empleados WHERE nombre LIKE '%a'")).toHaveLength(10);
    expect(names("SELECT nombre FROM empleados WHERE nombre LIKE '%ar%'")).toEqual([
      'Carlos',
      'María',
      'Oscar',
      'Mario',
      'Ricardo',
      'Carolina',
    ]);
    expect(names("SELECT nombre FROM empleados WHERE nombre LIKE 'A__'")).toEqual(['Ana']);
    expect(column("SELECT apellido FROM empleados WHERE apellido LIKE '_o%'", 'APELLIDO')).toEqual([
      'Rojas',
      'Mora',
      'Soto',
      'Torres',
    ]);
    // «Gómez» y «López» no coinciden: ó no es o.
    expect(column("SELECT apellido FROM empleados WHERE apellido LIKE 'R___'", 'APELLIDO')).toEqual(
      ['Ruiz', 'Ríos'],
    );
    expect(result("SELECT nombre FROM empleados WHERE nombre LIKE 'a%'").table.rows).toHaveLength(
      0,
    );
    expect(
      result("SELECT nombre FROM empleados WHERE nombre NOT LIKE 'A%'").table.rows,
    ).toHaveLength(17);
  });

  it('marca la parte del valor que explica una coincidencia de LIKE', () => {
    expect(likeSegments('Carolina', '%ar%')).toEqual([
      { kind: 'any', text: 'C' },
      { kind: 'literal', text: 'ar' },
      { kind: 'any', text: 'olina' },
    ]);
    expect(likeSegments('Rojas', '_o%')).toEqual([
      { kind: 'one', text: 'R' },
      { kind: 'literal', text: 'o' },
      { kind: 'any', text: 'jas' },
    ]);
    expect(likeSegments('Ana', 'B%')).toBeNull();
  });

  it('IS NULL, IS NOT NULL y la diferencia entre NULL y 0', () => {
    expect(names('SELECT nombre FROM empleados WHERE bono IS NULL')).toEqual([
      'Jorge',
      'Paula',
      'Ricardo',
      'Julián',
      'Felipe',
      'Esteban',
    ]);
    expect(result('SELECT nombre FROM empleados WHERE bono IS NOT NULL').table.rows).toHaveLength(
      14,
    );
    expect(names('SELECT nombre FROM empleados WHERE bono = 0')).toEqual(['Mario']);
    expect(names('SELECT nombre FROM empleados WHERE id_jefe IS NULL')).toEqual(['Ana', 'Esteban']);
  });

  it('= NULL es válido, no devuelve filas y avisa con la corrección IS NULL', () => {
    const outcome = run('SELECT nombre FROM empleados WHERE bono = NULL');
    expect(outcome.analysis.ok).toBe(true);
    expect(outcome.result!.table.rows).toHaveLength(0);
    expect(outcome.result!.trace.conditions!.every((value) => value === 'unknown')).toBe(true);
    expect(outcome.analysis.warnings[0]).toMatchObject({
      code: 'equals-null',
      fix: { text: 'IS NULL' },
    });
  });
});

describe('ORDER BY', () => {
  const salaries = (sql: string) => column(sql, 'SALARIO') as number[];

  it('ASC por defecto, DESC de mayor a menor', () => {
    const ascending = salaries('SELECT nombre, salario FROM empleados ORDER BY salario');
    expect(ascending[0]).toBe(2100000);
    expect(ascending.at(-1)).toBe(9000000);
    expect(salaries('SELECT nombre, salario FROM empleados ORDER BY salario DESC')[0]).toBe(
      9000000,
    );
  });

  it('ordena por varias columnas y resuelve empates', () => {
    const { table } = result(
      'SELECT departamento, nombre, salario FROM empleados ORDER BY departamento ASC, salario DESC',
    );
    expect(table.rows.map((row) => row[0])).toEqual([
      ...Array(4).fill('Finanzas'),
      ...Array(3).fill('Operaciones'),
      ...Array(3).fill('Recursos Humanos'),
      ...Array(5).fill('TI'),
      ...Array(5).fill('Ventas'),
    ]);
    expect(table.rows[0]).toEqual(['Finanzas', 'Jorge', 6800000]);
    expect(
      isSortedBy(table.rows, [
        { column: 0, direction: 'ASC' },
        { column: 2, direction: 'DESC' },
      ]),
    ).toBe(true);
  });

  it('acepta alias, posición y columnas no seleccionadas', () => {
    expect(
      result('SELECT nombre, salario * 12 AS anual FROM empleados ORDER BY anual DESC').table
        .rows[0],
    ).toEqual(['Ana', 108000000]);
    expect(result('SELECT nombre, salario FROM empleados ORDER BY 2 DESC').table.rows[0]).toEqual([
      'Ana',
      9000000,
    ]);
    expect(names('SELECT nombre FROM empleados ORDER BY fecha_ingreso')[0]).toBe('Ana');
  });

  it('NULLS LAST en ASC y NULLS FIRST en DESC, como Oracle', () => {
    const ascending = column('SELECT bono FROM empleados ORDER BY bono', 'BONO');
    expect(ascending.slice(-6)).toEqual(Array(6).fill(null));
    expect(ascending[0]).toBe(0);
    const descending = column('SELECT bono FROM empleados ORDER BY bono DESC', 'BONO');
    expect(descending.slice(0, 6)).toEqual(Array(6).fill(null));
    expect(column('SELECT bono FROM empleados ORDER BY bono NULLS FIRST', 'BONO')[0]).toBeNull();
  });

  it('ordena textos en orden binario (NLS_SORT = BINARY)', () => {
    const list = names("SELECT nombre FROM empleados WHERE nombre LIKE 'Mar%' ORDER BY nombre");
    expect(list).toEqual(['Mario', 'María']);
  });

  it('consulta integradora: activos de Bogotá con salario en rango, del mayor al menor', () => {
    const sql = `SELECT nombre, departamento, salario
FROM empleados
WHERE estado = 'ACTIVO'
  AND ciudad = 'Bogotá'
  AND salario BETWEEN 3000000 AND 6000000
ORDER BY salario DESC;`;
    const { table, trace } = result(sql);
    expect(table.rows).toEqual([
      ['Laura', 'Recursos Humanos', 5800000],
      ['Andrés', 'TI', 4200000],
      ['Mario', 'Ventas', 3500000],
    ]);
    expect(trace.order).toEqual([{ column: 2, direction: 'DESC' }]);
    expect(trace.resultRows).toEqual([4, 5, 9]);
  });
});

describe('Diagnósticos de Oracle y del alcance', () => {
  it('WHERE no puede usar un alias de SELECT (ORA-00904)', () => {
    expect(
      firstError('SELECT salario * 12 AS anual FROM empleados WHERE anual > 60000000'),
    ).toMatchObject({
      code: 'alias-in-where',
      category: 'oracle',
      fix: { text: '(salario * 12)' },
    });
  });

  it('con DISTINCT, ORDER BY solo usa columnas seleccionadas (ORA-01791)', () => {
    expect(firstError('SELECT DISTINCT ciudad FROM empleados ORDER BY salario')).toMatchObject({
      code: 'order-by-not-selected',
      category: 'oracle',
    });
    expect(analyzeSql('SELECT DISTINCT ciudad FROM empleados ORDER BY ciudad').ok).toBe(true);
    expect(analyzeSql('SELECT DISTINCT ciudad FROM empleados ORDER BY 1').ok).toBe(true);
  });

  it('ORDER BY con una posición inexistente', () => {
    expect(firstError('SELECT nombre FROM empleados ORDER BY 3')).toMatchObject({
      code: 'order-position',
    });
  });

  it('tipos incompatibles según las conversiones de Oracle', () => {
    expect(firstError('SELECT nombre FROM empleados WHERE ciudad = 3')).toMatchObject({
      code: 'type-mismatch',
      category: 'oracle',
    });
    expect(
      analyzeSql("SELECT nombre FROM empleados WHERE salario = '3000000'").warnings[0],
    ).toMatchObject({
      code: 'implicit-conversion',
    });
    expect(
      firstError("SELECT nombre FROM empleados WHERE fecha_ingreso > '2020-01-01'"),
    ).toMatchObject({
      code: 'date-text-comparison',
      fix: { text: "DATE '2020-01-01'" },
    });
    expect(
      firstError("SELECT nombre FROM empleados WHERE fecha_ingreso > DATE '2020-02-30'"),
    ).toMatchObject({
      code: 'invalid-date',
    });
    expect(firstError('SELECT fecha_ingreso + 30 FROM empleados')).toMatchObject({
      code: 'date-arithmetic',
      category: 'scope',
    });
  });

  it.each([
    ['JOIN', 'SELECT nombre FROM empleados JOIN deptos ON 1 = 1', 4, 'inner-join'],
    ['GROUP BY', 'SELECT ciudad FROM empleados GROUP BY ciudad', 3, 'group-by'],
    ['UPPER', 'SELECT UPPER(nombre) FROM empleados', 2, 'upper'],
    ['ROUND', 'SELECT ROUND(salario) FROM empleados', 2, 'round'],
    ['COUNT', 'SELECT COUNT(*) FROM empleados', 3, 'count'],
    [
      'subconsulta',
      'SELECT nombre FROM empleados WHERE salario > (SELECT 1 FROM empleados)',
      5,
      'subconsulta-where',
    ],
    ['SYSDATE', 'SELECT SYSDATE FROM empleados', 2, 'sysdate'],
  ])('%s es SQL válido de un nivel futuro, con enlace al roadmap', (_label, sql, level, topic) => {
    const error = firstError(sql)!;
    expect(error.category).toBe('scope');
    expect(error.message).toContain('es SQL válido en Oracle');
    expect(error.message).not.toMatch(/no existe|no (lo )?(admite|soporta)/);
    expect(error.future).toMatchObject({ level, topic });
  });

  it.each([
    ['varias tablas', 'SELECT nombre FROM empleados, deptos'],
    ['UNION', 'SELECT nombre FROM empleados UNION SELECT nombre FROM empleados'],
    ['DUAL', 'SELECT 1 FROM dual'],
    ['WITH', 'WITH x AS (SELECT 1 FROM empleados) SELECT * FROM x'],
    ['nombres calificados', 'SELECT e.nombre FROM empleados'],
    ['esquema', 'SELECT nombre FROM hr.empleados'],
    ['alias de tabla', 'SELECT nombre FROM empleados e'],
    ['comentario de bloque', '/* nota */ SELECT nombre FROM empleados'],
    ['UNIQUE', 'SELECT UNIQUE ciudad FROM empleados'],
    ['ESCAPE', "SELECT nombre FROM empleados WHERE nombre LIKE 'A%' ESCAPE '\\'"],
    ['FETCH', 'SELECT nombre FROM empleados FETCH FIRST 3 ROWS ONLY'],
  ])('%s queda fuera del alcance sin afirmar que Oracle no lo admite', (_label, sql) => {
    const error = firstError(sql)!;
    expect(error.category).toBe('scope');
    expect(error.message).not.toMatch(/Oracle no (lo )?(admite|soporta)|no existe/);
  });

  it('el asterisco combinado con otra columna es un error de Oracle', () => {
    expect(firstError('SELECT *, nombre FROM empleados')).toMatchObject({
      code: 'star-mixed',
      category: 'oracle',
    });
  });
});

describe('Errores pedagógicos de estructura', () => {
  it('falta SELECT', () => {
    expect(firstError('nombre FROM empleados')).toMatchObject({
      code: 'missing-select',
      column: 1,
    });
    expect(firstError('FROM empleados')!.message).toContain('Falta SELECT');
  });

  it('falta FROM, también cuando la tabla quedó como alias', () => {
    expect(firstError('SELECT nombre, salario')).toMatchObject({ code: 'missing-from' });
    expect(firstError("SELECT nombre WHERE ciudad = 'Cali'")).toMatchObject({
      code: 'missing-from',
    });
    expect(firstError('SELECT nombre empleados;')).toMatchObject({
      code: 'missing-from',
      fix: { text: 'FROM empleados' },
    });
  });

  it('coma ausente o sobrante', () => {
    expect(firstError('SELECT nombre salario edad FROM empleados')).toMatchObject({
      code: 'missing-comma',
      message: 'Falta una coma entre salario y edad.',
    });
    expect(firstError('SELECT nombre, FROM empleados;')).toMatchObject({
      code: 'missing-item-after-comma',
      column: 14,
    });
    expect(firstError('SELECT , nombre FROM empleados')).toMatchObject({ code: 'missing-item' });
  });

  it('columna desconocida con sugerencia y posición', () => {
    expect(firstError('SELECT nombre,\n  sueldo\nFROM empleados')).toMatchObject({
      code: 'unknown-column',
      line: 2,
      column: 3,
    });
    expect(firstError('SELECT depto FROM empleados')!.hint).toContain(
      '¿Quisiste decir DEPARTAMENTO?',
    );
    expect(firstError('SELECT salarios FROM empleados')).toMatchObject({
      fix: { text: 'salario' },
    });
    expect(firstError('SELECT empleados FROM empleados')).toMatchObject({
      code: 'table-as-column',
    });
  });

  it('expresión incompleta o paréntesis sin cerrar', () => {
    expect(firstError('SELECT salario * FROM empleados')).toMatchObject({
      code: 'incomplete-expression',
    });
    expect(firstError('SELECT (salario + 1 FROM empleados')).toMatchObject({
      code: 'unbalanced-parentheses',
    });
    expect(firstError("SELECT nombre FROM empleados WHERE (ciudad = 'Cali'")).toMatchObject({
      code: 'unbalanced-parentheses',
    });
  });

  it.each([
    ['empieza por número', 'SELECT salario AS 1anual FROM empleados'],
    ['palabra reservada', 'SELECT salario AS select FROM empleados'],
    ['reservada de Oracle', 'SELECT salario AS table FROM empleados'],
    ['tildes sin comillas', 'SELECT salario AS año FROM empleados'],
    ['AS sin nombre', 'SELECT salario AS FROM empleados'],
    ['comillas simples', "SELECT salario AS 'anual' FROM empleados"],
    ['demasiado largo', `SELECT salario AS ${'a'.repeat(31)} FROM empleados`],
    ['comillas vacías', 'SELECT salario AS "" FROM empleados'],
  ])('alias inválido: %s', (_label, sql) => {
    expect(firstError(sql)).toMatchObject({ code: 'invalid-alias', category: 'alias' });
  });

  it('tabla inválida o ausente', () => {
    expect(firstError('SELECT * FROM usuarios;')).toMatchObject({ code: 'unknown-table' });
    expect(firstError('SELECT nombre FROM;')).toMatchObject({
      code: 'missing-table',
      fix: { text: ' empleados' },
    });
  });

  it('comparaciones fuera de WHERE y otros errores de WHERE', () => {
    expect(firstError('SELECT salario > 3000000 FROM empleados')).toMatchObject({
      code: 'comparison-in-select',
    });
    expect(firstError('SELECT nombre FROM empleados WHERE')).toMatchObject({
      code: 'missing-condition',
    });
    expect(firstError("SELECT nombre FROM empleados ciudad = 'Cali'")).toMatchObject({
      code: 'missing-condition',
      fix: { text: 'WHERE ' },
    });
    expect(firstError('SELECT nombre FROM empleados WHERE salario')).toMatchObject({
      code: 'missing-comparison',
    });
    expect(firstError("SELECT nombre FROM empleados WHERE ciudad == 'Cali'")).toMatchObject({
      code: 'invalid-operator',
      fix: { text: '=' },
    });
    expect(firstError('SELECT nombre FROM empleados WHERE salario => 3000000')).toMatchObject({
      code: 'invalid-operator',
      fix: { text: '>=' },
    });
    expect(
      firstError('SELECT nombre FROM empleados WHERE 3000000 < salario < 6000000'),
    ).toMatchObject({ code: 'chained-comparison' });
    expect(
      firstError("SELECT nombre FROM empleados WHERE ciudad = 'Cali' salario > 1"),
    ).toMatchObject({
      code: 'missing-logical-operator',
    });
    expect(firstError("SELECT nombre FROM empleados WHERE ciudad = 'Cali' AND")).toMatchObject({
      code: 'missing-condition',
    });
    expect(firstError('SELECT nombre FROM empleados WHERE salario BETWEEN 1, 2')).toMatchObject({
      code: 'missing-between-and',
    });
    expect(firstError('SELECT nombre FROM empleados WHERE bono NOT NULL')).toMatchObject({
      code: 'missing-null',
      fix: { text: 'IS NOT NULL' },
    });
    expect(firstError('SELECT nombre FROM empleados ORDER salario')).toMatchObject({
      code: 'missing-by',
    });
    expect(
      firstError('SELECT nombre FROM empleados ORDER BY salario WHERE salario > 1'),
    ).toMatchObject({
      code: 'misplaced-clause',
    });
    expect(firstError("SELECT nombre FROM empleados WHERE ciudad = 'Cali")).toMatchObject({
      code: 'unterminated-quote',
    });
  });

  it('otros errores de estructura', () => {
    expect(firstError('')).toMatchObject({ code: 'empty' });
    expect(firstError('SELECT FROM empleados')).toMatchObject({ code: 'empty-select-list' });
    expect(firstError('SELECT * AS todo FROM empleados')).toMatchObject({ code: 'star-alias' });
    expect(firstError('SELECT nombre DISTINCT FROM empleados')).toMatchObject({
      code: 'misplaced-keyword',
    });
    expect(firstError('SELECT nombre * 2 FROM empleados')).toMatchObject({
      code: 'text-arithmetic',
    });
    expect(firstError('SELECT 1e5 FROM empleados')).toMatchObject({ code: 'number-format' });
    expect(firstError('SELECT "nombre FROM empleados')).toMatchObject({
      code: 'unterminated-quote',
    });
    expect(firstError('SELECT nombre @ FROM empleados')).toMatchObject({
      code: 'invalid-character',
    });
  });
});

describe('Seguridad y límites (SEC01, LAB13)', () => {
  it.each([
    ['DELETE FROM empleados', 6],
    ['DROP TABLE empleados', 7],
    ['INSERT INTO empleados VALUES (1)', 6],
    ['UPDATE empleados SET salario = 0', 6],
    ['COMMIT', 6],
    ['BEGIN NULL; END;', null],
    ['GRANT SELECT ON empleados TO public', null],
  ])('rechaza %s antes del motor', (sql, level) => {
    const error = firstError(sql)!;
    expect(error).toMatchObject({ code: 'statement-not-allowed', category: 'security' });
    expect(error.message).toContain('la sentencia no se envía al motor');
    expect(error.future?.level ?? null).toBe(level);
  });

  it('rechaza varias sentencias y llamadas a paquetes del sistema', () => {
    expect(firstError('SELECT * FROM empleados; DROP TABLE empleados')).toMatchObject({
      code: 'multiple-statements',
      category: 'security',
    });
    expect(firstError('SELECT dbms_random.value FROM empleados')).toMatchObject({
      category: 'security',
    });
  });

  it('aplica los límites de caracteres, elementos, columnas, listas y paréntesis', () => {
    expect(firstError(`SELECT nombre FROM empleados${' '.repeat(4000)}`)).toMatchObject({
      code: 'too-long',
    });
    expect(firstError(`SELECT ${'1+'.repeat(260)}1 FROM empleados`)).toMatchObject({
      code: 'too-many-tokens',
    });
    expect(
      firstError(`SELECT ${Array(13).fill('salario').join(', ')} FROM empleados`),
    ).toMatchObject({ code: 'too-many-items' });
    expect(
      firstError(
        `SELECT nombre FROM empleados WHERE salario IN (${Array(21).fill('1').join(', ')})`,
      ),
    ).toMatchObject({ code: 'too-many-items' });
    expect(firstError(`SELECT ${'('.repeat(9)}1${')'.repeat(9)} FROM empleados`)).toMatchObject({
      code: 'too-deep',
    });
    expect(analyzeSql(`SELECT ${'('.repeat(8)}1${')'.repeat(8)} FROM empleados`).ok).toBe(true);
  });
});

describe('Traducción, anatomía y renderizado', () => {
  const simple = 'SELECT nombre, salario\nFROM empleados;';
  const filtered =
    "SELECT nombre, salario * 12 AS anual\nFROM empleados\nWHERE ciudad = 'Bogotá' AND bono IS NULL\nORDER BY salario DESC;";

  it('identifica las columnas que usan SELECT y WHERE', () => {
    expect(sourceColumns(analyzeSql(simple).statement!)).toEqual(['NOMBRE', 'SALARIO']);
    expect(conditionColumns(analyzeSql(filtered).statement!)).toEqual(['CIUDAD', 'BONO']);
  });

  it('lee la consulta en español, con el modelo lógico', () => {
    const plain = translateStatement(analyzeSql(simple).statement!, result(simple).trace);
    expect(plain.summary).toBe('Muéstrame el nombre y el salario de todos los empleados.');
    expect(plain.steps[0]).toBe('FROM EMPLEADOS: parte de las 20 filas de la tabla EMPLEADOS.');
    const where = translateStatement(analyzeSql(filtered).statement!, result(filtered).trace);
    expect(where.summary).toBe(
      'Muéstrame el nombre y salario multiplicado por 12 (como ANUAL) de los empleados cuya ciudad es Bogotá y cuyo bono está vacío (es NULL), ordenados por salario de mayor a menor.',
    );
    expect(where.steps.join(' ')).toContain('Quedan 1 de 20');
    expect(where.steps.join(' ')).toContain('modelo para entender la consulta');
    const like = translateStatement(
      analyzeSql("SELECT nombre FROM empleados WHERE nombre LIKE 'A%'").statement!,
      null,
    );
    expect(like.summary).toContain('cuyo nombre empieza por «A»');
    const between = translateStatement(
      analyzeSql('SELECT nombre FROM empleados WHERE salario BETWEEN 3000000 AND 6000000')
        .statement!,
      null,
    );
    expect(between.summary).toContain(
      'cuyo salario está entre 3.000.000 y 6.000.000 (ambos incluidos)',
    );
    const list = translateStatement(
      analyzeSql("SELECT nombre FROM empleados WHERE ciudad IN ('Cali', 'Bogotá')").statement!,
      null,
    );
    expect(list.summary).toContain('cuya ciudad es Cali o Bogotá');
  });

  it('describe la anatomía en el orden del texto, con WHERE y ORDER BY', () => {
    const parts = describeAnatomy(analyzeSql(filtered).statement!, filtered);
    expect(parts.map((part) => part.role)).toEqual([
      'select',
      'column',
      'separator',
      'expression',
      'alias',
      'from',
      'table',
      'where',
      'condition',
      'logical',
      'condition',
      'order',
      'order-item',
      'terminator',
    ]);
  });

  it('renderiza una sentencia canónica desde el árbol, sin comentarios ni texto original', () => {
    const sql =
      "select nombre, -- comentario\n (salario+100000)*12 as Proyeccion, salario AS \"Pago x\" from Empleados where ciudad = 'O''Brien' or not bono is null order by proyeccion desc nulls last, 1;";
    expect(renderStatement(analyzeSql(sql).statement!)).toBe(
      "SELECT NOMBRE, (SALARIO + 100000) * 12 AS PROYECCION, SALARIO AS \"Pago x\" FROM EMPLEADOS WHERE CIUDAD = 'O''Brien' OR NOT BONO IS NULL ORDER BY PROYECCION DESC NULLS LAST, 1",
    );
    expect(
      renderStatement(
        analyzeSql(
          "SELECT * FROM empleados WHERE salario NOT BETWEEN 1 AND 2 AND ciudad IN ('A', 'B') AND nombre NOT LIKE '%a' AND fecha_ingreso < DATE '2020-01-01'",
        ).statement!,
      ),
    ).toBe(
      "SELECT * FROM EMPLEADOS WHERE SALARIO NOT BETWEEN 1 AND 2 AND CIUDAD IN ('A', 'B') AND NOMBRE NOT LIKE '%a' AND FECHA_INGRESO < DATE '2020-01-01'",
    );
  });

  it('una expresión aislada usa el mismo parser y catálogo', () => {
    const { expression, errors } = analyzeExpression('( salario + 100000 ) * 12');
    expect(errors).toEqual([]);
    expect(evaluateExpression(expression!, EMPLEADOS_DATASET.rows[0]!)).toEqual({
      ok: true,
      value: 109200000,
    });
    expect(analyzeExpression('salario *').expression).toBeNull();
    expect(analyzeExpression('sueldo * 2').errors[0]).toMatchObject({ code: 'unknown-column' });
  });
});

describe('Implementación', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );

  it('no usa eval ni Function en ningún módulo de src', () => {
    const offenders = files(path.resolve('src'))
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => /\beval\s*\(|new\s+Function\s*\(/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('existe un solo analizador SQL: todas las superficies lo importan del dominio compartido', () => {
    const parserUsers = files(path.resolve('src'))
      .filter(
        (file) =>
          /\.(ts|tsx)$/.test(file) && !file.includes(`${path.sep}domain${path.sep}sql${path.sep}`),
      )
      .filter((file) =>
        /function\s+(parse(Select|Expression|Sql|Query)\w*|tokeni[sz]e\w*|lex)\s*\(/.test(
          readFileSync(file, 'utf8'),
        ),
      );
    expect(parserUsers).toEqual([]);
  });
});
