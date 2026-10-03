import { ChangeSummary } from './change-summary';
import { SqlCode } from './sql-code';

/**
 * Patrón pedagógico de DB LAB: tabla original → consulta → qué hace → resultado → qué
 * cambió. Admite varias tablas de origen para que JOIN, GROUP BY y las subconsultas usen la
 * misma lectura que SELECT. Las cifras las calcula quien llama, a partir del motor.
 */

export interface TransformationSource {
  readonly name: string;
  readonly rows: number;
  readonly columns: number;
}

export interface QueryTransformationProps {
  readonly sources: readonly TransformationSource[];
  readonly sql: string;
  /** Qué hace la consulta, en una o dos frases. */
  readonly explanation: string;
  readonly result: { readonly rows: number; readonly columns: number };
  /** Rótulo del resultado: «Vista educativa» o «Resultado de Oracle». */
  readonly resultLabel: string;
  readonly tone?: 'light' | 'dark';
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function Dimensions({ rows, columns }: { readonly rows: number; readonly columns: number }) {
  return (
    <span className="qt-dimensions">
      <span>{plural(rows, 'fila', 'filas')}</span>
      <span>{plural(columns, 'columna', 'columnas')}</span>
    </span>
  );
}

export function QueryTransformation({
  sources,
  sql,
  explanation,
  result,
  resultLabel,
  tone = 'light',
}: QueryTransformationProps) {
  // Con una sola tabla, el cambio se lee como antes → después. Con varias (JOIN), las
  // filas no se suman: el resumen se omite y cada origen muestra sus propias cifras.
  const single = sources.length === 1 ? sources[0] : undefined;
  return (
    <ol className={`qt qt--${tone}`} aria-label="De la tabla original al resultado">
      <li className="qt__step">
        <span className="qt__label">
          {sources.length > 1 ? 'Tablas originales' : 'Tabla original'}
        </span>
        {sources.map((source) => (
          <span key={source.name} className="qt__table">
            <strong>{source.name}</strong>
            <Dimensions rows={source.rows} columns={source.columns} />
          </span>
        ))}
      </li>
      <li className="qt__step qt__step--query">
        <span className="qt__label">Consulta</span>
        <SqlCode sql={sql} />
      </li>
      <li className="qt__step">
        <span className="qt__label">Qué hace</span>
        <p className="qt__explanation">{explanation}</p>
      </li>
      <li className="qt__step">
        <span className="qt__label">{resultLabel}</span>
        <span className="qt__table">
          <strong>Resultado</strong>
          <Dimensions rows={result.rows} columns={result.columns} />
        </span>
        {single && (
          <ChangeSummary
            rows={[single.rows, result.rows]}
            columns={[single.columns, result.columns]}
            className="qt__change"
          />
        )}
      </li>
    </ol>
  );
}
