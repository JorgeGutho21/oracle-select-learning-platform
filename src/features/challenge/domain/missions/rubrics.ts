import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import {
  compareResults,
  isSortedBy,
  normalizeIdentifier,
  sameRowMultiset,
  type ResultTable,
} from '@/domain/results/result-table';
import { analyzeExpression } from '@/domain/sql/analyzer';
import { referencedColumns, type Expression, type SelectStatement } from '@/domain/sql/ast';
import { describeDiagnostic, type SqlDiagnostic } from '@/domain/sql/diagnostics';
import { runEducational } from '@/domain/sql/educational-run';
import { evaluateExpression } from '@/domain/sql/evaluator';
import { renderStatement } from '@/domain/sql/render';
import type {
  AnswerFor,
  AnyMissionPrivate,
  ErrorKind,
  EvaluationOutcome,
  FeedbackCategory,
  InteractionType,
  MissionGuide,
  MissionId,
  MissionPrivate,
  Piece,
  RubricVerdict,
} from '../types';
import { feedbackCategoryOf } from './feedback-category';
import { findPublicMission } from './public-catalog';

/**
 * PRIVADO. Rúbricas, pistas y explicaciones del Challenge v4. Solo debe componerse en el
 * servicio de corrección; nunca importarse desde aplicación ni presentación.
 * Toda consulta se analiza con el motor SQL compartido (el mismo del laboratorio) y se
 * corrige por su resultado sobre el dataset canónico, no por su texto. Con ORDER BY se
 * comprueba el orden pedido, admitiendo cualquier orden entre filas empatadas.
 *
 * Una respuesta incorrecta explica el tipo de error, qué ya está bien y qué revisar, sin
 * revelar la solución completa: la orientación es conceptual en el primer intento y más
 * localizada en el segundo (la añade el evaluador desde `guide`).
 */

const correct = (feedback: string): EvaluationOutcome => ({ kind: 'correct', feedback });
/** Respuesta incorrecta: diagnóstico, tipo de error y, si existe, lo que ya está bien. */
const incorrect = (
  feedback: string,
  category?: FeedbackCategory,
  good?: string,
): EvaluationOutcome => ({
  kind: 'incorrect',
  feedback,
  ...(category ? { category } : {}),
  ...(good ? { good } : {}),
});
const invalid = (message: string): EvaluationOutcome => ({ kind: 'invalid-input', message });

const rows = EMPLEADOS_DATASET.rows;
const TOTAL = rows.length;
const COLUMN_TOTAL = EMPLEADOS_COLUMNS.length;
const rowOf = (id: number) => rows.find((entry) => entry.ID_EMPLEADO === id);
const sortedKey = (values: readonly string[]) => [...values].sort().join();
const listWords = (items: readonly string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);
const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value);

function define<T extends InteractionType>(
  missionId: MissionId,
  interactionType: T,
  content: {
    hint: string;
    guide: MissionGuide;
    explanation: string;
    validate: (answer: AnswerFor<T>) => RubricVerdict;
    gradeExecution?: (result: ResultTable) => EvaluationOutcome;
  },
): MissionPrivate<T> {
  return {
    missionId,
    interactionType,
    hint: content.hint,
    guide: content.guide,
    explanation: content.explanation,
    rubric: {
      validate: content.validate,
      ...(content.gradeExecution ? { gradeExecution: content.gradeExecution } : {}),
    },
  };
}

/* ---------- Corrección común ---------- */

function reference(sql: string): ResultTable {
  const run = runEducational(sql);
  if (!run.result) throw new Error(`Consulta de referencia inválida: ${sql}`);
  return run.result.table;
}

/** ID_EMPLEADO de las filas que conserva una consulta. */
function keptIdsOf(sql: string): number[] {
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

/** Primer error de una consulta: sintaxis, identificadores o evaluación. */
function firstError(sql: string): SqlDiagnostic | null {
  const run = runEducational(sql);
  return run.analysis.errors[0] ?? run.runtimeError ?? null;
}

/** Diagnóstico del motor como respuesta incorrecta, con su tipo de error. */
const diagnosed = (error: SqlDiagnostic, good?: string) =>
  incorrect(describeDiagnostic(error), feedbackCategoryOf(error), good);

/**
 * Varias partes de una respuesta (pasos de la misión): la primera que falla es lo que hay
 * que revisar; las que ya están bien se reconocen.
 */
interface Check {
  readonly ok: boolean;
  readonly good: string;
  readonly problem: () => EvaluationOutcome;
}
function checklist(checks: readonly Check[], success: string): EvaluationOutcome {
  const failed = checks.find((check) => !check.ok);
  if (!failed) return correct(success);
  const outcome = failed.problem();
  if (outcome.kind !== 'incorrect') return outcome;
  const goods = checks.filter((check) => check.ok).map((check) => check.good);
  const good = [...goods, ...(outcome.good ? [outcome.good] : [])].join(' ');
  return { ...outcome, ...(good ? { good } : {}) };
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
  if (comma) return incorrect(comma.message, 'columna');
  if (statement.items.some((item) => item.kind === 'star')) {
    return incorrect(
      'El asterisco muestra todas las columnas; el pedido solo pide algunas.',
      'columna',
      'La consulta es válida y consulta la tabla correcta.',
    );
  }
  const got = actual.columns.map(normalizeIdentifier);
  const wanted = expected.columns.map(normalizeIdentifier);
  if (got.length === wanted.length && sortedKey(got) === sortedKey(wanted)) {
    return incorrect(
      `El orden de las columnas importa: SELECT las devuelve en el mismo orden en que las escribes, y el pedido es ${wanted.join(', ')}.`,
      'orden',
      'Elegiste exactamente las columnas pedidas.',
    );
  }
  const extra = got.filter((column) => !wanted.includes(column));
  const missing = wanted.filter((column) => !got.includes(column));
  const found = got.filter((column) => wanted.includes(column));
  const partial = found.length > 0 ? `Ya muestras ${listWords(found)}.` : undefined;
  if (extra.length > 0) {
    return incorrect(`Sobran columnas: ${extra.join(', ')} no se pidió.`, 'columna', partial);
  }
  if (missing.length > 0)
    return incorrect(`El pedido también necesita ${listWords(missing)}.`, 'columna', partial);
  if (comparison.difference === 'row-count') {
    return incorrect(
      actual.rows.length > expected.rows.length
        ? 'El resultado tiene filas de más: revisa la condición que las filtra.'
        : 'El resultado no tiene todas las filas pedidas.',
      'condicion',
      'Las columnas del resultado son las pedidas.',
    );
  }
  return incorrect(
    'La consulta es válida, pero sus valores no responden al pedido.',
    'resultado',
    'La consulta es válida.',
  );
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
    return fail(
      incorrect('La consulta contiene piezas que no pertenecen a esta misión.', 'sintaxis'),
    );
  const run = runEducational(sql);
  const error = run.analysis.errors[0] ?? run.runtimeError;
  if (error) return fail(diagnosed(error));
  if (!run.analysis.statement || !run.result) {
    return fail(incorrect('La consulta no es válida.', 'sintaxis'));
  }
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
      'resultado',
      'La consulta obtiene los datos correctos; todavía no define el orden solicitado.',
    );
  }
  if (index === -1) return incorrect(`Falta la columna ${column} en el resultado.`, 'columna');
  if (isSortedBy(result.rows, [{ column: index, direction }])) return correct(success);
  const reverse = direction === 'DESC' ? 'ASC' : 'DESC';
  if (isSortedBy(result.rows, [{ column: index, direction: reverse }])) {
    return incorrect(
      direction === 'DESC'
        ? 'Las filas quedaron del valor más bajo al más alto; el pedido es del más alto al más bajo.'
        : 'Las filas quedaron del valor más alto al más bajo; el pedido es del más bajo al más alto.',
      'resultado',
      `Los datos son correctos y el orden usa la columna ${column}.`,
    );
  }
  return incorrect(
    `Las filas no siguen el orden de ${column} que pide el enunciado.`,
    'resultado',
    'Los datos del resultado son correctos.',
  );
}

