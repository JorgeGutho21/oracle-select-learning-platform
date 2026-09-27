'use client';

import { useId } from 'react';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { EMPLEADOS, queryTrace, type EmpleadosColumn } from '../../application/challenge-api';
import { RowPicker } from '../row-picker';
import type { InteractionProps } from './types';

/**
 * M03 y M04: construir los encabezados de un resultado y marcar sus filas (sobre una
 * muestra que contiene todas las que importan) o indicar su número.
 */
export function PredictInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
}: InteractionProps<'predict-result'>) {
  const countId = useId();
  const { query, headerOptions, asks, sourceColumns, sampleIds } = mission.publicData;
  const trace = reveal && asks.rowSelection ? queryTrace(query) : null;
  const pieces = headerOptions.map((header) => ({ id: header, text: header, role: 'column' }));
  const set = (patch: Partial<typeof answer>) => onChange({ ...answer, ...patch });
  const toggleRow = (id: number) =>
    set({
      sourceRowIds: answer.sourceRowIds.includes(id)
        ? answer.sourceRowIds.filter((item) => item !== id)
        : [...answer.sourceRowIds, id],
    });
  return (
    <div className="ch-stack">
      {asks.rowSelection && (
        <RowPicker
          legend="¿Qué filas de la muestra aparecen en el resultado?"
          columns={
            (sourceColumns ?? EMPLEADOS.columns.map(({ name }) => name)) as EmpleadosColumn[]
          }
          rowIds={sampleIds ?? EMPLEADOS.rows.map((row) => row.ID_EMPLEADO)}
          selected={answer.sourceRowIds}
          onToggle={toggleRow}
          disabled={disabled}
          {...(trace ? { kept: trace.keptIds, focusColumns: trace.whereColumns } : {})}
        />
      )}
      {asks.headers && (
        <SequenceBuilder
          label="Encabezados del resultado, en orden"
          paletteLabel="Encabezados posibles"
          pieces={pieces}
          value={answer.headers}
          onChange={(headers) => set({ headers })}
          emptyText="Arrastra o pulsa encabezados"
          disabled={disabled}
        />
      )}
      {asks.rowCount && (
        <div className="ch-field">
          <label htmlFor={countId}>¿Cuántas filas devuelve?</label>
          <input
            id={countId}
            className="ch-input ch-input--short"
            type="number"
            inputMode="numeric"
            min={0}
            max={EMPLEADOS.rows.length * 10}
            value={answer.rowCount ?? ''}
            onChange={(event) =>
              set({ rowCount: event.target.value === '' ? null : Number(event.target.value) })
            }
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
