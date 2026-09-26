'use client';

import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { CodeBlock } from '@/presentation/components/ui';
import { EMPLEADOS } from '../../application/challenge-api';
import { formatNumber, parseTypedNumber } from '../format';
import type { InteractionProps } from './types';

/** M05: construir la columna calculada y predecir sus valores. */
export function ExpressionInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'expression-builder'>) {
  const { query, palette, predictionEmployeeIds } = mission.publicData;
  const employees = EMPLEADOS.rows.filter((row) => predictionEmployeeIds.includes(row.ID_EMPLEADO));
  const valueOf = (id: number) =>
    answer.predictions.find((item) => item.employeeId === id)?.value ?? null;
  const setPrediction = (employeeId: number, text: string) =>
    onChange({
      ...answer,
      predictions: predictionEmployeeIds.map((id) => ({
        employeeId: id,
        value: id === employeeId ? parseTypedNumber(text) : valueOf(id),
      })),
    });
  return (
    <div className="ch-stack">
      <CodeBlock code={query} label="Consulta con un espacio por completar" />
      <SequenceBuilder
        label="Tercera columna: expresión"
        paletteLabel="Piezas reutilizables"
        pieces={palette}
        value={answer.pieceIds}
        onChange={(pieceIds) => onChange({ ...answer, pieceIds })}
        reusable
        emptyText="Arrastra o pulsa piezas para formar la expresión"
        disabled={disabled}
      />
      <div className="ch-predictions">
        <p className="ch-builder__label">¿Qué valor mostrará la columna calculada?</p>
        <div className="ch-predictions__grid">
          {employees.map((row) => (
            <label key={row.ID_EMPLEADO} className="ch-prediction">
              <span>
                <strong>{row.NOMBRE}</strong>
                <span className="ch-muted"> · SALARIO {formatNumber(row.SALARIO)}</span>
              </span>
              <input
                className="ch-input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Valor calculado"
                defaultValue={valueOf(row.ID_EMPLEADO)?.toString() ?? ''}
                onChange={(event) => setPrediction(row.ID_EMPLEADO, event.target.value)}
                disabled={disabled}
                aria-label={`Valor calculado para ${row.NOMBRE}`}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