/* ---------- M01 ---------- */
const M01_WANTED = ['NOMBRE', 'CIUDAD', 'CORREO'];
const M01_SALARY = ['SALARIO', 'BONO'];
const m01Expected = reference('SELECT nombre, ciudad, correo FROM empleados');

const m01 = define('M01', 'drag-column', {
  hint: 'El pedido nombra tres datos, en un orden. SALARIO y BONO son información salarial.',
  guide: {
    concept:
      'SELECT decide qué columnas aparecen y en qué orden: el resultado tiene solo las columnas de su lista. Las filas no cambian.',
    locate:
      'Compara tu lista con el pedido palabra por palabra: tres datos, en el orden en que se nombran, y ninguno salarial.',
  },
  explanation: `SELECT nombre, ciudad, correo FROM empleados; muestra tres columnas, en ese orden, para los ${TOTAL} empleados. SALARIO y BONO siguen en la tabla, pero no aparecen en el resultado: SELECT decide qué columnas se ven. Las filas son las mismas porque no hay WHERE.`,
  validate: ({ columns }) => {
    if (columns.length === 0) return invalid('Arrastra al menos una columna a la lista de SELECT.');
    const chosen = columns.map(normalizeIdentifier);
    const found = chosen.filter((column) => M01_WANTED.includes(column));
    const good = found.length > 0 ? `Seleccionaste ${listWords(found)} correctamente.` : undefined;
    const salary = chosen.filter((column) => M01_SALARY.includes(column));
    if (salary.length > 0) {
      return incorrect(
        `El pedido excluye la información salarial: ${listWords(salary)} no debe aparecer en el resultado.`,
        'columna',
        good,
      );
    }
    const extra = chosen.filter((column) => !M01_WANTED.includes(column));
    if (extra.length > 0) {
      return incorrect(
        `Sobra ${listWords(extra)}: el pedido no ${plural(extra.length, 'lo', 'los')} menciona.`,
        'columna',
        good,
      );
    }
    const missing = M01_WANTED.filter((column) => !chosen.includes(column));
    if (missing.length > 0) {
      return incorrect(`El pedido también necesita ${listWords(missing)}.`, 'columna', good);
    }
    return judge(
      `SELECT ${columns.join(', ')} FROM empleados`,
      m01Expected,
      `Correcto. SELECT decide qué columnas aparecen: NOMBRE, CIUDAD y CORREO, en ese orden. Las filas siguen siendo las mismas (${TOTAL}) porque todavía no usamos WHERE.`,
    );
  },
});

/* ---------- M02 ---------- */
const m02Pieces = pieceMap(publicDataOf('M02', 'reorder-sql').pieces);
const m02Expected = reference('SELECT nombre, ciudad FROM empleados');

const m02 = define('M02', 'reorder-sql', {
  hint: 'Una consulta básica necesita dos cláusulas: qué mostrar y de qué tabla. Nada en el pedido pide filtrar ni quitar repetidas.',
  guide: {
    concept:
      'SELECT dice qué columnas mostrar y FROM de qué tabla obtenerlas, siempre en ese orden. WHERE y DISTINCT solo se usan si el pedido descarta filas o repetidas.',
    locate:
      'Revisa cada pieza que usaste: ¿el pedido la necesita? Después comprueba el orden: SELECT, las columnas separadas por comas, FROM y la tabla.',
  },
  explanation:
    'SELECT nombre, ciudad FROM empleados; — SELECT indica qué mostrar (NOMBRE y CIUDAD, en ese orden) y FROM de qué tabla salen los datos. No hace falta WHERE, porque no se descarta ninguna fila, ni DISTINCT, porque no se quitan repetidas; el asterisco traería todas las columnas.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const selectAt = pieceIds.indexOf('m02-select');
    const fromAt = pieceIds.indexOf('m02-from');
    const ordered = selectAt === 0 && fromAt > selectAt && pieceIds.includes('m02-empleados');
    const good = ordered ? 'SELECT y FROM están en el orden de SQL.' : undefined;
    if (pieceIds.includes('m02-where')) {
      return incorrect(
        'WHERE sirve para descartar filas que no cumplen una condición, y el pedido quiere a todos los empleados: esta consulta no necesita WHERE.',
        'concepto',
        good,
      );
    }
    if (pieceIds.includes('m02-distinct')) {
      return incorrect(
        'DISTINCT quita filas repetidas del resultado, y el pedido dice «sin quitar ninguno»: aquí sobra.',
        'concepto',
        good,
      );
    }
    if (pieceIds.includes('m02-star')) {
      return incorrect(
        'El asterisco traería las 12 columnas; el pedido solo necesita nombre y ciudad.',
        'columna',
        good,
      );
    }
    if (selectAt >= 0 && fromAt >= 0 && fromAt < selectAt) {
      return incorrect(
        'El orden de SQL es fijo: primero SELECT (qué mostrar) y después FROM (de qué tabla obtenerlo).',
        'orden',
      );
    }
    return judge(
      sqlFromPieces(pieceIds, m02Pieces),
      m02Expected,
      'Correcto: SELECT nombre, ciudad FROM empleados; — SELECT dice qué mostrar y FROM de qué tabla obtenerlo. No hacía falta WHERE (no se descarta ninguna fila) ni DISTINCT (no se quitan repetidas).',
    );
  },
});

