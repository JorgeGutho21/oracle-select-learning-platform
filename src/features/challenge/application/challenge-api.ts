import { EMPLEADOS_DATASET, type EducationalDataset } from '@/domain/dataset/empleados';
import { analyzeExpression, analyzeSql, conditionColumns } from '@/domain/sql/analyzer';
import type { Expression } from '@/domain/sql/ast';
import { runEducational } from '@/domain/sql/educational-run';
import type { ErrorVariant, HotspotErrorData } from '../domain/types';
import { PUBLIC_MISSIONS } from '../domain/missions/public-catalog';
import { GAME_SPEC_SCORING_POLICY } from '../domain/scoring';

/**
 * Superficie pública del Challenge para presentación: tipos, lectura del estado y
 * ayudas visuales sin rúbricas. Presentación no importa dominio ni infraestructura.
 */

export type { ChallengeResult, MissionResult } from '../domain/challenge-result';
export type {
  Attempt,
  ChallengeState,
  HintUsage,
  MissionState,
  MissionStatus,
} from '../domain/challenge-state';
export type { ScoreBreakdown } from '../domain/scoring';
export type {
  AnswerFor,
  AnyPublicMission,
  ClaimAnswer,
  Difficulty,
  ErrorKind,
  ErrorVariant,
  EvaluationOutcome,
  FeedbackCategory,
  InteractionType,
  MissionAnswer,
  MissionId,
  Piece,
  Prediction,
  PublicDataFor,
  PublicMission,
} from '../domain/types';
export type {
  ChallengeEngine,
  HintResult,
  PersistenceStatus,
  RestoreStatus,
  SubmitResult,
} from './challenge-engine';
export type { EmpleadoRow, EmpleadosColumn } from '@/domain/dataset/empleados';
export { elapsedMs, getMission, isClosed, scoredAttempts } from '../domain/challenge-state';

export const EMPLEADOS = EMPLEADOS_DATASET;

/** Resultado de una consulta pública sobre EMPLEADOS, limitado a sus primeras filas. */
export interface ResultPreview {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly (string | number | null)[])[];
  readonly total: number;
}

/**
 * Vista previa del resultado de una consulta que la misión ya muestra (por ejemplo, la
 * consulta con error de M08). Describe lo que devuelve; no corrige nada.
 */
export function previewResult(sql: string, limit: number): ResultPreview | null {
  const table = runEducational(sql).result?.table;
  if (!table) return null;
  return { columns: table.columns, rows: table.rows.slice(0, limit), total: table.rows.length };
}

/** EMPLEADOS reducida a los registros de una muestra de trabajo, en el orden de la tabla. */
function sampleDataset(sampleIds: readonly number[]): EducationalDataset {
  return {
    ...EMPLEADOS_DATASET,
    rows: EMPLEADOS_DATASET.rows.filter((row) => sampleIds.includes(row.ID_EMPLEADO)),
  };
}

/** Resultado de una consulta sobre la muestra de trabajo, con las filas que conserva. */
export interface SampleResult extends ResultPreview {
  /** ID_EMPLEADO de las filas de la muestra que conserva WHERE. */
  readonly keptIds: readonly number[];
}

/**
 * Qué devuelve una consulta sobre la muestra de trabajo de una misión (las mismas filas que
 * ve el estudiante). Describe el resultado; no corrige nada. `null` si no es válida.
 */
export function sampleResult(sql: string, sampleIds: readonly number[]): SampleResult | null {
  const dataset = sampleDataset(sampleIds);
  const run = runEducational(sql, dataset);
  if (!run.result || run.analysis.errors.length > 0) return null;
  const table = run.result.table;
  return {
    columns: table.columns,
    rows: table.rows,
    total: table.rows.length,
    keptIds: run.result.trace.keptRows.map((index) => dataset.rows[index]!.ID_EMPLEADO),
  };
}

/** Tipo de una columna del resultado: el de EMPLEADOS o, si es calculada, el de sus valores. */
export function columnTypeOf(
  name: string,
  values: readonly (string | number | null)[],
): 'number' | 'text' | 'date' {
  const known = EMPLEADOS_DATASET.columns.find((column) => column.name === name);
  if (known) return known.type;
  return values.some((value) => typeof value === 'number') ? 'number' : 'text';
}

