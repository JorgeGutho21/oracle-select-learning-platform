import {
  EMPLEADOS_COLUMNS,
  EMPLEADOS_DATASET,
  isEmpleadosColumn,
} from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  normalizeIdentifier,
  projectRows,
  sameRowMultiset,
  type ResultTable,
} from '@/domain/results/result-table';
import { evaluateExpression, parseExpression, referencesColumn } from '../expression';
import type {
  AnswerFor,
  AnyMissionPrivate,
  EvaluationOutcome,
  InteractionType,
  MissionId,
  MissionPrivate,
} from '../types';

/**
 * PRIVADO. Rúbricas, pistas y explicaciones de GAME_SPEC.md. Solo debe componerse en el
 * servicio de corrección; nunca importarse desde aplicación ni presentación.
 * Los resultados esperados se derivan del dataset canónico, sin copiar sus registros.
 */

const correct = (feedback: string): EvaluationOutcome => ({ kind: 'correct', feedback });
const incorrect = (feedback: string): EvaluationOutcome => ({ kind: 'incorrect', feedback });
const invalid = (message: string): EvaluationOutcome => ({ kind: 'invalid-input', message });

const rows = EMPLEADOS_DATASET.rows;
const text = (table: ResultTable) => table.rows.map((row) => row.map(String));

function withoutOptionalEnd(
  ids: readonly string[],
  optional: readonly string[],
): readonly string[] {
  const last = ids.at(-1);
  return last !== undefined && optional.includes(last) ? ids.slice(0, -1) : ids;
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return sameSequence([...left].sort(), [...right].sort());
}

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

/* ---------- M01 ---------- */
const m01Expected = projectRows(rows, ['NOMBRE', 'SALARIO']);

const m01 = define('M01', 'drag-column', {
  hint: 'El pedido menciona dos datos de cada empleado.',
  explanation:
    'SELECT nombre, salario FROM empleados; proyecta dos columnas en ese orden para los seis empleados. Las columnas restantes siguen en la tabla fuente.',
  validate: ({ columns }) => {
    if (columns.length === 0) return invalid('Elige al menos una columna antes de ejecutar.');
    const names = columns.map(normalizeIdentifier);
    if (names.includes('*'))
      return incorrect('El asterisco muestra todas las columnas; el pedido solo pide dos.');
    const unknown = names.find((name) => !isEmpleadosColumn(name));
    if (unknown) return incorrect(`${unknown} no pertenece a EMPLEADOS.`);
    const result = compareResults(projectRows(rows, names.filter(isEmpleadosColumn)), m01Expected);
    if (result.equal)
      return correct('Seis empleados con NOMBRE y SALARIO. Ana aparece con 3000000.');
    if (sameMembers(names, m01Expected.columns))
      return incorrect(
        'Las columnas son correctas, pero el orden pedido es NOMBRE y después SALARIO.',
      );
    if (names.length > 2)
      return incorrect('Sobran columnas: incluir ID u otros datos no cumple el pedido.');
    return incorrect('Falta alguno de los dos datos pedidos.');
  },
});

/* ---------- M02 ---------- */
const m02Solution = [
  'm02-select',
  'm02-ciudad',
  'm02-comma',
  'm02-nombre',
  'm02-from',
  'm02-empleados',
];

const m02 = define('M02', 'reorder-sql', {
  hint: 'Primero indica qué mostrar y después de dónde.',
  explanation:
    'SELECT ciudad, nombre FROM empleados; primero enumera las columnas en el orden pedido y después FROM indica la tabla de origen.',
  validate: ({ pieceIds }) => {
    if (pieceIds.length === 0) return invalid('Coloca las piezas antes de comprobar.');
    const ordered = withoutOptionalEnd(pieceIds, ['m02-end']);
    if (sameSequence(ordered, m02Solution))
      return correct('Cláusulas y columnas en el orden correcto.');
    if (ordered.length < m02Solution.length)
      return incorrect('Faltan piezas para completar la consulta.');
    const fromIndex = ordered.indexOf('m02-from');
    const afterFrom = ordered[fromIndex + 1];
    if (afterFrom === 'm02-ciudad' || afterFrom === 'm02-nombre') {
      return incorrect('FROM recibe el nombre de la tabla, no una columna.');
    }
    if (ordered[0] !== 'm02-select') return incorrect('La consulta comienza con SELECT.');
    return incorrect('Reuniste las piezas, pero el orden no produce CIUDAD y después NOMBRE.');
  },
});

