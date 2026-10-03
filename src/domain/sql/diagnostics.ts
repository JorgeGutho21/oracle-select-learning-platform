import type { FutureFeature } from './keywords';
import { positionAt, type Span } from './source';

/**
 * Diagnósticos pedagógicos (LAB_SPEC, «Errores y mensajes»). Se detectan antes del motor,
 * tienen códigos propios y nunca imitan un código ORA; cuando describen una regla de Oracle,
 * lo dicen en el texto.
 */

export type DiagnosticCategory =
  | 'syntax'
  | 'identifier'
  | 'table'
  | 'alias'
  | 'scope'
  | 'security'
  | 'limit'
  | 'operation'
  /** Regla propia de Oracle que el motor educativo comprueba antes de ejecutar. */
  | 'oracle'
  /** Consulta válida cuyo resultado probablemente no es el que se buscaba. */
  | 'semantic';

export type DiagnosticCode =
  | 'empty'
  | 'too-long'
  | 'too-many-tokens'
  | 'too-many-items'
  | 'too-deep'
  | 'invalid-character'
  | 'unterminated-quote'
  | 'missing-select'
  | 'statement-not-allowed'
  | 'multiple-statements'
  | 'empty-select-list'
  | 'missing-item'
  | 'missing-item-after-comma'
  | 'missing-comma'
  | 'star-mixed'
  | 'star-alias'
  | 'incomplete-expression'
  | 'unbalanced-parentheses'
  | 'misplaced-keyword'
  | 'misplaced-clause'
  | 'unexpected-token'
  | 'missing-from'
  | 'missing-table'
  | 'unknown-table'
  | 'column-as-table'
  | 'table-alias'
  | 'out-of-scope'
  | 'unknown-column'
  | 'table-as-column'
  | 'quoted-column'
  | 'text-arithmetic'
  | 'invalid-alias'
  | 'number-format'
  | 'implicit-alias'
  | 'possible-missing-comma'
  | 'division-by-zero'
  | 'comparison-in-select'
  | 'missing-condition'
  | 'missing-comparison'
  | 'missing-logical-operator'
  | 'chained-comparison'
  | 'invalid-operator'
  | 'missing-between-and'
  | 'in-without-parentheses'
  | 'empty-in-list'
  | 'like-unquoted-pattern'
  | 'missing-null'
  | 'missing-by'
  | 'missing-order-item'
  | 'unquoted-text'
  | 'double-quoted-text'
  | 'invalid-date'
  | 'type-mismatch'
  | 'date-text-comparison'
  | 'date-arithmetic'
  | 'alias-in-where'
  | 'order-by-not-selected'
  | 'order-position'
  | 'ambiguous-order'
  | 'equals-null'
  | 'between-reversed'
  | 'in-null'
  | 'not-in-null'
  | 'like-without-wildcard'
  | 'like-on-number'
  | 'and-or-precedence'
  | 'implicit-conversion'
  | 'never-null'
  | 'unaliased-literal'
  | 'text-case'
  | 'contradictory-and';

/** Corrección posible: reemplazar el tramo por el texto indicado. */
export interface DiagnosticFix {
  readonly span: Span;
  readonly text: string;
}

export interface SqlDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly category: DiagnosticCategory;
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly hint: string | null;
  readonly span: Span;
  readonly line: number;
  readonly column: number;
  readonly fix: DiagnosticFix | null;
  /** Construcción de un nivel futuro que motivó el diagnóstico. */
  readonly future: FutureFeature | null;
}

export function diagnostic(
  source: string,
  input: {
    code: DiagnosticCode;
    category: DiagnosticCategory;
    message: string;
    span: Span;
    hint?: string;
    severity?: 'error' | 'warning';
    fix?: DiagnosticFix;
    future?: FutureFeature;
  },
): SqlDiagnostic {
  const { line, column } = positionAt(source, input.span.start);
  return {
    severity: input.severity ?? 'error',
    category: input.category,
    code: input.code,
    message: input.message,
    hint: input.hint ?? null,
    span: input.span,
    line,
    column,
    fix: input.fix ?? null,
    future: input.future ?? null,
  };
}

/** Mensaje completo para feedback de texto: explicación y, si existe, sugerencia. */
export function describeDiagnostic(item: SqlDiagnostic): string {
  return item.hint ? `${item.message} ${item.hint}` : item.message;
}

/** Aplica una corrección al texto fuente. */
export function applyFix(source: string, fix: DiagnosticFix): string {
  return `${source.slice(0, fix.span.start)}${fix.text}${source.slice(fix.span.end)}`;
}

/**
 * Mensaje de alcance: la construcción es válida en Oracle y la plataforma la enseña después.
 * Nunca afirma que no exista.
 */
export function futureMessage(feature: FutureFeature): string {
  const where =
    feature.level === null
      ? 'se estudia en un nivel posterior de esta plataforma'
      : `se estudia en el Nivel ${feature.level} de esta plataforma`;
  const more = feature.topic ? ' Puedes consultar su explicación en Próximamente.' : '';
  return `${feature.label} es SQL válido en Oracle, pero ${where}.${more}`;
}
