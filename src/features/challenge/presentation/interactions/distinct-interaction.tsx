'use client';

import { useId } from 'react';
import { ChangeSummary } from '@/presentation/components/data/change-summary';
import { CodeBlock } from '@/presentation/components/ui';
import { EMPLEADOS, sampleResult } from '../../application/challenge-api';
import { MISSION_CONTEXT } from '../mission-context';
import { SampleTable } from './sample-table';
import type { InteractionProps } from './types';

/** Índices de las filas que repiten una anterior (lo que DISTINCT quita). */
function repeated(rows: readonly (readonly (string | number | null)[])[]): number[] {
  const seen = new Set<string>();
  return rows.flatMap((row, index) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return [index];
    seen.add(key);
    return [];
  });
}

/**
 * M07: predecir qué valores deja DISTINCT con una columna y cuántas filas deja con un par.
 * Al cerrar la misión se comparan ANTES (con las repetidas marcadas) y DESPUÉS.
 */
export function DistinctInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
}: InteractionProps<'distinct-result'>) {
  const countId = useId();
  const { query, pairQuery, options } = mission.publicData;
  const sample = MISSION_CONTEXT[mission.id].sample;
  const toggle = (value: string) =>
    onChange({
      ...answer,
      values: answer.values.includes(value)
        ? answer.values.filter((item) => item !== value)
        : options.filter((option) => [...answer.values, value].includes(option)),
    });
  const ids = sample?.rowIds ?? EMPLEADOS.rows.map((row) => row.ID_EMPLEADO);
  const single = reveal ? sampleResult(query.replace('DISTINCT ', ''), ids) : null;
  const singleAfter = reveal ? sampleResult(query, ids) : null;
  const pair = reveal ? sampleResult(pairQuery.replace('DISTINCT ', ''), ids) : null;
  const pairAfter = reveal ? sampleResult(pairQuery, ids) : null;

  return (
    <div className="ch-stack">
      <fieldset className="ch-options">
        <legend className="ch-builder__label">
          Paso 1 · ¿Qué ciudades devuelve la consulta objetivo?
        </legend>

        <div className="ch-options__list">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="ch-option"
              aria-pressed={answer.values.includes(option)}
              onClick={() => toggle(option)}
              disabled={disabled}
            >
              {answer.values.includes(option) && <span aria-hidden="true">✓ </span>}
              {option}
            </button>
          ))}
        </div>
        <p className="ch-muted" aria-live="polite">
          {answer.values.length === 0
            ? 'Toca las ciudades que aparecerán en el resultado.'
            : `Tu predicción: ${answer.values.join(', ')} (${answer.values.length} ${answer.values.length === 1 ? 'fila' : 'filas'}).`}
        </p>
      </fieldset>

      <div className="ch-field">
        <label htmlFor={countId} className="ch-builder__label">
          Paso 2 · Mini reto: ¿cuántas filas devuelve DISTINCT con dos columnas?
        </label>
        <CodeBlock code={pairQuery} label="Consulta con un par de columnas" />
        <input
          id={countId}
          className="ch-input ch-input--short"
          type="number"
          inputMode="numeric"
          min={0}
          max={EMPLEADOS.rows.length}
          value={answer.pairCount ?? ''}
          onChange={(event) =>
            onChange({
              ...answer,
              pairCount: event.target.value === '' ? null : Number(event.target.value),
            })
          }
          disabled={disabled}
        />
      </div>

      {single && singleAfter && pair && pairAfter && (
        <div className="ch-reveal" aria-live="polite">
          <div className="ch-compare ch-compare--flow ch-compare--tables ch-compare--narrow">
            <div className="ch-compare__panel">
              <SampleTable
                caption="Ciudades de los analistas, sin DISTINCT"
                label="Antes · sin DISTINCT"
                result={single}
                duplicateRows={repeated(single.rows)}
                source
              />
            </div>
            <p className="ch-compare__arrow" aria-hidden="true">
              <span>DISTINCT</span>
            </p>
            <div className="ch-compare__panel ch-compare__panel--result">
              <SampleTable
                caption="Ciudades de los analistas, con DISTINCT"
                label="Después"
                result={singleAfter}
              />
            </div>
          </div>
          <ChangeSummary
            rows={[single.rows.length, singleAfter.rows.length]}
            columns={[single.columns.length, singleAfter.columns.length]}
            label="Con una columna"
          />
          <div className="ch-compare ch-compare--flow ch-compare--tables">
            <div className="ch-compare__panel">
              <SampleTable
                caption="Pares ciudad y departamento, sin DISTINCT"
                label="Antes · pares"
                result={pair}
                duplicateRows={repeated(pair.rows)}
                source
              />
            </div>
            <p className="ch-compare__arrow" aria-hidden="true">
              <span>DISTINCT</span>
            </p>
            <div className="ch-compare__panel ch-compare__panel--result">
              <SampleTable
                caption="Pares con DISTINCT"
                label="Después · pares"
                result={pairAfter}
              />
            </div>
          </div>
          <p className="ch-rule">
            <strong>Regla:</strong> DISTINCT quita filas repetidas <em>del resultado</em>. Con dos
            columnas compara el par completo. No borra registros de la tabla ni ordena.
          </p>
        </div>
      )}
    </div>
  );
}
