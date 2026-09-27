import type { DiagnosticCategory, DiagnosticCode, SqlDiagnostic } from '@/domain/sql/diagnostics';
import type { FeedbackCategory } from '../types';

/**
 * Tipo de error pedagógico de un diagnóstico del motor SQL compartido. Solo clasifica el
 * mensaje para el feedback del Challenge; no cambia la corrección.
 */

const BY_CODE: Partial<Record<DiagnosticCode, FeedbackCategory>> = {
  'missing-select': 'orden',
  'misplaced-keyword': 'orden',
  'misplaced-clause': 'orden',
  'missing-from': 'sintaxis',
  'missing-table': 'sintaxis',
  'missing-by': 'sintaxis',
  'empty-select-list': 'columna',
  'missing-item': 'columna',
  'missing-item-after-comma': 'columna',
  'missing-comma': 'columna',
  'possible-missing-comma': 'columna',
  'star-mixed': 'columna',
  'star-alias': 'columna',
  'unknown-column': 'columna',
  'table-as-column': 'columna',
  'quoted-column': 'columna',
  'missing-order-item': 'columna',
  'order-by-not-selected': 'columna',
  'missing-condition': 'condicion',
  'missing-comparison': 'condicion',
  'chained-comparison': 'condicion',
  'alias-in-where': 'condicion',
  'comparison-in-select': 'condicion',
  'contradictory-and': 'condicion',
  'never-null': 'condicion',
  'and-or-precedence': 'condicion',
  'invalid-operator': 'operador',
  'missing-logical-operator': 'operador',
  'missing-between-and': 'operador',
  'between-reversed': 'operador',
  'in-without-parentheses': 'operador',
  'empty-in-list': 'operador',
  'in-null': 'operador',
  'not-in-null': 'operador',
  'like-unquoted-pattern': 'operador',
  'like-without-wildcard': 'operador',
  'like-on-number': 'operador',
  'equals-null': 'operador',
  'missing-null': 'operador',
  'text-arithmetic': 'operador',
  'statement-not-allowed': 'alcance',
  'multiple-statements': 'alcance',
  'out-of-scope': 'alcance',
};

const BY_CATEGORY: Record<DiagnosticCategory, FeedbackCategory> = {
  syntax: 'sintaxis',
  identifier: 'columna',
  table: 'sintaxis',
  alias: 'columna',
  scope: 'alcance',
  security: 'alcance',
  limit: 'alcance',
  operation: 'operador',
  oracle: 'sintaxis',
  semantic: 'semantica',
};

export function feedbackCategoryOf(item: SqlDiagnostic): FeedbackCategory {
  return BY_CODE[item.code] ?? BY_CATEGORY[item.category];
}
