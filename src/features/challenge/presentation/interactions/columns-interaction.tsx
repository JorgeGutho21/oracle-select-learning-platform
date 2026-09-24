'use client';

import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { SourceTable } from '../source-table';
import type { InteractionProps } from './types';

/** M01: arrastrar columnas de EMPLEADOS a la lista de SELECT. */
export function ColumnsInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'drag-column'>) {
  const pieces = mission.publicData.availableColumns.map((column) => ({
    id: column,
    text: column.toLowerCase(),
    role: 'column',
  }));
  return (
    <div className="ch-stack">
      <SourceTable highlighted={answer.columns} />
      <SequenceBuilder
        label="Tu consulta"
        paletteLabel="Columnas de EMPLEADOS"
        pieces={pieces}
        value={answer.columns}
        onChange={(columns) => onChange({ type: 'drag-column', columns })}
        prefix="SELECT"
        suffix="FROM empleados;"
        separator=","
        emptyText="Arrastra o pulsa columnas para añadirlas"
        disabled={disabled}
      />
    </div>
  );
}
