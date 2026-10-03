'use client';

import { useId, useState } from 'react';
import type { TableView, TraceStep } from '../application/curriculum-api';
import { CurriculumTable, NumberedCode } from './example-parts';

/**
 * Recorrido paso a paso de un bloque PL/SQL: qué línea se ejecuta, cómo cambian las
 * variables y qué escribe DBMS_OUTPUT. Con un cursor, señala además la fila que se procesa.
 * Los pasos son una explicación didáctica; la salida que muestran es la que Oracle produjo
 * (una prueba exige que coincidan). Se controla con botones y teclado, sin animación.
 */

export function ExecutionStepper({
  code,
  trace,
  cursor,
  density = 'study',
}: {
  readonly code: string;
  readonly trace: readonly TraceStep[];
  readonly cursor?: TableView | null;
  readonly density?: 'study' | 'stage';
}) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const step = trace[index];
  if (!step) return null;
  const output = trace.slice(0, index + 1).flatMap((entry) => (entry.output ? [entry.output] : []));
  const vars = Object.entries(step.vars ?? {});
  return (
    <section className={`stepper stepper--${density}`} aria-labelledby={`${id}-title`}>
      <div className="stepper__header">
        <p className="study-part" id={`${id}-title`}>
          Ejecución paso a paso
        </p>
        <p className="stepper__counter" aria-live="polite">
          Paso {index + 1} de {trace.length}: línea {step.line}
        </p>
      </div>
      <div className="stepper__grid">
        <NumberedCode code={code} label="Bloque PL/SQL" current={step.line} />
        <div className="stepper__state">
          <p className="stepper__note">{step.note}</p>
          {vars.length > 0 && (
            <table className="stepper__vars">
              <caption>Variables después de este paso</caption>
              <thead>
                <tr>
                  <th scope="col">Variable</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vars.map(([name, value]) => (
                  <tr key={name}>
                    <th scope="row">
                      <code>{name}</code>
                    </th>
                    <td>
                      <code>{value}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {cursor && (
            <CurriculumTable
              table={cursor}
              label="Filas del cursor"
              caption="Filas que recorre el cursor"
              size="compact"
              {...(step.row ? { highlightedRow: step.row - 1 } : {})}
            />
          )}
          <figure className="cu-console">
            <figcaption className="cu-console__label">Salida de DBMS_OUTPUT hasta aquí</figcaption>
            <pre className="cu-console__body">
              {output.length === 0 ? (
                <span className="cu-console__empty">(todavía nada)</span>
              ) : (
                output.join('\n')
              )}
            </pre>
          </figure>
        </div>
      </div>
      <div className="stepper__controls">
        <button
          type="button"
          className="ds-button ds-button--secondary"
          onClick={() => setIndex(0)}
          disabled={index === 0}
        >
          Reiniciar
        </button>
        <button
          type="button"
          className="ds-button ds-button--secondary"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
        >
          ← Paso anterior
        </button>
        <button
          type="button"
          className="ds-button ds-button--primary"
          onClick={() => setIndex((value) => Math.min(trace.length - 1, value + 1))}
          disabled={index === trace.length - 1}
        >
          Paso siguiente →
        </button>
      </div>
    </section>
  );
}
