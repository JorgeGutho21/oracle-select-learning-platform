'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { EMPLEADOS, analyzeLabQuery } from '@/features/laboratory/application/lab-api';
import { HighlightTable } from '@/presentation/components/data/highlight-table';

const INITIAL = ['NOMBRE', 'CIUDAD'];
const VISIBLE_ROWS = 8;

/**
 * Distribución según cuántas columnas se eligen: con 1–4, controles y resultado lado a lado;
 * con 5–7, el resultado ocupa todo el ancho bajo los controles; con 8–12, además, la vista de
 * datos reparte las columnas en bandas sincronizadas en lugar de fichas largas.
 */
function layoutFor(count: number): 'few' | 'some' | 'many' {
  return count <= 4 ? 'few' : count <= 7 ? 'some' : 'many';
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Demostración de proyección: el resultado sale del motor educativo sobre el dataset
 * compartido. Es una vista previa, no una ejecución en Oracle.
 */
export function HomeDemonstration() {
  const [selected, setSelected] = useState<readonly string[]>(INITIAL);
  const list = selected.map((name) => name.toLowerCase()).join(', ');
  const sql = selected.length > 0 ? `SELECT ${list}\nFROM empleados;` : '';
  const preview = sql ? analyzeLabQuery(sql).preview : null;
  const labHref = `/lab?${new URLSearchParams({ sql: sql || 'SELECT * FROM empleados;' }).toString()}`;
  const layout = layoutFor(selected.length);

  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  const shown = preview ? Math.min(VISIBLE_ROWS, preview.rows.length) : 0;

  return (
    <div className={`home-demo home-demo--${layout}`} data-columns={selected.length}>
      <div className="home-demo__controls">
        <fieldset className="home-demo__columns">
          <legend>Columnas de EMPLEADOS</legend>
          <div>
            {EMPLEADOS.columns.map(({ name }) => {
              const position = selected.indexOf(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={position >= 0}
                  onClick={() => toggle(name)}
                >
                  {position >= 0 && <span className="home-demo__order">{position + 1}</span>}
                  {name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="home-demo__side">
          <div className="home-demo__query" aria-live="polite">
            <span className="home-demo__label">Tu consulta</span>
            {sql ? (
              <pre>
                <code>
                  <b>SELECT</b> {list}
                  {'\n'}
                  <b>FROM</b> empleados;
                </code>
              </pre>
            ) : (
              <p>Elige al menos una columna para escribir la consulta.</p>
            )}
          </div>
          <Link className="hero-action hero-action--primary" href={labHref as Route}>
            Abrir en Lab <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="home-demo__result">
        {preview ? (
          <>
            <HighlightTable
              caption="Resultado de la demostración"
              label="Resultado"
              columns={preview.columns}
              rows={preview.rows.slice(0, VISIBLE_ROWS)}
              detail={preview.columns.length > 7 ? 'summary' : 'full'}
              summary={`${shown} de ${plural(preview.rows.length, 'fila', 'filas')} · ${plural(
                preview.columns.length,
                'columna',
                'columnas',
              )}`}
            />
            <p className="home-demo__note">
              Vista educativa: SELECT devuelve las {preview.rows.length} filas; aquí ves las
              primeras {shown}.
            </p>
          </>
        ) : (
          <p className="home-demo__empty">El resultado aparecerá aquí.</p>
        )}
      </div>
    </div>
  );
}
