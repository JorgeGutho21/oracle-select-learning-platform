import { EMPLEADOS_DATASET, isEmpleadosColumn, type CellValue } from '@/domain/dataset/empleados';
import { distinctRows, normalizeIdentifier, type ResultTable } from '@/domain/results/result-table';
import { evaluateExpression, parseExpression, type ExpressionNode } from '@/domain/sql/expression';

/**
 * Analizador estructural del subconjunto de proyección usado por las piezas del Challenge:
 * `SELECT [DISTINCT] (* | elemento [[AS] alias], ...) FROM empleados [;]`.
 * Construye la consulta a partir de tokens y calcula su resultado lógico sobre el dataset
 * canónico para comparar resultados, nunca cadenas. No sustituye la ejecución en Oracle
 * del laboratorio (LAB_SPEC): es la referencia semántica para corregir piezas.
 * Como en Oracle, un identificador sin coma tras un elemento es un alias implícito (LAB10).
 */

export type ProjectionError =
  | { readonly code: 'empty' }
  | { readonly code: 'invalid-character'; readonly character: string }
  | { readonly code: 'missing-select' }
  | { readonly code: 'missing-from' }
  | { readonly code: 'missing-table' }
  | { readonly code: 'unknown-table'; readonly table: string }
  | { readonly code: 'trailing-tokens'; readonly tokens: readonly string[] }
  | { readonly code: 'empty-item'; readonly position: number }
  | { readonly code: 'star-mixed' }
  | { readonly code: 'misplaced-keyword'; readonly keyword: string; readonly position: number }
  | { readonly code: 'alias-without-name'; readonly position: number }
  | { readonly code: 'invalid-expression'; readonly position: number }
  | { readonly code: 'unknown-column'; readonly column: string }
  | { readonly code: 'not-numeric'; readonly column: string }
  | { readonly code: 'division-by-zero' };

export interface ProjectionItem {
  readonly header: string;
  readonly expressionTokens: readonly string[];
  readonly alias: string | null;
  readonly aliasKind: 'explicit' | 'implicit' | null;
  readonly isStar: boolean;
}

export interface ProjectionQuery {
  readonly distinct: boolean;
  readonly items: readonly ProjectionItem[];
  readonly table: string;
}

export type ProjectionAnalysis =
  | { readonly ok: true; readonly query: ProjectionQuery; readonly result: ResultTable }
  | { readonly ok: false; readonly error: ProjectionError };

