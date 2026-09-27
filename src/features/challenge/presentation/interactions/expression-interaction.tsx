'use client';

import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import { calculationSteps, EMPLEADOS, sampleResult } from '../../application/challenge-api';
import { formatNumber, parseTypedNumber } from '../format';
import { MISSION_CONTEXT } from '../mission-context';
import { SampleTable } from './sample-table';
import type { InteractionProps } from './types';

/**
 * M05: predecir el valor de dos expresiones (con y sin paréntesis) y construir la que pide el
 * enunciado. Mientras se construye se ve el ORDEN de cálculo, no los valores; al cerrar la
 * misión, las dos columnas calculadas sobre la muestra.
 */
export function ExpressionInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
}: InteractionProps<'expression-builder'>) {
  const { palette, predictionEmployeeIds, comparisons = [] } = mission.publicData;
  const sample = MISSION_CONTEXT[mission.id].sample;
  const employees = EMPLEADOS.rows.filter((row) => predictionEmployeeIds.includes(row.ID_EMPLEADO));
  const text = answer.pieceIds
    .map((id) => palette.find((piece) => piece.id === id)?.text ?? '')
    .join(' ');
  const steps = text ? calculationSteps(text) : null;
  const valueOf = (employeeId: number, expression?: string) =>
    answer.predictions.find(
      (item) => item.employeeId === employeeId && item.expression === expression,
    )?.value ?? null;
  const setPrediction = (employeeId: number, expression: string | undefined, typed: string) =>
    onChange({
      ...answer,
      predictions: answer.predictions.map((item) =>
        item.employeeId === employeeId && item.expression === expression
          ? { ...item, value: parseTypedNumber(typed) }
          : item,
      ),
    });
  const compared =
    reveal && sample && comparisons.length > 0
      ? sampleResult(
          `SELECT nombre, salario, bono, ${comparisons.join(', ')} FROM empleados`,
          sample.rowIds,
        )
      : null;

  return (
    <div className="ch-stack">
      {comparisons.length > 0 && (
        <fieldset className="ch-predictions">
          <legend className="ch-builder__label">
            Paso 1 · ¿Dan lo mismo? Predice el valor para{' '}
            {employees.map((row) => row.NOMBRE).join(' y ')}
          </legend>
          {employees.map((row) => (
            <div key={row.ID_EMPLEADO} className="ch-prediction-set">
              <p className="ch-muted">
                <strong>{row.NOMBRE}</strong> · SALARIO {formatNumber(row.SALARIO)} · BONO{' '}
                {row.BONO === null ? 'NULL' : formatNumber(row.BONO)}
              </p>
              <div className="ch-predictions__grid">
                {comparisons.map((expression) => (
                  <label key={expression} className="ch-prediction">
                    <code>{expression}</code>
                    <input
                      className="ch-input"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Valor"
                      defaultValue={valueOf(row.ID_EMPLEADO, expression)?.toString() ?? ''}
                      onChange={(event) =>
                        setPrediction(row.ID_EMPLEADO, expression, event.target.value)
                      }
                      disabled={disabled}
                      aria-label={`Valor de ${expression} para ${row.NOMBRE}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
      )}

      <SequenceBuilder
        label="Paso 2 · Expresión del ingreso anual"
        paletteLabel="Piezas reutilizables"
        pieces={palette}
        value={answer.pieceIds}
        onChange={(pieceIds) => onChange({ ...answer, pieceIds })}
        reusable
        emptyText="Arrastra o toca piezas para formar la expresión"
        disabled={disabled}
      />
      <div className="ch-calc" aria-live="polite">
        {steps && steps.length > 0 ? (
          <>
            <p className="ch-calc__title">Orden en que Oracle calcula tu expresión</p>
            <ol className="ch-steps">
              {steps.map((step, index) => (
                <li key={index}>
                  <code>{step}</code>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>Cuando la expresión esté completa, aquí verás en qué orden la calcula Oracle.</p>
        )}
      </div>

      {compared && (
        <SampleTable
          caption="Las dos expresiones sobre la muestra"
          label="Comparación sobre la muestra"
          result={compared}
          highlightedColumns={compared.columns.slice(3)}
          summary="Mismas filas; cada expresión es una columna calculada"
        />
      )}
    </div>
  );
}
