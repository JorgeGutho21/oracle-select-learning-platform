import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  normalizeIdentifier,
  projectRows,
  sameRowMultiset,
  type ResultTable,
} from '@/domain/results/result-table';
import { analyzeExpression } from '@/domain/sql/analyzer';
import { referencedColumns, type Expression, type SelectStatement } from '@/domain/sql/ast';
import { describeDiagnostic } from '@/domain/sql/diagnostics';
import { runEducational } from '@/domain/sql/educational-run';
import { evaluateExpression } from '@/domain/sql/evaluator';
import { renderStatement } from '@/domain/sql/render';
import type {
  AnswerFor,
  AnyMissionPrivate,
  EvaluationOutcome,
  InteractionType,
  MissionId,
  MissionPrivate,
  Piece,
  RubricVerdict,
} from '../types';
import { findPublicMission } from './public-catalog';

/**
 * PRIVADO. Rúbricas, pistas y explicaciones del Challenge v2. Solo debe componerse en el
 * servicio de corrección; nunca importarse desde aplicación ni presentación.
 * Toda consulta se analiza con el motor SQL compartido (el mismo del laboratorio) y se
 * corrige por su resultado sobre el dataset canónico, no por su texto.
 */

const correct = (feedback: string): EvaluationOutcome => ({ kind: 'correct', feedback });
const incorrect = (feedback: string): EvaluationOutcome => ({ kind: 'incorrect', feedback });
const invalid = (message: string): EvaluationOutcome => ({ kind: 'invalid-input', message });

const rows = EMPLEADOS_DATASET.rows;
const nameOf = (id: number) => rows.find((row) => row.ID === id)?.NOMBRE ?? `ID ${id}`;
const sortedKey = (values: readonly string[]) => [...values].sort().join();

function define<T extends InteractionType>(
  missionId: MissionId,
  interactionType: T,
  content: {
    hint: string;
    explanation: string;
    validate: (answer: AnswerFor<T>) => RubricVerdict;
    gradeExecution?: (result: ResultTable) => EvaluationOutcome;
  },
): MissionPrivate<T> {
  return {
    missionId,
    interactionType,
    hint: content.hint,
    explanation: content.explanation,
    rubric: {
      validate: content.validate,
      ...(content.gradeExecution ? { gradeExecution: content.gradeExecution } : {}),
    },
  };
}

/* ---------- Corrección común por resultado ---------- */

function reference(sql: string): ResultTable {
  const run = runEducational(sql);
  if (!run.result) throw new Error(`Consulta de referencia inválida: ${sql}`);
  return run.result.table;
}

function publicDataOf<T extends InteractionType>(missionId: MissionId, type: T) {
  const data = findPublicMission(missionId)?.publicData;
  if (!data || data.type !== type) throw new Error(`Datos públicos de ${missionId} inválidos.`);
  return data as Extract<typeof data, { type: T }>;
}

function pieceMap(pieces: readonly Piece[]): ReadonlyMap<string, string> {
  return new Map(pieces.map((item) => [item.id, item.text]));
}

/** Texto SQL armado con piezas, o `null` si alguna pieza no pertenece a la misión. */
function sqlFromPieces(
  pieceIds: readonly string[],
  pieces: ReadonlyMap<string, string>,
): string | null {
  const texts = pieceIds.map((id) => pieces.get(id));
  return texts.some((text) => text === undefined) ? null : texts.join(' ');
}

/** Compara el resultado con el esperado y explica la diferencia en términos del pedido. */
function explainResult(
  statement: SelectStatement,
  actual: ResultTable,
  expected: ResultTable,
  success: string,
  warnings: readonly { code: string; message: string }[] = [],
): EvaluationOutcome {
  const comparison = compareResults(actual, expected);
  if (comparison.equal) return correct(success);
  const comma = warnings.find((warning) => warning.code === 'possible-missing-comma');
  if (comma) return incorrect(comma.message);
  if (statement.items.some((item) => item.kind === 'star')) {
    return incorrect('El asterisco muestra todas las columnas; el pedido solo pide algunas.');
  }
  const got = actual.columns.map(normalizeIdentifier);
  const wanted = expected.columns.map(normalizeIdentifier);
  if (got.length === wanted.length && sortedKey(got) === sortedKey(wanted)) {
    return incorrect(`Las columnas son correctas, pero el orden pedido es ${wanted.join(', ')}.`);
  }
  const extra = got.filter((column) => !wanted.includes(column));
  const missing = wanted.filter((column) => !got.includes(column));
  if (extra.length > 0) return incorrect(`Sobran columnas: ${extra.join(', ')} no se pidió.`);
  if (missing.length > 0) return incorrect(`Falta mostrar ${missing.join(', ')}.`);
  if (comparison.difference === 'row-count')
    return incorrect('El resultado no tiene todas las filas pedidas.');
  return incorrect('La consulta es válida, pero sus valores no responden al pedido.');
}

