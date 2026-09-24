import type { Span } from './source';

/** Árbol sintáctico del subconjunto SELECT v1. Cada nodo conserva su tramo en el texto. */

export type BinaryOperator = '+' | '-' | '*' | '/';

export type Expression =
  | {
      readonly kind: 'column';
      readonly name: string;
      readonly raw: string;
      readonly quoted: boolean;
      readonly span: Span;
    }
  | { readonly kind: 'number'; readonly raw: string; readonly value: number; readonly span: Span }
  | {
      readonly kind: 'unary';
      readonly operator: '+' | '-';
      readonly operand: Expression;
      readonly span: Span;
    }
  | {
      readonly kind: 'binary';
      readonly operator: BinaryOperator;
      readonly left: Expression;
      readonly right: Expression;
      readonly span: Span;
    }
  | { readonly kind: 'group'; readonly expression: Expression; readonly span: Span };

export interface Alias {
  /** Texto escrito, sin comillas. */
  readonly raw: string;
  /** Encabezado resultante: mayúsculas si no lleva comillas; literal si las lleva. */
  readonly header: string;
  readonly quoted: boolean;
  /** `AS` escrito explícitamente. */
  readonly explicit: boolean;
  readonly span: Span;
  readonly keywordSpan: Span | null;
}

export type SelectItem =
  | { readonly kind: 'star'; readonly span: Span }
  | {
      readonly kind: 'expression';
      readonly expression: Expression;
      readonly alias: Alias | null;
      readonly span: Span;
    };

export interface SelectStatement {
  readonly kind: 'select';
  readonly selectKeyword: Span;
  readonly distinct: Span | null;
  readonly items: readonly SelectItem[];
  readonly commas: readonly Span[];
  readonly fromKeyword: Span;
  readonly table: { readonly name: string; readonly raw: string; readonly span: Span };
  readonly terminator: Span | null;
  readonly span: Span;
}

/** Recorre una expresión en orden. */
export function* walkExpression(expression: Expression): Generator<Expression> {
  yield expression;
  switch (expression.kind) {
    case 'unary':
      yield* walkExpression(expression.operand);
      break;
    case 'binary':
      yield* walkExpression(expression.left);
      yield* walkExpression(expression.right);
      break;
    case 'group':
      yield* walkExpression(expression.expression);
      break;
  }
}

export function referencedColumns(expression: Expression): string[] {
  return [...walkExpression(expression)]
    .filter((node) => node.kind === 'column')
    .map((node) => (node as { name: string }).name);
}
