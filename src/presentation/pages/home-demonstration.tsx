'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { EMPLEADOS, analyzeLabQuery } from '@/features/laboratory/application/lab-api';
import { HighlightTable } from '@/presentation/components/data/highlight-table';

const INITIAL = ['NOMBRE', 'CIUDAD'];

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

  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  return (
    <div className="home-demo">
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
          Abrir en el laboratorio <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-demo__result">
        {preview ? (
          <HighlightTable
            caption="Resultado de la demostración"
            columns={preview.columns}
            rows={preview.rows}
            summary={`Vista educativa · ${preview.rows.length} filas · ${preview.columns.length} ${
              preview.columns.length === 1 ? 'columna' : 'columnas'
            }`}
          />
        ) : (
          <p className="home-demo__empty">El resultado aparecerá aquí.</p>
        )}
      </div>
    </div>
  );
}
