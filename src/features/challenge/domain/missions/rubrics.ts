import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  normalizeIdentifier,
  projectRows,
  sameRowMultiset,
  type ResultTable,
} from '@/domain/results/result-table';
import { evaluateExpression, parseExpression, referencesColumn } from '@/domain/sql/expression';
import {
  analyzeProjection,
  tokenizeSql,
  tokensFromPieces,
  type ProjectionAnalysis,
  type ProjectionError,
} from '@/domain/sql/projection-query';
import type {
  AnswerFor,
  AnyMissionPrivate,
  EvaluationOutcome,
  InteractionType,
  MissionId,
  MissionPrivate,
  Piece,
} from '../types';
import { findPublicMission } from './public-catalog';

/**
 * PRIVADO. Rúbricas, pistas y explicaciones del Challenge v2. Solo debe componerse en el
 * servicio de corrección; nunca importarse desde aplicación ni presentación.
 * Las respuestas se corrigen por su resultado sobre el dataset canónico, no por su texto.
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
    validate: (answer: AnswerFor<T>) => EvaluationOutcome;
  },
): MissionPrivate<T> {
  return {
    missionId,
    interactionType,
    hint: content.hint,
    explanation: content.explanation,
    rubric: { validate: content.validate },
  };
}

/* ---------- Corrección común por resultado ---------- */

function reference(sql: string): ResultTable {
  const analysis = analyzeProjection(tokenizeSql(sql));
  if (!analysis.ok) throw new Error(`Consulta de referencia inválida: ${sql}`);
  return analysis.result;
}

function publicDataOf<T extends InteractionType>(missionId: MissionId, type: T) {
  const data = findPublicMission(missionId)?.publicData;
  if (!data || data.type !== type) throw new Error(`Datos públicos de ${missionId} inválidos.`);
  return data as Extract<typeof data, { type: T }>;
}

function pieceMap(pieces: readonly Piece[]): ReadonlyMap<string, string> {
  return new Map(pieces.map((item) => [item.id, item.text]));
}

function analyzePieces(
  pieceIds: readonly string[],
  pieces: ReadonlyMap<string, string>,
): ProjectionAnalysis | null {
  const texts = pieceIds.map((id) => pieces.get(id));
  if (texts.some((text) => text === undefined)) return null;
  return analyzeProjection(tokensFromPieces(texts as string[]));
}

export function describeProjectionError(error: ProjectionError): string {
  switch (error.code) {
    case 'empty':
      return 'La consulta está vacía.';
    case 'missing-select':
      return 'Una consulta comienza con SELECT: primero se indica qué mostrar.';
    case 'missing-from':
      return 'Falta FROM: indica de qué tabla salen los datos.';
    case 'missing-table':
      return 'Después de FROM va el nombre de la tabla.';
    case 'unknown-table':
      return `FROM recibe el nombre de la tabla EMPLEADOS, no ${error.table}.`;
    case 'trailing-tokens':
      return `Sobra algo después de la tabla: ${error.tokens.join(' ')}. La lista de columnas va entre SELECT y FROM.`;
    case 'empty-item':
      return 'Hay una coma sin columna: cada coma anuncia otro elemento de la lista.';
    case 'star-mixed':
      return 'El asterisco ya representa todas las columnas; en esta unidad no se combina con otras ni lleva alias.';
    case 'misplaced-keyword':
      return error.keyword === 'DISTINCT'
        ? 'DISTINCT va inmediatamente después de SELECT.'
        : `${error.keyword} está fuera de su lugar en la consulta.`;
    case 'alias-without-name':
      return 'AS debe ir seguido del nombre del encabezado.';
    case 'invalid-expression':
      return 'Uno de los elementos no forma una columna o expresión completa.';
    case 'unknown-column':
      return `${error.column} no es una columna de EMPLEADOS.`;
    case 'not-numeric':
      return `${error.column} es texto: no admite operaciones aritméticas.`;
    case 'division-by-zero':
      return 'No se puede dividir entre cero.';
    case 'invalid-character':
      return `El símbolo ${error.character} no forma parte de esta unidad.`;
  }
}

/** Feedback pedagógico al comparar el resultado de una consulta con el esperado. */
function judge(
  analysis: ProjectionAnalysis | null,
  expected: ResultTable,
  success: string,
): EvaluationOutcome {
  if (!analysis) return incorrect('La consulta contiene piezas que no pertenecen a esta misión.');
  if (!analysis.ok) return incorrect(describeProjectionError(analysis.error));
  const comparison = compareResults(analysis.result, expected);
  if (comparison.equal) return correct(success);
  const implicit = analysis.query.items.find((item) => item.aliasKind === 'implicit');
  if (implicit?.alias) {
    return incorrect(
      `Sin coma entre ${implicit.expressionTokens.join(' ')} y ${implicit.alias}, Oracle lee ${implicit.alias} como un alias: la consulta es válida, pero esa parte muestra una sola columna llamada ${normalizeIdentifier(implicit.alias)}.`,
    );
  }
  if (analysis.query.items.some((item) => item.isStar)) {
    return incorrect('El asterisco muestra todas las columnas; el pedido solo pide algunas.');
  }
  const actual = analysis.result.columns.map(normalizeIdentifier);
  const wanted = expected.columns.map(normalizeIdentifier);
  if (actual.length === wanted.length && sortedKey(actual) === sortedKey(wanted)) {
    return incorrect(`Las columnas son correctas, pero el orden pedido es ${wanted.join(', ')}.`);
  }
  const extra = actual.filter((column) => !wanted.includes(column));
  const missing = wanted.filter((column) => !actual.includes(column));
  if (extra.length > 0) return incorrect(`Sobran columnas: ${extra.join(', ')} no se pidió.`);
  if (missing.length > 0) return incorrect(`Falta mostrar ${missing.join(', ')}.`);
  return incorrect('La consulta es válida, pero su resultado no responde al pedido.');
}

