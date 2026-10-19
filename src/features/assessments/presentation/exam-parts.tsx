'use client';

import { useId, type RefObject } from 'react';
import { Button, Dialog } from '@/presentation/components/ui';
import type { SaveStatus } from '../application/answer-queue';
import type { Answer, ExamItem } from '../application/exam-wire';
import { RESPONSE_INSTRUCTION } from '../application/assessment-api';
import { OptionBody, QuestionBody } from './question-content';

/**
 * Piezas del examen. Sobrias a propósito: sin fondos animados ni efectos que distraigan.
 * Todo se maneja con teclado y los controles miden al menos 44 px.
 */

export const SAVE_TEXT: Readonly<Record<SaveStatus, string>> = {
  saved: 'Guardado',
  pending: 'Cambios pendientes',
  saving: 'Guardando…',
  offline: 'Sin conexión. Tus respuestas se conservarán temporalmente.',
  finished: 'Evaluación cerrada',
};

export function ExamHeader({
  title,
  answered,
  total,
  clock,
  clockLabel,
  clockTone,
  saveStatus,
  online,
}: {
  readonly title: string;
  readonly answered: number;
  readonly total: number;
  readonly clock: string;
  readonly clockLabel: string;
  readonly clockTone: 'normal' | 'warning' | 'final';
  readonly saveStatus: SaveStatus;
  readonly online: boolean;
}) {
  const status = online ? saveStatus : 'offline';
  return (
    <header className="exam-header">
      <div className="exam-header__title">
        <p className="exam-header__eyebrow">Evaluación en curso</p>
        <h1>{title}</h1>
      </div>
      <p className="exam-header__progress">
        <span className="exam-header__value">
          {answered}/{total}
        </span>
        <span className="exam-header__label">respondidas</span>
      </p>
      <p className={`exam-clock exam-clock--${clockTone}`} role="timer" aria-label={clockLabel}>
        <span className="exam-clock__value" aria-hidden="true">
          {clock}
        </span>
        <span className="exam-header__label" aria-hidden="true">
          restantes
        </span>
      </p>
      <p className={`exam-save exam-save--${status}`} role="status">
        <span className="exam-save__dot" aria-hidden="true" />
        {SAVE_TEXT[status]}
      </p>
    </header>
  );
}

export interface NavigatorItem {
  readonly position: number;
  readonly answered: boolean;
  readonly flagged: boolean;
}

