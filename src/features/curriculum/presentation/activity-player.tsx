'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useId, useMemo, useRef, useState } from 'react';
import type { ActivityView } from '../application/curriculum-api';
import { CodeView, CurriculumTable, ExampleOutcome, OracleError, SetupFold } from './example-parts';
import { SourceTables } from './visuals';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';

/**
 * Actividad de Practicar, del Challenge o de la comprobación de una lección. Retroalimentación
 * gradual sin regalar la respuesta: cada intento fallido dice qué error representa la opción
 * elegida (y, en selección múltiple, qué parte está bien); el primero añade una pista
 * conceptual, el segundo una concreta y la opción de ver la respuesta; el tercero la muestra.
 * Al acertar, la explicación. Éxito y error se dicen con texto y símbolo, no solo con color.
 */

export interface ActivityOutcome {
  /** Resuelta por el estudiante (false si vio la respuesta). */
  readonly solved: boolean;
  readonly attempts: number;
  readonly hints: number;
}

type Feedback =
  | { readonly kind: 'idle' }
  | { readonly kind: 'correct' }
  | { readonly kind: 'incomplete'; readonly detail: string }
  | {
      readonly kind: 'wrong';
      readonly detail: string;
      /** Selección múltiple: lo que ya está bien. */
      readonly good?: readonly string[];
    };

const LETTERS = 'ABCDEFGH';
const numberFormat = new Intl.NumberFormat('es-CO');

