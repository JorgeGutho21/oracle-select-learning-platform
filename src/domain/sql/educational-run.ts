import { EMPLEADOS_DATASET, type EducationalDataset } from '@/domain/dataset/empleados';
import { analyzeSql, withDiagnostics, type SqlAnalysis } from './analyzer';
import { predicates, unwrap, type Condition, type SelectStatement } from './ast';
import { diagnostic, type SqlDiagnostic } from './diagnostics';
import { evaluateStatement, type EducationalResult } from './evaluator';
import { EMPLEADOS_SCHEMA, findColumn } from './schema';
import { likeMatches, looseLikeMatches, looseText } from './values';

/**
 * Análisis y evaluación educativa en un solo paso: la referencia semántica que comparten
 * el laboratorio (vista previa), el Estudio, la Exposición y las rúbricas del Challenge.
 * No es una ejecución en Oracle.
 */
export interface EducationalRun {
  readonly analysis: SqlAnalysis;
  readonly result: EducationalResult | null;
  readonly runtimeError: SqlDiagnostic | null;
}

export function runEducational(
  source: string,
  dataset: EducationalDataset = EMPLEADOS_DATASET,
): EducationalRun {
  const analysis = analyzeSql(source);
  if (!analysis.ok || !analysis.statement) return { analysis, result: null, runtimeError: null };
  const evaluation = evaluateStatement(analysis.statement, source, dataset);
  if (!evaluation.ok) return { analysis, result: null, runtimeError: evaluation.diagnostic };
  const hints = caseHints(analysis.statement, source, dataset);
  return {
    analysis: withDiagnostics(analysis, hints),
    result: evaluation.result,
    runtimeError: null,
  };
}

/**
 * Avisos cuando una condición de texto no encuentra nada por mayúsculas o tildes: Oracle
 * compara textos exactamente (`'bogota'` no es `'Bogotá'`; LIKE `'a%'` no encuentra «Ana»).
 */
function caseHints(
  statement: SelectStatement,
  source: string,
  dataset: EducationalDataset,
): SqlDiagnostic[] {
  if (!statement.where) return [];
  const found: SqlDiagnostic[] = [];
  for (const condition of predicates(statement.where.condition)) {
    const target = textTarget(condition);
    if (!target) continue;
    const values = dataset.rows
      .map((row) => row[target.column as keyof typeof row])
      .filter((value): value is string => typeof value === 'string');
    if (target.kind === 'equals') {
      if (values.includes(target.text)) continue;
      const loose = values.find((value) => looseText(value) === looseText(target.text));
      if (!loose) continue;
      found.push(
        diagnostic(source, {
          code: 'text-case',
          category: 'semantic',
          severity: 'warning',
          span: target.span,
          message: `Ningún valor de ${target.column} es exactamente '${target.text}': Oracle compara los textos letra por letra, con mayúsculas y tildes.`,
          hint: `En la tabla está escrito '${loose}'.`,
          fix: { span: target.span, text: `'${loose.replaceAll("'", "''")}'` },
        }),
      );
    } else {
      if (values.some((value) => likeMatches(value, target.text))) continue;
      const loose = values.filter((value) => looseLikeMatches(value, target.text));
      if (loose.length === 0) continue;
      found.push(
        diagnostic(source, {
          code: 'text-case',
          category: 'semantic',
          severity: 'warning',
          span: target.span,
          message: `Ningún valor de ${target.column} coincide con '${target.text}': LIKE distingue mayúsculas, minúsculas y tildes.`,
          hint: `Sin esa distinción coincidirían ${loose.length}, por ejemplo «${loose[0]}».`,
        }),
      );
    }
  }
  return found;
}

function textTarget(condition: Condition): {
  kind: 'equals' | 'like';
  column: string;
  text: string;
  span: { start: number; end: number };
} | null {
  const column = (expression: Parameters<typeof unwrap>[0]) => {
    const bare = unwrap(expression);
    return bare.kind === 'column' &&
      !bare.quoted &&
      findColumn(EMPLEADOS_SCHEMA, bare.name)?.type === 'text'
      ? bare.name
      : null;
  };
  if (condition.kind === 'comparison' && condition.operator === '=') {
    const left = column(condition.left);
    const right = unwrap(condition.right);
    if (left && right.kind === 'string' && right.value !== '') {
      return { kind: 'equals', column: left, text: right.value, span: right.span };
    }
  }
  if (condition.kind === 'like' && !condition.negated) {
    const left = column(condition.expression);
    const pattern = unwrap(condition.pattern);
    if (left && pattern.kind === 'string' && pattern.value !== '') {
      return { kind: 'like', column: left, text: pattern.value, span: pattern.span };
    }
  }
  return null;
}
