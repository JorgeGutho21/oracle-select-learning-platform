// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeExpression, analyzeSql, sourceColumns } from '@/domain/sql/analyzer';
import { describeAnatomy } from '@/domain/sql/anatomy';
import { runEducational } from '@/domain/sql/educational-run';
import { evaluateExpression } from '@/domain/sql/evaluator';
import { lex } from '@/domain/sql/lexer';
import { renderStatement } from '@/domain/sql/render';
import { positionAt } from '@/domain/sql/source';
import { translateStatement } from '@/domain/sql/translator';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';

const firstError = (sql: string) => analyzeSql(sql).errors[0];
const result = (sql: string) => {
  const run = runEducational(sql);
  if (!run.result)
    throw new Error(`Sin resultado: ${(run.analysis.errors[0] ?? run.runtimeError)?.message}`);
  return run.result;
};
const rowOf = (sql: string, name: string) => {
  const { table } = result(sql);
  const nameIndex = table.columns.indexOf('NOMBRE');
  return nameIndex === -1 ? undefined : table.rows.find((row) => row[nameIndex] === name);
};

describe('Léxico', () => {
  it('reconoce palabras, números, operadores, comillas y comentarios de línea', () => {
    const { tokens, comments } = lex(
      'SELECT nombre, salario*12 AS "Anual" -- nota\nFROM empleados;',
    );
    expect(tokens.map((token) => token.kind)).toEqual([
      'identifier',
      'identifier',
      'comma',
      'identifier',
      'operator',
      'number',
      'identifier',
      'quoted-identifier',
      'identifier',
      'identifier',
      'semicolon',
      'eof',
    ]);
    expect(tokens[7]).toMatchObject({ value: 'Anual' });
    expect(comments).toHaveLength(1);
  });

  it('calcula línea y columna desde 1', () => {
    expect(positionAt('SELECT\n  nombre', 9)).toEqual({ line: 2, column: 3 });
  });
});

describe('Casos de aceptación LAB01–LAB10 (LAB_SPEC)', () => {
  it('LAB01: SELECT * devuelve seis columnas en orden del esquema y seis filas', () => {
    const { table } = result('SELECT * FROM empleados;');
    expect(table.columns).toEqual(['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO']);
    expect(table.rows).toHaveLength(6);
  });

  it('LAB02: caja libre y orden de columnas respetado', () => {
    expect(result('select ciudad, nombre from EMPLEADOS').table.columns).toEqual([
      'CIUDAD',
      'NOMBRE',
    ]);
  });

  it('LAB03: cálculo con alias en varias líneas', () => {
    const sql = 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;';
    expect(result(sql).table.columns).toEqual(['NOMBRE', 'SALARIO_ANUAL']);
    expect(rowOf(sql, 'Ana')).toEqual(['Ana', 36000000]);
    expect(rowOf(sql, 'Carlos')).toEqual(['Carlos', 60000000]);
  });

  it('LAB04 y LAB05: DISTINCT compara la fila completa', () => {
    expect(result('SELECT DISTINCT ciudad FROM empleados;').table.rows).toHaveLength(3);
    expect(result('SELECT DISTINCT ciudad, depto FROM empleados;').table.rows).toHaveLength(5);
  });

  it('LAB06 y LAB07: precedencia y paréntesis (S07)', () => {
    expect(result('SELECT salario + 100000 * 12 AS total FROM empleados;').table.rows[0]).toEqual([
      4200000,
    ]);
    expect(result('SELECT (salario + 100000) * 12 AS total FROM empleados;').table.rows[0]).toEqual(
      [37200000],
    );
  });

  it('LAB08: división exacta (S12)', () => {
    const rows = result('SELECT salario / 2 AS mitad FROM empleados;').table.rows;
    expect(rows[0]).toEqual([1500000]);
    expect(rows[3]).toEqual([900000]);
  });

  it('LAB09 y S10: alias entre comillas conserva caja y espacios', () => {
    expect(result('SELECT nombre AS "Nombre empleado" FROM empleados;').table.columns).toEqual([
      'Nombre empleado',
    ]);
    expect(result('SELECT salario AS "Salario anual" FROM empleados').table.columns).not.toEqual([
      'SALARIO_ANUAL',
    ]);
  });

  it('LAB10 y S06: sin coma es un alias implícito válido, con aviso de posible coma ausente', () => {
    const analysis = analyzeSql('SELECT nombre salario FROM empleados;');
    expect(analysis.ok).toBe(true);
    expect(analysis.warnings[0]).toMatchObject({
      code: 'possible-missing-comma',
      line: 1,
      column: 15,
    });
    expect(analysis.warnings[0]!.message).toContain('Oracle lee salario como un alias de NOMBRE');
    expect(result('SELECT nombre salario FROM empleados;').table).toMatchObject({
      columns: ['SALARIO'],
    });
    expect(result('SELECT nombre salario FROM empleados;').table.rows[0]).toEqual(['Ana']);
  });

  it('un alias implícito que no es columna es válido y solo sugiere AS', () => {
    const analysis = analyzeSql('SELECT salario * 12 anual FROM empleados');
    expect(analysis.ok).toBe(true);
    expect(analysis.warnings[0]).toMatchObject({ code: 'implicit-alias' });
  });
});

