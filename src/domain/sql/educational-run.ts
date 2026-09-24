import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { analyzeSql, type SqlAnalysis } from './analyzer';
import type { SqlDiagnostic } from './diagnostics';
import { evaluateStatement, type EducationalResult } from './evaluator';

/**
 * Análisis y evaluación educativa en un solo paso: la referencia semántica que comparten
 * el laboratorio (vista previa) y las rúbricas del Challenge. No es una ejecución en Oracle.
 */
export interface EducationalRun {
  readonly analysis: SqlAnalysis;
  readonly result: EducationalResult | null;
  readonly runtimeError: SqlDiagnostic | null;
}

export function runEducational(source: string): EducationalRun {
  const analysis = analyzeSql(source);
  if (!analysis.ok || !analysis.statement) return { analysis, result: null, runtimeError: null };
  const evaluation = evaluateStatement(analysis.statement, source, EMPLEADOS_DATASET);
  return evaluation.ok
    ? { analysis, result: evaluation.result, runtimeError: null }
    : { analysis, result: null, runtimeError: evaluation.diagnostic };
}
