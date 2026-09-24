import { walkExpression, type Alias, type Expression, type SelectStatement } from './ast';
import { diagnostic, type SqlDiagnostic } from './diagnostics';
import { RESERVED_WORDS } from './keywords';
import { lex, type Token } from './lexer';
import { parseExpressionOnly, parseSelect } from './parser';
import { closestColumn, EMPLEADOS_SCHEMA, findColumn, type TableSchema } from './schema';
import type { Span } from './source';

/**
 * Punto de entrada único del motor SQL educativo: análisis léxico, sintáctico y semántico
 * del subconjunto SELECT v1 contra el catálogo permitido. Lo usan el laboratorio y las
 * misiones del Challenge; no ejecuta nada ni se presenta como Oracle.
 */

export const INPUT_LIMITS = Object.freeze({ maxCharacters: 4000, maxTokens: 500 });

export interface SqlAnalysis {
  readonly source: string;
  readonly statement: SelectStatement | null;
  readonly diagnostics: readonly SqlDiagnostic[];
  readonly errors: readonly SqlDiagnostic[];
  readonly warnings: readonly SqlDiagnostic[];
  /** Verdadero si no hay errores: la consulta pertenece al subconjunto permitido. */
  readonly ok: boolean;
  readonly tokens: readonly Token[];
  readonly comments: readonly Span[];
}

export function analyzeSql(source: string, schema: TableSchema = EMPLEADOS_SCHEMA): SqlAnalysis {
  const found: SqlDiagnostic[] = [];
  if (source.length > INPUT_LIMITS.maxCharacters) {
    found.push(
      diagnostic(source, {
        code: 'too-long',
        category: 'limit',
        span: { start: INPUT_LIMITS.maxCharacters, end: source.length },
        message: `La consulta supera los ${INPUT_LIMITS.maxCharacters} caracteres permitidos.`,
      }),
    );
    return finish(source, null, found, [], []);
  }
  const { tokens, comments } = lex(source);
  if (tokens.length - 1 > INPUT_LIMITS.maxTokens) {
    found.push(
      diagnostic(source, {
        code: 'too-many-tokens',
        category: 'limit',
        span: tokens[INPUT_LIMITS.maxTokens]!,
        message: `La consulta tiene más de ${INPUT_LIMITS.maxTokens} elementos, el máximo de este laboratorio.`,
      }),
    );
    return finish(source, null, found, tokens, comments);
  }
  const parsed = parseSelect(source, tokens);
  found.push(...parsed.diagnostics);
  if (parsed.node) found.push(...checkStatement(source, parsed.node, schema));
  return finish(source, parsed.node, found, tokens, comments);
}

function finish(
  source: string,
  statement: SelectStatement | null,
  found: SqlDiagnostic[],
  tokens: readonly Token[],
  comments: readonly Span[],
): SqlAnalysis {
  const diagnostics = [...found].sort(
    (left, right) => left.span.start - right.span.start || (left.severity === 'error' ? -1 : 1),
  );
  const errors = diagnostics.filter((item) => item.severity === 'error');
  return {
    source,
    statement,
    diagnostics,
    errors,
    warnings: diagnostics.filter((item) => item.severity === 'warning'),
    ok: errors.length === 0,
    tokens,
    comments,
  };
}

/* ---------- Comprobaciones semánticas ---------- */

function checkStatement(
  source: string,
  statement: SelectStatement,
  schema: TableSchema,
): SqlDiagnostic[] {
  const found: SqlDiagnostic[] = [];
  const { table } = statement;
  if (table.name !== schema.name) {
    found.push(
      findColumn(schema, table.name)
        ? diagnostic(source, {
            code: 'column-as-table',
            category: 'table',
            span: table.span,
            message: `${table.raw} es una columna, no una tabla: FROM recibe el nombre de la tabla ${schema.name}.`,
            hint: `Escribe FROM ${schema.name.toLowerCase()}.`,
          })
        : diagnostic(source, {
            code: 'unknown-table',
            category: 'table',
            span: table.span,
            message: `La tabla ${table.raw} no está disponible en este laboratorio.`,
            hint: `La única tabla disponible es ${schema.name}.`,
          }),
    );
  }
  for (const item of statement.items) {
    if (item.kind === 'star') continue;
    found.push(...checkExpression(source, item.expression, schema));
    if (item.alias) found.push(...checkAlias(source, item.alias, item.expression, schema));
  }
  return found;
}

