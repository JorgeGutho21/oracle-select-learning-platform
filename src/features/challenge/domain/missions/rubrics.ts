import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  isSortedBy,
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
 * PRIVADO. Rúbricas, pistas y explicaciones del Challenge v3. Solo debe componerse en el
 * servicio de corrección; nunca importarse desde aplicación ni presentación.
 * Toda consulta se analiza con el motor SQL compartido (el mismo del laboratorio) y se
 * corrige por su resultado sobre el dataset canónico, no por su texto. Con ORDER BY se
 * comprueba el orden pedido, admitiendo cualquier orden entre filas empatadas.
 */

const correct = (feedback: string): EvaluationOutcome => ({ kind: 'correct', feedback });
const incorrect = (feedback: string): EvaluationOutcome => ({ kind: 'incorrect', feedback });
const invalid = (message: string): EvaluationOutcome => ({ kind: 'invalid-input', message });

const rows = EMPLEADOS_DATASET.rows;
const TOTAL = rows.length;
const nameOf = (id: number) => {
  const row = rows.find((entry) => entry.ID_EMPLEADO === id);
  return row ? `${row.NOMBRE} ${row.APELLIDO}` : `ID ${id}`;
};
const sortedKey = (values: readonly string[]) => [...values].sort().join();
const listWords = (items: readonly string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;

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

/** ID_EMPLEADO de las filas que conserva una consulta de referencia. */
function keptIds(sql: string): number[] {
  const run = runEducational(sql);
  if (!run.result) throw new Error(`Consulta de referencia inválida: ${sql}`);
  return run.result.trace.keptRows.map((index) => rows[index]!.ID_EMPLEADO);
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
  if (comparison.difference === 'row-count') {
    return incorrect(
      actual.rows.length > expected.rows.length
        ? 'El resultado tiene filas de más: revisa la condición que las filtra.'
        : 'El resultado no tiene todas las filas pedidas.',
    );
  }
  return incorrect('La consulta es válida, pero sus valores no responden al pedido.');
}

type Judged =
  | { readonly outcome: EvaluationOutcome; readonly statement: null; readonly result: null }
  | {
      readonly outcome: EvaluationOutcome;
      readonly statement: SelectStatement;
      readonly result: ResultTable;
    };

/** Analiza con el motor compartido y corrige por resultado. */
function judgeRun(sql: string | null, expected: ResultTable, success: string): Judged {
  const fail = (outcome: EvaluationOutcome): Judged => ({ outcome, statement: null, result: null });
  if (sql === null)
    return fail(incorrect('La consulta contiene piezas que no pertenecen a esta misión.'));
  const run = runEducational(sql);
  const error = run.analysis.errors[0] ?? run.runtimeError;
  if (error) return fail(incorrect(describeDiagnostic(error)));
  if (!run.analysis.statement || !run.result) return fail(incorrect('La consulta no es válida.'));
  return {
    outcome: explainResult(
      run.analysis.statement,
      run.result.table,
      expected,
      success,
      run.analysis.warnings,
    ),
    statement: run.analysis.statement,
    result: run.result.table,
  };
}

function judge(sql: string | null, expected: ResultTable, success: string): EvaluationOutcome {
  return judgeRun(sql, expected, success).outcome;
}

/** Comprueba que las filas sigan el orden pedido por una columna del resultado. */
function orderOutcome(
  statement: SelectStatement | null,
  result: ResultTable,
  column: string,
  direction: 'ASC' | 'DESC',
  success: string,
): EvaluationOutcome {
  const index = result.columns.map(normalizeIdentifier).indexOf(column);
  if (statement && !statement.orderBy) {
    return incorrect(
      'El pedido indica un orden, y sin ORDER BY Oracle no garantiza ninguno: añade el criterio de orden.',
    );
  }
  if (index === -1) return incorrect(`Falta la columna ${column} en el resultado.`);
  if (isSortedBy(result.rows, [{ column: index, direction }])) return correct(success);
  const reverse = direction === 'DESC' ? 'ASC' : 'DESC';
  if (isSortedBy(result.rows, [{ column: index, direction: reverse }])) {
    return incorrect(
      direction === 'DESC'
        ? 'Las filas quedaron del valor más bajo al más alto; el pedido es del más alto al más bajo.'
        : 'Las filas quedaron del valor más alto al más bajo; el pedido es del más bajo al más alto.',
    );
  }
  return incorrect(`Las filas no siguen el orden de ${column} que pide el enunciado.`);
}

/* ---------- M01 ---------- */
const m01Expected = reference('SELECT nombre, salario FROM empleados');

const m01 = define('M01', 'drag-column', {
  hint: 'El pedido menciona dos datos de cada empleado. El orden de la lista es el orden de las columnas.',
  explanation: `SELECT nombre, salario FROM empleados; proyecta dos columnas en ese orden para los ${TOTAL} empleados. Las demás columnas siguen en la tabla; solo no se muestran.`,
  validate: ({ columns }) => {
    if (columns.length === 0) return invalid('Arrastra al menos una columna a la lista de SELECT.');
    return judge(
      `SELECT ${columns.join(', ')} FROM empleados`,
      m01Expected,
      `Correcto: ${TOTAL} empleados con NOMBRE y SALARIO, en ese orden.`,
    );
  },
});

/* ---------- M02 ---------- */
const m02Pieces = pieceMap(publicDataOf('M02', 'reorder-sql').pieces);
const m02Expected = reference("SELECT nombre, ciudad FROM empleados WHERE departamento = 'TI'");

const m02 = define('M02', 'reorder-sql', {
  hint: 'Primero qué mostrar (SELECT y las columnas), después de dónde (FROM y la tabla) y al final qué filas (WHERE y la condición).',
  explanation:
    "SELECT nombre, ciudad FROM empleados WHERE departamento = 'TI'; — las columnas en el orden pedido, la tabla después de FROM y la condición después de WHERE.",
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const required = [...m02Pieces.keys()].filter((id) => id !== 'm02-end');
    if (!required.every((id) => pieceIds.includes(id))) {
      return incorrect('Usa todas las piezas: faltan algunas para completar la consulta.');
    }
    return judge(
      sqlFromPieces(pieceIds, m02Pieces),
      m02Expected,
      'Correcto: SELECT, FROM y WHERE en el orden de SQL.',
    );
  },
});

