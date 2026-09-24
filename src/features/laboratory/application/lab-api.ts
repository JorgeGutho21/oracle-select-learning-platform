import { EMPLEADOS_DATASET, type CellValue } from '@/domain/dataset/empleados';
import { sourceColumns } from '@/domain/sql/analyzer';
import { describeAnatomy, type AnatomyPart } from '@/domain/sql/anatomy';
import type { DiagnosticCategory } from '@/domain/sql/diagnostics';
import { runEducational } from '@/domain/sql/educational-run';
import type { ResultColumn } from '@/domain/sql/evaluator';
import { renderStatement } from '@/domain/sql/render';
import { translateStatement, type Translation } from '@/domain/sql/translator';

/**
 * Superficie del laboratorio para presentación. `analyzeLabQuery` es el análisis
 * educativo (sintaxis, anatomía, traducción y vista previa sobre el dataset); la
 * ejecución real en Oracle es una operación distinta (`executeOnOracle`).
 */

export type { AnatomyPart, AnatomyRole } from '@/domain/sql/anatomy';
export type { Translation } from '@/domain/sql/translator';
export type { ResultColumn } from '@/domain/sql/evaluator';
export type { EmpleadoRow, EmpleadosColumn } from '@/domain/dataset/empleados';
export type { OracleExecutionResult, OracleServiceStatus } from '@/application/oracle-executor';
export { DEFAULT_LAB_SQL, LAB_EXAMPLES, type LabExample } from '../domain/examples';

export const EMPLEADOS = EMPLEADOS_DATASET;

export interface LabDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly category: DiagnosticCategory;
  readonly message: string;
  readonly hint: string | null;
  readonly line: number;
  readonly column: number;
  readonly from: number;
  readonly to: number;
}

export interface LabAnalysis {
  readonly source: string;
  readonly status: 'valid' | 'invalid';
  readonly diagnostics: readonly LabDiagnostic[];
  readonly anatomy: readonly AnatomyPart[];
  readonly translation: Translation | null;
  readonly sourceColumns: readonly string[];
  /** Vista previa educativa calculada sobre el dataset; nunca una ejecución en Oracle. */
  readonly preview: {
    readonly datasetId: string;
    readonly columns: readonly ResultColumn[];
    readonly rows: readonly (readonly CellValue[])[];
  } | null;
  /** Sentencia canónica que se enviaría al servicio Oracle. */
  readonly canonicalSql: string | null;
}

export function analyzeLabQuery(source: string): LabAnalysis {
  const run = runEducational(source);
  const { analysis } = run;
  const diagnostics = [
    ...analysis.diagnostics,
    ...(run.runtimeError ? [run.runtimeError] : []),
  ].map((item): LabDiagnostic => ({
    severity: item.severity,
    category: item.category,
    message: item.message,
    hint: item.hint,
    line: item.line,
    column: item.column,
    from: item.span.start,
    to: item.span.end,
  }));
  const statement = analysis.ok ? analysis.statement : null;
  return {
    source,
    status: statement && run.result ? 'valid' : 'invalid',
    diagnostics,
    anatomy: statement ? describeAnatomy(statement, source) : [],
    translation: statement ? translateStatement(statement, EMPLEADOS_DATASET.rows.length) : null,
    sourceColumns: statement ? sourceColumns(statement) : [],
    preview: run.result
      ? {
          datasetId: EMPLEADOS_DATASET.id,
          columns: run.result.columns,
          rows: run.result.table.rows,
        }
      : null,
    canonicalSql: statement ? renderStatement(statement) : null,
  };
}
