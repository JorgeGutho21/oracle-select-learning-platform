import { typeOf, type ValueType } from './analyzer';
import {
  unwrap,
  type Condition,
  type Expression,
  type SelectItem,
  type SelectStatement,
} from './ast';
import type { EvaluationTrace } from './evaluator';
import { resolveOrderBy } from './order';
import { EMPLEADOS_SCHEMA, findColumn, type TableSchema } from './schema';

/**
 * Traducción al lenguaje cotidiano derivada del árbol sintáctico (ARCHITECTURE: sin IA
 * generativa). `summary` es la «lectura en español» de la consulta; `steps` la recorre
 * con el modelo lógico FROM → WHERE → SELECT → DISTINCT → ORDER BY.
 */

export interface Translation {
  readonly summary: string;
  readonly steps: readonly string[];
}

const OPERATOR_WORDS = {
  '+': 'más',
  '-': 'menos',
  '*': 'multiplicado por',
  '/': 'dividido entre',
} as const;

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });

export function numberWords(value: number): string {
  return numberFormat.format(value);
}

/** «2020-01-31» → «31 de enero de 2020». */
export function dateWords(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

function columnLabel(name: string, schema: TableSchema): string {
  return findColumn(schema, name)?.label ?? name.toLowerCase();
}

function withArticle(name: string, schema: TableSchema): string {
  const column = findColumn(schema, name);
  if (!column) return name;
  return `${column.gender === 'f' ? 'la' : 'el'} ${column.label}`;
}

function flattenConcat(expression: Expression): Expression[] {
  const bare = unwrap(expression);
  return bare.kind === 'binary' && bare.operator === '||'
    ? [...flattenConcat(bare.left), ...flattenConcat(bare.right)]
    : [expression];
}

export function expressionInWords(
  expression: Expression,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string {
  switch (expression.kind) {
    case 'column':
      return columnLabel(expression.name, schema);
    case 'number':
      return numberWords(expression.value);
    case 'string':
      return expression.value === ' ' ? 'un espacio' : `«${expression.value}»`;
    case 'null':
      return 'NULL';
    case 'date':
      return dateWords(expression.value);
    case 'group':
      return `(${expressionInWords(expression.expression, schema)})`;
    case 'unary':
      return expression.operator === '-'
        ? `menos ${expressionInWords(expression.operand, schema)}`
        : expressionInWords(expression.operand, schema);
    case 'binary':
      if (expression.operator === '||') {
        return `${listInWords(flattenConcat(expression).map((part) => expressionInWords(part, schema)))} unidos en un texto`;
      }
      return `${expressionInWords(expression.left, schema)} ${OPERATOR_WORDS[expression.operator]} ${expressionInWords(expression.right, schema)}`;
  }
}

export function listInWords(parts: readonly string[], conjunction = 'y'): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} ${conjunction} ${parts.at(-1)}`;
}

/** Valor de una condición dicho en palabras: los textos sin comillas, los números con miles. */
function valueWords(expression: Expression, schema: TableSchema): string {
  const bare = unwrap(expression);
  if (bare.kind === 'string') return bare.value;
  if (bare.kind === 'column') return withArticle(bare.name, schema);
  return expressionInWords(expression, schema);
}

function describeItem(item: SelectItem, schema: TableSchema): string {
  if (item.kind === 'star') return 'todas las columnas';
  const bare = unwrap(item.expression);
  const base =
    bare.kind === 'column'
      ? withArticle(bare.name, schema)
      : expressionInWords(item.expression, schema);
  return item.alias ? `${base} (como ${item.alias.header})` : base;
}

function stepForItem(item: SelectItem, schema: TableSchema): string {
  if (item.kind === 'star') return 'copia todos sus valores';
  const bare = unwrap(item.expression);
  const action =
    bare.kind === 'column'
      ? `copia ${withArticle(bare.name, schema)}`
      : bare.kind === 'string' ||
          bare.kind === 'number' ||
          bare.kind === 'null' ||
          bare.kind === 'date'
        ? `escribe el valor fijo ${expressionInWords(item.expression, schema)}`
        : `calcula ${expressionInWords(item.expression, schema)}`;
  return item.alias ? `${action} y lo muestra como ${item.alias.header}` : action;
}

/* ---------- Condiciones ---------- */

const COMPARISON_WORDS: Readonly<Record<string, string>> = {
  '=': 'es',
  '<>': 'no es',
  '!=': 'no es',
  '^=': 'no es',
  '<': 'es menor que',
  '<=': 'es menor o igual que',
  '>': 'es mayor que',
  '>=': 'es mayor o igual que',
};

const DATE_COMPARISON_WORDS: Readonly<Record<string, string>> = {
  '<': 'es anterior al',
  '<=': 'es igual o anterior al',
  '>': 'es posterior al',
  '>=': 'es igual o posterior al',
};

/** «cuya ciudad» / «cuyo salario»; para una expresión, «en los que salario × 12». */
function subject(expression: Expression, schema: TableSchema): string {
  const bare = unwrap(expression);
  const column = bare.kind === 'column' ? findColumn(schema, bare.name) : undefined;
  if (column) return `${column.gender === 'f' ? 'cuya' : 'cuyo'} ${column.label}`;
  return `en los que ${expressionInWords(expression, schema)}`;
}

function likeWords(pattern: string): string {
  if (/^[^%_]+%$/.test(pattern)) return `empieza por «${pattern.slice(0, -1)}»`;
  if (/^%[^%_]+$/.test(pattern)) return `termina en «${pattern.slice(1)}»`;
  if (/^%[^%_]+%$/.test(pattern)) return `contiene «${pattern.slice(1, -1)}»`;
  if (!/[%_]/.test(pattern)) return `es exactamente «${pattern}»`;
  return `sigue el patrón «${pattern}» (_ es un carácter y % cualquier cantidad)`;
}

export function conditionInWords(
  condition: Condition,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string {
  const value = (expression: Expression) => valueWords(expression, schema);
  switch (condition.kind) {
    case 'comparison': {
      const date =
        typeOf(condition.left, schema) === 'date' || typeOf(condition.right, schema) === 'date';
      const verb =
        (date ? DATE_COMPARISON_WORDS[condition.operator] : undefined) ??
        COMPARISON_WORDS[condition.operator];
      return `${subject(condition.left, schema)} ${verb} ${value(condition.right)}`;
    }
    case 'between':
      return condition.negated
        ? `${subject(condition.expression, schema)} queda fuera del rango de ${value(condition.low)} a ${value(condition.high)}`
        : `${subject(condition.expression, schema)} está entre ${value(condition.low)} y ${value(condition.high)} (ambos incluidos)`;
    case 'in': {
      const values = condition.values.map(value);
      return condition.negated
        ? `${subject(condition.expression, schema)} no es ${listInWords(values, 'ni')}`
        : `${subject(condition.expression, schema)} es ${listInWords(values, 'o')}`;
    }
    case 'like': {
      const pattern = unwrap(condition.pattern);
      const words =
        pattern.kind === 'string'
          ? likeWords(pattern.value)
          : `sigue el patrón de ${value(condition.pattern)}`;
      return `${subject(condition.expression, schema)} ${condition.negated ? 'no ' : ''}${words}`;
    }
    case 'is-null': {
      const bare = unwrap(condition.expression);
      const feminine = bare.kind === 'column' && findColumn(schema, bare.name)?.gender === 'f';
      return condition.negated
        ? `${subject(condition.expression, schema)} tiene un valor (no es NULL)`
        : `${subject(condition.expression, schema)} está ${feminine ? 'vacía' : 'vacío'} (es NULL)`;
    }
    case 'logical':
      return `${conditionInWords(condition.left, schema)} ${condition.operator === 'AND' ? 'y' : 'o'} ${conditionInWords(condition.right, schema)}`;
    case 'not':
      return `que no cumplen «${conditionInWords(condition.condition, schema)}»`;
    case 'condition-group':
      return `(${conditionInWords(condition.condition, schema)})`;
  }
}

/* ---------- ORDER BY ---------- */

function directionWords(type: ValueType, direction: 'ASC' | 'DESC'): string {
  if (type === 'text') return direction === 'ASC' ? 'de la A a la Z' : 'de la Z a la A';
  if (type === 'date')
    return direction === 'ASC'
      ? 'de la más antigua a la más reciente'
      : 'de la más reciente a la más antigua';
  return direction === 'ASC' ? 'de menor a mayor' : 'de mayor a menor';
}

export function orderInWords(
  statement: SelectStatement,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string | null {
  if (!statement.orderBy) return null;
  const { targets } = resolveOrderBy(statement, schema);
  const slots = statement.items.flatMap((item) =>
    item.kind === 'star'
      ? schema.columns.map(({ name }) => ({
          label: columnLabel(name, schema),
          type: findColumn(schema, name)!.type as ValueType,
        }))
      : [
          {
            label: item.alias
              ? item.alias.header
              : unwrap(item.expression).kind === 'column'
                ? columnLabel((unwrap(item.expression) as { name: string }).name, schema)
                : expressionInWords(item.expression, schema),
            type: typeOf(item.expression, schema),
          },
        ],
  );
  const parts = statement.orderBy.items.map((item, index) => {
    const slot = targets[index]?.slot;
    const target =
      slot !== null && slot !== undefined
        ? slots[slot]!
        : {
            label:
              unwrap(item.expression).kind === 'column'
                ? columnLabel((unwrap(item.expression) as { name: string }).name, schema)
                : expressionInWords(item.expression, schema),
            type: typeOf(item.expression, schema),
          };
    return `por ${target.label} ${directionWords(target.type, item.direction ?? 'ASC')}`;
  });
  if (parts.length === 1) return `ordenados ${parts[0]}`;
  return `ordenados ${parts[0]} y, cuando empatan, ${listInWords(parts.slice(1))}`;
}

/* ---------- Consulta completa ---------- */

export function translateStatement(
  statement: SelectStatement,
  trace: EvaluationTrace | null,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): Translation {
  const items = listInWords(statement.items.map((item) => describeItem(item, schema)));
  const where = statement.where ? conditionInWords(statement.where.condition, schema) : null;
  const order = orderInWords(statement, schema);
  const people = where ? `los empleados ${where}` : 'todos los empleados';
  const summary = `Muéstrame ${items} de ${people}${statement.distinct ? ', sin repetir filas' : ''}${order ? `, ${order}` : ''}.`;

  const total = trace?.sourceRowCount;
  const steps: string[] = [
    `FROM ${statement.table.name}: parte de ${total === undefined ? 'todas las filas' : `las ${total} filas`} de la tabla ${statement.table.name}.`,
  ];
  if (where) {
    const kept = trace ? ` Quedan ${trace.keptRows.length} de ${trace.sourceRowCount}.` : '';
    const unknown = trace?.conditions?.some((value) => value === 'unknown')
      ? ' Si un NULL impide decidir, la condición es desconocida y la fila tampoco pasa.'
      : '';
    steps.push(
      `WHERE: revisa cada fila y conserva solo las filas ${where.replace(/^en los que/, 'en las que')}.${kept}${unknown}`,
    );
  }
  steps.push(
    `SELECT: en cada fila que queda, ${listInWords(statement.items.map((item) => stepForItem(item, schema)))}.`,
  );
  if (statement.distinct) {
    const removed = trace
      ? ` (${trace.duplicateRows.length} ${trace.duplicateRows.length === 1 ? 'fila repetida sale' : 'filas repetidas salen'} del resultado)`
      : '';
    steps.push(
      `DISTINCT: compara las filas completas del resultado y deja una sola de cada combinación repetida${removed}.`,
    );
  }
  steps.push(
    order
      ? `ORDER BY: ordena el resultado ${order.replace(/^ordenados /, '')}.`
      : 'Sin ORDER BY, el orden de las filas del resultado no está garantizado.',
  );
  if (statement.items.some((item) => item.kind === 'expression' && item.alias)) {
    steps.push(
      'AS solo cambia el encabezado del resultado: la columna original conserva su nombre en la tabla.',
    );
  }
  steps.push(`La tabla ${statement.table.name} no cambia: la consulta solo lee datos.`);
  if (statement.where || statement.orderBy) {
    steps.push(
      'Este recorrido es un modelo para entender la consulta: Oracle puede ejecutarla con otro plan y obtiene el mismo resultado.',
    );
  }
  return { summary, steps };
}