const TOKEN = /[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[(),;*+\-/]|\S/g;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const KEYWORDS = new Set(['SELECT', 'DISTINCT', 'FROM', 'AS']);

export function tokenizeSql(text: string): readonly string[] {
  return text.match(TOKEN) ?? [];
}

/** Aplana los textos de piezas o fragmentos en tokens. */
export function tokensFromPieces(texts: readonly string[]): readonly string[] {
  return texts.flatMap((text) => tokenizeSql(text));
}

const upper = (token: string | undefined) => (token ?? '').toUpperCase();
const isIdentifier = (token: string | undefined) =>
  token !== undefined && IDENTIFIER.test(token) && !KEYWORDS.has(upper(token));

function splitItems(tokens: readonly string[]): string[][] {
  const items: string[][] = [[]];
  let depth = 0;
  for (const token of tokens) {
    if (token === '(') depth++;
    if (token === ')') depth--;
    if (token === ',' && depth === 0) items.push([]);
    else items.at(-1)!.push(token);
  }
  return items;
}

function parseItem(tokens: readonly string[], position: number): ProjectionItem | ProjectionError {
  if (tokens.length === 0) return { code: 'empty-item', position };
  const keyword = tokens.find((token) => KEYWORDS.has(upper(token)) && upper(token) !== 'AS');
  if (keyword) return { code: 'misplaced-keyword', keyword: upper(keyword), position };
  if (tokens.length === 1 && tokens[0] === '*') {
    return { header: '*', expressionTokens: ['*'], alias: null, aliasKind: null, isStar: true };
  }
  let expressionTokens = [...tokens];
  let alias: string | null = null;
  let aliasKind: ProjectionItem['aliasKind'] = null;
  const asIndex = tokens.findIndex((token) => upper(token) === 'AS');
  if (asIndex !== -1) {
    const name = tokens[asIndex + 1];
    if (!isIdentifier(name) || asIndex + 2 !== tokens.length) {
      return { code: 'alias-without-name', position };
    }
    expressionTokens = tokens.slice(0, asIndex);
    alias = name!;
    aliasKind = 'explicit';
  } else if (tokens.length >= 2 && isIdentifier(tokens.at(-1))) {
    const before = tokens.at(-2)!;
    if (isIdentifier(before) || before === ')' || /^\d/.test(before)) {
      expressionTokens = tokens.slice(0, -1);
      alias = tokens.at(-1)!;
      aliasKind = 'implicit';
    }
  }
  if (expressionTokens.length === 0) return { code: 'empty-item', position };
  // `* alias` no es válido: el asterisco no admite alias.
  if (expressionTokens.length === 1 && expressionTokens[0] === '*') return { code: 'star-mixed' };
  if (!parseExpression(expressionTokens).ok) return { code: 'invalid-expression', position };
  const header = alias ? normalizeIdentifier(alias) : expressionTokens.join('').toUpperCase();
  return { header, expressionTokens, alias, aliasKind, isStar: false };
}

function evaluateItems(
  query: ProjectionQuery,
):
  | { readonly ok: true; readonly result: ResultTable }
  | { readonly ok: false; readonly error: ProjectionError } {
  const columns = query.items.flatMap((item) =>
    item.isStar ? EMPLEADOS_DATASET.columns.map(({ name }) => name) : [item.header],
  );
  const parsed: (ExpressionNode | 'star')[] = [];
  for (const item of query.items) {
    if (item.isStar) {
      parsed.push('star');
      continue;
    }
    const expression = parseExpression(item.expressionTokens);
    if (!expression.ok) return { ok: false, error: { code: 'invalid-expression', position: 0 } };
    parsed.push(expression.node);
  }
  const rows: CellValue[][] = [];
  for (const row of EMPLEADOS_DATASET.rows) {
    const values: CellValue[] = [];
    for (const node of parsed) {
      if (node === 'star') {
        values.push(...EMPLEADOS_DATASET.columns.map(({ name }) => row[name]));
        continue;
      }
      if (node.kind === 'column') {
        if (!isEmpleadosColumn(node.name)) {
          return { ok: false, error: { code: 'unknown-column', column: node.name } };
        }
        values.push(row[node.name]);
        continue;
      }
      const value = evaluateExpression(node, row);
      if (!value.ok) {
        if (value.error === 'division-by-zero')
          return { ok: false, error: { code: 'division-by-zero' } };
        const column = firstColumn(node, value.error === 'unknown-column' ? unknown : textual);
        return {
          ok: false,
          error:
            value.error === 'unknown-column'
              ? { code: 'unknown-column', column }
              : { code: 'not-numeric', column },
        };
      }
      values.push(value.value);
    }
    rows.push(values);
  }
  const table: ResultTable = { columns, rows };
  return { ok: true, result: query.distinct ? distinctRows(table) : table };
}

const unknown = (name: string) => !isEmpleadosColumn(name);
const textual = (name: string) =>
  EMPLEADOS_DATASET.columns.some((column) => column.name === name && column.type === 'text');

function firstColumn(node: ExpressionNode, predicate: (name: string) => boolean): string {
  if (node.kind === 'column') return predicate(node.name) ? node.name : '';
  if (node.kind === 'binary')
    return firstColumn(node.left, predicate) || firstColumn(node.right, predicate);
  return '';
}

export function analyzeProjection(input: readonly string[]): ProjectionAnalysis {
  const invalid = input.find(
    (token) => !/^([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[(),;*+\-/])$/.test(token),
  );
  if (invalid !== undefined)
    return { ok: false, error: { code: 'invalid-character', character: invalid } };
  const tokens = input.at(-1) === ';' ? input.slice(0, -1) : [...input];
  if (tokens.length === 0) return { ok: false, error: { code: 'empty' } };
  if (upper(tokens[0]) !== 'SELECT') return { ok: false, error: { code: 'missing-select' } };
  const fromIndex = tokens.findIndex((token) => upper(token) === 'FROM');
  if (fromIndex === -1) return { ok: false, error: { code: 'missing-from' } };
  const table = tokens[fromIndex + 1];
  if (table === undefined) return { ok: false, error: { code: 'missing-table' } };
  if (normalizeIdentifier(table) !== EMPLEADOS_DATASET.table) {
    return { ok: false, error: { code: 'unknown-table', table } };
  }
  const trailing = tokens.slice(fromIndex + 2);
  if (trailing.length > 0)
    return { ok: false, error: { code: 'trailing-tokens', tokens: trailing } };
  const distinct = upper(tokens[1]) === 'DISTINCT';
  const selectList = tokens.slice(distinct ? 2 : 1, fromIndex);
  const items: ProjectionItem[] = [];
  const groups = splitItems(selectList);
  for (const [position, group] of groups.entries()) {
    const item = parseItem(group, position);
    if ('code' in item) return { ok: false, error: item };
    items.push(item);
  }
  if (items.some((item) => item.isStar) && items.length > 1)
    return { ok: false, error: { code: 'star-mixed' } };
  const query: ProjectionQuery = { distinct, items, table: EMPLEADOS_DATASET.table };
  const evaluated = evaluateItems(query);
  return evaluated.ok ? { ok: true, query, result: evaluated.result } : evaluated;
}
