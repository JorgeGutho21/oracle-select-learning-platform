import type { Span } from './source';

/** Árbol sintáctico del subconjunto SELECT v2. Cada nodo conserva su tramo en el texto. */

export type ArithmeticOperator = '+' | '-' | '*' | '/';
/** `||` concatena textos; en Oracle tiene la misma precedencia que `+` y `-`. */
export type BinaryOperator = ArithmeticOperator | '||';
export type ComparisonOperator = '=' | '<>' | '!=' | '^=' | '<' | '<=' | '>' | '>=';

export type Expression =
  | {
      readonly kind: 'column';
      readonly name: string;
      readonly raw: string;
      readonly quoted: boolean;
      readonly span: Span;
    }
  | { readonly kind: 'number'; readonly raw: string; readonly value: number; readonly span: Span }
  /** Literal de texto entre comillas simples; `value` ya sin comillas y con `''` resuelto. */
  | { readonly kind: 'string'; readonly raw: string; readonly value: string; readonly span: Span }
  | { readonly kind: 'null'; readonly span: Span }
  /** Literal de fecha ANSI `DATE 'AAAA-MM-DD'`. */
  | { readonly kind: 'date'; readonly raw: string; readonly value: string; readonly span: Span }
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

/** Condición de WHERE. Oracle evalúa NOT antes que AND, y AND antes que OR. */
export type Condition =
  | {
      readonly kind: 'comparison';
      readonly operator: ComparisonOperator;
      readonly left: Expression;
      readonly right: Expression;
      readonly operatorSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'between';
      readonly negated: boolean;
      readonly expression: Expression;
      readonly low: Expression;
      readonly high: Expression;
      readonly keywordSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'in';
      readonly negated: boolean;
      readonly expression: Expression;
      readonly values: readonly Expression[];
      readonly keywordSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'like';
      readonly negated: boolean;
      readonly expression: Expression;
      readonly pattern: Expression;
      readonly keywordSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'is-null';
      readonly negated: boolean;
      readonly expression: Expression;
      readonly keywordSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'logical';
      readonly operator: 'AND' | 'OR';
      readonly left: Condition;
      readonly right: Condition;
      readonly operatorSpan: Span;
      readonly span: Span;
    }
  | {
      readonly kind: 'not';
      readonly condition: Condition;
      readonly keywordSpan: Span;
      readonly span: Span;
    }
  | { readonly kind: 'condition-group'; readonly condition: Condition; readonly span: Span };

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

export interface OrderItem {
  readonly expression: Expression;
  readonly direction: 'ASC' | 'DESC' | null;
  readonly directionSpan: Span | null;
  readonly nulls: 'FIRST' | 'LAST' | null;
  readonly nullsSpan: Span | null;
  readonly span: Span;
}

export interface WhereClause {
  readonly keyword: Span;
  readonly condition: Condition;
}

export interface OrderByClause {
  /** Tramo de `ORDER BY`. */
  readonly keyword: Span;
  readonly items: readonly OrderItem[];
  readonly commas: readonly Span[];
}

export interface SelectStatement {
  readonly kind: 'select';
  readonly selectKeyword: Span;
  readonly distinct: Span | null;
  readonly items: readonly SelectItem[];
  readonly commas: readonly Span[];
  readonly fromKeyword: Span;
  readonly table: { readonly name: string; readonly raw: string; readonly span: Span };
  readonly where: WhereClause | null;
  readonly orderBy: OrderByClause | null;
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

/** Recorre una condición y sus subcondiciones en orden. */
export function* walkCondition(condition: Condition): Generator<Condition> {
  yield condition;
  switch (condition.kind) {
    case 'logical':
      yield* walkCondition(condition.left);
      yield* walkCondition(condition.right);
      break;
    case 'not':
    case 'condition-group':
      yield* walkCondition(condition.condition);
      break;
  }
}

/** Expresiones que compara una condición simple (no recorre AND, OR ni NOT). */
export function predicateExpressions(condition: Condition): readonly Expression[] {
  switch (condition.kind) {
    case 'comparison':
      return [condition.left, condition.right];
    case 'between':
      return [condition.expression, condition.low, condition.high];
    case 'in':
      return [condition.expression, ...condition.values];
    case 'like':
      return [condition.expression, condition.pattern];
    case 'is-null':
      return [condition.expression];
    default:
      return [];
  }
}

/** Condiciones simples (hojas) de una condición compuesta, en orden. */
export function predicates(condition: Condition): Condition[] {
  return [...walkCondition(condition)].filter(
    (node) => node.kind !== 'logical' && node.kind !== 'not' && node.kind !== 'condition-group',
  );
}

/** Quita los paréntesis exteriores de una expresión. */
export function unwrap(expression: Expression): Expression {
  return expression.kind === 'group' ? unwrap(expression.expression) : expression;
}

export function referencedColumns(expression: Expression): string[] {
  return [...walkExpression(expression)]
    .filter((node) => node.kind === 'column')
    .map((node) => (node as { name: string }).name);
}
