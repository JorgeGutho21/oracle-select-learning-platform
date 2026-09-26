import { lex, type Token } from './lexer';

/**
 * Formateador de consultas SELECT para mostrarlas (Recursos, Estudio, Exposición). Trabaja
 * sobre los tokens del analizador léxico y solo cambia espacios y saltos de línea fuera de
 * los textos: no cambia mayúsculas, comillas, valores ni el orden de los tokens, así que la
 * consulta significa lo mismo (las pruebas lo comprueban volviendo a analizarla).
 *
 * - Cada cláusula empieza una línea: SELECT, FROM, WHERE, ORDER BY.
 * - Las condiciones de WHERE unidas por AND u OR van una por línea, alineadas bajo WHERE.
 * - Una lista de SELECT, de ORDER BY o de IN que no cabe en `width` se parte en una línea
 *   por elemento.
 *
 * Si la consulta tiene comentarios, bloques sin cerrar o no es un SELECT, se devuelve tal
 * cual: es mejor mostrarla como la escribió su autor que arriesgar su significado.
 */

export interface FormatOptions {
  /** Ancho de línea deseado, en caracteres. */
  readonly width?: number;
  /** Sangría de los elementos de una lista partida. */
  readonly indent?: string;
}

const DEFAULT_WIDTH = 44;
const CLAUSES = new Set(['SELECT', 'FROM', 'WHERE', 'ORDER']);
const WORD_OPERATORS = new Set([
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'IN',
  'LIKE',
  'IS',
  'SELECT',
  'DISTINCT',
  'WHERE',
  'BY',
]);

/** Cláusula con su palabra clave tal como se escribió («order by» sigue en minúsculas). */
type Clause = {
  readonly keyword: string;
  readonly text: string;
  readonly tokens: readonly Token[];
};

function isWord(token: Token | undefined, value: string): boolean {
  return token?.kind === 'identifier' && token.value === value;
}

/** Un `+` o `-` es unario si no sigue a un valor (columna, número, texto o paréntesis). */
function isUnary(previous: Token | undefined): boolean {
  if (!previous) return true;
  if (['operator', 'comparison', 'concat', 'lparen', 'comma'].includes(previous.kind)) return true;
  return previous.kind === 'identifier' && WORD_OPERATORS.has(previous.value);
}

/** Une tokens en una línea con los espacios convencionales. */
function join(tokens: readonly Token[]): string {
  let text = '';
  tokens.forEach((token, index) => {
    const previous = tokens[index - 1];
    if (index > 0) {
      const noSpace =
        token.kind === 'comma' ||
        token.kind === 'rparen' ||
        token.kind === 'semicolon' ||
        token.kind === 'dot' ||
        previous?.kind === 'lparen' ||
        previous?.kind === 'dot' ||
        (previous?.kind === 'operator' &&
          (previous.text === '+' || previous.text === '-') &&
          isUnary(tokens[index - 2]));
      if (!noSpace) text += ' ';
    }
    text += token.text;
  });
  return text;
}

/** Parte una secuencia por las comas de primer nivel (fuera de paréntesis). */
function splitCommas(tokens: readonly Token[]): Token[][] {
  const parts: Token[][] = [[]];
  let depth = 0;
  for (const token of tokens) {
    if (token.kind === 'lparen') depth++;
    if (token.kind === 'rparen') depth--;
    if (token.kind === 'comma' && depth === 0) parts.push([]);
    else parts[parts.length - 1]!.push(token);
  }
  return parts;
}

/** Parte una condición por AND y OR de primer nivel, sin separar el AND de BETWEEN. */
function splitConditions(tokens: readonly Token[]): { operator: string | null; tokens: Token[] }[] {
  const parts: { operator: string | null; tokens: Token[] }[] = [{ operator: null, tokens: [] }];
  let depth = 0;
  let pendingBetween = 0;
  for (const token of tokens) {
    if (token.kind === 'lparen') depth++;
    if (token.kind === 'rparen') depth--;
    if (depth === 0 && isWord(token, 'BETWEEN')) pendingBetween++;
    const logical = depth === 0 && (isWord(token, 'AND') || isWord(token, 'OR'));
    if (logical && isWord(token, 'AND') && pendingBetween > 0) {
      pendingBetween--;
      parts[parts.length - 1]!.tokens.push(token);
    } else if (logical) {
      parts.push({ operator: token.text, tokens: [] });
    } else {
      parts[parts.length - 1]!.tokens.push(token);
    }
  }
  return parts;
}