/* ---------- M03 ---------- */
const m03 = define('M03', 'predict-result', {
  hint: 'Observa el esquema completo de EMPLEADOS: el asterisco no deja ninguna columna fuera.',
  explanation: `SELECT * expande todas las columnas de la tabla, en el orden del esquema: ${EMPLEADOS_COLUMNS.join(', ')}. Sin filtros, devuelve las ${TOTAL} filas.`,
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
        : incorrect(
            `Revisa los encabezados: * devuelve las ${EMPLEADOS_COLUMNS.length} columnas de EMPLEADOS.`,
          );
    }
    if (rowCount !== TOTAL) {
      return incorrect('Los encabezados son correctos; revisa cuántas filas tiene EMPLEADOS.');
    }
    return correct(
      `Correcto: ${EMPLEADOS_COLUMNS.length} encabezados en el orden del esquema y ${TOTAL} filas.`,
    );
  },
});

/* ---------- M04 ---------- */
const m04Query = publicDataOf('M04', 'predict-result').query;
const m04Expected = reference(m04Query);
const m04Ids = keptIds(m04Query);

const m04 = define('M04', 'predict-result', {
  hint: 'WHERE conserva solo las filas cuya ciudad es Cali; SELECT decide qué columnas se ven.',
  explanation: `${m04Query.replace(/\s+/g, ' ')} devuelve NOMBRE y SALARIO de los ${m04Ids.length} empleados de Cali: ${listWords(m04Ids.map(nameOf))}.`,
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
            'Revisa los encabezados: el resultado solo tiene las columnas escritas después de SELECT, aunque WHERE use otra.',
          );
    }
    const selected = rows.filter((row) => sourceRowIds.includes(row.ID_EMPLEADO));
    if (compareResults(projectRows(selected, ['NOMBRE', 'SALARIO']), m04Expected).equal) {
      return correct(`Correcto: dos columnas y los ${m04Ids.length} empleados de Cali.`);
    }
    const extra = selected.filter((row) => !m04Ids.includes(row.ID_EMPLEADO));
    if (extra.length > 0) {
      return incorrect(
        `Sobran filas: ${listWords(extra.map((row) => row.NOMBRE))} no ${extra.length === 1 ? 'trabaja' : 'trabajan'} en Cali, así que WHERE las descarta.`,
      );
    }
    const missing = m04Ids.length - selected.length;
    return incorrect(
      `Falta${missing === 1 ? '' : 'n'} ${missing} empleado${missing === 1 ? '' : 's'} de Cali: WHERE conserva todas las filas que cumplen la condición.`,
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
const m05Examples = m05Data.predictionEmployeeIds.map((id) => {
  const index = rows.findIndex((row) => row.ID_EMPLEADO === id);
  return `${nameOf(id)} ${m05Expected?.[index] ?? '?'}`;
});

const m05 = define('M05', 'expression-builder', {
  hint: 'Un año tiene doce meses: la expresión parte del salario mensual.',
  explanation: `SELECT nombre, salario, salario * 12 FROM empleados; añade una columna calculada fila por fila: ${listWords(m05Examples)}. La columna SALARIO de la tabla no cambia.`,
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
      const index = rows.findIndex((row) => row.ID_EMPLEADO === id);
      const prediction = predictions.find((item) => item.employeeId === id)?.value ?? null;
      return index === -1 || prediction !== m05Expected[index];
    });
    if (wrong.length > 0) {
      return incorrect(
        `La expresión es correcta; revisa el valor calculado para ${listWords(wrong.map(nameOf))}.`,
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
const m07Data = publicDataOf('M07', 'distinct-result');
const m07Source = {
  columns: [m07Data.column],
  rows: m07Data.candidateValues.map((value) => [value]),
};
const m07Expected = distinctRows(m07Source);
const m07Values = m07Expected.rows.map(([value]) => String(value));
if (!compareResults(m07Expected, reference(m07Data.query)).equal) {
  throw new Error('La lista de partida de M07 no corresponde a su consulta.');
}

const m07 = define('M07', 'distinct-result', {
  hint: 'Cada departamento debe aparecer una vez: ni repetido ni eliminado del todo.',
  explanation: `${m07Data.sourceQuery} devuelve ${m07Source.rows.length} filas con repeticiones. Con DISTINCT quedan ${m07Values.length}: ${listWords(m07Values)}.`,
  validate: ({ keptIndexes }) => {
    if (keptIndexes.length === 0) return invalid('Conserva al menos una fila.');
    const kept = [...new Set(keptIndexes)]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < m07Source.rows.length)
      .map((index) => m07Source.rows[index]!);
    if (sameRowMultiset(kept, m07Expected.rows)) {
      return correct('Correcto: DISTINCT deja cada departamento una sola vez.');
    }
    const present = new Set(kept.map(([value]) => String(value)));
    const missing = m07Values.filter((value) => !present.has(value));
    if (missing.length > 0) {
      return incorrect(
        `Retiraste todas las filas de ${listWords(missing)}: DISTINCT conserva un ejemplar de cada valor.`,
      );
    }
    return incorrect('Todavía hay departamentos repetidos: DISTINCT deja cada valor una sola vez.');
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
const m09Expected = reference(
  'SELECT nombre, ciudad, salario FROM empleados ORDER BY salario DESC',
);

const m09 = define('M09', 'build-query', {
  hint: 'Cada dato mencionado es una columna, en ese orden; el orden de las filas se pide al final. Algunos bloques sobran.',
  explanation: `SELECT nombre, ciudad, salario FROM empleados ORDER BY salario DESC; responde al pedido: tres columnas en el orden mencionado, los ${TOTAL} empleados y el salario más alto primero. Se acepta cualquier construcción con el mismo resultado y el mismo orden.`,
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca los bloques antes de comprobar.');
    const sql = sqlFromPieces(pieceIds, m09Pieces);
    if (sql !== null && runEducational(sql).analysis.statement?.distinct) {
      return incorrect(
        'El pedido dice «todos los empleados»: DISTINCT eliminaría filas repetidas y no se pidió.',
      );
    }
    const success =
      'Correcto: tres columnas, todos los empleados y del salario más alto al más bajo.';
    const judged = judgeRun(sql, m09Expected, success);
    if (judged.outcome.kind !== 'correct' || !judged.result) return judged.outcome;
    return orderOutcome(judged.statement, judged.result, 'SALARIO', 'DESC', success);
  },
});

/* ---------- M10 ---------- */
const M10_REFERENCE =
  "SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY proyeccion_anual DESC";
const m10Expected = reference(M10_REFERENCE);

const m10 = define('M10', 'write-query', {
  hint: 'Filtra primero las filas (activos y de Bogotá), calcula el nuevo salario mensual antes de multiplicar por 12 y ordena por la proyección.',
  explanation: `${M10_REFERENCE}; — WHERE deja a los ${m10Expected.rows.length} empleados activos de Bogotá, los paréntesis suman los 100000 antes de multiplicar, AS nombra la columna y ORDER BY la ordena de mayor a menor.`,
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
      return incorrect('El pedido no busca quitar repetidas: DISTINCT no se pidió.');
    }
    if (statement.items.length !== 3) {
      return incorrect(
        `El pedido tiene tres columnas (NOMBRE, CARGO y la proyección anual); tu consulta tiene ${statement.items.length}.`,
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
    if (!statement.where) {
      return incorrect(
        'El pedido es solo para los empleados activos de Bogotá: falta la condición que filtra las filas.',
      );
    }
    if (!statement.orderBy) {
      return incorrect(
        'El pedido indica un orden, de la proyección más alta a la más baja: falta ordenar el resultado.',
      );
    }
    return { kind: 'requires-execution', statement: renderStatement(statement) };
  },
  gradeExecution: (result) => {
    const comparison = compareResults(result, m10Expected);
    if (!comparison.equal) {
      if (comparison.difference === 'columns') {
        return incorrect(
          `Oracle devolvió las columnas ${result.columns.join(', ')}; el pedido es NOMBRE, CARGO, PROYECCION_ANUAL.`,
        );
      }
      if (comparison.difference === 'row-count') {
        return incorrect(
          `Oracle devolvió ${result.rows.length} filas; los empleados activos de Bogotá son ${m10Expected.rows.length}. Revisa las condiciones y cómo las unes.`,
        );
      }
      return incorrect(
        'La consulta se ejecutó, pero los valores no corresponden al salario anual tras sumar 100000.',
      );
    }
    return orderOutcome(
      null,
      result,
      'PROYECCION_ANUAL',
      'DESC',
      `Correcto: Oracle devolvió los ${m10Expected.rows.length} empleados activos de Bogotá con NOMBRE, CARGO y PROYECCION_ANUAL, de mayor a menor.`,
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