export function checkExpression(
  source: string,
  expression: Expression,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): SqlDiagnostic[] {
  const found: SqlDiagnostic[] = [];
  const nodes = [...walkExpression(expression)];
  const computed = nodes.some((node) => node.kind === 'binary' || node.kind === 'unary');
  const available = schema.columns.map(({ name }) => name).join(', ');
  for (const node of nodes) {
    if (node.kind === 'number' && !/^\d{1,12}(\.\d{1,4})?$/.test(node.raw)) {
      found.push(
        diagnostic(source, {
          code: 'number-format',
          category: 'syntax',
          span: node.span,
          message: `El número ${node.raw} no tiene un formato admitido.`,
          hint: 'Usa enteros o decimales con punto, sin notación científica, con hasta 12 cifras enteras y 4 decimales.',
        }),
      );
    }
    if (node.kind !== 'column') continue;
    if (node.quoted) {
      found.push(
        diagnostic(source, {
          code: 'quoted-column',
          category: 'identifier',
          span: node.span,
          message: `Las columnas se escriben sin comillas en esta unidad: escribe ${node.name.toLowerCase()} en lugar de ${node.raw}.`,
        }),
      );
      continue;
    }
    const column = findColumn(schema, node.name);
    if (!column) {
      if (node.name === schema.name) {
        found.push(
          diagnostic(source, {
            code: 'table-as-column',
            category: 'identifier',
            span: node.span,
            message: `${node.raw} es el nombre de la tabla: va después de FROM, no en la lista de columnas.`,
          }),
        );
        continue;
      }
      const suggestion = closestColumn(schema, node.name);
      found.push(
        diagnostic(source, {
          code: 'unknown-column',
          category: 'identifier',
          span: node.span,
          message: `${node.raw.toUpperCase()} no pertenece a la tabla ${schema.name}.`,
          hint: `${suggestion ? `¿Quisiste decir ${suggestion}? ` : ''}Columnas disponibles: ${available}.`,
        }),
      );
      continue;
    }
    if (computed && column.type === 'text') {
      found.push(
        diagnostic(source, {
          code: 'text-arithmetic',
          category: 'operation',
          span: node.span,
          message: `${column.name} es una columna de texto: no admite operaciones aritméticas.`,
          hint: 'Los cálculos usan columnas numéricas como SALARIO, EDAD o ID.',
        }),
      );
    }
  }
  return found;
}

function checkAlias(
  source: string,
  alias: Alias,
  expression: Expression,
  schema: TableSchema,
): SqlDiagnostic[] {
  const invalid = (message: string, hint?: string) =>
    diagnostic(source, {
      code: 'invalid-alias',
      category: 'alias',
      span: alias.span,
      message,
      ...(hint ? { hint } : {}),
    });
  if (alias.quoted) {
    if (alias.raw.length === 0) return [invalid('El alias entre comillas no puede estar vacío.')];
    if (alias.raw.length > 40 || !/^[\p{L}\p{N} _-]+$/u.test(alias.raw)) {
      return [
        invalid(
          `El alias "${alias.raw}" solo admite letras, números, espacios, guion y guion bajo, hasta 40 caracteres.`,
        ),
      ];
    }
    return [];
  }
  if (/[^ -~]/.test(alias.raw)) {
    return [
      invalid(
        `El alias ${alias.raw} lleva tildes o ñ: sin comillas solo admite letras sin tilde, números y guion bajo.`,
        `Escríbelo entre comillas dobles, por ejemplo "${alias.raw}", o sin tildes.`,
      ),
    ];
  }
  if (!/^[A-Za-z]/.test(alias.raw))
    return [invalid(`Un alias sin comillas empieza por una letra; ${alias.raw} no.`)];
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(alias.raw)) {
    return [invalid(`El alias ${alias.raw} solo puede tener letras, números y guion bajo.`)];
  }
  if (alias.raw.length > 30)
    return [invalid(`El alias ${alias.raw} supera los 30 caracteres permitidos.`)];
  if (RESERVED_WORDS.has(alias.header)) {
    return [
      invalid(
        `${alias.raw} es una palabra reservada y no puede usarse como alias sin comillas.`,
        'Elige otro nombre o escríbelo entre comillas dobles.',
      ),
    ];
  }
  if (!alias.explicit) {
    const written = source.slice(expression.span.start, expression.span.end);
    if (findColumn(schema, alias.header)) {
      return [
        diagnostic(source, {
          code: 'possible-missing-comma',
          category: 'alias',
          severity: 'warning',
          span: alias.span,
          message: `Sin coma entre ${written} y ${alias.raw}, Oracle lee ${alias.raw} como un alias de ${written.toUpperCase()}: la consulta es válida, pero esa parte muestra una sola columna llamada ${alias.header}.`,
          hint: `Si querías dos columnas, escribe ${written}, ${alias.raw}.`,
        }),
      ];
    }
    return [
      diagnostic(source, {
        code: 'implicit-alias',
        category: 'alias',
        severity: 'warning',
        span: alias.span,
        message: `${alias.raw} es un alias implícito de ${written}: la consulta es válida.`,
        hint: `Escribir ${written} AS ${alias.raw} hace el alias más claro.`,
      }),
    ];
  }
  return [];
}

/** Analiza una expresión aislada con el mismo parser y las mismas reglas de catálogo. */
export function analyzeExpression(
  source: string,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): { readonly expression: Expression | null; readonly errors: readonly SqlDiagnostic[] } {
  const { tokens } = lex(source);
  const parsed = parseExpressionOnly(source, tokens);
  if (!parsed.node) return { expression: null, errors: parsed.diagnostics };
  return { expression: parsed.node, errors: checkExpression(source, parsed.node, schema) };
}

/** Columnas de la tabla que la consulta lee, en orden de esquema (para resaltarlas). */
export function sourceColumns(
  statement: SelectStatement,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string[] {
  const used = new Set<string>();
  for (const item of statement.items) {
    if (item.kind === 'star') schema.columns.forEach(({ name }) => used.add(name));
    else
      for (const node of walkExpression(item.expression))
        if (node.kind === 'column') used.add(node.name);
  }
  return schema.columns.map(({ name }) => name).filter((name) => used.has(name));
}