/* ---------- M03 ---------- */
const m03Data = publicDataOf('M03', 'predict-result');
/** Qué hace el asterisco: la respuesta y una pregunta que orienta sin darla. */
const M03_CLAIMS: Readonly<Record<string, { readonly value: boolean; readonly ask: string }>> = {
  'star-column': {
    value: false,
    ask: '¿El * es el nombre de una columna o una forma de pedirlas todas?',
  },
  'table-order': { value: true, ask: '¿En qué orden aparecen las columnas en el esquema?' },
  'drops-null': { value: false, ask: '¿Hay alguna condición WHERE que descarte filas?' },
  sorts: { value: false, ask: '¿Hay algún ORDER BY en la consulta?' },
  'select-controls': { value: true, ask: '¿Qué parte de la consulta decide qué columnas se ven?' },
};
if (
  !m03Data.claims ||
  sortedKey(m03Data.claims.map(({ id }) => id)) !== sortedKey(Object.keys(M03_CLAIMS))
) {
  throw new Error('Las afirmaciones de M03 no corresponden a su rúbrica.');
}

const m03 = define('M03', 'predict-result', {
  hint: 'Cuenta las columnas del esquema. Después busca en la consulta si hay WHERE o ORDER BY.',
  guide: {
    concept:
      'El asterisco (*) no es una columna: representa todas las columnas de la tabla, en su orden. SELECT controla las columnas; sin WHERE ninguna fila se descarta y sin ORDER BY no se ordena.',
    locate:
      'Mira el esquema de EMPLEADOS: cuántas columnas tiene y en qué orden. Después lee la consulta: solo tiene SELECT * y FROM.',
  },
  explanation: `SELECT * se sustituye por las ${COLUMN_TOTAL} columnas de EMPLEADOS, en el orden de la tabla: ${EMPLEADOS_COLUMNS.join(', ')}. Sin WHERE devuelve las ${TOTAL} filas, también las que tienen NULL en BONO, y sin ORDER BY no las ordena. Para ver solo algunas columnas, se escriben en lugar del *.`,
  validate: ({ rowCount, columnCount = null, claims = [] }) => {
    const answered = claims.filter((claim) => claim.value !== null);
    if (rowCount === null && columnCount === null && answered.length === 0) {
      return invalid('Indica cuántas columnas y filas devuelve y responde las afirmaciones.');
    }
    if (columnCount === null || rowCount === null) {
      return invalid('Indica cuántas columnas y cuántas filas devuelve la consulta.');
    }
    const claimList = m03Data.claims!;
    if (claimList.some(({ id }) => !answered.some((claim) => claim.id === id))) {
      return invalid('Responde todas las afirmaciones: «Lo hace» o «No lo hace».');
    }
    const wrongClaims = claimList.filter(
      ({ id }) => answered.find((claim) => claim.id === id)?.value !== M03_CLAIMS[id]!.value,
    );
    return checklist(
      [
        {
          ok: columnCount === COLUMN_TOTAL,
          good: `El resultado tiene ${COLUMN_TOTAL} columnas: el * las trae todas.`,
          problem: () =>
            incorrect(
              'El * representa todas las columnas de la tabla: revisa cuántas tiene el esquema de EMPLEADOS.',
              'concepto',
            ),
        },
        {
          ok: rowCount === TOTAL,
          good: `Sin WHERE salen las ${TOTAL} filas.`,
          problem: () =>
            incorrect(
              'Sin WHERE ninguna fila se descarta: el resultado tiene tantas filas como la tabla.',
              'resultado',
            ),
        },
        {
          ok: wrongClaims.length === 0,
          good: 'Clasificaste bien lo que hace y lo que no hace el asterisco.',
          problem: () => {
            const first = wrongClaims[0]!;
            const more = wrongClaims.length - 1;
            return incorrect(
              `Revisa «${first.text}» ${M03_CLAIMS[first.id]!.ask}${more > 0 ? ` (y ${more} ${plural(more, 'afirmación más', 'afirmaciones más')})` : ''}`,
              'concepto',
            );
          },
        },
      ],
      `Correcto: el * se sustituye por las ${COLUMN_TOTAL} columnas, en el orden de la tabla, y sin WHERE salen las ${TOTAL} filas. SELECT controla las columnas; el * no filtra ni ordena.`,
    );
  },
});

/* ---------- M04 ---------- */
const m04Data = publicDataOf('M04', 'predict-result');
const M04_REFERENCE = "SELECT nombre, ciudad, salario FROM empleados WHERE ciudad = 'Cali'";
const m04Expected = reference(M04_REFERENCE);
const m04Sample = rows.filter((row) => m04Data.sampleIds!.includes(row.ID_EMPLEADO));
const m04Kept = keptIdsOf(M04_REFERENCE).filter((id) => m04Data.sampleIds!.includes(id));
const m04Pieces = pieceMap(m04Data.conditionPieces!);
const m04Select = m04Data.query.split('▢')[0]!.trim();