/** Analiza con el motor compartido y corrige por resultado. */
function judge(sql: string | null, expected: ResultTable, success: string): EvaluationOutcome {
  if (sql === null)
    return incorrect('La consulta contiene piezas que no pertenecen a esta misión.');
  const run = runEducational(sql);
  const error = run.analysis.errors[0] ?? run.runtimeError;
  if (error) return incorrect(describeDiagnostic(error));
  if (!run.analysis.statement || !run.result) return incorrect('La consulta no es válida.');
  return explainResult(
    run.analysis.statement,
    run.result.table,
    expected,
    success,
    run.analysis.warnings,
  );
}

/* ---------- M01 ---------- */
const m01Expected = reference('SELECT nombre, salario FROM empleados');

const m01 = define('M01', 'drag-column', {
  hint: 'El pedido menciona dos datos de cada empleado. El orden de la lista es el orden de las columnas.',
  explanation:
    'SELECT nombre, salario FROM empleados; proyecta dos columnas en ese orden para los seis empleados. Las demás columnas siguen en la tabla; solo no se muestran.',
  validate: ({ columns }) => {
    if (columns.length === 0) return invalid('Arrastra al menos una columna a la lista de SELECT.');
    return judge(
      `SELECT ${columns.join(', ')} FROM empleados`,
      m01Expected,
      'Correcto: seis empleados con NOMBRE y SALARIO, en ese orden.',
    );
  },
});

/* ---------- M02 ---------- */
const m02Pieces = pieceMap(publicDataOf('M02', 'reorder-sql').pieces);
const m02Expected = reference('SELECT nombre, ciudad FROM empleados');

const m02 = define('M02', 'reorder-sql', {
  hint: 'Primero indica qué mostrar (SELECT y las columnas) y después de dónde (FROM y la tabla).',
  explanation:
    'SELECT nombre, ciudad FROM empleados; enumera las columnas en el orden pedido, separadas por coma, y después FROM indica la tabla de origen.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const required = [...m02Pieces.keys()].filter((id) => id !== 'm02-end');
    if (!required.every((id) => pieceIds.includes(id))) {
      return incorrect('Usa todas las piezas: faltan algunas para completar la consulta.');
    }
    return judge(
      sqlFromPieces(pieceIds, m02Pieces),
      m02Expected,
      'Correcto: cláusulas y columnas en el orden de SQL.',
    );
  },
});

/* ---------- M03 ---------- */
const m03 = define('M03', 'predict-result', {
  hint: 'Observa el esquema completo de EMPLEADOS: el asterisco no deja ninguna columna fuera.',
  explanation: `SELECT * expande todas las columnas visibles de la tabla, en el orden del esquema: ${EMPLEADOS_COLUMNS.join(', ')}. Sin filtros, devuelve las ${rows.length} filas.`,
  validate: ({ headers, rowCount }) => {
    if (headers.length === 0 && rowCount === null) {
      return invalid('Construye los encabezados e indica el número de filas.');
    }
    const names = headers.map(normalizeIdentifier);
    if (names.includes('*')) {
      return incorrect(
        'El asterisco no es una columna del resultado: se expande en las columnas del esquema.',
      );
    }
    if (names.join() !== EMPLEADOS_COLUMNS.join()) {
      return sortedKey(names) === sortedKey(EMPLEADOS_COLUMNS)
        ? incorrect('Están todas las columnas, pero no en el orden del esquema.')
        : incorrect('Revisa los encabezados: * devuelve cada columna de EMPLEADOS.');
    }
    if (rowCount !== rows.length) {
      return incorrect('Los encabezados son correctos; revisa cuántas filas tiene EMPLEADOS.');
    }
    return correct('Correcto: seis encabezados en el orden del esquema y seis filas.');
  },
});