/* ---------- M03 ---------- */
const m03 = define('M03', 'predict-result', {
  hint: 'Observa el esquema; no cuentes solo las columnas más llamativas.',
  explanation: `SELECT * expande todas las columnas visibles del dataset: ${EMPLEADOS_COLUMNS.join(', ')}, con ${rows.length} filas.`,
  validate: ({ headers, rowCount }) => {
    if (headers.length === 0 && rowCount === null)
      return invalid('Construye los encabezados e indica el número de filas.');
    const names = headers.map(normalizeIdentifier);
    if (names.includes('*'))
      return incorrect('El asterisco no es una columna: se expande en las columnas del esquema.');
    const headersOk = sameSequence(names, EMPLEADOS_COLUMNS);
    const countOk = rowCount === rows.length;
    if (headersOk && countOk)
      return correct('Seis encabezados en el orden del esquema y seis filas.');
    if (!headersOk && sameMembers(names, EMPLEADOS_COLUMNS))
      return incorrect('Están todas las columnas, pero no en el orden del esquema.');
    if (!headersOk)
      return incorrect('Revisa los encabezados: * devuelve cada columna del esquema.');
    return incorrect('Los encabezados son correctos; revisa cuántas filas tiene EMPLEADOS.');
  },
});

/* ---------- M04 ---------- */
const m04Expected = projectRows(rows, ['CIUDAD']);

const m04 = define('M04', 'predict-result', {
  hint: 'Hay una fila de resultado por empleado.',
  explanation:
    'SELECT ciudad FROM empleados; devuelve una fila por empleado: Bogotá tres veces, Cali dos y Medellín una. Elegir menos columnas no elimina duplicados.',
  validate: ({ headers, rows: answerRows }) => {
    if (headers.length === 0 && answerRows.length === 0)
      return invalid('Construye el encabezado y las filas del resultado.');
    const result = compareResults(
      { columns: headers, rows: answerRows },
      { columns: m04Expected.columns, rows: text(m04Expected) },
    );
    if (result.equal)
      return correct('Seis valores, con las ciudades repetidas tal como aparecen en la tabla.');
    if (result.difference === 'columns')
      return incorrect('El resultado tiene una sola columna: CIUDAD.');
    if (sameRowMultiset(answerRows, text(distinctRows(m04Expected)))) {
      return incorrect('Eliminaste repeticiones, pero la consulta no usa DISTINCT.');
    }
    return incorrect('Revisa cuántas veces aparece cada ciudad: hay una fila por empleado.');
  },
});

/* ---------- M05 ---------- */
const m05Tokens: Readonly<Record<string, string>> = {
  'm05-salario': 'salario',
  'm05-100000': '100000',
  'm05-12': '12',
  'm05-plus': '+',
  'm05-times': '*',
  'm05-open': '(',
  'm05-close': ')',
};
const m05Reference = parseExpression(['(', 'salario', '+', '100000', ')', '*', '12']);
const m05Target = rows.find((row) => row.NOMBRE === 'Ana');

function m05Values(node: Parameters<typeof evaluateExpression>[0]): number[] | null {
  const values: number[] = [];
  for (const row of rows) {
    const result = evaluateExpression(node, row);
    if (!result.ok) return null;
    values.push(result.value);
  }
  return values;
}

