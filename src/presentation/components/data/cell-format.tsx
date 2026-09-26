/**
 * Formato de presentación único para las tablas de la plataforma: números con separador de
 * miles colombiano (sin cambiar su valor), fechas 'AAAA-MM-DD' tal cual y NULL visible.
 */

const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Identificadores y años (menos de 1000) se muestran sin separador. */
export function formatCell(value: string | number | null): string {
  if (value === null) return 'NULL';
  return typeof value === 'number' && Math.abs(value) >= 1000
    ? numberFormat.format(value)
    : String(value);
}

export function NullValue() {
  return (
    <span className="hl-null">
      NULL<span className="visually-hidden"> (sin valor)</span>
    </span>
  );
}

/** Celda lista para una tabla: NULL con estilo propio y texto accesible. */
export function CellValueView({ value }: { readonly value: string | number | null }) {
  return value === null ? <NullValue /> : <>{formatCell(value)}</>;
}