/** Una condición con IN (…) demasiado larga pone cada valor de la lista en su línea. */
function formatCondition(prefix: string, tokens: readonly Token[], width: number, indent: string) {
  const line = `${prefix}${join(tokens)}`;
  if (line.length <= width) return [line];
  const inIndex = tokens.findIndex(
    (token, index) => isWord(token, 'IN') && tokens[index + 1]?.kind === 'lparen',
  );
  if (inIndex < 0) return [line];
  const open = inIndex + 1;
  let depth = 0;
  let close = -1;
  for (let index = open; index < tokens.length; index++) {
    if (tokens[index]!.kind === 'lparen') depth++;
    if (tokens[index]!.kind === 'rparen' && --depth === 0) {
      close = index;
      break;
    }
  }
  if (close < 0) return [line];
  const base = ' '.repeat(Math.max(0, prefix.length - prefix.trimStart().length));
  const items = splitCommas(tokens.slice(open + 1, close));
  return [
    `${prefix}${join(tokens.slice(0, open + 1))}`,
    ...items.map(
      (item, index) => `${base}${indent}${join(item)}${index < items.length - 1 ? ',' : ''}`,
    ),
    `${base}${join(tokens.slice(close))}`,
  ];
}

/** Lista de SELECT u ORDER BY: en una línea si cabe; si no, un elemento por línea. */
function formatList(head: string, tokens: readonly Token[], width: number) {
  const items = splitCommas(tokens);
  const inline = `${head} ${items.map(join).join(', ')}`;
  if (inline.length <= width || items.length === 1) return [inline];
  const pad = ' '.repeat(head.length + 1);
  return items.map(
    (item, index) =>
      `${index === 0 ? `${head} ` : pad}${join(item)}${index < items.length - 1 ? ',' : ''}`,
  );
}

function clauses(tokens: readonly Token[]): Clause[] | null {
  const result: { keyword: string; text: string; tokens: Token[] }[] = [];
  let depth = 0;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!;
    if (token.kind === 'lparen') depth++;
    if (token.kind === 'rparen') depth--;
    const starts =
      depth === 0 &&
      token.kind === 'identifier' &&
      CLAUSES.has(token.value) &&
      (token.value !== 'ORDER' || isWord(tokens[index + 1], 'BY'));
    if (starts) {
      if (token.value === 'ORDER') {
        result.push({
          keyword: 'ORDER BY',
          text: `${token.text} ${tokens[++index]!.text}`,
          tokens: [],
        });
      } else {
        result.push({ keyword: token.value, text: token.text, tokens: [] });
      }
      continue;
    }
    if (result.length === 0) return null;
    result[result.length - 1]!.tokens.push(token);
  }
  return result[0]?.keyword === 'SELECT' ? result : null;
}

export function formatSql(sql: string, options: FormatOptions = {}): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const indent = options.indent ?? '    ';
  const { tokens, comments } = lex(sql);
  const body = tokens.filter((token) => token.kind !== 'eof');
  if (
    comments.length > 0 ||
    body.some((token) => token.unterminated || token.kind === 'block-comment')
  ) {
    return sql.trim();
  }
  const semicolon = body.at(-1)?.kind === 'semicolon' ? body.at(-1)! : null;
  const parts = clauses(semicolon ? body.slice(0, -1) : body);
  if (!parts) return sql.trim();
  const lines: string[] = [];
  parts.forEach((clause) => {
    const head = clause.text;
    if (clause.keyword === 'SELECT') {
      const distinct = isWord(clause.tokens[0], 'DISTINCT') || isWord(clause.tokens[0], 'UNIQUE');
      const items = distinct ? clause.tokens.slice(1) : clause.tokens;
      const selectHead = distinct ? `${head} ${clause.tokens[0]!.text}` : head;
      lines.push(...formatList(selectHead, items, width));
    } else if (clause.keyword === 'ORDER BY') {
      lines.push(...formatList(head, clause.tokens, width));
    } else if (clause.keyword === 'WHERE') {
      splitConditions(clause.tokens).forEach((condition, position) => {
        const prefix =
          position === 0
            ? `${head} `
            : `${' '.repeat(Math.max(0, head.length - condition.operator!.length))}${condition.operator} `;
        lines.push(...formatCondition(prefix, condition.tokens, width, indent));
      });
    } else {
      lines.push(`${head} ${join(clause.tokens)}`.trimEnd());
    }
  });
  if (semicolon && lines.length > 0) lines[lines.length - 1] += ';';
  return lines.join('\n');
}
