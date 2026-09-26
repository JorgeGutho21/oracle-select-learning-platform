import type { CellValue } from '@/domain/dataset/empleados';

/**
 * Semántica de valores de Oracle que comparten el evaluador y las vistas: comparación
 * binaria de textos (NLS_SORT = BINARY), NULL, LIKE y conversión de números a texto.
 */

export type Truth = 'true' | 'false' | 'unknown';

export function and(left: Truth, right: Truth): Truth {
  if (left === 'false' || right === 'false') return 'false';
  if (left === 'unknown' || right === 'unknown') return 'unknown';
  return 'true';
}

export function or(left: Truth, right: Truth): Truth {
  if (left === 'true' || right === 'true') return 'true';
  if (left === 'unknown' || right === 'unknown') return 'unknown';
  return 'false';
}

export function not(value: Truth): Truth {
  return value === 'true' ? 'false' : value === 'false' ? 'true' : 'unknown';
}

/** Texto de un número como lo convierte Oracle sin formato (TO_CHAR): 0.5 → «.5». */
export function numberText(value: number): string {
  const text = String(value);
  return text.replace(/^(-?)0\./, '$1.');
}

export function toText(value: CellValue): string | null {
  if (value === null) return null;
  return typeof value === 'number' ? numberText(value) : value;
}

/**
 * Compara dos valores no nulos. Números por su valor; textos y fechas ('AAAA-MM-DD') por
 * código de carácter, como NLS_SORT = BINARY. Un texto numérico frente a un número se
 * convierte, como hace Oracle; si no es numérico, la comparación falla (ORA-01722).
 */
export function compareValues(
  left: string | number,
  right: string | number,
): { readonly ok: true; readonly order: number } | { readonly ok: false } {
  if (typeof left === 'number' && typeof right === 'number') {
    return { ok: true, order: Math.sign(left - right) };
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return { ok: true, order: left < right ? -1 : left > right ? 1 : 0 };
  }
  const text = typeof left === 'string' ? left : (right as string);
  if (!/^\s*[-+]?\d+(\.\d+)?\s*$/.test(text)) return { ok: false };
  const a = typeof left === 'string' ? Number(left) : left;
  const b = typeof right === 'string' ? Number(right) : right;
  return { ok: true, order: Math.sign(a - b) };
}

/* ---------- LIKE ---------- */

export type LikeSegmentKind = 'literal' | 'one' | 'any';

export interface LikeSegment {
  readonly text: string;
  /** `literal`: coincide con texto del patrón; `one`: un carácter de `_`; `any`: parte de `%`. */
  readonly kind: LikeSegmentKind;
}

interface PatternPart {
  readonly kind: LikeSegmentKind;
  readonly text: string;
}

function patternParts(pattern: string): PatternPart[] {
  const parts: PatternPart[] = [];
  for (const char of pattern) {
    if (char === '%') {
      if (parts.at(-1)?.kind !== 'any') parts.push({ kind: 'any', text: '' });
    } else if (char === '_') {
      parts.push({ kind: 'one', text: '' });
    } else if (parts.at(-1)?.kind === 'literal') {
      const last = parts.pop()!;
      parts.push({ kind: 'literal', text: last.text + char });
    } else {
      parts.push({ kind: 'literal', text: char });
    }
  }
  return parts;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function likeExpression(pattern: string, flags = 'u'): { regex: RegExp; parts: PatternPart[] } {
  const parts = patternParts(pattern);
  const body = parts
    .map((part) =>
      part.kind === 'literal'
        ? `(${escapeRegExp(part.text)})`
        : part.kind === 'one'
          ? '([\\s\\S])'
          : '([\\s\\S]*?)',
    )
    .join('');
  return { regex: new RegExp(`^${body}$`, flags), parts };
}

/** LIKE de Oracle: distingue mayúsculas; % es cualquier cantidad de caracteres y _ uno. */
export function likeMatches(value: string, pattern: string): boolean {
  return likeExpression(pattern).regex.test(value);
}

/** Partes del valor que explican la coincidencia, para resaltarlas; `null` si no coincide. */
export function likeSegments(value: string, pattern: string): LikeSegment[] | null {
  const { regex, parts } = likeExpression(pattern);
  const match = regex.exec(value);
  if (!match) return null;
  return parts
    .map((part, index) => ({ kind: part.kind, text: match[index + 1] ?? '' }))
    .filter((segment) => segment.text !== '');
}

/** Normaliza para comparar sin mayúsculas ni tildes (solo para avisos pedagógicos). */
export function looseText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** LIKE sin distinguir mayúsculas ni tildes (solo para avisos pedagógicos). */
export function looseLikeMatches(value: string, pattern: string): boolean {
  return likeMatches(looseText(value), looseText(pattern));
}