const STEP_MARKS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

/**
 * Orden en que Oracle calcula una expresión aritmética: cada paso con sus operandos (los
 * pasos anteriores se citan por su número). Muestra la precedencia sin calcular valores.
 * `null` si la expresión todavía no es válida.
 */
export function calculationSteps(text: string): readonly string[] | null {
  const { expression, errors } = analyzeExpression(text);
  if (!expression || errors.length > 0) return null;
  const steps: string[] = [];
  const visit = (node: Expression): string => {
    switch (node.kind) {
      case 'group':
        return visit(node.expression);
      case 'binary': {
        const left = visit(node.left);
        const right = visit(node.right);
        steps.push(`${left} ${node.operator} ${right}`);
        return STEP_MARKS[steps.length - 1] ?? `(${steps.length})`;
      }
      case 'unary':
        return `${node.operator}${visit(node.operand)}`;
      case 'column':
        return node.name.toLowerCase();
      case 'number':
        return node.raw;
      default:
        return 'valor';
    }
  };
  visit(expression);
  return steps;
}

/**
 * Variante de M08 que corresponde a una partida: se elige con la sesión, así que es estable
 * al recargar y distinta entre estudiantes.
 */
export function errorVariantFor(data: HotspotErrorData, seed: string): ErrorVariant {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return data.variants[hash % data.variants.length]!;
}

/** Consulta de una variante como se escribiría (sin espacios antes de comas ni tras «(»). */
export function variantSql(variant: ErrorVariant): string {
  return variant.tokens
    .join(' ')
    .replace(/ ([,;)])/g, '$1')
    .replace(/\( /g, '(');
}

/**
 * Filas de EMPLEADOS (ID_EMPLEADO) que conserva la consulta de la misión y columnas que usa
 * su condición. Solo se muestra cuando la misión ya está cerrada, para explicar el porqué.
 */
export function queryTrace(sql: string): {
  readonly keptIds: readonly number[];
  readonly whereColumns: readonly string[];
} {
  const run = runEducational(sql);
  const statement = run.analysis.statement;
  return {
    keptIds: (run.result?.trace.keptRows ?? []).map(
      (index) => EMPLEADOS_DATASET.rows[index]!.ID_EMPLEADO,
    ),
    whereColumns: statement ? [...new Set(conditionColumns(statement))] : [],
  };
}

export const PRACTICE_RULES = Object.freeze({
  maxScoredAttempts: GAME_SPEC_SCORING_POLICY.maxScoredAttempts,
  hintPenalty: GAME_SPEC_SCORING_POLICY.hintPenalty,
  attemptPenalty: GAME_SPEC_SCORING_POLICY.attemptPenalty,
  maxScorePerMission: GAME_SPEC_SCORING_POLICY.maxScorePerMission,
});

/**
 * Encabezados que mostraría una consulta armada con piezas, o `null` si aún no forma
 * una consulta válida. Solo describe la forma; la corrección la hace el evaluador.
 */
export function previewHeaders(pieceTexts: readonly string[]): readonly string[] | null {
  return runEducational(pieceTexts.join(' ')).result?.table.columns ?? null;
}

export interface SqlCheckItem {
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly hint: string | null;
  readonly line: number;
  readonly column: number;
  readonly from: number;
  readonly to: number;
}

/** Revisión sin puntuar de una consulta escrita (M10) con el motor SQL compartido. */
export function checkSql(sql: string): {
  readonly valid: boolean;
  readonly items: readonly SqlCheckItem[];
} {
  const analysis = analyzeSql(sql);
  return {
    valid: analysis.ok,
    items: analysis.diagnostics.map((item) => ({
      severity: item.severity,
      message: item.message,
      hint: item.hint,
      line: item.line,
      column: item.column,
      from: item.span.start,
      to: item.span.end,
    })),
  };
}

/** Recorrido público de las diez misiones (identificador, título y dificultad), sin rúbricas. */
export const MISSION_OVERVIEW: readonly {
  readonly id: string;
  readonly title: string;
  readonly difficulty: 'facil' | 'media' | 'dificil';
}[] = PUBLIC_MISSIONS.map(({ id, title, difficulty }) => ({ id, title, difficulty }));