const m04 = define('M04', 'predict-result', {
  hint: 'Recorre la columna CIUDAD fila por fila. En la condición, un texto va entre comillas simples.',
  guide: {
    concept:
      'WHERE selecciona FILAS: solo pasan las que cumplen la condición. SELECT selecciona COLUMNAS. Un texto se compara entre comillas simples.',
    locate:
      'Mira la columna CIUDAD de cada registro de la muestra. Para la condición: la columna, el operador = y el texto entre comillas.',
  },
  explanation: `WHERE ciudad = 'Cali' conserva solo las filas cuya CIUDAD es Cali: de los ${m04Sample.length} registros de la muestra quedan ${m04Kept.length} (en la tabla completa, ${m04Expected.rows.length} de ${TOTAL}). SELECT muestra de ellas NOMBRE, CIUDAD y SALARIO. WHERE decide qué filas quedan; SELECT, qué columnas se ven.`,
  validate: ({ sourceRowIds, conditionPieceIds = [] }) => {
    if (sourceRowIds.length === 0 && conditionPieceIds.length === 0) {
      return invalid('Marca las filas que cumplen la condición y construye la condición de WHERE.');
    }
    if (sourceRowIds.length === 0) {
      return invalid('Marca en la muestra las filas que cumplirán la condición (paso 1).');
    }
    if (conditionPieceIds.length === 0) {
      return invalid('Construye la condición de WHERE con las piezas (paso 2).');
    }
    const selected = m04Sample.filter((row) => sourceRowIds.includes(row.ID_EMPLEADO));
    const extra = selected.filter((row) => !m04Kept.includes(row.ID_EMPLEADO));
    const missing = m04Kept.filter((id) => !sourceRowIds.includes(id));
    const condition = sqlFromPieces(conditionPieceIds, m04Pieces);
    const sql = condition === null ? null : `${m04Select} ${condition}`;
    const conditionOk =
      sql !== null &&
      conditionPieceIds[0] === 'm04-where' &&
      firstError(sql) === null &&
      compareResults(reference(sql), m04Expected).equal;
    return checklist(
      [
        {
          ok: extra.length === 0 && missing.length === 0,
          good: `Marcaste exactamente las ${m04Kept.length} filas de Cali de la muestra.`,
          problem: () =>
            extra.length > 0
              ? incorrect(
                  `Sobran filas: ${listWords(extra.map((row) => row.NOMBRE))} no ${plural(extra.length, 'trabaja', 'trabajan')} en Cali, así que WHERE ${plural(extra.length, 'la', 'las')} descarta.`,
                  'condicion',
                )
              : incorrect(
                  `Falta${plural(missing.length, '', 'n')} ${missing.length} ${plural(missing.length, 'fila que cumple', 'filas que cumplen')} la condición: WHERE conserva todas las filas cuya CIUDAD es Cali.`,
                  'condicion',
                ),
        },
        {
          ok: conditionOk,
          good: 'La condición de WHERE es correcta.',
          problem: () => {
            if (sql === null)
              return incorrect('La condición tiene piezas ajenas a la misión.', 'sintaxis');
            if (conditionPieceIds[0] !== 'm04-where') {
              return incorrect(
                'La condición empieza con WHERE: esa palabra indica qué filas se conservan.',
                'sintaxis',
              );
            }
            const error = firstError(sql);
            if (error) return diagnosed(error);
            if (conditionPieceIds.includes('m04-salario')) {
              return incorrect(
                'El pedido habla de dónde trabajan, no de cuánto ganan: la condición debe mirar la columna CIUDAD.',
                'condicion',
              );
            }
            return incorrect(
              'La condición no conserva solo a los empleados de Cali: revisa la columna, el operador y el valor.',
              'condicion',
            );
          },
        },
      ],
      `Correcto: WHERE selecciona FILAS: de los ${m04Sample.length} registros quedan los ${m04Kept.length} de Cali (en la tabla completa, ${m04Expected.rows.length} de ${TOTAL}). SELECT selecciona COLUMNAS: NOMBRE, CIUDAD y SALARIO. WHERE no quitó ninguna columna.`,
    );
  },
});

/* ---------- M05 ---------- */
const m05Data = publicDataOf('M05', 'expression-builder');
const m05Palette = pieceMap(m05Data.palette);