/* ---------- M04 ---------- */
const m04Expected = reference('SELECT nombre, salario FROM empleados');

const m04 = define('M04', 'predict-result', {
  hint: 'La consulta elige columnas, no filas: piensa si algún empleado podría quedar fuera.',
  explanation:
    'SELECT nombre, salario FROM empleados; devuelve dos columnas, NOMBRE y SALARIO, y conserva a los seis empleados: proyectar columnas no elimina filas.',
  validate: ({ headers, sourceRowIds }) => {
    if (headers.length === 0 && sourceRowIds.length === 0) {
      return invalid('Construye los encabezados y marca las filas del resultado.');
    }
    const names = headers.map(normalizeIdentifier);
    const wanted = m04Expected.columns;
    if (names.join() !== wanted.join()) {
      return sortedKey(names) === sortedKey(wanted)
        ? incorrect(
            'Las columnas son correctas, pero el resultado respeta el orden escrito en SELECT.',
          )
        : incorrect(
            'Revisa los encabezados: el resultado solo tiene las columnas escritas después de SELECT.',
          );
    }
    const selected = rows.filter((row) => sourceRowIds.includes(row.ID));
    if (compareResults(projectRows(selected, ['NOMBRE', 'SALARIO']), m04Expected).equal) {
      return correct('Correcto: dos columnas y los seis empleados.');
    }
    const missing = rows.length - selected.length;
    return incorrect(
      `Faltan ${missing} empleado${missing === 1 ? '' : 's'}: sin una condición que filtre filas, la consulta devuelve todas.`,
    );
  },
});

/* ---------- M05 ---------- */
const m05Data = publicDataOf('M05', 'expression-builder');
const m05Palette = pieceMap(m05Data.palette);

function columnValues(expression: Expression): number[] | null {
  const values: number[] = [];
  for (const row of rows) {
    const value = evaluateExpression(expression, row);
    if (!value.ok || typeof value.value !== 'number') return null;
    values.push(value.value);
  }
  return values;
}

const m05Reference = analyzeExpression('salario * 12').expression;
const m05Expected = m05Reference ? columnValues(m05Reference) : null;

const m05 = define('M05', 'expression-builder', {
  hint: 'Un año tiene doce meses: la expresión parte del salario mensual.',
  explanation:
    'SELECT nombre, salario, salario * 12 FROM empleados; añade una columna calculada fila por fila: Ana 36000000, Pedro 21600000 y María 44400000. La columna SALARIO de la tabla no cambia.',
  validate: ({ pieceIds, predictions }) => {
    const filled = predictions.filter((prediction) => prediction.value !== null);
    if (pieceIds.length === 0 && filled.length === 0) {
      return invalid('Construye la expresión y escribe los valores calculados.');
    }
    if (!m05Expected) throw new Error('Referencia de M05 inválida.');
    const tokens = pieceIds.map((id) => m05Palette.get(id));
    if (tokens.some((token) => token === undefined)) {
      return incorrect('La expresión contiene piezas que no pertenecen a esta misión.');
    }
    const { expression, errors } = analyzeExpression(tokens.join(' '));
    if (!expression || errors.length > 0) {
      return incorrect(
        'La expresión está incompleta: combina una columna, un operador y un número.',
      );
    }
    if (!referencedColumns(expression).includes('SALARIO')) {
      return incorrect('El cálculo debe partir de la columna SALARIO.');
    }
    const actual = columnValues(expression);
    if (!actual || actual.join() !== m05Expected.join()) {
      return incorrect(
        'La expresión no calcula el salario de un año: revisa el operador y el número.',
      );
    }
    const wrong = m05Data.predictionEmployeeIds.filter((id) => {
      const index = rows.findIndex((row) => row.ID === id);
      const prediction = predictions.find((item) => item.employeeId === id)?.value ?? null;
      return index === -1 || prediction !== m05Expected[index];
    });
    if (wrong.length > 0) {
      return incorrect(
        `La expresión es correcta; revisa el valor calculado para ${wrong.map(nameOf).join(', ')}.`,
      );
    }
    return correct('Correcto: la columna calculada multiplica el salario de cada fila por 12.');
  },
});

/* ---------- M06 ---------- */
const m06Pieces = pieceMap(publicDataOf('M06', 'alias-builder').pieces);
const m06Expected = reference('SELECT nombre, salario * 12 AS salario_anual FROM empleados');