describe('Semántica S01–S14 (TEST_PLAN)', () => {
  it('S03: CIUDAD sin DISTINCT conserva seis valores', () => {
    expect(result('SELECT ciudad FROM empleados').table.rows).toHaveLength(6);
  });

  it('S05: AS no cambia la tabla de origen', () => {
    result('SELECT salario * 2 AS salario FROM empleados');
    expect(EMPLEADOS_DATASET.rows[0]!.SALARIO).toBe(3000000);
  });

  it('S08: 12 * salario y salario * 12 coinciden', () => {
    expect(result('SELECT 12 * salario FROM empleados').table.rows).toEqual(
      result('SELECT salario * 12 FROM empleados').table.rows,
    );
  });

  it('S11: comentario de línea, espacios y terminador no cambian la salida', () => {
    expect(result('  SELECT   nombre -- columna\n  FROM empleados ;').table).toEqual(
      result('select NOMBRE from empleados').table,
    );
  });

  it('S12: la división entre cero no produce resultado parcial', () => {
    const run = runEducational('SELECT salario / 0 FROM empleados');
    expect(run.result).toBeNull();
    expect(run.runtimeError).toMatchObject({ code: 'division-by-zero', category: 'operation' });
  });

  it('S13: SUELDO se rechaza con las columnas disponibles', () => {
    expect(firstError('SELECT sueldo FROM empleados;')).toMatchObject({
      code: 'unknown-column',
      category: 'identifier',
      message: 'SUELDO no pertenece a la tabla EMPLEADOS.',
    });
    expect(firstError('SELECT sueldo FROM empleados;')!.hint).toContain(
      'ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO',
    );
    expect(firstError('SELECT salarios FROM empleados')!.hint).toContain(
      '¿Quisiste decir SALARIO?',
    );
  });

  it.each([
    ['WHERE', 'SELECT nombre FROM empleados WHERE edad > 20'],
    ['ORDER BY', 'SELECT nombre FROM empleados ORDER BY nombre'],
    ['JOIN', 'SELECT nombre FROM empleados JOIN deptos'],
    ['varias tablas', 'SELECT nombre FROM empleados, deptos'],
    ['UNION', 'SELECT nombre FROM empleados UNION SELECT nombre FROM empleados'],
    ['funciones', 'SELECT UPPER(nombre) FROM empleados'],
    ['DUAL', 'SELECT 1 FROM dual'],
    ['subconsulta', 'SELECT (SELECT 1 FROM empleados) FROM empleados'],
    ['WITH', 'WITH x AS (SELECT 1 FROM empleados) SELECT * FROM x'],
    ['texto', "SELECT 'hola' FROM empleados"],
    ['concatenación', 'SELECT nombre || ciudad FROM empleados'],
    ['comparaciones', 'SELECT nombre = 1 FROM empleados'],
    ['nombres calificados', 'SELECT e.nombre FROM empleados'],
    ['esquema', 'SELECT nombre FROM hr.empleados'],
    ['alias de tabla', 'SELECT nombre FROM empleados e'],
    ['comentario de bloque', '/* nota */ SELECT nombre FROM empleados'],
    ['UNIQUE', 'SELECT UNIQUE ciudad FROM empleados'],
    ['asterisco combinado', 'SELECT *, nombre FROM empleados'],
  ])('S14: %s queda fuera del alcance sin afirmar que Oracle no lo admite', (_label, sql) => {
    const error = firstError(sql)!;
    expect(['scope', 'table']).toContain(error.category);
    if (error.category === 'scope')
      expect(error.message).not.toMatch(/Oracle no (lo )?(admite|soporta)/);
  });
});