/** Valor de una expresión en cada fila (NULL incluido), o `null` si no puede evaluarse. */
function columnValues(expression: Expression): (number | null)[] | null {
  const values: (number | null)[] = [];
  for (const row of rows) {
    const value = evaluateExpression(expression, row);
    if (!value.ok) return null;
    if (value.value !== null && typeof value.value !== 'number') return null;
    values.push(value.value);
  }
  return values;
}
function valuesOf(text: string): (number | null)[] {
  const expression = analyzeExpression(text).expression;
  const values = expression ? columnValues(expression) : null;
  if (!values) throw new Error(`Expresión de referencia inválida: ${text}`);
  return values;
}
const sameValues = (left: readonly (number | null)[], right: readonly (number | null)[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const M05_TARGET = '(salario + bono) * 12';
const m05Target = valuesOf(M05_TARGET);
const m05Comparisons = (m05Data.comparisons ?? []).map((text) => ({
  text,
  values: valuesOf(text),
}));
const m05Unparenthesized = valuesOf('salario + bono * 12');
const m05Examples = m05Data.predictionEmployeeIds.flatMap((id) => {
  const index = rows.findIndex((row) => row.ID_EMPLEADO === id);
  return m05Comparisons.map(
    ({ text, values }) =>
      `${text} → ${formatNumber(values[index] ?? 0)} para ${rows[index]!.NOMBRE}`,
  );
});

const m05 = define('M05', 'expression-builder', {
  hint: 'Oracle multiplica antes de sumar. Si algo debe sumarse primero, va entre paréntesis.',
  guide: {
    concept:
      'En una expresión, * y / se calculan antes que + y −. Los paréntesis cambian ese orden: lo de dentro se calcula primero.',
    locate:
      'Para cada expresión, identifica qué operación va primero y calcula paso a paso con los valores de Ana. Para el pedido: ¿qué debe sumarse antes de multiplicar por 12?',
  },
  explanation: `${M05_TARGET} suma primero salario y bono y después multiplica por 12: el ingreso de un año. Sin paréntesis, Oracle multiplica primero: salario + bono * 12 suma el salario a doce bonos. ${listWords(m05Examples)}. Es una columna calculada del resultado: la tabla no cambia.`,
  validate: ({ pieceIds, predictions }) => {
    const filled = predictions.filter((prediction) => prediction.value !== null);
    if (pieceIds.length === 0 && filled.length === 0) {
      return invalid('Predice los valores de las dos expresiones y construye la del pedido.');
    }
    const expectedCount = m05Comparisons.length * m05Data.predictionEmployeeIds.length;
    if (filled.length < expectedCount) {
      return invalid('Escribe el valor de las dos expresiones para Ana (paso 1).');
    }
    if (pieceIds.length === 0) {
      return invalid('Construye la expresión del ingreso anual (paso 2).');
    }
    const wrongPredictions = m05Comparisons.filter(({ text, values }) =>
      m05Data.predictionEmployeeIds.some((id) => {
        const index = rows.findIndex((row) => row.ID_EMPLEADO === id);
        const prediction = predictions.find(
          (item) => item.employeeId === id && item.expression === text,
        );
        return prediction?.value !== values[index];
      }),
    );
    const tokens = pieceIds.map((id) => m05Palette.get(id));
    const text = tokens.some((token) => token === undefined) ? null : tokens.join(' ');
    const analysis = text === null ? null : analyzeExpression(text);
    const expression = analysis && analysis.errors.length === 0 ? analysis.expression : null;
    const values = expression ? columnValues(expression) : null;
    return checklist(
      [
        {
          ok: wrongPredictions.length === 0,
          good: 'Tus dos predicciones son correctas.',
          problem: () =>
            incorrect(
              wrongPredictions[0]!.text.startsWith('(')
                ? `Revisa tu predicción de ${wrongPredictions[0]!.text}: lo que está entre paréntesis se calcula primero.`
                : `Revisa tu predicción de ${wrongPredictions[0]!.text}: sin paréntesis, ¿qué operación hace Oracle primero?`,
              'operador',
            ),
        },
        {
          ok: values !== null && sameValues(values, m05Target),
          good: 'La expresión calcula el ingreso anual pedido.',
          problem: () => {
            if (!expression) {
              return incorrect(
                'La expresión está incompleta: revisa que cada operador tenga un valor a cada lado y que cada ( tenga su ).',
                'sintaxis',
              );
            }
            const used = referencedColumns(expression);
            if (!used.includes('SALARIO') || !used.includes('BONO')) {
              return incorrect(
                'El ingreso de cada mes es salario más bono: la expresión debe usar las dos columnas.',
                'columna',
              );
            }
            if (values && sameValues(values, m05Unparenthesized)) {
              return incorrect(
                'Sin paréntesis, * se calcula antes que +: así se suma el salario a doce bonos. El pedido suma salario y bono antes de multiplicar por 12.',
                'operador',
                'La expresión usa salario, bono y 12.',
              );
            }
            return incorrect(
              'La expresión no calcula (salario del mes + bono del mes) durante 12 meses: revisa los operadores y los paréntesis.',
              'operador',
            );
          },
        },
      ],
      `Correcto: ${M05_TARGET} suma primero salario y bono y después multiplica por 12. Sin paréntesis, Oracle multiplica primero y el valor cambia. Es una columna calculada: la tabla no cambia.`,
    );
  },
});

/* ---------- M06 ---------- */
const m06Pieces = pieceMap(publicDataOf('M06', 'alias-builder').pieces);
const m06Expected = reference('SELECT nombre, salario * 12 AS salario_anual FROM empleados');

const m06 = define('M06', 'alias-builder', {
  hint: 'AS va justo después de la expresión que nombra, y el alias es un nombre, no un texto: sin comillas simples.',
  guide: {
    concept:
      'Un alias es un nombre temporal para una columna del resultado. AS no renombra la columna guardada ni cambia la tabla: solo cambia el encabezado del resultado.',
    locate:
      'Revisa dónde quedó AS: inmediatamente después de salario * 12, antes de FROM. Y cómo está escrito el alias: sin comillas simples.',
  },
  explanation:
    'SELECT nombre, salario * 12 AS salario_anual FROM empleados; — sin alias, el encabezado de la columna calculada es SALARIO*12; con AS, SALARIO_ANUAL. Los valores son los mismos: AS solo cambia el encabezado del resultado. No renombra la columna SALARIO ni cambia la tabla EMPLEADOS. Las comillas simples son para textos, así que el alias va sin ellas.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const sql = sqlFromPieces(pieceIds, m06Pieces);
    if (sql !== null) {
      const run = runEducational(sql);
      const statement = run.analysis.statement;
      const error = run.analysis.errors[0];
      if (error?.code === 'invalid-alias') {
        return incorrect(
          "'salario_anual' entre comillas simples es un texto, no un nombre: el alias se escribe sin comillas simples.",
          'sintaxis',
          'AS está junto a la columna calculada.',
        );
      }
      if (error?.code === 'table-alias') {
        return incorrect(
          'El alias quedó después de la tabla: AS nombra una columna del resultado, no la tabla.',
          'orden',
        );
      }
      if (statement && run.analysis.ok && statement.items.length === 2) {
        const labeled = statement.items.findIndex(
          (item) => item.kind === 'expression' && item.alias,
        );
        if (labeled === 0) {
          return incorrect(
            'El alias quedó junto a NOMBRE: debe describir la columna calculada salario * 12.',
            'orden',
            'La consulta es válida y tiene las dos columnas pedidas.',
          );
        }
        const item = statement.items[1]!;
        if (labeled === -1 || item.kind !== 'expression' || !item.alias) {
          return incorrect(
            'Sin alias, el encabezado de la columna calculada es la propia expresión: SALARIO*12.',
            'semantica',
            'La consulta es válida y calcula el salario anual.',
          );
        }
        if (!item.alias.explicit) {
          return incorrect(
            'El encabezado ya sería SALARIO_ANUAL, pero el pedido pide escribir AS: así se ve que es un alias.',
            'semantica',
            'La consulta es válida y calcula el salario anual.',
          );
        }
      }
    }
    return judge(
      sql,
      m06Expected,
      'Correcto: AS salario_anual solo cambia el encabezado del resultado: SALARIO*12 pasa a llamarse SALARIO_ANUAL, con los mismos valores. La tabla EMPLEADOS no cambia y su columna sigue siendo SALARIO.',
    );
  },
});

/* ---------- M07 ---------- */
const m07Data = publicDataOf('M07', 'distinct-result');
const m07Source = reference(m07Data.sourceQuery);
const m07Values = reference(m07Data.query).rows.map(([value]) => String(value));
const m07Pairs = reference(m07Data.pairQuery).rows.length;
if (!m07Values.every((value) => m07Data.options.includes(value))) {
  throw new Error('Las opciones de M07 no contienen su resultado.');
}

const m07 = define('M07', 'distinct-result', {
  hint: 'Recorre la columna CIUDAD de la muestra: cada ciudad cuenta una vez. Con dos columnas, compara ciudad y departamento a la vez.',
  guide: {
    concept:
      'DISTINCT quita filas repetidas del RESULTADO: deja un ejemplar de cada valor. No borra registros de la tabla ni ordena. Con dos columnas compara el par completo.',
    locate:
      'Para el paso 1, anota cada ciudad distinta de la muestra. Para el paso 2, escribe los pares (ciudad, departamento) y cuenta cuántos son distintos.',
  },
  explanation: `${m07Data.sourceQuery.replace(/\s+/g, ' ')} devuelve ${m07Source.rows.length} filas. Con DISTINCT ciudad quedan ${m07Values.length}: ${listWords(m07Values)}. Con DISTINCT ciudad, departamento quedan ${m07Pairs}: DISTINCT compara el par completo y (Bogotá, TI) no es igual que (Bogotá, Finanzas). DISTINCT quita repetidas del resultado; la tabla EMPLEADOS no pierde registros.`,
  validate: ({ values, pairCount }) => {
    if (values.length === 0 && pairCount === null) {
      return invalid('Marca las ciudades del resultado y predice cuántas filas devuelve el par.');
    }
    if (values.length === 0) return invalid('Marca al menos una ciudad (paso 1).');
    if (pairCount === null) {
      return invalid('Predice cuántas filas devuelve DISTINCT con dos columnas (paso 2).');
    }
    const extra = values.filter((value) => !m07Values.includes(value));
    const missing = m07Values.filter((value) => !values.includes(value));
    return checklist(
      [
        {
          ok: extra.length === 0 && missing.length === 0,
          good: 'Las ciudades que marcaste son las que devuelve DISTINCT.',
          problem: () =>
            extra.length > 0
              ? incorrect(
                  `${listWords(extra)} no ${plural(extra.length, 'aparece', 'aparecen')} entre los analistas: DISTINCT solo deja valores que están en las filas de partida.`,
                  'resultado',
                )
              : incorrect(
                  `Falta${plural(missing.length, '', 'n')} ${missing.length} ${plural(missing.length, 'ciudad', 'ciudades')}: DISTINCT conserva un ejemplar de cada valor, también de los que se repiten.`,
                  'resultado',
                ),
        },
        {
          ok: pairCount === m07Pairs,
          good: 'Contaste bien los pares distintos.',
          problem: () =>
            pairCount === m07Values.length
              ? incorrect(
                  'Con dos columnas, DISTINCT compara el PAR completo (ciudad, departamento): dos filas de la misma ciudad con distinto departamento son filas distintas.',
                  'concepto',
                )
              : incorrect(
                  'Cuenta los pares (ciudad, departamento) diferentes: DISTINCT solo quita una fila si el par completo se repite.',
                  'concepto',
                ),
        },
      ],
      `Correcto: DISTINCT ciudad deja ${m07Values.length} de ${m07Source.rows.length} filas. Con ciudad y departamento compara el par completo: los ${m07Pairs} pares son distintos. DISTINCT quita repetidas del resultado: la tabla no pierde registros ni se ordena.`,
    );
  },
});

/* ---------- M08 ---------- */
const m08Data = publicDataOf('M08', 'hotspot-error');
const KIND_LABEL: Readonly<Record<ErrorKind, string>> = {
  sintaxis: 'sintaxis',
  semantica: 'semántica',
  concepto: 'concepto',
};
/** Clave privada de cada variante: tipo, piezas donde está el error y consulta pedida. */
const M08_KEYS: Readonly<
  Record<
    string,
    {
      readonly kind: ErrorKind;
      readonly zone: readonly number[];
      readonly expected: string;
      readonly why: string;
    }
  >
> = {
  coma: {
    kind: 'concepto',
    zone: [1, 2],
    expected: 'SELECT nombre, salario FROM empleados',
    why: 'Oracle la ejecuta sin error, pero sin coma salario se lee como alias de nombre: el resultado tiene una sola columna.',
  },
  from: {
    kind: 'sintaxis',
    zone: [3, 4],
    expected: 'SELECT nombre, ciudad FROM empleados',
    why: 'Oracle no puede leerla: falta FROM antes del nombre de la tabla.',
  },
  comillas: {
    kind: 'semantica',
    zone: [7],
    expected: "SELECT nombre FROM empleados WHERE ciudad = 'Cali'",
    why: 'La consulta se puede leer, pero Cali sin comillas se interpreta como una columna, y EMPLEADOS no tiene ninguna columna CALI (ORA-00904).',
  },
  'doble-coma': {
    kind: 'sintaxis',
    zone: [2, 3],
    expected: 'SELECT nombre, cargo, ciudad FROM empleados',
    why: 'Oracle no puede leerla: entre dos comas falta una columna.',
  },
  parentesis: {
    kind: 'sintaxis',
    zone: [3, 4, 5, 6, 7, 8],
    expected: 'SELECT nombre, (salario + bono) * 12 FROM empleados',
    why: 'Oracle no puede leerla: el paréntesis que se abre nunca se cierra.',
  },
  'igual-null': {
    kind: 'concepto',
    zone: [6, 7],
    expected: 'SELECT nombre FROM empleados WHERE bono IS NULL',
    why: 'Oracle la ejecuta, pero una comparación con = NULL nunca es verdadera: devuelve 0 filas. NULL se busca con IS NULL.',
  },
  in: {
    kind: 'sintaxis',
    zone: [6, 7, 8, 9],
    expected: "SELECT nombre FROM empleados WHERE ciudad IN ('Cali', 'Medellín')",
    why: 'Oracle no puede leerla: IN necesita la lista de valores entre paréntesis.',
  },
  distinct: {
    kind: 'sintaxis',
    zone: [1, 2],
    expected: 'SELECT DISTINCT ciudad FROM empleados',
    why: 'Oracle no puede leerla: DISTINCT va justo después de SELECT.',
  },
};
const m08Expected = new Map(
  Object.entries(M08_KEYS).map(([id, key]) => [id, reference(key.expected)]),
);
// Cada variante debe fallar como dice su clave: la corrección nunca contradice al motor.
for (const variant of m08Data.variants) {
  const key = M08_KEYS[variant.id];
  if (!key) throw new Error(`La variante ${variant.id} de M08 no tiene clave.`);
  const run = runEducational(variant.tokens.join(' '));
  const failsToRun = run.analysis.errors.length > 0 || run.runtimeError !== null;
  const wrongResult =
    run.result !== null && !compareResults(run.result.table, m08Expected.get(variant.id)!).equal;
  const behaves = key.kind === 'concepto' ? !failsToRun && wrongResult : failsToRun;
  if (!behaves)
    throw new Error(`La variante ${variant.id} de M08 no produce el error de su clave.`);
}
/** Consulta sin espacios ni punto y coma final: detecta una corrección que no cambió nada. */
const normalizeSql = (sql: string) => sql.replace(/\s+/g, '').replace(/;$/, '');

const m08 = define('M08', 'hotspot-error', {
  hint: 'Lee la consulta pieza por pieza frente al pedido. Si Oracle no pudiera leerla, es sintaxis; si la lee pero nombra algo que no existe, semántica; si la ejecuta y devuelve otra cosa, concepto.',
  guide: {
    concept:
      'Un error de SINTAXIS impide leer la consulta; uno de SEMÁNTICA nombra algo que no existe; uno de CONCEPTO se ejecuta, pero no hace lo pedido.',
    locate:
      'Mira las piezas donde suele estar el problema: comas, comillas, paréntesis y palabras clave (FROM, DISTINCT, IS, IN).',
  },
  explanation:
    'Tres tipos de error. SINTAXIS: Oracle no puede leer la consulta (dos comas seguidas, un FROM que falta, un paréntesis sin cerrar, IN sin paréntesis, DISTINCT fuera de su sitio). SEMÁNTICA: se lee, pero nombra algo que no existe (un texto sin comillas se toma como una columna). CONCEPTO: se ejecuta, pero no hace lo pedido (sin coma, la segunda columna se vuelve un alias; = NULL nunca es verdadero, se usa IS NULL).',
  validate: ({ variantId, kind, tokenIndex, sql }) => {
    const variant = m08Data.variants.find((entry) => entry.id === variantId);
    const key = M08_KEYS[variantId];
    if (!variant || !key)
      return invalid('La consulta de la misión no es válida: recarga la misión.');
    if (kind === null && tokenIndex === null && sql.trim() === '') {
      return invalid('Completa los tres pasos: tipo de error, dónde está y la consulta corregida.');
    }
    if (kind === null) return invalid('Elige el tipo de error (paso 1).');
    if (tokenIndex === null)
      return invalid('Toca la parte de la consulta donde está el error (paso 2).');
    if (sql.trim() === '') return invalid('Escribe la consulta corregida (paso 3).');
    const expected = m08Expected.get(variantId)!;
    if (normalizeSql(sql) === normalizeSql(variant.tokens.join(' '))) {
      return invalid('Corrige la consulta (paso 3): todavía es igual a la original.');
    }
    const run = runEducational(sql);
    const error = run.analysis.errors[0] ?? run.runtimeError;
    const actual = run.result?.table ?? null;
    const fixed =
      !error &&
      actual !== null &&
      actual.columns.length === expected.columns.length &&
      sameRowMultiset(actual.rows, expected.rows);
    return checklist(
      [
        {
          ok: kind === key.kind,
          good: `Clasificaste bien: es un error de ${KIND_LABEL[key.kind]}.`,
          problem: () =>
            incorrect(
              'Revisa el tipo de error: ¿Oracle podría leer esta consulta? Si la lee, ¿existe todo lo que nombra? Y si se ejecuta, ¿devuelve lo pedido?',
            ),
        },
        {
          ok: key.zone.includes(tokenIndex),
          good: 'Localizaste bien la parte con el error.',
          problem: () =>
            incorrect(
              'El error no está en la parte que tocaste: compara la consulta con el pedido, pieza por pieza.',
            ),
        },
        {
          ok: fixed,
          good: 'Tu corrección devuelve lo pedido.',
          problem: () => {
            if (error) return diagnosed(error);
            if (!actual) return incorrect('La consulta corregida no es válida.', 'sintaxis');
            if (actual.columns.length !== expected.columns.length) {
              return incorrect(
                `La consulta corregida devuelve ${actual.columns.length} ${plural(actual.columns.length, 'columna', 'columnas')}; el pedido necesita ${expected.columns.length}.`,
                'columna',
              );
            }
            if (actual.rows.length !== expected.rows.length) {
              return incorrect(
                `La consulta corregida devuelve ${actual.rows.length} ${plural(actual.rows.length, 'fila', 'filas')}, y el pedido corresponde a ${expected.rows.length}.`,
                'resultado',
              );
            }
            return incorrect(
              'La consulta corregida es válida, pero sus valores no responden al pedido.',
              'resultado',
            );
          },
        },
      ],
      `Correcto: era un error de ${KIND_LABEL[key.kind]}. ${key.why} Tu corrección devuelve lo pedido.`,
    );
  },
});

/* ---------- M09 ---------- */
const m09Pieces = pieceMap(publicDataOf('M09', 'build-query').pieces);
const M09_REFERENCE =
  "SELECT nombre, ciudad, salario FROM empleados WHERE ciudad IN ('Bogotá', 'Cali') AND salario >= 4200000 ORDER BY salario DESC";
const M09_CITIES = ['Bogotá', 'Cali'];
const M09_MINIMUM = 4200000;
const m09Expected = reference(M09_REFERENCE);
const m09Ids = keptIdsOf(M09_REFERENCE);

const m09 = define('M09', 'build-query', {
  hint: 'Cada dato mencionado es una columna, en ese orden. Hay dos condiciones que se cumplen a la vez, «al menos» incluye el límite y el orden se pide al final.',
  guide: {
    concept:
      'WHERE filtra filas: AND exige que se cumplan las dos condiciones, OR basta con una. «Al menos» es >=. ORDER BY … DESC va del mayor al menor.',
    locate:
      'Revisa la condición parte por parte: la de la ciudad, la del salario (¿incluye 4.200.000?) y el operador que las une. Después, la dirección de ORDER BY.',
  },
  explanation: `${M09_REFERENCE}; — WHERE deja a los ${m09Expected.rows.length} empleados de Bogotá o Cali que ganan al menos 4.200.000 (IN para las ciudades, AND porque se exigen las dos condiciones y >= porque «al menos» incluye el límite). ORDER BY salario DESC los ordena del salario más alto al más bajo. Se acepta cualquier consulta con el mismo resultado y el mismo orden.`,
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca los bloques antes de comprobar.');
    const sql = sqlFromPieces(pieceIds, m09Pieces);
    if (sql === null) {
      return incorrect('La consulta contiene piezas que no pertenecen a esta misión.', 'sintaxis');
    }
    const run = runEducational(sql);
    const error = run.analysis.errors[0] ?? run.runtimeError;
    if (error) return diagnosed(error);
    const statement = run.analysis.statement!;
    const result = run.result!;
    if (statement.distinct) {
      return incorrect(
        'El pedido no busca quitar repetidas: DISTINCT no se pidió.',
        'concepto',
        'La consulta es válida.',
      );
    }
    const success = `Correcto: WHERE deja a los ${m09Expected.rows.length} empleados de Bogotá o Cali que ganan al menos 4.200.000 y ORDER BY salario DESC los ordena del salario más alto al más bajo. AND exige las dos condiciones y >= incluye el valor límite.`;
    const columns = compareResults(result.table, m09Expected);
    if (!columns.equal && columns.difference === 'columns') {
      return explainResult(statement, result.table, m09Expected, success, run.analysis.warnings);
    }
    const shape = 'Las columnas son las pedidas.';
    if (!statement.where) {
      return incorrect(
        'Faltan las condiciones: el pedido no quiere a todos los empleados, solo a los de Bogotá o Cali que ganan al menos 4.200.000.',
        'condicion',
        shape,
      );
    }
    const kept = result.trace.keptRows.map((index) => rows[index]!);
    const extra = kept.filter((row) => !m09Ids.includes(row.ID_EMPLEADO));
    const missing = m09Ids.filter((id) => !kept.some((row) => row.ID_EMPLEADO === id));
    if (extra.length > 0) {
      const otherCity = extra.some((row) => !M09_CITIES.includes(row.CIUDAD));
      return otherCity
        ? incorrect(
            'Sobran empleados de otras ciudades: revisa la condición sobre la ciudad y cómo se une con la del salario.',
            'condicion',
            shape,
          )
        : incorrect(
            'Sobran empleados de Bogotá o Cali que ganan menos de 4.200.000: las dos condiciones deben cumplirse a la vez. ¿Qué operador lo exige?',
            'operador',
            shape,
          );
    }
    if (missing.length > 0) {
      const atLimit = missing.every((id) => rowOf(id)?.SALARIO === M09_MINIMUM);
      return atLimit
        ? incorrect(
            'Falta quien gana exactamente 4.200.000: «al menos» incluye ese valor. Revisa el operador de comparación.',
            'operador',
            shape,
          )
        : incorrect(
            'Faltan empleados que cumplen el pedido: revisa las condiciones.',
            'condicion',
            shape,
          );
    }
    return orderOutcome(statement, result.table, 'SALARIO', 'DESC', success);
  },
});