const m06 = define('M06', 'alias-builder', {
  hint: 'La etiqueta va inmediatamente después de aquello que describe.',
  explanation:
    'SELECT nombre, salario * 12 AS salario_anual FROM empleados; muestra el encabezado SALARIO_ANUAL para la columna calculada. AS solo cambia el encabezado del resultado: la tabla EMPLEADOS conserva su columna SALARIO.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const sql = sqlFromPieces(pieceIds, m06Pieces);
    if (sql !== null) {
      const run = runEducational(sql);
      const statement = run.analysis.statement;
      if (run.analysis.errors.some((error) => error.code === 'table-alias')) {
        return incorrect(
          'El alias quedó después de la tabla: AS nombra una columna del resultado, no la tabla.',
        );
      }
      if (statement && run.analysis.ok && statement.items.length === 2) {
        const labeled = statement.items.findIndex(
          (item) => item.kind === 'expression' && item.alias,
        );
        if (labeled === 0) {
          return incorrect(
            'El alias quedó junto a NOMBRE: debe describir la columna calculada salario * 12.',
          );
        }
        if (labeled === -1) {
          return incorrect(
            'Sin AS, el encabezado de la columna calculada es la propia expresión SALARIO*12.',
          );
        }
      }
    }
    return judge(
      sql,
      m06Expected,
      'Correcto: el resultado muestra SALARIO_ANUAL y la tabla conserva SALARIO.',
    );
  },
});

/* ---------- M07 ---------- */
const m07Source = projectRows(rows, ['CIUDAD']);
const m07Expected = distinctRows(m07Source);
const m07Cities = m07Expected.rows.map(([city]) => String(city));

const m07 = define('M07', 'distinct-result', {
  hint: 'Cada ciudad debe aparecer una vez: ni repetida ni eliminada del todo.',
  explanation: `SELECT ciudad FROM empleados; devuelve ${m07Source.rows.length} filas con repeticiones. Con DISTINCT quedan ${m07Cities.length}: ${m07Cities.join(', ')}.`,
  validate: ({ keptIndexes }) => {
    if (keptIndexes.length === 0) return invalid('Conserva al menos una fila.');
    const kept = [...new Set(keptIndexes)]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < m07Source.rows.length)
      .map((index) => m07Source.rows[index]!);
    if (sameRowMultiset(kept, m07Expected.rows)) {
      return correct('Correcto: DISTINCT deja cada ciudad una sola vez.');
    }
    const present = new Set(kept.map(([city]) => String(city)));
    const missing = m07Cities.filter((city) => !present.has(city));
    if (missing.length > 0) {
      return incorrect(
        `Retiraste todas las filas de ${missing.join(', ')}: DISTINCT conserva un ejemplar de cada valor.`,
      );
    }
    return incorrect('Todavía hay ciudades repetidas: DISTINCT deja cada valor una sola vez.');
  },
});

/* ---------- M08 ---------- */
const m08Data = publicDataOf('M08', 'hotspot-error');
const m08Expected = reference('SELECT nombre, salario FROM empleados');
const m08Original = runEducational(m08Data.tokens.join(' '));

const m08 = define('M08', 'hotspot-error', {
  hint: 'Cuenta cuántas columnas pide el pedido y cuántas separa realmente la lista.',
  explanation:
    `${m08Original.analysis.warnings.find((warning) => warning.code === 'possible-missing-comma')?.message ?? ''} Con SELECT nombre, salario FROM empleados; se obtienen las dos columnas pedidas.`.trim(),
  validate: ({ gapIndex }) => {
    if (gapIndex === null) return invalid('Selecciona un hueco de la consulta.');
    const tokens = m08Data.tokens;
    if (!Number.isInteger(gapIndex) || gapIndex < 1 || gapIndex >= tokens.length) {
      return incorrect('Ese hueco no pertenece a la consulta.');
    }
    const repaired = [...tokens.slice(0, gapIndex), m08Data.insertToken, ...tokens.slice(gapIndex)];
    const outcome = judge(
      repaired.join(' '),
      m08Expected,
      'Correcto: con la coma, NOMBRE y SALARIO son dos columnas.',
    );
    if (outcome.kind !== 'incorrect') return outcome;
    return incorrect(
      `Con la coma en ese hueco la consulta sigue sin cumplir el pedido. ${outcome.feedback}`,
    );
  },
});

