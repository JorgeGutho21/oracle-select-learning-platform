import { Fragment } from 'react';
import type {
  ExampleErrorView,
  ExampleView,
  TableView,
  VerificationView,
} from '../application/curriculum-api';
import { DataView, anchorIndexes } from '@/presentation/components/data/data-view';
import { SqlCode, SqlLines } from '@/presentation/components/data/sql-code';
import { explainOracleError } from '../application/learning-feedback';

/**
 * Piezas comunes de los ejemplos del currículo: tablas (siempre como tabla, nunca como fichas),
 * código SQL o PL/SQL, salida de DBMS_OUTPUT, errores de Oracle tal como los devuelve el
 * motor y el sello de verificación. Todo se renderiza en el servidor.
 */

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function tableSummary(table: TableView): string {
  const rows =
    table.rows.length < table.totalRows
      ? `${table.rows.length} de ${plural(table.totalRows, 'fila', 'filas')}`
      : plural(table.rows.length, 'fila', 'filas');
  return `${rows} · ${plural(table.columns.length, 'columna', 'columnas')}`;
}

const CREATED =
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?(TRIGGER|PROCEDURE|FUNCTION|PACKAGE\s+BODY|PACKAGE)\s+(\w+)/i;

/** «TRIGGER trg_auditar_salario»: qué objeto crea un script de preparación. */
export function createdObject(code: string): string {
  const match = CREATED.exec(code);
  return match ? `${match[1]!.toUpperCase().replace(/\s+/, ' ')} ${match[2]}` : 'Preparación';
}

/**
 * Objetos que se crean antes de ejecutar el ejemplo, plegados: en la clase el código de
 * preparación puede ser largo y el profesor lo despliega solo si lo necesita.
 */
export function SetupFold({ setup }: { readonly setup: readonly string[] }) {
  if (setup.length === 0) return null;
  return (
    <details className="cu-setup">
      <summary>
        <span className="cu-setup__label">Antes se crea</span>{' '}
        {setup.map(createdObject).join(' · ')}
      </summary>
      <div className="cu-setup__code">
        {setup.map((code, index) => (
          <CodeView key={index} code={code} label={createdObject(code)} />
        ))}
      </div>
    </details>
  );
}

/** Consulta con la que se leyó el estado de una tabla antes o después de un bloque. */
export function ProbeQuery({ query }: { readonly query: string }) {
  return (
    <p className="cu-probe">
      <span className="cu-probe__label">Consulta de comprobación</span>{' '}
      <code className="cu-probe__code">{query}</code>
    </p>
  );
}

export function CurriculumTable({
  table,
  label,
  caption,
  size = 'regular',
  highlightedRow,
  groupColumns,
}: {
  readonly table: TableView;
  readonly label?: string;
  readonly caption?: string;
  readonly size?: 'regular' | 'compact' | 'large';
  /** Fila señalada (por ejemplo, la que procesa un cursor). */
  readonly highlightedRow?: number;
  /** Columnas simultáneas (identidad incluida) en pantallas estrechas; el resto, en pestañas. */
  readonly groupColumns?: number;
}) {
  // Una tabla compacta vive en una tarjeta o un pliegue estrecho: en un teléfono pasa a
  // identidad + una columna por pestaña, aunque tenga pocas columnas.
  const columnsPerGroup =
    groupColumns ??
    (size === 'compact' ? anchorIndexes(table.columns, table.schema).length + 1 : undefined);
  if (table.rows.length === 0) {
    return (
      <div className="cu-empty" role="status">
        {label && <p className="cu-empty__label">{label}</p>}
        <p>
          <strong>Sin filas.</strong> La consulta es válida, pero ninguna fila cumple las
          condiciones.
        </p>
        <p className="cu-empty__columns">
          Columnas: {table.columns.map((column) => column.name).join(', ')}
        </p>
      </div>
    );
  }
  return (
    <DataView
      caption={caption ?? table.title}
      {...(label ? { label } : {})}
      columns={table.columns}
      rows={table.rows}
      {...(table.schema ? { schema: table.schema } : {})}
      size={size}
      {...(highlightedRow !== undefined ? { highlightedRow } : {})}
      {...(columnsPerGroup !== undefined ? { groupColumns: columnsPerGroup } : {})}
      summary={tableSummary(table)}
      fallback={table.rows.length <= 6 ? 'bands' : 'groups'}
    />
  );
}

export function CodeView({
  code,
  label,
  tone = 'default',
  size = 'regular',
}: {
  readonly code: string;
  readonly label: string;
  readonly tone?: 'default' | 'error' | 'success';
  readonly size?: 'regular' | 'large';
}) {
  return <SqlCode sql={code} label={label} tone={tone} size={size} />;
}

