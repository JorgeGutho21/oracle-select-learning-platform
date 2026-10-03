import type { DataTable } from '../domain/question';

/** Valores de los formularios del profesor sin dependencias (se usan también en el navegador). */

/**
 * Fechas del formulario (datetime-local) en hora de Colombia. Colombia no tiene horario de
 * verano: UTC−5 todo el año.
 */
const BOGOTA_OFFSET = '-05:00';

export function localToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${BOGOTA_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return '';
  return new Date(time - 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

/**
 * Tabla de origen escrita como texto: la primera línea son las columnas y cada línea
 * siguiente una fila, con los valores separados por «|». NULL se escribe NULL.
 */
export function parseExhibitTable(raw: string): DataTable | null | 'invalid' {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const split = (line: string) => line.split('|').map((cell) => cell.trim());
  const columns = split(lines[0]!);
  if (columns.some((column) => column === '') || columns.length > 12 || lines.length > 31) {
    return 'invalid';
  }
  const rows = lines.slice(1).map((line) =>
    split(line).map((cell) => {
      if (cell.toUpperCase() === 'NULL') return null;
      return /^-?\d+(\.\d+)?$/.test(cell) ? Number(cell) : cell;
    }),
  );
  if (rows.some((row) => row.length !== columns.length)) return 'invalid';
  return { columns, rows };
}

export function exhibitTableText(table: DataTable | undefined): string {
  if (!table) return '';
  return [
    table.columns.join(' | '),
    ...table.rows.map((row) =>
      row.map((cell) => (cell === null ? 'NULL' : String(cell))).join(' | '),
    ),
  ].join('\n');
}

export const MAX_FORM_OPTIONS = 8;
