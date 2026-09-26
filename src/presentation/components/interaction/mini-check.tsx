'use client';

import { useId, useMemo, useState } from 'react';
import type { CheckView } from '@/features/study/application/study-api';
import { SqlCode } from '@/presentation/components/data/sql-code';
import { SequenceBuilder } from './sequence-builder';

/**
 * Mini comprobación del Modo Estudio. Feedback gradual sin regalar la respuesta: el primer
 * error muestra una pista conceptual, el segundo una pista concreta y la opción de ver la
 * respuesta; el tercero la muestra con su explicación. Éxito y error se indican con texto y
 * símbolo, no solo con color.
 */

type Outcome =
  | { readonly kind: 'idle' }
  | { readonly kind: 'correct' }
  | { readonly kind: 'wrong'; readonly detail: string };

function parseNumber(text: string): number | null {
  const clean = text.replace(/[\s.$]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}

const numberFormat = new Intl.NumberFormat('es-CO');

export function MiniCheck({
  check,
  onSolved,
  solved = false,
}: {
  readonly check: CheckView;
  readonly onSolved?: () => void;
  /** Ya resuelta antes (progreso guardado). */
  readonly solved?: boolean;
}) {
  const id = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });
  const [revealed, setRevealed] = useState(false);

  const pieces = useMemo(
    () =>
      check.kind === 'order'
        ? check.shuffled.map((piece) => ({ id: `p${check.shuffled.indexOf(piece)}`, text: piece }))
        : [],
    [check],
  );

  const done = outcome.kind === 'correct' || revealed;

  function evaluate(): Outcome {
    switch (check.kind) {
      case 'choice': {
        if (choice === null)
          return { kind: 'wrong', detail: 'Elige una opción antes de comprobar.' };
        if (choice === check.answer) return { kind: 'correct' };
        return { kind: 'wrong', detail: check.options[choice]?.feedback ?? '' };
      }
      case 'count':
      case 'number': {
        const value = parseNumber(text);
        if (value === null) return { kind: 'wrong', detail: 'Escribe un número, sin letras.' };
        if (value === check.answer) return { kind: 'correct' };
        return {
          kind: 'wrong',
          detail:
            check.kind === 'count'
              ? `${numberFormat.format(value)} no es el recuento correcto.`
              : `${numberFormat.format(value)} no es el valor que muestra la consulta.`,
        };
      }
      case 'order': {
        const texts = order.map(
          (pieceId) => pieces.find((piece) => piece.id === pieceId)?.text ?? '',
        );
        if (texts.length < check.answer.length)
          return { kind: 'wrong', detail: 'Usa todas las piezas antes de comprobar.' };
        return texts.join('|') === check.answer.join('|')
          ? { kind: 'correct' }
          : { kind: 'wrong', detail: 'El orden todavía no es el de una consulta válida.' };
      }
    }
  }

  function submit() {
    const next = evaluate();
    const incomplete =
      next.kind === 'wrong' &&
      ((check.kind === 'choice' && choice === null) ||
        (check.kind !== 'choice' && check.kind !== 'order' && parseNumber(text) === null) ||
        (check.kind === 'order' && order.length < check.answer.length));
    setOutcome(next);
    if (next.kind === 'correct') {
      onSolved?.();
      return;
    }
    if (incomplete) return;
    const count = attempts + 1;
    setAttempts(count);
    if (count >= 3) {
      setRevealed(true);
      onSolved?.();
    }
  }

  const hint = attempts >= 2 ? check.hints[1] : attempts === 1 ? check.hints[0] : null;
  const answerText =
    check.kind === 'choice'
      ? check.options[check.answer]?.text
      : check.kind === 'order'
        ? check.answer.join(' ')
        : numberFormat.format(check.answer);

  return (
    <section className="mini-check" aria-labelledby={`${id}-title`}>
      <p className="mini-check__eyebrow">Mini comprobación</p>
      <h3 id={`${id}-title`} className="mini-check__prompt">
        {check.prompt}
      </h3>
      {solved && outcome.kind === 'idle' && (
        <p className="mini-check__solved">
          <span aria-hidden="true">✓</span> Ya la resolviste. Puedes repetirla.
        </p>
      )}
      {'sql' in check && check.sql && <SqlCode sql={check.sql} />}

      {check.kind === 'choice' && (
        <fieldset className="mini-check__options" disabled={done}>
          <legend className="visually-hidden">Opciones</legend>
          {check.options.map((option, index) => (
            <label
              key={option.text}
              className={[
                'mini-check__option',
                choice === index ? 'is-selected' : '',
                done && index === check.answer ? 'is-answer' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name={`${id}-option`}
                checked={choice === index}
                onChange={() => {
                  setChoice(index);
                  if (outcome.kind === 'wrong') setOutcome({ kind: 'idle' });
                }}
              />
              {option.code ? <code>{option.text}</code> : <span>{option.text}</span>}
            </label>
          ))}
        </fieldset>
      )}

      {(check.kind === 'count' || check.kind === 'number') && (
        <label className="mini-check__number">
          <span>
            {check.kind === 'count'
              ? check.measure === 'rows'
                ? 'Número de filas'
                : 'Número de columnas'
              : check.label}
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={text}
            disabled={done}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
      )}

      {check.kind === 'order' && (
        <SequenceBuilder
          label="Tu consulta"
          paletteLabel="Piezas disponibles"
          pieces={pieces}
          value={order}
          onChange={setOrder}
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
              onSolved?.();
            }}
          >
            Ver la respuesta
          </button>
        )}
      </div>

      <div className="mini-check__feedback" role="status" aria-live="polite">
        {outcome.kind === 'correct' && (
          <p className="mini-check__message mini-check__message--correct">
            <span aria-hidden="true">✓</span> <strong>Correcto.</strong> {check.explanation}
          </p>
        )}
        {outcome.kind === 'wrong' && !revealed && (
          <p className="mini-check__message mini-check__message--wrong">
            <span aria-hidden="true">✗</span> <strong>Todavía no.</strong> {outcome.detail}
          </p>
        )}
        {hint && !done && (
          <p className="mini-check__hint">
            <strong>Pista {attempts >= 2 ? 2 : 1}:</strong> {hint}
          </p>
        )}
        {revealed && outcome.kind !== 'correct' && (
          <p className="mini-check__message mini-check__message--answer">
            <strong>Respuesta:</strong> {answerText}. {check.explanation}
          </p>
        )}
      </div>
    </section>
  );
}
