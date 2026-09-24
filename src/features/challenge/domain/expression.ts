import type { CellValue } from '@/domain/dataset/empleados';
import { normalizeIdentifier } from '@/domain/results/result-table';

/**
 * Expresiones aritméticas construidas con piezas: columnas numéricas, números,
 * + - * / y paréntesis. Multiplicación y división preceden a suma y resta.
 * No es el analizador del subconjunto SELECT; solo evalúa expresiones de piezas.
 */

export type ExpressionNode =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'column'; readonly name: string }
  | {
      readonly kind: 'binary';
      readonly operator: '+' | '-' | '*' | '/';
      readonly left: ExpressionNode;
      readonly right: ExpressionNode;
    };

export type ParseResult =
  | { readonly ok: true; readonly node: ExpressionNode }
  | {
      readonly ok: false;
      readonly error: 'empty' | 'unexpected-token' | 'unbalanced' | 'incomplete';
    };

const NUMBER = /^\d{1,12}(?:\.\d{1,4})?$/;
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

export function parseExpression(tokens: readonly string[]): ParseResult {
  if (tokens.length === 0) return { ok: false, error: 'empty' };
  let position = 0;
  type Step = ExpressionNode | 'unexpected-token' | 'unbalanced' | 'incomplete';

  const primary = (): Step => {
    const token = tokens[position];
    if (token === undefined) return 'incomplete';
    if (token === '(') {
      position++;
      const inner = additive();
      if (typeof inner === 'string') return inner;
      if (tokens[position] !== ')') return 'unbalanced';
      position++;
      return inner;
    }
    if (NUMBER.test(token)) {
      position++;
      return { kind: 'number', value: Number(token) };
    }
    if (IDENTIFIER.test(token)) {
      position++;
      return { kind: 'column', name: normalizeIdentifier(token) };
    }
    return token === ')' ? 'unbalanced' : 'unexpected-token';
  };

  const binary = (next: () => Step, operators: readonly string[]) => (): Step => {
    let left = next();
    while (typeof left !== 'string') {
      const operator = tokens[position];
      if (operator === undefined || !operators.includes(operator)) break;
      position++;
      const right = next();
      if (typeof right === 'string') return right;
      left = { kind: 'binary', operator: operator as '+' | '-' | '*' | '/', left, right };
    }
    return left;
  };

  const multiplicative = binary(primary, ['*', '/']);
  const additive = binary(multiplicative, ['+', '-']);

  const node = additive();
  if (typeof node === 'string') return { ok: false, error: node };
  if (position < tokens.length)
    return { ok: false, error: tokens[position] === ')' ? 'unbalanced' : 'unexpected-token' };
  return { ok: true, node };
}

export type EvaluationResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: 'unknown-column' | 'not-numeric' | 'division-by-zero' };

export function evaluateExpression(
  node: ExpressionNode,
  row: Readonly<Record<string, CellValue>>,
): EvaluationResult {
  switch (node.kind) {
    case 'number':
      return { ok: true, value: node.value };
    case 'column': {
      if (!(node.name in row)) return { ok: false, error: 'unknown-column' };
      const value = row[node.name];
      return typeof value === 'number' ? { ok: true, value } : { ok: false, error: 'not-numeric' };
    }
    case 'binary': {
      const left = evaluateExpression(node.left, row);
      if (!left.ok) return left;
      const right = evaluateExpression(node.right, row);
      if (!right.ok) return right;
      if (node.operator === '/' && right.value === 0)
        return { ok: false, error: 'division-by-zero' };
      const value =
        node.operator === '+'
          ? left.value + right.value
          : node.operator === '-'
            ? left.value - right.value
            : node.operator === '*'
              ? left.value * right.value
              : left.value / right.value;
      return { ok: true, value };
    }
  }
}

export function referencesColumn(node: ExpressionNode, column: string): boolean {
  if (node.kind === 'column') return node.name === normalizeIdentifier(column);
  if (node.kind === 'binary')
    return referencesColumn(node.left, column) || referencesColumn(node.right, column);
  return false;
}
