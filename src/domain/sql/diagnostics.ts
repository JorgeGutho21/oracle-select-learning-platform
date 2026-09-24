import { positionAt, type Span } from './source';

/**
 * Diagnósticos pedagógicos (LAB_SPEC, «Errores y mensajes»). Se detectan antes del motor,
 * tienen códigos propios y nunca imitan un código ORA.
 */

export type DiagnosticCategory =
  'syntax' | 'identifier' | 'table' | 'alias' | 'scope' | 'security' | 'limit' | 'operation';

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
  | 'division-by-zero';

export interface SqlDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly category: DiagnosticCategory;
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly hint: string | null;
  readonly span: Span;
  readonly line: number;
  readonly column: number;
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
  };
}

/** Mensaje completo para feedback de texto: explicación y, si existe, sugerencia. */
export function describeDiagnostic(item: SqlDiagnostic): string {
  return item.hint ? `${item.message} ${item.hint}` : item.message;
}
