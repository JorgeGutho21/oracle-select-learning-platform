'use client';

import { useId } from 'react';
import { ChangeSummary } from '@/presentation/components/data/change-summary';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import {
  EMPLEADOS,
  sampleResult,
  type ClaimAnswer,
  type EmpleadosColumn,
} from '../../application/challenge-api';
import { RowPicker } from '../row-picker';
import { SampleTable, sizeOf } from './sample-table';
import type { InteractionProps } from './types';

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  readonly label: string;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly disabled: boolean;
}) {
  const id = useId();
  return (
    <div className="ch-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="ch-input ch-input--short"
        type="number"
        inputMode="numeric"
        min={0}
        max={EMPLEADOS.rows.length * 10}
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
        disabled={disabled}
      />
    </div>
  );
}

/** Afirmaciones que se clasifican como «Lo hace» o «No lo hace» (radios accesibles). */
function Claims({
  claims,
  answers,
  onChange,
  disabled,
}: {
  readonly claims: readonly { readonly id: string; readonly text: string }[];
  readonly answers: readonly ClaimAnswer[];
  readonly onChange: (answers: ClaimAnswer[]) => void;
  readonly disabled: boolean;
}) {
  const name = useId();
  const valueOf = (id: string) => answers.find((answer) => answer.id === id)?.value ?? null;
  const set = (id: string, value: boolean) =>
    onChange(
      claims.map((claim) => ({ id: claim.id, value: claim.id === id ? value : valueOf(claim.id) })),
    );
  return (
    <fieldset className="ch-claims">
      <legend className="ch-builder__label">¿Qué hace y qué no hace SELECT *?</legend>
      <ul className="ch-claims__list">
        {claims.map((claim) => (
          <li key={claim.id} className="ch-claim">
            <span className="ch-claim__text" id={`${name}-${claim.id}`}>
              {claim.text}
            </span>
            <span
              className="ch-claim__options"
              role="radiogroup"
              aria-labelledby={`${name}-${claim.id}`}
            >
              {([true, false] as const).map((value) => (
                <label key={String(value)} className="ch-claim__option">
                  <input
                    type="radio"
                    name={`${name}-${claim.id}`}
                    checked={valueOf(claim.id) === value}
                    onChange={() => set(claim.id, value)}
                    disabled={disabled}
                  />
                  <span>{value ? 'Lo hace' : 'No lo hace'}</span>
                </label>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/**
 * M03 y M04. M03: predecir cuántas columnas y filas devuelve SELECT * y qué no hace. M04:
 * marcar sobre la muestra las filas que conserva WHERE y construir la condición; al cerrar
 * la misión se comparan ANTES y DESPUÉS.
 */
export function PredictInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
}: InteractionProps<'predict-result'>) {
  const { query, headerOptions, asks, sourceColumns, sampleIds, claims, conditionPieces } =
    mission.publicData;
  const set = (patch: Partial<typeof answer>) => onChange({ ...answer, ...patch });
  const toggleRow = (id: number) =>
    set({
      sourceRowIds: answer.sourceRowIds.includes(id)
        ? answer.sourceRowIds.filter((item) => item !== id)
        : [...answer.sourceRowIds, id],
    });
  const columns = (sourceColumns ?? EMPLEADOS.columns.map(({ name }) => name)) as EmpleadosColumn[];
  const rowIds = sampleIds ?? EMPLEADOS.rows.map((row) => row.ID_EMPLEADO);
  const [select] = query.split('▢');
  const condition = (answer.conditionPieceIds ?? [])
    .map((id) => conditionPieces?.find((piece) => piece.id === id)?.text ?? '')
    .join(' ');
  // Al cerrar: qué hace la condición construida sobre la muestra (la correcta si se resolvió).
  const after =
    reveal && asks.condition && condition
      ? sampleResult(`${select!.trim()} ${condition}`, rowIds)
      : null;

  return (
    <div className="ch-stack">
      {asks.rowSelection && (
        <RowPicker
          legend={
            reveal ? 'Antes: la muestra de trabajo' : 'Paso 1 · ¿Qué filas cumplirán la condición?'
          }
          columns={columns}
          rowIds={rowIds}
          selected={answer.sourceRowIds}
          onToggle={toggleRow}
          disabled={disabled}
          {...(after ? { kept: after.keptIds, focusColumns: ['CIUDAD'] } : {})}
        />
      )}
      {asks.condition && conditionPieces && (
        <SequenceBuilder
          label="Paso 2 · Tu condición"
          paletteLabel="Piezas (algunas sobran)"
          pieces={conditionPieces}
          value={answer.conditionPieceIds ?? []}
          onChange={(conditionPieceIds) => set({ conditionPieceIds })}
          prefix={select!.trim().replace(/\n/g, ' ')}
          suffix=";"
          emptyText="Arrastra o toca piezas para formar la condición"
          disabled={disabled}
        />
      )}
      {after && (
        <div className="ch-result" aria-live="polite">
          <ChangeSummary
            rows={[rowIds.length, after.rows.length]}
            columns={[columns.length, after.columns.length]}
            label="Antes → después"
          />
          <SampleTable
            caption="Resultado de la consulta sobre la muestra"
            label={`Después: ${condition}`}
            result={after}
            summary={`${sizeOf(after.rows.length, after.columns.length)} · WHERE eligió las filas; SELECT, las columnas`}
          />
        </div>
      )}
      {asks.headers && (
        <SequenceBuilder
          label="Encabezados del resultado, en orden"
          paletteLabel="Encabezados posibles"
          pieces={headerOptions.map((header) => ({ id: header, text: header, role: 'column' }))}
          value={answer.headers}
          onChange={(headers) => set({ headers })}
          emptyText="Arrastra o toca encabezados"
          disabled={disabled}
        />
      )}
      {(asks.columnCount || asks.rowCount) && (
        <div className="ch-fields">
          {asks.columnCount && (
            <NumberField
              label="Columnas del resultado"
              value={answer.columnCount ?? null}
              onChange={(columnCount) => set({ columnCount })}
              disabled={disabled}
            />
          )}
          {asks.rowCount && (
            <NumberField
              label="Filas del resultado"
              value={answer.rowCount}
              onChange={(rowCount) => set({ rowCount })}
              disabled={disabled}
            />
          )}
        </div>
      )}
      {asks.claims && claims && (
        <Claims
          claims={claims}
          answers={answer.claims ?? []}
          onChange={(next) => set({ claims: next })}
          disabled={disabled}
        />
      )}
    </div>
  );
}