const m05 = define('M05', 'expression-builder', {
  hint: 'El incremento también se aplica durante doce meses.',
  explanation:
    '(salario + 100000) * 12 suma primero el incremento y después anualiza: Ana obtiene 37200000. Sin paréntesis, salario + 100000 * 12 da 4200000 porque la multiplicación va primero.',
  validate: ({ pieceIds, value }) => {
    if (pieceIds.length === 0 && value === null)
      return invalid('Construye la expresión y escribe el resultado para Ana.');
    if (!m05Reference.ok || !m05Target) throw new Error('Referencia de M05 inválida.');
    const tokens = pieceIds.map((id) => m05Tokens[id]);
    if (tokens.some((token) => token === undefined))
      return incorrect('La expresión contiene piezas no disponibles.');
    const parsed = parseExpression(tokens as string[]);
    if (!parsed.ok) return incorrect('La expresión está incompleta o tiene paréntesis sin cerrar.');
    if (!referencesColumn(parsed.node, 'SALARIO'))
      return incorrect('El cálculo debe partir de la columna SALARIO.');
    const expected = m05Values(m05Reference.node);
    const actual = m05Values(parsed.node);
    const anaExpected = evaluateExpression(m05Reference.node, m05Target);
    const expressionOk =
      expected !== null &&
      actual !== null &&
      sameSequence(actual.map(String), expected.map(String));
    const valueOk = anaExpected.ok && value === anaExpected.value;
    if (expressionOk && valueOk) return correct('Expresión correcta: Ana obtiene 37200000.');
    const withoutParentheses = parseExpression(['salario', '+', '100000', '*', '12']);
    if (
      withoutParentheses.ok &&
      actual &&
      sameSequence(actual.map(String), (m05Values(withoutParentheses.node) ?? []).map(String))
    ) {
      return incorrect(
        'Sin paréntesis se multiplica primero 100000 × 12: los paréntesis cambian la operación que se realiza primero.',
      );
    }
    if (expressionOk)
      return incorrect('La expresión es correcta; revisa el valor calculado para Ana.');
    return incorrect('La expresión no produce el salario anual con el incremento.');
  },
});

/* ---------- M06 ---------- */
const m06Solution = [
  'm06-select',
  'm06-nombre',
  'm06-comma',
  'm06-expr',
  'm06-as',
  'm06-from',
  'm06-empleados',
];

const m06 = define('M06', 'alias-builder', {
  hint: 'La etiqueta va después de aquello que describe.',
  explanation:
    'SELECT nombre, salario * 12 AS salario_anual FROM empleados; etiqueta la expresión calculada. La columna original sigue llamándose SALARIO en la tabla.',
  validate: ({ pieceIds, labeledColumnIndex }) => {
    if (pieceIds.length === 0 && labeledColumnIndex === null)
      return invalid('Coloca el alias y asigna la etiqueta.');
    const aliasAt = pieceIds.indexOf('m06-as');
    const before = pieceIds[aliasAt - 1];
    if (aliasAt === -1) return incorrect('Falta el bloque AS salario_anual.');
    if (before === 'm06-nombre')
      return incorrect('El alias quedó junto a NOMBRE: la etiqueta describe la columna calculada.');
    if (before === 'm06-empleados')
      return incorrect('El alias quedó tras la tabla: debe nombrar la expresión salario * 12.');
    if (!sameSequence(pieceIds, m06Solution))
      return incorrect('El orden de las piezas no forma la consulta pedida.');
    if (labeledColumnIndex !== 1)
      return incorrect('La etiqueta corresponde al encabezado de la columna calculada.');
    return correct(
      'El alias SALARIO_ANUAL describe la expresión y los valores anuales no cambian.',
    );
  },
});

/* ---------- M07 ---------- */
const m07Projection = projectRows(rows, ['CIUDAD', 'DEPTO']);
const m07Expected = text(distinctRows(m07Projection));

const m07 = define('M07', 'distinct-result', {
  hint: 'Compara toda la fila que saldrá, no únicamente CIUDAD.',
  explanation: `DISTINCT compara la combinación completa: quedan ${m07Expected.length} pares. Bogotá/Sistemas aparece una vez aunque lo comparten dos empleados.`,
  validate: ({ rows: answerRows }) => {
    if (answerRows.length === 0) return invalid('Construye las filas del resultado.');
    if (sameRowMultiset(answerRows, m07Expected))
      return correct('Pares únicos correctos: el orden de las filas no importa.');
    if (sameRowMultiset(answerRows, text(m07Projection)))
      return incorrect('Quedan filas idénticas repetidas: DISTINCT las retira.');
    const citiesKept = new Set(answerRows.map((row) => row[0])).size === answerRows.length;
    if (citiesKept && answerRows.length < m07Expected.length) {
      return incorrect('Dos filas con igual ciudad y diferente departamento son distintas.');
    }
    return incorrect(
      'Revisa los pares: cada combinación distinta de ciudad y departamento aparece una vez.',
    );
  },
});