/* ---------- M01 ---------- */
const m01Expected = reference('SELECT nombre, salario FROM empleados');

const m01 = define('M01', 'drag-column', {
  hint: 'El pedido menciona dos datos de cada empleado. El orden de la lista es el orden de las columnas.',
  explanation:
    'SELECT nombre, salario FROM empleados; proyecta dos columnas en ese orden para los seis empleados. Las demás columnas siguen en la tabla; solo no se muestran.',
  validate: ({ columns }) => {
    if (columns.length === 0) return invalid('Arrastra al menos una columna a la lista de SELECT.');
    const list = columns.flatMap((column, index) => (index === 0 ? [column] : [',', column]));
    return judge(
      analyzeProjection(['SELECT', ...list, 'FROM', 'empleados']),
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
      analyzePieces(pieceIds, m02Pieces),
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
const m05Reference = ['salario', '*', '12'];

function columnValues(tokens: readonly string[]): number[] | null {
  const parsed = parseExpression(tokens);
  if (!parsed.ok) return null;
  const values: number[] = [];
  for (const row of rows) {
    const value = evaluateExpression(parsed.node, row);
    if (!value.ok) return null;
    values.push(value.value);
  }
  return values;
}

const m05Expected = columnValues(m05Reference);

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
    const parsed = parseExpression(tokens as string[]);
    if (!parsed.ok) {
      return incorrect(
        'La expresión está incompleta: combina una columna, un operador y un número.',
      );
    }
    if (!referencesColumn(parsed.node, 'SALARIO')) {
      return incorrect('El cálculo debe partir de la columna SALARIO.');
    }
    const actual = columnValues(tokens as string[]);
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
    const analysis = analyzePieces(pieceIds, m06Pieces);
    if (analysis?.ok && analysis.query.items.length === 2) {
      const labeled = analysis.query.items.findIndex((item) => item.alias !== null);
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
    if (analysis && !analysis.ok && analysis.error.code === 'trailing-tokens') {
      return incorrect(
        'El alias quedó después de la tabla: AS nombra una columna del resultado, no la tabla.',
      );
    }
    return judge(
      analysis,
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

const m08 = define('M08', 'hotspot-error', {
  hint: 'Cuenta cuántas columnas pide el pedido y cuántas separa realmente la lista.',
  explanation:
    'Sin coma, Oracle interpreta SELECT nombre salario como la columna NOMBRE con el alias SALARIO: es una consulta válida, pero devuelve una sola columna. Con SELECT nombre, salario FROM empleados; se obtienen las dos columnas pedidas.',
  validate: ({ gapIndex }) => {
    if (gapIndex === null) return invalid('Selecciona un hueco de la consulta.');
    const tokens = m08Data.tokens;
    if (!Number.isInteger(gapIndex) || gapIndex < 1 || gapIndex >= tokens.length) {
      return incorrect('Ese hueco no pertenece a la consulta.');
    }
    const repaired = [...tokens.slice(0, gapIndex), m08Data.insertToken, ...tokens.slice(gapIndex)];
    const outcome = judge(
      analyzeProjection(repaired),
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
    const analysis = analyzePieces(pieceIds, m09Pieces);
    if (analysis?.ok && analysis.query.distinct) {
      return incorrect(
        'El pedido dice «todos los empleados»: DISTINCT eliminaría filas repetidas y no se pidió.',
      );
    }
    return judge(
      analysis,
      m09Expected,
      'Correcto: tres columnas en el orden del pedido para todos los empleados.',
    );
  },
});

/* ---------- M10 ---------- */
const m10 = define('M10', 'write-query', {
  hint: 'Calcula primero el nuevo salario mensual y después multiplícalo por 12.',
  explanation:
    'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados; conserva a los seis empleados, proyecta tres columnas y etiqueta el cálculo.',
  validate: ({ sql }) => {
    if (sql.trim() === '') return invalid('Escribe una consulta antes de enviarla.');
    return {
      kind: 'technical',
      reason: 'oracle-unavailable',
      message:
        'Esta misión se corrige ejecutando la consulta en Oracle y el servicio no está disponible. No se consumió ningún intento.',
    };
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
