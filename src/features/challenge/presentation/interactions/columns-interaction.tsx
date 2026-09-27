'use client';

import { ChangeSummary } from '@/presentation/components/data/change-summary';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { EMPLEADOS, sampleResult } from '../../application/challenge-api';
import { MISSION_CONTEXT } from '../mission-context';
import { SampleTable, sizeOf } from './sample-table';
import type { InteractionProps } from './types';

/**
 * M01: elegir y ordenar las columnas de SELECT. El resultado se calcula en vivo sobre las
 * mismas filas de la muestra: cambian las columnas, no las filas.
 */
export function ColumnsInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'drag-column'>) {
  const sample = MISSION_CONTEXT[mission.id].sample;
  const pieces = mission.publicData.availableColumns.map((column) => ({
    id: column,
    text: column.toLowerCase(),
    role: 'column',
  }));
  const result =
    sample && answer.columns.length > 0
      ? sampleResult(`SELECT ${answer.columns.join(', ')} FROM empleados`, sample.rowIds)
      : null;
  return (
    <div className="ch-stack">
      <SequenceBuilder
        label="Tu consulta"
        paletteLabel="Columnas de EMPLEADOS"
        pieces={pieces}
        value={answer.columns}
        onChange={(columns) => onChange({ type: 'drag-column', columns })}
        prefix="SELECT"
        suffix="FROM empleados;"
        separator=","
        emptyText="Arrastra o toca columnas para añadirlas"
        disabled={disabled}
      />
      <div className="ch-result" aria-live="polite">
        {result && sample ? (
          <>
            <ChangeSummary
              rows={[sample.rowIds.length, result.rows.length]}
              columns={[EMPLEADOS.columns.length, result.columns.length]}
            />
            <SampleTable
              caption="Resultado de tu consulta sobre la muestra de trabajo"
              label="Resultado de tu consulta"
              result={result}
              summary={`${sizeOf(result.rows.length, result.columns.length)} · las mismas filas de la muestra`}
            />
          </>
        ) : (
          <p className="ch-calc">
            Cuando añadas columnas, aquí verás tu resultado sobre las mismas filas de la muestra.
          </p>
        )}
      </div>
    </div>
  );
}
