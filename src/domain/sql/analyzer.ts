import {
  predicateExpressions,
  unwrap,
  walkExpression,
  type Alias,
  type Condition,
  type Expression,
  type SelectItem,
  type SelectStatement,
} from './ast';
import { diagnostic, type DiagnosticFix, type SqlDiagnostic } from './diagnostics';
import { RESERVED_WORDS } from './keywords';
import { lex, type Token } from './lexer';
import { resolveOrderBy } from './order';
import { parseExpressionOnly, parseSelect } from './parser';
import {
  closestColumn,
  EMPLEADOS_SCHEMA,
  findColumn,
  numericColumns,
  type TableSchema,
} from './schema';
import type { Span } from './source';

/**
 * Punto de entrada único del motor SQL educativo: análisis léxico, sintáctico y semántico
 * del subconjunto SELECT v2 contra el catálogo permitido. Lo usan el laboratorio, el
 * Estudio, la Exposición y las misiones del Challenge; no ejecuta nada ni se presenta como
 * Oracle.
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
  const parsed = parseSelect(source, tokens, schema.name);
  found.push(...parsed.diagnostics);
  if (parsed.node) found.push(...checkStatement(source, parsed.node, schema));
  return finish(source, parsed.node, found, tokens, comments);
}

/** Resultado de un análisis con diagnósticos añadidos después (por ejemplo, al evaluar). */
export function withDiagnostics(
  analysis: SqlAnalysis,
  extra: readonly SqlDiagnostic[],
): SqlAnalysis {
  if (extra.length === 0) return analysis;
  return finish(
    analysis.source,
    analysis.statement,
    [...analysis.diagnostics, ...extra],
    analysis.tokens,
    analysis.comments,
  );
}

function finish(
  source: string,
  statement: SelectStatement | null,
  found: SqlDiagnostic[],
  tokens: readonly Token[],
  comments: readonly Span[],
): SqlAnalysis {
  // Un mismo hallazgo puede llegar por dos caminos (por ejemplo, un alias en WHERE).
  const unique = found.filter(
    (item, index) =>
      found.findIndex(
        (other) =>
          other.code === item.code &&
          other.span.start === item.span.start &&
          other.span.end === item.span.end,
      ) === index,
  );
  const diagnostics = unique.sort(
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

/* ---------- Tipos ---------- */

export type ValueType = 'number' | 'text' | 'date' | 'null' | 'unknown';

export function typeOf(expression: Expression, schema: TableSchema = EMPLEADOS_SCHEMA): ValueType {
  switch (expression.kind) {
    case 'column':
      return expression.quoted
        ? 'unknown'
        : (findColumn(schema, expression.name)?.type ?? 'unknown');
    case 'number':
      return 'number';
    case 'string':
      // En Oracle, un texto vacío '' es NULL.
      return expression.value === '' ? 'null' : 'text';
    case 'null':
      return 'null';
    case 'date':
      return 'date';
    case 'group':
      return typeOf(expression.expression, schema);
    case 'unary':
      return 'number';
    case 'binary':
      return expression.operator === '||' ? 'text' : 'number';
  }
}

const TYPE_WORD: Readonly<Record<ValueType, string>> = {
  number: 'un número',
  text: 'un texto',
  date: 'una fecha',
  null: 'NULL',
  unknown: 'un valor',
};

const isNumericText = (text: string) => /^\s*[-+]?\d+(\.\d+)?\s*$/.test(text);

/* ---------- Comprobaciones semánticas ---------- */

interface ExpressionContext {
  /** Alias de SELECT: en WHERE no pueden usarse (ORA-00904). */
  readonly aliases?: ReadonlyMap<string, Extract<SelectItem, { kind: 'expression' }>>;
  /** El valor se compara con un texto: un identificador desconocido suele ser un texto sin comillas. */
  readonly textPeer?: boolean;
}

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
            fix: { span: table.span, text: schema.name.toLowerCase() },
          })
        : diagnostic(source, {
            code: 'unknown-table',
            category: 'table',
            span: table.span,
            message: `La tabla ${table.raw} no está disponible en este laboratorio.`,
            hint: `La única tabla disponible es ${schema.name}. Otras tablas llegarán con JOIN (Nivel 4).`,
            fix: { span: table.span, text: schema.name.toLowerCase() },
          }),
    );
  }
  const aliases = new Map<string, Extract<SelectItem, { kind: 'expression' }>>();
  for (const item of statement.items) {
    if (item.kind === 'star') continue;
    found.push(...checkExpression(source, item.expression, schema));
    if (item.alias) {
      found.push(...checkAlias(source, item.alias, item.expression, schema));
      if (!findColumn(schema, item.alias.header)) aliases.set(item.alias.header, item);
    } else {
      const bare = unwrap(item.expression);
      if (
        bare.kind === 'string' ||
        bare.kind === 'date' ||
        bare.kind === 'null' ||
        (bare.kind === 'binary' && bare.operator === '||')
      ) {
        found.push(
          diagnostic(source, {
            code: 'unaliased-literal',
            category: 'alias',
            severity: 'warning',
            span: item.expression.span,
            message: 'Sin alias, el encabezado de esta columna es el propio texto de la expresión.',
            hint: 'Con AS le das un nombre claro, por ejemplo … AS nombre_completo.',
            fix: {
              span: { start: item.expression.span.end, end: item.expression.span.end },
              text: ' AS etiqueta',
            },
          }),
        );
      }
    }
  }
  if (statement.where) {
    found.push(...checkCondition(source, statement.where.condition, schema, aliases));
  }
  if (statement.orderBy) {
    const { targets, diagnostics } = resolveOrderBy(statement, schema, source);
    found.push(...diagnostics);
    statement.orderBy.items.forEach((item, index) => {
      if (targets[index]?.slot !== null && targets[index]?.slot !== undefined) return;
      if (diagnostics.some((entry) => entry.span.start === unwrap(item.expression).span.start))
        return;
      found.push(...checkExpression(source, item.expression, schema));
    });
  }
  return found;
}

