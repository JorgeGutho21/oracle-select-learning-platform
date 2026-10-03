const numberFormat = new Intl.NumberFormat('es-CO');

/** Formato colombiano de presentación; no altera el valor evaluado. */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPercent(ratio: number | null): string {
  return ratio === null ? 'Sin datos' : `${Math.round(ratio * 100)} %`;
}

/** Convierte lo escrito por el estudiante en número; admite separadores de miles. */
export function parseTypedNumber(text: string): number | null {
  const digits = text.replace(/[\s.]/g, '').replace(',', '.');
  if (digits === '' || !/^\d+(\.\d+)?$/.test(digits)) return null;
  return Number(digits);
}