/* ---------- M09 ---------- */
const m09Pieces = pieceMap(publicDataOf('M09', 'build-query').pieces);
const m09Expected = reference('SELECT nombre, ciudad, salario FROM empleados');

const m09 = define('M09', 'build-query', {
  hint: 'Cada dato mencionado en el pedido es una columna, en ese orden. Algunos bloques sobran.',
  explanation:
    'SELECT nombre, ciudad, salario FROM empleados; responde al pedido: tres columnas en el orden mencionado y los seis empleados. Se acepta cualquier construcción con el mismo resultado.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca los bloques antes de comprobar.');
    const sql = sqlFromPieces(pieceIds, m09Pieces);
    if (sql !== null && runEducational(sql).analysis.statement?.distinct) {
      return incorrect(
        'El pedido dice «todos los empleados»: DISTINCT eliminaría filas repetidas y no se pidió.',
      );
    }
    return judge(
      sql,
      m09Expected,
      'Correcto: tres columnas en el orden del pedido para todos los empleados.',
    );
  },
});

/* ---------- M10 ---------- */
const m10Expected = reference(
  'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados',
);

const m10 = define('M10', 'write-query', {
  hint: 'Calcula primero el nuevo salario mensual y después multiplícalo por 12.',
  explanation:
    'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados; conserva a los seis empleados, proyecta tres columnas y etiqueta el cálculo.',
  // Capas 1 y 2 de LAB_SPEC (estructura y requisitos) con el motor compartido; la capa 3,
  // la salida real, exige ejecutar en Oracle.
  validate: ({ sql }) => {
    if (sql.trim() === '') return invalid('Escribe una consulta antes de enviarla.');
    const run = runEducational(sql);
    const error = run.analysis.errors[0];
    if (error) return incorrect(describeDiagnostic(error));
    const statement = run.analysis.statement!;
    if (statement.items.some((item) => item.kind === 'star')) {
      return incorrect('El pedido indica tres columnas concretas: el asterisco mostraría todas.');
    }
    if (statement.distinct) {
      return incorrect('El pedido conserva a todos los empleados: DISTINCT no se pidió.');
    }
    if (statement.items.length !== 3) {
      return incorrect(
        `El pedido tiene tres columnas (NOMBRE, CIUDAD y la proyección anual); tu consulta tiene ${statement.items.length}.`,
      );
    }
    const third = statement.items[2]!;
    if (third.kind !== 'expression')
      return incorrect('La tercera columna debe ser el cálculo anual.');
    if (
      third.expression.kind === 'column' ||
      !referencedColumns(third.expression).includes('SALARIO')
    ) {
      return incorrect('La tercera columna es un cálculo basado en SALARIO.');
    }
    if (!third.alias) return incorrect('Usa AS para llamar PROYECCION_ANUAL a la tercera columna.');
    if (!third.alias.explicit) {
      return incorrect('El pedido exige escribir AS antes del alias PROYECCION_ANUAL.');
    }
    if (third.alias.header !== 'PROYECCION_ANUAL') {
      return incorrect(
        `El encabezado de la tercera columna debe ser PROYECCION_ANUAL, no ${third.alias.header}.`,
      );
    }
    return { kind: 'requires-execution', statement: renderStatement(statement) };
  },
  gradeExecution: (result) => {
    const comparison = compareResults(result, m10Expected);
    if (comparison.equal) {
      return correct('Correcto: Oracle devolvió seis filas con NOMBRE, CIUDAD y PROYECCION_ANUAL.');
    }
    if (comparison.difference === 'columns') {
      return incorrect(
        `Oracle devolvió las columnas ${result.columns.join(', ')}; el pedido es NOMBRE, CIUDAD, PROYECCION_ANUAL.`,
      );
    }
    return incorrect(
      'La consulta se ejecutó, pero los valores no corresponden al salario anual tras sumar 100000.',
    );
  },
});

export const MISSION_PRIVATE: Readonly<Record<MissionId, AnyMissionPrivate>> = Object.freeze({
  M01: m01,
  M02: m02,
  M03: m03,
  M04: m04,
  M05: m05,
  M06: m06,
  M07: m07,
  M08: m08,
  M09: m09,
  M10: m10,
});
