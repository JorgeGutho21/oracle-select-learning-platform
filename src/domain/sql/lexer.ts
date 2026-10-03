import type { Span } from './source';

/**
 * Análisis léxico del subconjunto SELECT. Reconoce identificadores (incluidas letras con
 * tilde, para poder explicar por qué no valen sin comillas), identificadores entre comillas
 * dobles, números, literales de texto, operadores aritméticos y de comparación, `||` y
 * puntuación. Los comentarios `--` se guardan aparte; `/* *\/` se marca para rechazarlo.
 */

export type TokenKind =
  | 'identifier'
  | 'quoted-identifier'
  | 'number'
  | 'string'
  | 'operator'
  | 'comparison'
  | 'comma'
  | 'semicolon'
  | 'lparen'
  | 'rparen'
  | 'dot'
  | 'concat'
  | 'block-comment'
  | 'symbol'
  | 'eof';

export interface Token extends Span {
  readonly kind: TokenKind;
  /** Texto tal como se escribió. */
  readonly text: string;
  /**
   * Identificadores en mayúsculas; contenido interior de comillas (en textos, con `''`
   * convertido en `'`); número u operador tal cual.
   */
  readonly value: string;
  readonly unterminated?: boolean;
}

export interface LexResult {
  readonly tokens: readonly Token[];
  readonly comments: readonly Span[];
}

const IDENTIFIER_START = /[\p{L}_]/u;
const IDENTIFIER_PART = /[\p{L}\p{N}_$#]/u;
const DIGIT = /[0-9]/;
const SINGLE: Readonly<Record<string, TokenKind>> = {
  ',': 'comma',
  ';': 'semicolon',
  '(': 'lparen',
  ')': 'rparen',
  '.': 'dot',
  '+': 'operator',
  '-': 'operator',
  '*': 'operator',
  '/': 'operator',
  '=': 'comparison',
  '<': 'comparison',
  '>': 'comparison',
};
/** Operadores de dos caracteres de Oracle: distinto (<>, !=, ^=) y menor o mayor o igual. */
const DOUBLE_COMPARISON = new Set(['<>', '!=', '^=', '<=', '>=']);

export function lex(source: string): LexResult {
  const tokens: Token[] = [];
  const comments: Span[] = [];
  const length = source.length;
  let index = 0;
  const push = (
    kind: TokenKind,
    start: number,
    end: number,
    value?: string,
    unterminated = false,
  ) => {
    const text = source.slice(start, end);
    tokens.push({
      kind,
      text,
      value: value ?? text,
      start,
      end,
      ...(unterminated ? { unterminated } : {}),
    });
  };

  while (index < length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (/\s/.test(char)) {
      index++;
    } else if (char === '-' && next === '-') {
      const newline = source.indexOf('\n', index);
      const end = newline === -1 ? length : newline;
      comments.push({ start: index, end });
      index = end;
    } else if (char === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      const end = close === -1 ? length : close + 2;
      push('block-comment', index, end, '', close === -1);
      index = end;
    } else if (IDENTIFIER_START.test(char)) {
      let end = index + 1;
      while (end < length && IDENTIFIER_PART.test(source[end]!)) end++;
      push('identifier', index, end, source.slice(index, end).toUpperCase());
      index = end;
    } else if (DIGIT.test(char)) {
      let end = index;
      while (end < length && DIGIT.test(source[end]!)) end++;
      if (source[end] === '.' && DIGIT.test(source[end + 1] ?? '')) {
        end++;
        while (end < length && DIGIT.test(source[end]!)) end++;
      }
      // Letras pegadas (1e5, 12abc) forman un número mal escrito, no un alias.
      while (end < length && IDENTIFIER_PART.test(source[end]!)) end++;
      push('number', index, end);
      index = end;
    } else if (char === '"') {
      const close = source.indexOf('"', index + 1);
      const end = close === -1 ? length : close + 1;
      push(
        'quoted-identifier',
        index,
        end,
        source.slice(index + 1, close === -1 ? length : close),
        close === -1,
      );
      index = end;
    } else if (char === "'") {
      let end = index + 1;
      let closed = false;
      while (end < length) {
        if (source[end] === "'") {
          if (source[end + 1] === "'") {
            end += 2;
            continue;
          }
          closed = true;
          end++;
          break;
        }
        end++;
      }
      const inner = source.slice(index + 1, closed ? end - 1 : end);
      push('string', index, end, inner.replaceAll("''", "'"), !closed);
      index = end;
    } else if (char === '|' && next === '|') {
      push('concat', index, index + 2);
      index += 2;
    } else if (next !== undefined && DOUBLE_COMPARISON.has(char + next)) {
      push('comparison', index, index + 2);
      index += 2;
    } else {
      push(SINGLE[char] ?? 'symbol', index, index + 1);
      index++;
    }
  }
  tokens.push({ kind: 'eof', text: '', value: '', start: length, end: length });
  return { tokens, comments };
}