describe('Errores pedagógicos', () => {
  it('falta SELECT', () => {
    expect(firstError('nombre FROM empleados')).toMatchObject({
      code: 'missing-select',
      line: 1,
      column: 1,
    });
    expect(firstError('FROM empleados')!.message).toContain('Falta SELECT');
  });

  it('falta FROM', () => {
    expect(firstError('SELECT nombre, salario')).toMatchObject({ code: 'missing-from' });
    expect(firstError('SELECT nombre WHERE edad')).toMatchObject({ code: 'missing-from' });
  });

  it('coma ausente entre tres elementos', () => {
    expect(firstError('SELECT nombre salario edad FROM empleados')).toMatchObject({
      code: 'missing-comma',
      message: 'Falta una coma entre salario y edad.',
      column: 23,
    });
    expect(firstError('SELECT salario 12 FROM empleados')).toMatchObject({ code: 'missing-comma' });
  });

  it('coma sobrante o repetida', () => {
    expect(firstError('SELECT nombre, FROM empleados;')).toMatchObject({
      code: 'missing-item-after-comma',
      message: 'Falta una columna o expresión después de la coma.',
      column: 14,
    });
    expect(firstError('SELECT , nombre FROM empleados')).toMatchObject({ code: 'missing-item' });
    expect(firstError('SELECT nombre,, edad FROM empleados')).toMatchObject({
      code: 'missing-item',
    });
  });

  it('columna desconocida con posición en varias líneas', () => {
    expect(firstError('SELECT nombre,\n  sueldo\nFROM empleados')).toMatchObject({
      code: 'unknown-column',
      line: 2,
      column: 3,
    });
    expect(firstError('SELECT empleados FROM empleados')).toMatchObject({
      code: 'table-as-column',
    });
    expect(firstError('SELECT "NOMBRE" FROM empleados')).toMatchObject({ code: 'quoted-column' });
  });

  it('expresión incompleta o paréntesis sin cerrar', () => {
    expect(firstError('SELECT salario * FROM empleados')).toMatchObject({
      code: 'incomplete-expression',
      message: 'La expresión está incompleta: falta un valor después de «*».',
    });
    expect(firstError('SELECT salario + * 2 FROM empleados')).toMatchObject({
      code: 'incomplete-expression',
    });
    expect(firstError('SELECT (salario + 1 FROM empleados')).toMatchObject({
      code: 'unbalanced-parentheses',
    });
    expect(firstError('SELECT salario) FROM empleados')).toMatchObject({
      code: 'unbalanced-parentheses',
    });
  });

  it.each([
    ['empieza por número', 'SELECT salario AS 1anual FROM empleados'],
    ['palabra reservada', 'SELECT salario AS select FROM empleados'],
    ['reservada de Oracle', 'SELECT salario AS table FROM empleados'],
    ['tildes sin comillas', 'SELECT salario AS año FROM empleados'],
    ['AS sin nombre', 'SELECT salario AS FROM empleados'],
    ['demasiado largo', `SELECT salario AS ${'a'.repeat(31)} FROM empleados`],
    ['comillas vacías', 'SELECT salario AS "" FROM empleados'],
    ['símbolos en comillas', 'SELECT salario AS "sueldo$" FROM empleados'],
  ])('alias inválido: %s', (_label, sql) => {
    expect(firstError(sql)).toMatchObject({ code: 'invalid-alias', category: 'alias' });
  });

  it('acepta alias entre comillas con tildes y espacios', () => {
    expect(analyzeSql('SELECT salario * 12 AS "Salario año" FROM empleados').ok).toBe(true);
  });

  it('tabla inválida o columna usada como tabla', () => {
    expect(firstError('SELECT * FROM usuarios;')).toMatchObject({
      code: 'unknown-table',
      category: 'table',
      message: 'La tabla usuarios no está disponible en este laboratorio.',
    });
    expect(firstError('SELECT nombre FROM ciudad')!.message).toContain(
      'FROM recibe el nombre de la tabla',
    );
    expect(firstError('SELECT nombre FROM')).toMatchObject({ code: 'missing-table' });
  });

  it('otros errores de estructura', () => {
    expect(firstError('')).toMatchObject({ code: 'empty' });
    expect(firstError('SELECT FROM empleados')).toMatchObject({ code: 'empty-select-list' });
    expect(firstError('SELECT * AS todo FROM empleados')).toMatchObject({ code: 'star-alias' });
    expect(firstError('SELECT nombre DISTINCT FROM empleados')).toMatchObject({
      code: 'misplaced-keyword',
    });
    expect(firstError('SELECT nombre, DISTINCT ciudad FROM empleados')).toMatchObject({
      code: 'misplaced-keyword',
    });
    expect(firstError('SELECT nombre * 2 FROM empleados')).toMatchObject({
      code: 'text-arithmetic',
    });
    expect(firstError('SELECT 1e5 FROM empleados')).toMatchObject({ code: 'number-format' });
    expect(firstError('SELECT 1234567890123 FROM empleados')).toMatchObject({
      code: 'number-format',
    });
    expect(firstError('SELECT 1.23456 FROM empleados')).toMatchObject({ code: 'number-format' });
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
    'DELETE FROM empleados',
    'DROP TABLE empleados',
    'INSERT INTO empleados VALUES (1)',
    'BEGIN NULL; END;',
    'UPDATE empleados SET salario = 0',
  ])('rechaza %s antes del motor', (sql) => {
    expect(firstError(sql)).toMatchObject({ code: 'statement-not-allowed', category: 'security' });
  });

  it('rechaza varias sentencias y llamadas a paquetes del sistema', () => {
    expect(firstError('SELECT * FROM empleados; DROP TABLE empleados')).toMatchObject({
      code: 'multiple-statements',
      category: 'security',
    });
    expect(firstError('SELECT dbms_random.value FROM empleados')).toMatchObject({
      category: 'security',
    });
    expect(firstError('SELECT utl_http(1) FROM empleados')).toMatchObject({ category: 'security' });
  });

  it('aplica los límites de caracteres, elementos, columnas y paréntesis', () => {
    expect(firstError(`SELECT nombre FROM empleados${' '.repeat(4000)}`)).toMatchObject({
      code: 'too-long',
      category: 'limit',
    });
    expect(firstError(`SELECT ${'1+'.repeat(260)}1 FROM empleados`)).toMatchObject({
      code: 'too-many-tokens',
    });
    expect(firstError(`SELECT ${Array(13).fill('id').join(', ')} FROM empleados`)).toMatchObject({
      code: 'too-many-items',
    });
    expect(analyzeSql(`SELECT ${Array(12).fill('id').join(', ')} FROM empleados`).ok).toBe(true);
    expect(firstError(`SELECT ${'('.repeat(9)}1${')'.repeat(9)} FROM empleados`)).toMatchObject({
      code: 'too-deep',
    });
    expect(analyzeSql(`SELECT ${'('.repeat(8)}1${')'.repeat(8)} FROM empleados`).ok).toBe(true);
  });
});