export function QuestionNavigator({
  items,
  current,
  onSelect,
}: {
  readonly items: readonly NavigatorItem[];
  readonly current: number;
  readonly onSelect: (position: number) => void;
}) {
  const answered = items.filter((item) => item.answered).length;
  const flagged = items.filter((item) => item.flagged).length;
  return (
    <nav className="exam-nav" aria-label="Preguntas de la evaluación">
      <details className="exam-nav__details" open>
        <summary>
          Preguntas · {answered} de {items.length} respondidas
          {flagged > 0 ? ` · ${flagged} para revisar` : ''}
        </summary>
        <ol className="exam-nav__list">
          {items.map((item) => {
            const state = [
              item.answered ? 'respondida' : 'sin responder',
              item.flagged ? 'marcada para revisar' : null,
              item.position === current ? 'actual' : null,
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <li key={item.position}>
                <button
                  type="button"
                  className={[
                    'exam-nav__item',
                    item.answered ? 'is-answered' : '',
                    item.flagged ? 'is-flagged' : '',
                    item.position === current ? 'is-current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={item.position === current ? 'step' : undefined}
                  aria-label={`Pregunta ${item.position}: ${state}`}
                  onClick={() => onSelect(item.position)}
                >
                  {item.position}
                  {item.flagged && (
                    <span className="exam-nav__flag" aria-hidden="true">
                      ⚑
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <ul className="exam-nav__legend" aria-hidden="true">
          <li>
            <span className="exam-nav__swatch is-answered" /> Respondida
          </li>
          <li>
            <span className="exam-nav__swatch" /> Sin responder
          </li>
          <li>
            <span className="exam-nav__swatch is-flagged" /> Para revisar
          </li>
        </ul>
      </details>
    </nav>
  );
}

function selectedIds(answer: Answer | null): readonly string[] {
  if (!answer) return [];
  if ('choice' in answer) return [answer.choice];
  if ('choices' in answer) return answer.choices;
  return [];
}

function OrderInput({
  item,
  answer,
  onAnswer,
  announce,
}: {
  readonly item: ExamItem;
  readonly answer: Answer | null;
  readonly onAnswer: (answer: Answer) => void;
  readonly announce: (text: string) => void;
}) {
  const ids = answer && 'order' in answer ? answer.order : item.options.map((option) => option.id);
  const byId = new Map(item.options.map((option) => [option.id, option]));
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onAnswer({ order: next });
    const option = byId.get(ids[index]!);
    announce(
      `Fragmento movido a la posición ${target + 1} de ${ids.length}: ${option?.body ?? ''}`,
    );
  };
  return (
    <div className="exam-order">
      {!answer && (
        <p className="exam-order__hint">
          Mueve los fragmentos con los botones. Tu orden se guarda con el primer cambio; si este ya
          es tu respuesta, pulsa «Guardar este orden».
        </p>
      )}
      <ol className="exam-order__list">
        {ids.map((id, index) => {
          const option = byId.get(id);
          if (!option) return null;
          return (
            <li key={id} className="exam-order__item">
              <span className="exam-order__index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="exam-order__body">
                <OptionBody body={option.body} kind={option.kind} result={option.result} />
              </span>
              <span className="exam-order__actions">
                <button
                  type="button"
                  className="exam-order__move"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Subir «${option.body}»`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="exam-order__move"
                  onClick={() => move(index, 1)}
                  disabled={index === ids.length - 1}
                  aria-label={`Bajar «${option.body}»`}
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {!answer && (
        <Button variant="secondary" onClick={() => onAnswer({ order: [...ids] })}>
          Guardar este orden
        </Button>
      )}
    </div>
  );
}

export function ExamQuestion({
  item,
  total,
  answer,
  flagged,
  onAnswer,
  onFlag,
  announce,
  headingRef,
}: {
  readonly item: ExamItem;
  readonly total: number;
  readonly answer: Answer | null;
  readonly flagged: boolean;
  readonly onAnswer: (answer: Answer | null) => void;
  readonly onFlag: (flagged: boolean) => void;
  readonly announce: (text: string) => void;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const id = useId();
  const promptId = `${id}-prompt`;
  const chosen = selectedIds(answer);
  const toggle = (optionId: string, checked: boolean) => {
    if (item.response === 'single') {
      onAnswer({ choice: optionId });
      return;
    }
    const next = checked
      ? [...new Set([...chosen, optionId])]
      : chosen.filter((value) => value !== optionId);
    onAnswer(next.length > 0 ? { choices: next } : null);
  };
  return (
    <article className="exam-question" key={item.position} aria-labelledby={`${id}-title`}>
      <div className="exam-question__head">
        <h2 id={`${id}-title`} ref={headingRef} tabIndex={-1}>
          Pregunta {item.position} de {total}
        </h2>
        <button
          type="button"
          className={`exam-flag${flagged ? ' is-flagged' : ''}`}
          aria-pressed={flagged}
          onClick={() => onFlag(!flagged)}
        >
          <span aria-hidden="true">⚑</span>{' '}
          {flagged ? 'Marcada para revisar' : 'Marcar para revisar'}
        </button>
      </div>
      <QuestionBody
        prompt={item.prompt}
        code={item.code}
        exhibit={item.exhibit}
        headingId={promptId}
      />
      {item.response === 'order' ? (
        <fieldset className="exam-answer">
          <legend>{RESPONSE_INSTRUCTION.order}</legend>
          <OrderInput item={item} answer={answer} onAnswer={onAnswer} announce={announce} />
        </fieldset>
      ) : (
        <fieldset className="exam-answer" aria-describedby={promptId}>
          <legend>{RESPONSE_INSTRUCTION[item.response]}</legend>
          <ul className="exam-options">
            {item.options.map((option, index) => {
              const checked = chosen.includes(option.id);
              return (
                <li key={option.id}>
                  <label className={`exam-option${checked ? ' is-checked' : ''}`}>
                    <input
                      type={item.response === 'single' ? 'radio' : 'checkbox'}
                      name={`${id}-answer`}
                      value={option.id}
                      checked={checked}
                      onChange={(event) => toggle(option.id, event.currentTarget.checked)}
                    />
                    <span className="exam-option__letter" aria-hidden="true">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <OptionBody body={option.body} kind={option.kind} result={option.result} />
                  </label>
                </li>
              );
            })}
          </ul>
          {item.response === 'single' && answer && (
            <button type="button" className="exam-clear" onClick={() => onAnswer(null)}>
              Quitar mi respuesta
            </button>
          )}
        </fieldset>
      )}
    </article>
  );
}

export function SubmitDialog({
  open,
  onClose,
  onConfirm,
  unanswered,
  flagged,
  pending,
  submitting,
  error,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly unanswered: number;
  readonly flagged: number;
  readonly pending: boolean;
  readonly submitting: boolean;
  readonly error: string | null;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="¿Entregar la evaluación?"
      description="Después de entregar no podrás cambiar tus respuestas."
    >
      <ul className="exam-submit__summary">
        <li>
          {unanswered === 0
            ? 'Respondiste todas las preguntas.'
            : `${unanswered} ${unanswered === 1 ? 'pregunta sin responder' : 'preguntas sin responder'}.`}
        </li>
        {flagged > 0 && (
          <li>
            {flagged} {flagged === 1 ? 'pregunta marcada' : 'preguntas marcadas'} para revisar.
          </li>
        )}
        {pending && <li>Hay respuestas guardándose: se enviarán antes de entregar.</li>}
      </ul>
      {error && (
        <p className="exam-submit__error" role="alert">
          {error}
        </p>
      )}
      <div className="exam-submit__actions">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Seguir respondiendo
        </Button>
        <Button onClick={onConfirm} pending={submitting} pendingLabel="Entregando…">
          Entregar evaluación
        </Button>
      </div>
    </Dialog>
  );
}
