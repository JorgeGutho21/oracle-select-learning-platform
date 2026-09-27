'use client';

import { DataView } from '@/presentation/components/data/data-view';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { EMPLEADOS, previewResult } from '../../application/challenge-api';
import type { InteractionProps } from './types';

/** M01: arrastrar columnas de EMPLEADOS a la lista de SELECT; la muestra resalta la elección. */
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
      <ResultPreview columns={answer.columns} />
    </div>
  );
}

/** Lo que mostraría tu SELECT en las tres primeras filas: SELECT decide qué se ve. */
function ResultPreview({ columns }: { readonly columns: readonly string[] }) {
  const preview =
    columns.length > 0 ? previewResult(`SELECT ${columns.join(', ')} FROM empleados`, 3) : null;
  if (!preview) {
    return (
      <p className="ch-calc" aria-live="polite">
        Cuando añadas columnas, aquí verás las primeras filas de tu resultado.
      </p>
    );
  }
  return (
    <DataView
      caption="Vista previa de tu resultado"
      label="Vista previa de tu resultado"
      columns={preview.columns.map((name) => ({
        name,
        type: EMPLEADOS.columns.find((column) => column.name === name)?.type ?? 'text',
      }))}
      rows={preview.rows}
      summary={`3 de ${preview.total} filas · ${preview.columns.length} columna${preview.columns.length === 1 ? '' : 's'}`}
      className="ch-preview"
    />
  );
}