describe('Evaluación, traducción, anatomía y renderizado', () => {
  const simple = 'SELECT nombre, salario\nFROM empleados;';
  const alias = 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;';

  it('identifica las columnas fuente para resaltarlas', () => {
    expect(sourceColumns(analyzeSql(simple).statement!)).toEqual(['NOMBRE', 'SALARIO']);
    expect(sourceColumns(analyzeSql('SELECT * FROM empleados').statement!)).toHaveLength(6);
    expect(sourceColumns(analyzeSql(alias).statement!)).toEqual(['NOMBRE', 'SALARIO']);
  });

  it('usa la expresión sin espacios como encabezado cuando no hay alias', () => {
    expect(result('SELECT (salario + 100000) * 12 FROM empleados').table.columns).toEqual([
      '(SALARIO+100000)*12',
    ]);
    expect(result('SELECT -salario FROM empleados').table.rows[0]).toEqual([-3000000]);
  });

  it('traduce al lenguaje cotidiano sin inventar datos', () => {
    const plain = translateStatement(analyzeSql(simple).statement!, 6);
    expect(plain.summary).toBe(
      'Para cada fila de la tabla EMPLEADOS, muestra la columna NOMBRE y la columna SALARIO.',
    );
    expect(plain.steps[0]).toBe('FROM EMPLEADOS: toma las 6 filas de la tabla EMPLEADOS.');
    const calculated = translateStatement(analyzeSql(alias).statement!, 6);
    expect(calculated.summary).toContain(
      'el cálculo SALARIO multiplicado por 12 con el encabezado SALARIO_ANUAL',
    );
    expect(calculated.steps.join(' ')).toContain('AS solo cambia el encabezado');
    const distinct = translateStatement(
      analyzeSql('SELECT DISTINCT ciudad FROM empleados').statement!,
      6,
    );
    expect(distinct.summary).toContain('sin repetir filas idénticas');
    const precedence = translateStatement(
      analyzeSql('SELECT (salario + 100000) * 12 FROM empleados').statement!,
      6,
    );
    expect(precedence.summary).toContain('(SALARIO más 100000) multiplicado por 12');
  });

  it('describe la anatomía en el orden del texto', () => {
    const parts = describeAnatomy(analyzeSql(alias).statement!, alias);
    expect(parts.map((part) => part.role)).toEqual([
      'select',
      'column',
      'separator',
      'expression',
      'alias',
      'from',
      'table',
      'terminator',
    ]);
    expect(parts.find((part) => part.role === 'alias')).toMatchObject({
      text: 'AS salario_anual',
      label: 'Alias (AS)',
    });
  });

  it('renderiza una sentencia canónica desde el árbol, sin comentarios ni texto original', () => {
    const sql =
      'select nombre, -- comentario\n (salario+100000)*12 as Proyeccion, salario AS "Pago ""x""" from Empleados;';
    const tree = analyzeSql(sql.replace('""x""', 'x')).statement!;
    expect(renderStatement(tree)).toBe(
      'SELECT NOMBRE, (SALARIO + 100000) * 12 AS PROYECCION, SALARIO AS "Pago x" FROM EMPLEADOS',
    );
    expect(renderStatement(analyzeSql('SELECT DISTINCT * FROM empleados').statement!)).toBe(
      'SELECT DISTINCT * FROM EMPLEADOS',
    );
  });

  it('una expresión aislada usa el mismo parser y catálogo', () => {
    const { expression, errors } = analyzeExpression('( salario + 100000 ) * 12');
    expect(errors).toEqual([]);
    const value = evaluateExpression(expression!, EMPLEADOS_DATASET.rows[0]!);
    expect(value).toEqual({ ok: true, value: 37200000 });
    expect(analyzeExpression('salario *').expression).toBeNull();
    expect(analyzeExpression('sueldo * 2').errors[0]).toMatchObject({ code: 'unknown-column' });
    expect(analyzeExpression('salario 12').expression).toBeNull();
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

  it('existe un solo analizador SQL: laboratorio y Challenge lo importan del dominio compartido', () => {
    const sqlModules = readdirSync(path.resolve('src/domain/sql')).sort();
    expect(sqlModules).toEqual([
      'analyzer.ts',
      'anatomy.ts',
      'ast.ts',
      'diagnostics.ts',
      'educational-run.ts',
      'evaluator.ts',
      'keywords.ts',
      'lexer.ts',
      'parser.ts',
      'render.ts',
      'schema.ts',
      'source.ts',
      'translator.ts',
    ]);
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
