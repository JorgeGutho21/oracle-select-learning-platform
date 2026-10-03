'use client';

import { useId, useState } from 'react';
import { Button } from '@/presentation/components/ui';
import {
  checkSql,
  previewResult,
  variantSql,
  type ErrorKind,
  type ResultPreview,
  type SqlCheckItem,
} from '../../application/challenge-api';
import { SampleTable, sizeOf } from './sample-table';
import type { InteractionProps } from './types';

const KINDS: readonly { readonly id: ErrorKind; readonly label: string; readonly hint: string }[] =
  [
    {
      id: 'sintaxis',
      label: 'Sintaxis',
      hint: 'Oracle no puede leerla: sobra, falta o está fuera de lugar un símbolo o una palabra.',
    },
    {
      id: 'semantica',
      label: 'Semántica',
      hint: 'Se puede leer, pero nombra algo que no existe (una columna, una tabla).',
    },
    {
      id: 'concepto',
      label: 'Concepto',
      hint: 'Oracle la ejecuta sin error, pero no hace lo que se pidió.',
    },
  ];

/** Filas que se muestran al probar la corrección: una muestra, nunca la tabla entera. */
const TRY_ROWS = 6;

/**
 * M08: depuración real en tres pasos: clasificar el error, tocar la parte de la consulta
 * donde está y escribir la consulta corregida. «Probar» revisa la corrección con el motor
 * educativo sin puntuar.
 */
export function HotspotInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'hotspot-error'>) {
  const kindName = useId();
  const sqlId = useId();
  const variant = mission.publicData.variants.find((entry) => entry.id === answer.variantId);
  const [tried, setTried] = useState<{
    sql: string;
    items: readonly SqlCheckItem[];
    result: ResultPreview | null;
  } | null>(null);
  if (!variant) return null;
  const set = (patch: Partial<typeof answer>) => onChange({ ...answer, ...patch });
  const current = tried && tried.sql === answer.sql ? tried : null;
  const errors = current?.items.filter((item) => item.severity === 'error') ?? [];
  const warnings = current?.items.filter((item) => item.severity === 'warning') ?? [];
  const tryFix = () => {
    const check = checkSql(answer.sql);
    setTried({
      sql: answer.sql,
      items: check.items,
      result: check.valid ? previewResult(answer.sql, TRY_ROWS) : null,
    });
  };

  return (
    <div className="ch-stack" data-variant={variant.id}>
      <fieldset className="ch-kinds">
        <legend className="ch-builder__label">Paso 1 · ¿Qué tipo de error es?</legend>
        <div className="ch-kinds__list">
          {KINDS.map((kind) => (
            <label key={kind.id} className="ch-kind">
              <input
                type="radio"
                name={kindName}
                checked={answer.kind === kind.id}
                onChange={() => set({ kind: kind.id })}
                disabled={disabled}
              />
              <span className="ch-kind__label">{kind.label}</span>
              <span className="ch-kind__hint">{kind.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="ch-field">
        <p className="ch-builder__label" id={`${sqlId}-zone`}>
          Paso 2 · Toca la parte de la consulta donde está el error
        </p>
        <div className="ch-hotspot" role="group" aria-labelledby={`${sqlId}-zone`}>
          {variant.tokens.map((token, index) => (
            <button
              key={index}
              type="button"
              className={`ch-token${/^[A-Z][A-Z ]*$/.test(token) ? ' ch-token--keyword' : ''}${answer.tokenIndex === index ? ' is-selected' : ''}`}
              aria-pressed={answer.tokenIndex === index}
              onClick={() => set({ tokenIndex: answer.tokenIndex === index ? null : index })}
              disabled={disabled}
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      <div className="ch-field">
        <label htmlFor={sqlId} className="ch-builder__label">
          Paso 3 · Escribe la consulta corregida
        </label>
        <textarea
          id={sqlId}
          className="ch-input ch-sql"
          rows={3}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={answer.sql}
          onChange={(event) => set({ sql: event.target.value })}
          disabled={disabled}
        />
        <div className="ch-actions ch-actions--inline">
          <Button
            variant="secondary"
            onClick={tryFix}
            disabled={disabled || answer.sql.trim() === ''}
          >
            Probar la corrección (sin puntuar)
          </Button>
          <Button
            variant="text"
            onClick={() => set({ sql: variantSql(variant) })}
            disabled={disabled}
          >
            Restaurar la consulta original
          </Button>
        </div>
      </div>

      <div aria-live="polite" className="ch-stack">
        {current && errors.length > 0 && (
          <p className="ch-try ch-try--error">
            <strong>Oracle no podría ejecutarla:</strong> {errors[0]!.message}
          </p>
        )}
        {current && errors.length === 0 && warnings.length > 0 && (
          <p className="ch-try ch-try--warning">
            <strong>Atención:</strong> {warnings[0]!.message}
          </p>
        )}
        {current?.result && (
          <SampleTable
            caption="Qué devuelve tu corrección"
            label="Qué devuelve tu corrección"
            result={current.result}
            summary={`${sizeOf(current.result.total, current.result.columns.length)} · se muestran ${Math.min(TRY_ROWS, current.result.total)}`}
          />
        )}
      </div>
    </div>
  );
}
