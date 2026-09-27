'use client';

import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { EMPLEADOS, previewHeaders } from '../../application/challenge-api';
import { formatNumber, parseTypedNumber } from '../format';
import type { InteractionProps } from './types';

/** M05: construir la columna calculada y predecir sus valores. */
export function ExpressionInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'expression-builder'>) {
  const { palette, predictionEmployeeIds } = mission.publicData;
  const employees = EMPLEADOS.rows.filter((row) => predictionEmployeeIds.includes(row.ID_EMPLEADO));
  const texts = answer.pieceIds.map((id) => palette.find((piece) => piece.id === id)?.text ?? '');
  // Encabezado que tendría la columna calculada: muestra la expresión, no su valor.
  const header =
    texts.length > 0
      ? (previewHeaders([
          'SELECT',
          'nombre',
          ',',
          'salario',
          ',',
          ...texts,
          'FROM',
          'empleados',
        ])?.[2] ?? null)
      : null;
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
      <p className="ch-calc" aria-live="polite">
        {header ? (
          <>
            Columna calculada: <code>{header}</code> · Oracle la calcula en cada fila; la tabla no
            cambia.
          </>
        ) : (
          'Cuando la expresión esté completa, aquí verás el encabezado de la columna calculada.'
        )}
      </p>
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