function parseNumber(text: string): number | null {
  const clean = text.replace(/[\s.$]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}

/** Mezcla estable de las piezas para ordenar (nunca en el orden correcto). */
function shuffledPieces(pieces: readonly string[], seed: string): string[] {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const copy = [...pieces];
  for (let index = copy.length - 1; index > 0; index--) {
    hash = Math.imul(hash ^ (hash >>> 13), 0x5bd1e995) >>> 0;
    const swap = hash % (index + 1);
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  if (copy.every((piece, index) => piece === pieces[index])) copy.push(copy.shift()!);
  return copy;
}

export function ActivityPlayer({
  activity,
  eyebrow = 'Práctica',
  solved = false,
  onFinished,
  showReview = true,
  headingLevel = 3,
}: {
  readonly activity: ActivityView;
  readonly eyebrow?: string;
  /** Ya resuelta antes (progreso guardado). */
  readonly solved?: boolean;
  readonly onFinished?: (outcome: ActivityOutcome) => void;
  /** Muestra el enlace «Qué revisar» a la lección. */
  readonly showReview?: boolean;
  readonly headingLevel?: 2 | 3;
}) {
  const id = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const [choice, setChoice] = useState<number | null>(null);
  const [choices, setChoices] = useState<readonly number[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const numberRef = useRef<HTMLInputElement>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });
  const [revealed, setRevealed] = useState(false);

  const pieces = useMemo(
    () =>
      activity.kind === 'order'
        ? shuffledPieces(activity.pieces, activity.id).map((text) => ({
            id: `p${activity.pieces.indexOf(text)}`,
            text,
          }))
        : [],
    [activity],
  );

  const done = feedback.kind === 'correct' || revealed;
  const hintsShown = Math.min(attempts, 2);

  function finish(success: boolean, count: number) {
    onFinished?.({ solved: success, attempts: count, hints: Math.min(count, 2) });
  }

  function evaluate(): Feedback {
    switch (activity.kind) {
      case 'choice':
      case 'result': {
        if (choice === null)
          return { kind: 'incomplete', detail: 'Elige una opción antes de comprobar.' };
        const option = activity.options[choice]!;
        return option.correct ? { kind: 'correct' } : { kind: 'wrong', detail: option.feedback };
      }
      case 'multi': {
        if (choices.length === 0)
          return { kind: 'incomplete', detail: 'Marca al menos una opción antes de comprobar.' };
        const picked = choices.map((index) => activity.options[index]!);
        const wrong = picked.filter((option) => !option.correct);
        const missing = activity.options.filter(
          (option, index) => option.correct && !choices.includes(index),
        ).length;
        if (wrong.length === 0 && missing === 0) return { kind: 'correct' };
        const good = picked.filter((option) => option.correct).map((option) => option.text);
        const detail = [
          ...wrong.map((option) => `«${option.text}»: ${option.feedback}`),
          missing > 0
            ? `Te ${missing === 1 ? 'falta una opción correcta' : `faltan ${missing} opciones correctas`}.`
            : '',
        ]
          .filter(Boolean)
          .join(' ');
        return { kind: 'wrong', detail, good };
      }
      case 'count': {
        const value = parseNumber(numberRef.current?.value ?? '');
        if (value === null) return { kind: 'incomplete', detail: 'Escribe un número, sin letras.' };
        if (value === activity.answer) return { kind: 'correct' };
        return {
          kind: 'wrong',
          detail:
            activity.unit === 'value'
              ? `${numberFormat.format(value)} no es el valor que devuelve la consulta.`
              : `${numberFormat.format(value)} no es el número de ${activity.unit === 'rows' ? 'filas' : 'líneas'}. ${value > activity.answer ? 'Son menos.' : 'Son más.'}`,
        };
      }
      case 'order': {
        if (order.length < activity.pieces.length)
          return { kind: 'incomplete', detail: 'Usa todas las piezas antes de comprobar.' };
        const texts = order.map((pieceId) => pieces.find((piece) => piece.id === pieceId)?.text);
        const right = texts.filter((text, index) => text === activity.pieces[index]).length;
        return right === activity.pieces.length
          ? { kind: 'correct' }
          : {
              kind: 'wrong',
              detail: `${right} de ${activity.pieces.length} piezas están en su lugar. Revisa el orden de las cláusulas.`,
            };
      }
    }
  }

  function submit() {
    const next = evaluate();
    setFeedback(next);
    if (next.kind === 'incomplete') return;
    const count = attempts + 1;
    setAttempts(count);
    if (next.kind === 'correct') {
      finish(true, count);
      return;
    }
    if (count >= 3) {
      setRevealed(true);
      finish(false, count);
    }
  }

  function reset() {
    if (feedback.kind === 'wrong' || feedback.kind === 'incomplete') setFeedback({ kind: 'idle' });
  }

  const answer = (() => {
    switch (activity.kind) {
      case 'choice':
      case 'multi':
        return activity.options
          .filter((option) => option.correct)
          .map((option) => option.text)
          .join(' · ');
      case 'result': {
        const index = activity.options.findIndex((option) => option.correct);
        return `opción ${LETTERS[index]}`;
      }
      case 'count':
        return numberFormat.format(activity.answer);
      case 'order':
        return activity.pieces.join(' ');
    }
  })();

  const context = activity.context;
  const hint = hintsShown >= 2 ? activity.hints[1] : hintsShown === 1 ? activity.hints[0] : null;

  return (
    <section className="mini-check cu-activity" aria-labelledby={`${id}-title`}>
      <p className="mini-check__eyebrow">{eyebrow}</p>
      <Heading id={`${id}-title`} className="mini-check__prompt">
        {activity.prompt}
      </Heading>
      {solved && feedback.kind === 'idle' && (
        <p className="mini-check__solved">
          <span aria-hidden="true">✓</span> Ya la resolviste. Puedes repetirla.
        </p>
      )}

      {context.code && <CodeView code={context.code} label="Código" />}
      {context.example && (
        <div className="cu-activity__context">
          {context.example.sources.length > 0 && (
            <details className="study-fold">
              <summary>
                <span className="study-part">Tablas originales</span>{' '}
                {context.example.sources.map((table) => table.title).join(', ')}
              </summary>
              <SourceTables tables={context.example.sources} />
            </details>
          )}
          {context.example.kind === 'plsql' && <SetupFold setup={context.example.setup} />}
          <CodeView
            code={context.example.code}
            label={context.example.kind === 'plsql' ? 'Código PL/SQL' : 'Consulta'}
          />
          {context.showResult ? (
            <ExampleOutcome example={context.example} size="compact" />
          ) : (
            context.example.error && <OracleError error={context.example.error} />
          )}
        </div>
      )}

      {(activity.kind === 'choice' || activity.kind === 'multi') && (
        <fieldset className="mini-check__options" disabled={done}>
          <legend className="visually-hidden">
            {activity.kind === 'multi' ? 'Marca todas las correctas' : 'Opciones'}
          </legend>
          {activity.kind === 'multi' && (
            <p className="cu-activity__instruction">Marca todas las correctas.</p>
          )}
          {activity.options.map((option, index) => {
            const selected = activity.kind === 'multi' ? choices.includes(index) : choice === index;
            return (
              <label
                key={option.text}
                className={[
                  'mini-check__option',
                  selected ? 'is-selected' : '',
                  done && option.correct ? 'is-answer' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type={activity.kind === 'multi' ? 'checkbox' : 'radio'}
                  name={`${id}-option`}
                  checked={selected}
                  onChange={() => {
                    if (activity.kind === 'multi') {
                      setChoices((current) =>
                        current.includes(index)
                          ? current.filter((entry) => entry !== index)
                          : [...current, index],
                      );
                    } else setChoice(index);
                    reset();
                  }}
                />
                {option.code ? <code>{option.text}</code> : <span>{option.text}</span>}
              </label>
            );
          })}
        </fieldset>
      )}

      {activity.kind === 'result' && (
        <fieldset className="cu-result-options" disabled={done}>
          <legend className="visually-hidden">Resultados posibles</legend>
          {activity.options.map((option, index) => (
            <label
              key={option.id}
              className={[
                'cu-result-option',
                choice === index ? 'is-selected' : '',
                done && option.correct ? 'is-answer' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="cu-result-option__pick">
                <input
                  type="radio"
                  name={`${id}-result`}
                  checked={choice === index}
                  onChange={() => {
                    setChoice(index);
                    reset();
                  }}
                />
                Opción {LETTERS[index]}
              </span>
              <CurriculumTable
                table={option.table}
                caption={`Opción ${LETTERS[index]}`}
                size="compact"
              />
            </label>
          ))}
        </fieldset>
      )}

      {activity.kind === 'count' && (
        <label className="mini-check__number">
          <span>
            {activity.unit === 'rows'
              ? 'Número de filas'
              : activity.unit === 'lines'
                ? 'Número de líneas'
                : 'Valor que devuelve'}
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            ref={numberRef}
            defaultValue=""
            disabled={done}
            onChange={reset}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
      )}

      {activity.kind === 'order' && (
        <SequenceBuilder
          label="Tu respuesta"
          paletteLabel="Piezas disponibles"
          pieces={pieces}
          value={order}
          onChange={(next) => {
            setOrder(next);
            reset();
          }}
          disabled={done}
          emptyText="Arrastra, toca o pulsa Enter sobre las piezas para colocarlas en orden."
        />
      )}

      <div className="mini-check__actions">
        <button type="button" className="mini-check__submit" onClick={submit} disabled={done}>
          Comprobar
        </button>
        {attempts >= 2 && !done && (
          <button
            type="button"
            className="mini-check__reveal"
            onClick={() => {
              setRevealed(true);
              finish(false, attempts);
            }}
          >
            Ver la respuesta
          </button>
        )}
      </div>

      <div className="mini-check__feedback" role="status" aria-live="polite">
        {feedback.kind === 'correct' && (
          <p className="mini-check__message mini-check__message--correct">
            <span aria-hidden="true">✓</span> <strong>Correcto.</strong> {activity.explanation}
          </p>
        )}
        {feedback.kind === 'incomplete' && (
          <p className="mini-check__message mini-check__message--wrong">
            <span aria-hidden="true">!</span> {feedback.detail}
          </p>
        )}
        {feedback.kind === 'wrong' && !revealed && (
          <>
            {feedback.good && feedback.good.length > 0 && (
              <p className="mini-check__message cu-activity__good">
                <span aria-hidden="true">✓</span> <strong>Bien:</strong> {feedback.good.join(' · ')}
              </p>
            )}
            <p className="mini-check__message mini-check__message--wrong">
              <span aria-hidden="true">✗</span> <strong>Todavía no.</strong> {feedback.detail}
            </p>
          </>
        )}
        {hint && !done && (
          <p className="mini-check__hint">
            <strong>Pista {hintsShown}:</strong> {hint}
          </p>
        )}
        {revealed && feedback.kind !== 'correct' && (
          <p className="mini-check__message mini-check__message--answer">
            <strong>Respuesta:</strong> {answer}. {activity.explanation}
          </p>
        )}
        {showReview && activity.lesson && (feedback.kind === 'wrong' || revealed) && (
          <p className="cu-activity__review">
            <strong>Qué revisar:</strong>{' '}
            <Link href={activity.lesson.href as Route}>{activity.lesson.title}</Link>
          </p>
        )}
      </div>
    </section>
  );
}