/* ---------- M08 ---------- */
const M08_FAULT_INDEX = 8;
const m08Accepted = [
  ['SELECT', 'NOMBRE', ',', 'SALARIO', '*', '12', 'AS', 'SALARIO_ANUAL', 'FROM', 'EMPLEADOS'],
  ['SELECT', 'NOMBRE', ',', '12', '*', 'SALARIO', 'AS', 'SALARIO_ANUAL', 'FROM', 'EMPLEADOS'],
];

const m08 = define('M08', 'hotspot-error', {
  hint: 'Una coma anuncia otro elemento de la lista.',
  explanation:
    'La coma anterior a FROM anuncia una columna que no existe. Al retirarla queda SELECT nombre, salario * 12 AS salario_anual FROM empleados;, que cumple el pedido.',
  validate: ({ selectedTokenIndex, repairedTokens }) => {
    if (selectedTokenIndex === null && repairedTokens.length === 0)
      return invalid('Selecciona el error y repara la consulta.');
    if (selectedTokenIndex !== M08_FAULT_INDEX)
      return incorrect('Ese elemento no provoca el error. Revisa lo que hay justo antes de FROM.');
    const repaired = withoutOptionalEnd(repairedTokens.map(normalizeIdentifier), [';']);
    if (m08Accepted.some((accepted) => sameSequence(repaired, accepted))) {
      return correct('Error localizado y consulta reparada con nombre y salario anual.');
    }
    if (!repaired.includes('SALARIO') || !repaired.includes('AS')) {
      return incorrect(
        'La consulta puede ser válida, pero ya no cumple el pedido: faltan el salario anual o su alias.',
      );
    }
    return incorrect('La consulta todavía no está reparada.');
  },
});

/* ---------- M09 ---------- */
const m09Solution = [
  'm09-select',
  'm09-distinct',
  'm09-ciudad',
  'm09-as-ciudad',
  'm09-comma',
  'm09-depto',
  'm09-as-depto',
  'm09-from',
  'm09-empleados',
];

const m09 = define('M09', 'build-query', {
  hint: 'Forma primero la lista de salida y después identifica cuáles filas son repetidas.',
  explanation: `SELECT DISTINCT ciudad AS ciudad_origen, depto AS departamento FROM empleados; devuelve ${m07Expected.length} filas. Los alias no cambian la regla de comparación de valores.`,
  validate: ({ pieceIds, rowCount }) => {
    if (pieceIds.length === 0 && rowCount === null)
      return invalid('Reconstruye la consulta e indica el número de filas.');
    const ordered = withoutOptionalEnd(pieceIds, ['m09-end']);
    if (ordered.includes('m09-distinct') && ordered.indexOf('m09-distinct') !== 1) {
      return incorrect('DISTINCT va inmediatamente después de SELECT.');
    }
    const cityAlias = ordered[ordered.indexOf('m09-as-ciudad') - 1];
    const deptAlias = ordered[ordered.indexOf('m09-as-depto') - 1];
    if (cityAlias === 'm09-depto' || deptAlias === 'm09-ciudad')
      return incorrect('Cada alias va después de la columna que describe.');
    if (!sameSequence(ordered, m09Solution))
      return incorrect('La consulta no produce los encabezados en el orden pedido.');
    if (rowCount !== m07Expected.length)
      return incorrect('La consulta es correcta; revisa cuántas combinaciones distintas quedan.');
    return correct('DISTINCT y alias en su lugar, con la predicción de filas correcta.');
  },
});

/* ---------- M10 ---------- */
const m10 = define('M10', 'write-query', {
  hint: 'Calcula primero el nuevo salario mensual.',
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
