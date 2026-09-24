'use client';

import { useId } from 'react';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { CodeBlock } from '@/presentation/components/ui';
import { EMPLEADOS } from '../../application/challenge-api';
import { SourceTable } from '../source-table';
import type { InteractionProps } from './types';

/** M03 y M04: construir los encabezados de un resultado y sus filas o su número. */
export function PredictInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'predict-result'>) {
  const countId = useId();
  const { query, headerOptions, asks } = mission.publicData;
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
      <CodeBlock code={query} label="Consulta" />
      {asks.rowSelection ? (
        <SourceTable
          caption="Marca las filas de EMPLEADOS que aparecen en el resultado"
          extraColumns={[
            {
              id: 'incluir',
              header: 'En el resultado',
              cell: (row) => (
                <label className="ch-check">
                  <input
                    type="checkbox"
                    checked={answer.sourceRowIds.includes(row.ID)}
                    onChange={() => toggleRow(row.ID)}
                    disabled={disabled}
                  />
                  <span className="ds-sr-only">Incluir a {row.NOMBRE}</span>
                </label>
              ),
            },
          ]}
        />
      ) : (
        <SourceTable caption="Tabla EMPLEADOS: observa su esquema" />
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