/* ---------- M10 ---------- */
const M10_REFERENCE =
  "SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad IN ('Bogotá', 'Cali') ORDER BY proyeccion_anual DESC";
const m10Expected = reference(M10_REFERENCE);

const m10 = define('M10', 'write-query', {
  hint: 'Filtra primero las filas: activos y de una de las dos ciudades (si usas OR, entre paréntesis). Suma los 100000 antes de multiplicar por 12 y ordena por la proyección.',
  guide: {
    concept:
      'Cada cláusula resuelve una parte del pedido: SELECT qué mostrar, FROM de dónde, WHERE qué filas y ORDER BY en qué orden. AS nombra la columna calculada. AND se evalúa antes que OR.',
    locate:
      'Comprueba cada parte por separado: las condiciones de WHERE y cómo se agrupan, los paréntesis del cálculo, el alias escrito con AS y la dirección de ORDER BY.',
  },
  explanation: `${M10_REFERENCE}; — WHERE deja a los ${m10Expected.rows.length} empleados activos de Bogotá o Cali (IN, o bien OR entre paréntesis, porque AND se evalúa antes que OR), los paréntesis suman los 100000 antes de multiplicar, AS nombra la columna y ORDER BY la ordena de mayor a menor.`,
  // Capas 1 y 2 de LAB_SPEC (estructura y requisitos) con el motor compartido; la capa 3,
  // la salida real, exige ejecutar en Oracle.
  validate: ({ sql }) => {
    if (sql.trim() === '') return invalid('Escribe una consulta antes de enviarla.');
    const run = runEducational(sql);
    const error = run.analysis.errors[0];
    if (error) return diagnosed(error);
    const statement = run.analysis.statement!;
    const valid = 'La consulta es válida en el subconjunto SELECT.';
    if (statement.items.some((item) => item.kind === 'star')) {
      return incorrect(
        'El pedido indica tres columnas concretas: el asterisco mostraría todas.',
        'columna',
        valid,
      );
    }
    if (statement.distinct) {
      return incorrect(
        'El pedido no busca quitar repetidas: DISTINCT no se pidió.',
        'concepto',
        valid,
      );
    }
    if (statement.items.length !== 3) {
      return incorrect(
        `El pedido tiene tres columnas (NOMBRE, CIUDAD y la proyección anual); tu consulta tiene ${statement.items.length}.`,
        'columna',
        valid,
      );
    }
    const third = statement.items[2]!;
    if (third.kind !== 'expression')
      return incorrect('La tercera columna debe ser el cálculo anual.', 'columna', valid);
    if (
      third.expression.kind === 'column' ||
      !referencedColumns(third.expression).includes('SALARIO')
    ) {
      return incorrect('La tercera columna es un cálculo basado en SALARIO.', 'operador', valid);
    }
    const shape = 'Las tres columnas y el cálculo basado en SALARIO están en su sitio.';
    if (!third.alias) {
      return incorrect(
        'Usa AS para llamar PROYECCION_ANUAL a la tercera columna.',
        'columna',
        shape,
      );
    }
    if (!third.alias.explicit) {
      return incorrect(
        'El pedido exige escribir AS antes del alias PROYECCION_ANUAL.',
        'semantica',
        shape,
      );
    }
    if (third.alias.header !== 'PROYECCION_ANUAL') {
      return incorrect(
        `El encabezado de la tercera columna debe ser PROYECCION_ANUAL, no ${third.alias.header}.`,
        'columna',
        shape,
      );
    }
    const named = 'Las columnas, el cálculo y el alias PROYECCION_ANUAL están bien.';
    if (!statement.where) {
      return incorrect(
        'El pedido es solo para los empleados activos de Bogotá o Cali: falta la condición que filtra las filas.',
        'condicion',
        named,
      );
    }
    if (!statement.orderBy) {
      return incorrect(
        'El pedido indica un orden, de la proyección más alta a la más baja: falta ordenar el resultado.',
        'resultado',
        named,
      );
    }
    return { kind: 'requires-execution', statement: renderStatement(statement) };
  },
  gradeExecution: (result) => {
    const comparison = compareResults(result, m10Expected);
    if (!comparison.equal) {
      if (comparison.difference === 'columns') {
        return incorrect(
          `Oracle devolvió las columnas ${result.columns.join(', ')}; el pedido es NOMBRE, CIUDAD, PROYECCION_ANUAL.`,
          'columna',
          'La consulta se ejecutó en Oracle sin errores.',
        );
      }
      if (comparison.difference === 'row-count') {
        return incorrect(
          `Oracle devolvió ${result.rows.length} filas; los empleados activos de Bogotá o Cali son ${m10Expected.rows.length}. Revisa las condiciones y cómo las unes: AND se evalúa antes que OR.`,
          'condicion',
          'Oracle ejecutó la consulta y las columnas son las pedidas.',
        );
      }
      return incorrect(
        'La consulta se ejecutó, pero los valores no corresponden al salario anual tras sumar 100000 cada mes.',
        'operador',
        'Las columnas y las filas son las pedidas.',
      );
    }
    return orderOutcome(
      null,
      result,
      'PROYECCION_ANUAL',
      'DESC',
      `Correcto: Oracle devolvió los ${m10Expected.rows.length} empleados activos de Bogotá o Cali con NOMBRE, CIUDAD y PROYECCION_ANUAL, de mayor a menor.`,
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
