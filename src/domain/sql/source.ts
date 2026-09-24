/** Tramo de texto fuente: desplazamientos en unidades UTF-16, `end` exclusivo. */
export interface Span {
  readonly start: number;
  readonly end: number;
}

export interface Position {
  readonly line: number;
  readonly column: number;
}

/** Línea y columna (desde 1) de un desplazamiento del texto fuente. */
export function positionAt(source: string, offset: number): Position {
  let line = 1;
  let lineStart = 0;
  const limit = Math.min(Math.max(offset, 0), source.length);
  for (let index = 0; index < limit; index++) {
    if (source[index] === '\n') {
      line++;
      lineStart = index + 1;
    }
  }
  return { line, column: limit - lineStart + 1 };
}

export function joinSpans(first: Span, last: Span): Span {
  return { start: first.start, end: last.end };
}