/** Código con números de línea (para seguir un recorrido o un error «línea 5»). */
export function NumberedCode({
  code,
  label,
  current,
}: {
  readonly code: string;
  readonly label: string;
  readonly current?: number;
}) {
  return (
    <figure className="sql-code sql-code--default cu-numbered">
      <figcaption className="sql-code__label">{label}</figcaption>
      <pre className="sql-code__pre" aria-label={label}>
        <code>
          {code.split('\n').map((line, index) => (
            <span
              key={index}
              className={`cu-numbered__line${current === index + 1 ? ' cu-numbered__line--current' : ''}`}
              {...(current === index + 1 ? { 'aria-current': 'step' as const } : {})}
            >
              <span className="cu-numbered__number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="cu-numbered__text">
                <SqlLines sql={line} />
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

/**
 * Error para aprender: qué ocurrió, por qué, cómo corregirlo y el ejemplo correcto, en ese
 * orden. El código ORA o PLS de Oracle es el detalle técnico, plegado al final.
 */
export function OracleError({
  error,
  stage = false,
}: {
  readonly error: ExampleErrorView;
  /** Lienzo de clase: el ejemplo correcto queda plegado bajo su título. */
  readonly stage?: boolean;
}) {
  const generic = explainOracleError(error.code);
  const lesson = error.lesson;
  const what =
    lesson?.what ?? generic?.title ?? 'Oracle no pudo ejecutar la instrucción del ejemplo';
  const why =
    lesson?.why ??
    generic?.explanation ??
    'El ejemplo muestra a propósito una instrucción incorrecta para aprender a corregirla.';
  const fix = lesson?.fix ?? generic?.correction ?? null;
  return (
    <section
      className="cu-oracle-error"
      aria-label={`Error para aprender: ${what}`}
      data-error-kind="pedagogical"
    >
      <p className="study-part">Error para aprender</p>
      <p className="cu-oracle-error__title">
        <span aria-hidden="true">!</span> <strong>Qué ocurrió:</strong> {what}
      </p>
      <p>
        <strong>Por qué ocurrió:</strong> {why}
      </p>
      {fix && (
        <p>
          <strong>Cómo corregirlo:</strong> {fix}
        </p>
      )}
      {lesson &&
        (stage ? (
          <details className="cu-oracle-error__correct">
            <summary>Ejemplo correcto · Oracle lo ejecuta sin error</summary>
            <SqlCode sql={lesson.correct} tone="success" />
          </details>
        ) : (
          <SqlCode
            sql={lesson.correct}
            label="Ejemplo correcto · Oracle lo ejecuta sin error"
            tone="success"
          />
        ))}
      <details>
        <summary>
          Detalle técnico: <code>{error.code}</code>
        </summary>
        <pre className="cu-oracle-error__message">{error.message}</pre>
      </details>
    </section>
  );
}

export function OutputConsole({
  lines,
  label = 'Salida de DBMS_OUTPUT',
}: {
  readonly lines: readonly string[];
  readonly label?: string;
}) {
  return (
    <figure className="cu-console">
      <figcaption className="cu-console__label">{label}</figcaption>
      <pre className="cu-console__body" aria-label={label}>
        {lines.length === 0 ? (
          <span className="cu-console__empty">(sin líneas)</span>
        ) : (
          lines.map((line, index) => (
            <Fragment key={index}>
              {line}
              {'\n'}
            </Fragment>
          ))
        )}
      </pre>
    </figure>
  );
}

export function VerifiedNote({ verification }: { readonly verification: VerificationView }) {
  return (
    <p className="cu-verified">
      <span className="cu-verified__badge">Vista educativa</span> Resultados y mensajes obtenidos al
      ejecutar este código en {verification.engine} el {verification.verifiedAt}. No es una
      ejecución en vivo.
    </p>
  );
}

/** Resultado de un ejemplo: tabla verificada, salida PL/SQL o error de Oracle. */
export function ExampleOutcome({
  example,
  size = 'regular',
}: {
  readonly example: ExampleView;
  readonly size?: 'regular' | 'compact';
}) {
  return (
    <>
      {example.result && (
        <CurriculumTable table={example.result} label="Resultado" caption="Resultado" size={size} />
      )}
      {example.kind === 'plsql' && example.output.length > 0 && (
        <OutputConsole lines={example.output} />
      )}
      {example.error && <OracleError error={example.error} stage={size === 'compact'} />}
    </>
  );
}
