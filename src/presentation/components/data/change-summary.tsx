/**
 * «Qué cambió en los datos»: filas y columnas antes y después de una consulta, con la
 * dimensión que cambia destacada (con texto, no solo color). Enseña de un vistazo que WHERE
 * cambia filas, SELECT columnas, DISTINCT quita repetidas y ORDER BY solo reordena.
 */
export interface ChangeSummaryProps {
  readonly rows: readonly [number, number];
  readonly columns: readonly [number, number];
  /** Las filas son las mismas, en otro orden (ORDER BY). */
  readonly reordered?: boolean;
  /** Solo cambian los encabezados (AS). */
  readonly renamed?: boolean;
  /** Dato complementario al final («tabla completa: 5 de 20»). */
  readonly extra?: string;
  readonly label?: string;
  readonly className?: string;
}

const noun = (count: number, one: string, many: string) => (count === 1 ? one : many);

function Item({
  name,
  before,
  after,
  one,
  many,
}: {
  readonly name: string;
  readonly before: number;
  readonly after: number;
  readonly one: string;
  readonly many: string;
}) {
  const same = before === after;
  return (
    <li className={`change-summary__item ${same ? 'is-same' : 'is-changed'}`}>
      <span className="change-summary__name">{name}</span>{' '}
      {same ? (
        <>
          <span className="change-summary__value">{after}</span>{' '}
          <span className="change-summary__note">sin cambios</span>
        </>
      ) : (
        <>
          <span className="change-summary__value">{before}</span>
          <span aria-hidden="true"> → </span>
          <span className="visually-hidden"> pasan a </span>
          <span className="change-summary__value">{after}</span>{' '}
          <span className="visually-hidden">{noun(after, one, many)}</span>
        </>
      )}
    </li>
  );
}

export function ChangeSummary({
  rows,
  columns,
  reordered = false,
  renamed = false,
  extra,
  label = 'Qué cambió',
  className = '',
}: ChangeSummaryProps) {
  return (
    <div className={['change-summary', className].filter(Boolean).join(' ')}>
      <p className="change-summary__label">{label}</p>
      <ul className="change-summary__list">
        <Item name="Filas" before={rows[0]} after={rows[1]} one="fila" many="filas" />
        <Item
          name="Columnas"
          before={columns[0]}
          after={columns[1]}
          one="columna"
          many="columnas"
        />
        {reordered && (
          <li className="change-summary__item is-changed">
            <span className="change-summary__name">Orden</span>{' '}
            <span className="change-summary__note">nuevo orden de las mismas filas</span>
          </li>
        )}
        {renamed && (
          <li className="change-summary__item is-changed">
            <span className="change-summary__name">Encabezado</span>{' '}
            <span className="change-summary__note">nuevo nombre, mismos valores</span>
          </li>
        )}
        {extra && <li className="change-summary__item change-summary__extra">{extra}</li>}
      </ul>
    </div>
  );
}