export function checkExpression(
  source: string,
  expression: Expression,
  schema: TableSchema = EMPLEADOS_SCHEMA,
  context: ExpressionContext = {},
): SqlDiagnostic[] {
  const found: SqlDiagnostic[] = [];
  const available = schema.columns.map(({ name }) => name).join(', ');
  for (const node of walkExpression(expression)) {
    if (node.kind === 'number' && !/^\d{1,12}(\.\d{1,4})?$/.test(node.raw)) {
      found.push(
        diagnostic(source, {
          code: 'number-format',
          category: 'syntax',
          span: node.span,
          message: `El número ${node.raw} no tiene un formato admitido.`,
          hint: 'Usa enteros o decimales con punto, sin separadores de miles ni notación científica, con hasta 12 cifras enteras y 4 decimales.',
        }),
      );
    }
    if (node.kind === 'binary' && node.operator !== '||') {
      found.push(
        ...checkArithmetic(source, node.left, schema),
        ...checkArithmetic(source, node.right, schema),
      );
    }
    if (node.kind === 'unary') found.push(...checkArithmetic(source, node.operand, schema));
    if (node.kind === 'binary' && node.operator === '||') {
      for (const side of [node.left, node.right]) {
        if (typeOf(side, schema) === 'date') {
          found.push(
            diagnostic(source, {
              code: 'implicit-conversion',
              category: 'semantic',
              severity: 'warning',
              span: side.span,
              message:
                'Al unir una fecha con ||, Oracle la convierte en texto con el formato de fecha de la sesión.',
              hint: 'TO_CHAR (Nivel 2) permite elegir ese formato explícitamente.',
            }),
          );
        }
      }
    }
    if (node.kind !== 'column') continue;
    if (node.quoted) {
      found.push(
        context.textPeer
          ? diagnostic(source, {
              code: 'double-quoted-text',
              category: 'syntax',
              span: node.span,
              message: `${node.raw} está entre comillas dobles: en Oracle las comillas dobles nombran columnas o alias, y los textos van entre comillas simples.`,
              fix: { span: node.span, text: `'${node.name.replaceAll("'", "''")}'` },
            })
          : diagnostic(source, {
              code: 'quoted-column',
              category: 'identifier',
              span: node.span,
              message: `Las columnas se escriben sin comillas en esta unidad: escribe ${node.name.toLowerCase()} en lugar de ${node.raw}.`,
              hint: "Si querías un texto, escríbelo entre comillas simples: 'texto'.",
              fix: { span: node.span, text: node.name.toLowerCase() },
            }),
      );
      continue;
    }
    if (findColumn(schema, node.name)) continue;
    const alias = context.aliases?.get(node.name);
    if (alias) {
      const written = source.slice(alias.expression.span.start, alias.expression.span.end);
      const replacement = unwrap(alias.expression).kind === 'binary' ? `(${written})` : written;
      found.push(
        diagnostic(source, {
          code: 'alias-in-where',
          category: 'oracle',
          span: node.span,
          message: `Oracle no permite usar el alias ${alias.alias!.header} en WHERE (daría ORA-00904): en el modelo lógico, WHERE se aplica antes de que SELECT calcule los encabezados.`,
          hint: 'Repite la expresión en la condición. El alias sí puede usarse en ORDER BY.',
          fix: { span: node.span, text: replacement },
        }),
      );
      continue;
    }
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
    if (context.textPeer) {
      found.push(
        diagnostic(source, {
          code: 'unquoted-text',
          category: 'syntax',
          span: node.span,
          message: `${node.raw} no es una columna de ${schema.name}: si es un texto, va entre comillas simples.`,
          hint: `Sin comillas, Oracle busca una columna llamada ${node.name} (daría ORA-00904).`,
          fix: { span: node.span, text: `'${node.raw}'` },
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
        ...(suggestion ? { fix: { span: node.span, text: suggestion.toLowerCase() } } : {}),
      }),
    );
  }
  return found;
}

/** Operando de + - * /: debe ser numérico. */
function checkArithmetic(source: string, side: Expression, schema: TableSchema): SqlDiagnostic[] {
  const bare = unwrap(side);
  const type = typeOf(bare, schema);
  const numeric = numericColumns(schema).join(', ');
  if (type === 'date') {
    return [
      diagnostic(source, {
        code: 'date-arithmetic',
        category: 'scope',
        span: side.span,
        message:
          'Operar con fechas (sumar días o restar fechas) es SQL válido en Oracle, pero se estudia en el Nivel 2 de esta plataforma. Puedes consultar su explicación en Próximamente.',
        future: { label: 'Operar con fechas', level: 2, topic: 'operaciones-fecha' },
      }),
    ];
  }
  if (type !== 'text') return [];
  if (bare.kind === 'string') {
    return isNumericText(bare.value)
      ? [
          diagnostic(source, {
            code: 'implicit-conversion',
            category: 'semantic',
            severity: 'warning',
            span: bare.span,
            message: `${bare.raw} es un texto: Oracle lo convierte en número para calcular.`,
            hint: 'Escribe los números sin comillas.',
            fix: { span: bare.span, text: bare.value.trim() },
          }),
        ]
      : [
          diagnostic(source, {
            code: 'type-mismatch',
            category: 'oracle',
            span: bare.span,
            message: `${bare.raw} es un texto y no un número: Oracle no puede usarlo en un cálculo (daría ORA-01722).`,
          }),
        ];
  }
  if (bare.kind === 'column') {
    return [
      diagnostic(source, {
        code: 'text-arithmetic',
        category: 'operation',
        span: bare.span,
        message: `${bare.name} es una columna de texto: no admite operaciones aritméticas.`,
        hint: `Los cálculos usan columnas numéricas como ${numeric}. Para unir textos se usa ||.`,
      }),
    ];
  }
  return [
    diagnostic(source, {
      code: 'text-arithmetic',
      category: 'operation',
      span: side.span,
      message: 'Una operación aritmética recibió un texto: + - * / solo trabajan con números.',
      hint: 'Para unir textos se usa ||.',
    }),
  ];
}

/* ---------- WHERE ---------- */

function literalValue(expression: Expression): number | string | null {
  const bare = unwrap(expression);
  if (bare.kind === 'number') return bare.value;
  if (bare.kind === 'unary' && unwrap(bare.operand).kind === 'number') {
    const value = (unwrap(bare.operand) as { value: number }).value;
    return bare.operator === '-' ? -value : value;
  }
  if (bare.kind === 'string' || bare.kind === 'date') return bare.value;
  return null;
}

function isNullLiteral(expression: Expression): boolean {
  const bare = unwrap(expression);
  return bare.kind === 'null' || (bare.kind === 'string' && bare.value === '');
}

function checkCondition(
  source: string,
  condition: Condition,
  schema: TableSchema,
  aliases: ReadonlyMap<string, Extract<SelectItem, { kind: 'expression' }>>,
): SqlDiagnostic[] {
  const found: SqlDiagnostic[] = [];
  const text = (span: Span) => source.slice(span.start, span.end);
  const expressions = (expression: Expression, peer: ValueType) =>
    checkExpression(source, expression, schema, { aliases, textPeer: peer === 'text' });

  switch (condition.kind) {
    case 'comparison': {
      const left = typeOf(condition.left, schema);
      const right = typeOf(condition.right, schema);
      found.push(...expressions(condition.left, right), ...expressions(condition.right, left));
      if (isNullLiteral(condition.right) || isNullLiteral(condition.left)) {
        const equality = condition.operator === '=';
        const inequality = ['<>', '!=', '^='].includes(condition.operator);
        const fix: DiagnosticFix | undefined =
          isNullLiteral(condition.right) && (equality || inequality)
            ? {
                span: { start: condition.operatorSpan.start, end: condition.right.span.end },
                text: equality ? 'IS NULL' : 'IS NOT NULL',
              }
            : undefined;
        found.push(
          diagnostic(source, {
            code: 'equals-null',
            category: 'semantic',
            severity: 'warning',
            span: condition.span,
            message: `NULL no se compara con ${condition.operator}: una comparación con NULL nunca es verdadera, así que esta condición no deja pasar ninguna fila.`,
            hint: equality
              ? `Para preguntar si no hay valor, escribe ${text(condition.left.span)} IS NULL.`
              : inequality
                ? `Para preguntar si hay valor, escribe ${text(condition.left.span)} IS NOT NULL.`
                : 'Para trabajar con valores ausentes se usa IS NULL o IS NOT NULL.',
            ...(fix ? { fix } : {}),
          }),
        );
      } else {
        found.push(...compareTypes(source, condition.left, left, condition.right, right, schema));
      }
      break;
    }
    case 'between': {
      const type = typeOf(condition.expression, schema);
      found.push(
        ...expressions(condition.expression, typeOf(condition.low, schema)),
        ...expressions(condition.low, type),
        ...expressions(condition.high, type),
      );
      if (isNullLiteral(condition.low) || isNullLiteral(condition.high)) {
        found.push(
          diagnostic(source, {
            code: 'equals-null',
            category: 'semantic',
            severity: 'warning',
            span: condition.span,
            message:
              'Con NULL como límite, BETWEEN nunca se cumple: no hay forma de comparar con un valor ausente.',
          }),
        );
        break;
      }
      found.push(
        ...compareTypes(
          source,
          condition.expression,
          type,
          condition.low,
          typeOf(condition.low, schema),
          schema,
        ),
        ...compareTypes(
          source,
          condition.expression,
          type,
          condition.high,
          typeOf(condition.high, schema),
          schema,
        ),
      );
      const low = literalValue(condition.low);
      const high = literalValue(condition.high);
      if (low !== null && high !== null && typeof low === typeof high && low > high) {
        const lowText = text(condition.low.span);
        const highText = text(condition.high.span);
        found.push(
          diagnostic(source, {
            code: 'between-reversed',
            category: 'semantic',
            severity: 'warning',
            span: { start: condition.low.span.start, end: condition.high.span.end },
            message: `BETWEEN ${lowText} AND ${highText} tiene los límites al revés: el primero debe ser el menor, así que ninguna fila cumple la condición.`,
            hint: `Escribe BETWEEN ${highText} AND ${lowText}.`,
            fix: {
              span: { start: condition.low.span.start, end: condition.high.span.end },
              text: `${highText} AND ${lowText}`,
            },
          }),
        );
      }
      break;
    }
    case 'in': {
      const type = typeOf(condition.expression, schema);
      found.push(...expressions(condition.expression, typeOf(condition.values[0]!, schema)));
      for (const value of condition.values) {
        found.push(...expressions(value, type));
        if (!isNullLiteral(value)) {
          found.push(
            ...compareTypes(
              source,
              condition.expression,
              type,
              value,
              typeOf(value, schema),
              schema,
            ),
          );
        }
      }
      const withNull = condition.values.find(isNullLiteral);
      if (withNull) {
        found.push(
          diagnostic(source, {
            code: condition.negated ? 'not-in-null' : 'in-null',
            category: 'semantic',
            severity: 'warning',
            span: withNull.span,
            message: condition.negated
              ? 'NOT IN con un NULL en la lista no devuelve ninguna fila: comparar con NULL nunca es verdadero, así que nunca se puede afirmar «no está en la lista».'
              : 'NULL dentro de IN nunca coincide con nada: las filas sin valor no se encuentran así.',
            hint: `Para las filas sin valor usa ${text(condition.expression.span)} IS NULL.`,
          }),
        );
      }
      break;
    }
    case 'like': {
      const type = typeOf(condition.expression, schema);
      found.push(
        ...expressions(condition.expression, 'text'),
        ...expressions(condition.pattern, 'text'),
      );
      if (type === 'number' || type === 'date') {
        found.push(
          diagnostic(source, {
            code: 'like-on-number',
            category: 'semantic',
            severity: 'warning',
            span: condition.expression.span,
            message: `LIKE compara textos: Oracle convierte ${text(condition.expression.span)} en texto antes de buscar el patrón.`,
            hint: 'Para números y fechas suelen ser más claros =, BETWEEN o >.',
          }),
        );
      }
      const pattern = unwrap(condition.pattern);
      if (isNullLiteral(condition.pattern)) {
        found.push(
          diagnostic(source, {
            code: 'equals-null',
            category: 'semantic',
            severity: 'warning',
            span: condition.span,
            message: 'Un patrón NULL nunca coincide: esta condición no deja pasar ninguna fila.',
          }),
        );
      } else if (pattern.kind === 'string' && !/[%_]/.test(pattern.value)) {
        found.push(
          diagnostic(source, {
            code: 'like-without-wildcard',
            category: 'semantic',
            severity: 'warning',
            span: condition.pattern.span,
            message: `El patrón ${pattern.raw} no tiene comodines: LIKE solo encuentra el texto exacto, igual que =.`,
            hint: "Usa % para «cualquier cantidad de caracteres» y _ para «un carácter», por ejemplo 'A%'.",
          }),
        );
      }
      break;
    }
    case 'is-null': {
      found.push(...expressions(condition.expression, 'unknown'));
      const bare = unwrap(condition.expression);
      const column =
        bare.kind === 'column' && !bare.quoted ? findColumn(schema, bare.name) : undefined;
      if (column && !column.nullable) {
        found.push(
          diagnostic(source, {
            code: 'never-null',
            category: 'semantic',
            severity: 'warning',
            span: condition.span,
            message: condition.negated
              ? `${column.name} nunca es NULL en ${schema.name}: esta condición se cumple en todas las filas.`
              : `${column.name} nunca es NULL en ${schema.name}: esta condición no devuelve filas.`,
            hint:
              'En esta tabla, las columnas que admiten NULL son ' +
              schema.columns
                .filter(({ nullable }) => nullable)
                .map(({ name }) => name)
                .join(' y ') +
              '.',
          }),
        );
      }
      break;
    }
    case 'logical': {
      found.push(
        ...checkCondition(source, condition.left, schema, aliases),
        ...checkCondition(source, condition.right, schema, aliases),
      );
      if (condition.operator === 'AND') found.push(...contradictions(source, condition));
      if (condition.operator === 'OR') {
        const inner = [condition.left, condition.right].find(
          (side) => side.kind === 'logical' && side.operator === 'AND',
        );
        if (inner) {
          const read = `${source.slice(condition.span.start, inner.span.start)}(${text(inner.span)})${source.slice(inner.span.end, condition.span.end)}`;
          found.push(
            diagnostic(source, {
              code: 'and-or-precedence',
              category: 'semantic',
              severity: 'warning',
              span: condition.span,
              message: `AND se evalúa antes que OR, así que Oracle lee esta condición como: ${read.replace(/\s+/g, ' ')}.`,
              hint: 'Si querías otra agrupación, escríbela con paréntesis; si es la que querías, los paréntesis la hacen explícita.',
            }),
          );
        }
      }
      break;
    }
    case 'not':
    case 'condition-group':
      found.push(...checkCondition(source, condition.condition, schema, aliases));
      break;
  }
  return found;
}

/** Comparaciones de igualdad unidas solo por AND (sin entrar en OR ni en NOT). */
function andEqualities(
  condition: Condition,
): { column: string; value: string | number; span: Span }[] {
  if (condition.kind === 'logical' && condition.operator === 'AND') {
    return [...andEqualities(condition.left), ...andEqualities(condition.right)];
  }
  if (condition.kind === 'condition-group') return andEqualities(condition.condition);
  if (condition.kind === 'comparison' && condition.operator === '=') {
    const left = unwrap(condition.left);
    const value = literalValue(condition.right);
    if (left.kind === 'column' && !left.quoted && value !== null) {
      return [{ column: left.name, value, span: condition.span }];
    }
  }
  return [];
}

/** `ciudad = 'Cali' AND ciudad = 'Bogotá'`: una fila no tiene dos valores a la vez. */
function contradictions(source: string, condition: Condition): SqlDiagnostic[] {
  const equalities = andEqualities(condition);
  for (const [index, first] of equalities.entries()) {
    const other = equalities
      .slice(index + 1)
      .find((candidate) => candidate.column === first.column && candidate.value !== first.value);
    if (other) {
      return [
        diagnostic(source, {
          code: 'contradictory-and',
          category: 'semantic',
          severity: 'warning',
          span: other.span,
          message: `Una fila no puede tener dos valores de ${first.column} a la vez: con AND, esta condición nunca se cumple.`,
          hint: '¿Querías que se cumpliera una u otra? Usa OR, o IN con la lista de valores.',
        }),
      ];
    }
  }
  return [];
}

/** Tipos incompatibles en una comparación, según las conversiones implícitas de Oracle. */
function compareTypes(
  source: string,
  left: Expression,
  leftType: ValueType,
  right: Expression,
  rightType: ValueType,
  schema: TableSchema,
): SqlDiagnostic[] {
  if (
    leftType === 'unknown' ||
    rightType === 'unknown' ||
    leftType === 'null' ||
    rightType === 'null'
  ) {
    return [];
  }
  if (leftType === rightType) return [];
  const text = (span: Span) => source.slice(span.start, span.end);
  const pairs: [Expression, ValueType, Expression, ValueType][] = [
    [left, leftType, right, rightType],
    [right, rightType, left, leftType],
  ];
  for (const [a, aType, b, bType] of pairs) {
    const bBare = unwrap(b);
    if (aType === 'number' && bType === 'text' && bBare.kind === 'string') {
      return isNumericText(bBare.value)
        ? [
            diagnostic(source, {
              code: 'implicit-conversion',
              category: 'semantic',
              severity: 'warning',
              span: bBare.span,
              message: `${text(a.span)} es numérica y ${bBare.raw} es un texto: Oracle lo convierte en número, pero es mejor escribir los números sin comillas.`,
              fix: { span: bBare.span, text: bBare.value.trim() },
            }),
          ]
        : [
            diagnostic(source, {
              code: 'type-mismatch',
              category: 'oracle',
              span: bBare.span,
              message: `${text(a.span)} es numérica y ${bBare.raw} no es un número: Oracle no puede compararlos (daría ORA-01722).`,
            }),
          ];
    }
    if (aType === 'text' && bType === 'number' && bBare.kind === 'number') {
      return [
        diagnostic(source, {
          code: 'type-mismatch',
          category: 'oracle',
          span: bBare.span,
          message: `${text(a.span)} es texto y ${bBare.raw} es un número: Oracle intentaría convertir cada valor de texto en número y fallaría (ORA-01722).`,
          hint: 'Compara textos con textos entre comillas simples.',
          fix: { span: bBare.span, text: `'${bBare.raw}'` },
        }),
      ];
    }
    if (aType === 'date' && bType === 'text' && bBare.kind === 'string') {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(bBare.value.trim());
      return [
        diagnostic(source, {
          code: 'date-text-comparison',
          category: 'oracle',
          span: bBare.span,
          message: `${text(a.span)} es una fecha y ${bBare.raw} es un texto: su conversión dependería del formato de fecha de la sesión (NLS_DATE_FORMAT).`,
          hint: "Escribe la fecha como literal DATE 'AAAA-MM-DD'. TO_DATE, para otros formatos, se estudia en el Nivel 2.",
          ...(iso ? { fix: { span: bBare.span, text: `DATE '${bBare.value.trim()}'` } } : {}),
        }),
      ];
    }
  }
  const leftColumn =
    unwrap(left).kind === 'column'
      ? findColumn(schema, (unwrap(left) as { name: string }).name)
      : undefined;
  return [
    diagnostic(source, {
      code: 'type-mismatch',
      category: 'oracle',
      span: { start: left.span.start, end: right.span.end },
      message: `No se puede comparar ${TYPE_WORD[leftType]} (${text(left.span)}) con ${TYPE_WORD[rightType]} (${text(right.span)}): Oracle necesita valores del mismo tipo.`,
      hint:
        leftColumn?.type === 'date'
          ? "Las fechas se comparan con literales DATE 'AAAA-MM-DD'."
          : 'Compara números con números, textos con textos y fechas con fechas.',
    }),
  ];
}

/* ---------- Alias ---------- */

function checkAlias(
  source: string,
  alias: Alias,
  expression: Expression,
  schema: TableSchema,
): SqlDiagnostic[] {
  const invalid = (message: string, hint?: string, fix?: DiagnosticFix) =>
    diagnostic(source, {
      code: 'invalid-alias',
      category: 'alias',
      span: alias.span,
      message,
      ...(hint ? { hint } : {}),
      ...(fix ? { fix } : {}),
    });
  const nameSpan: Span = {
    start: alias.span.end - (alias.quoted ? alias.raw.length + 2 : alias.raw.length),
    end: alias.span.end,
  };
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
        { span: nameSpan, text: `"${alias.raw}"` },
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
          fix: { span: { start: expression.span.end, end: expression.span.end }, text: ',' },
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
        fix: { span: { start: alias.span.start, end: alias.span.start }, text: 'AS ' },
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
  return {
    expression: parsed.node,
    errors: checkExpression(source, parsed.node, schema).filter(
      ({ severity }) => severity === 'error',
    ),
  };
}

/** Columnas de la tabla que la consulta lee, en orden de esquema (para resaltarlas). */
export function sourceColumns(
  statement: SelectStatement,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string[] {
  const used = new Set<string>();
  const add = (expression: Expression) => {
    for (const node of walkExpression(expression)) if (node.kind === 'column') used.add(node.name);
  };
  for (const item of statement.items) {
    if (item.kind === 'star') schema.columns.forEach(({ name }) => used.add(name));
    else add(item.expression);
  }
  return schema.columns.map(({ name }) => name).filter((name) => used.has(name));
}

/** Columnas que usa WHERE, en orden de esquema. */
export function conditionColumns(
  statement: SelectStatement,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string[] {
  if (!statement.where) return [];
  const used = new Set<string>();
  const visit = (condition: Condition) => {
    switch (condition.kind) {
      case 'logical':
        visit(condition.left);
        visit(condition.right);
        return;
      case 'not':
      case 'condition-group':
        visit(condition.condition);
        return;
      default:
        for (const expression of predicateExpressions(condition))
          for (const node of walkExpression(expression))
            if (node.kind === 'column') used.add(node.name);
    }
  };
  visit(statement.where.condition);
  return schema.columns.map(({ name }) => name).filter((name) => used.has(name));
}
