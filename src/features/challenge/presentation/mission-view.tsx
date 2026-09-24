'use client';

import { useState } from 'react';
import { Alert, Button, Chip, Dialog } from '@/presentation/components/ui';
import {
  elapsedMs,
  isClosed,
  PRACTICE_RULES,
  scoredAttempts,
  type AnyPublicMission,
  type Difficulty,
  type EvaluationOutcome,
  type MissionAnswer,
  type MissionState,
} from '../application/challenge-api';
import { formatDuration } from './format';
import { MissionInteraction } from './interactions/mission-interaction';
import { useNow } from './use-challenge';

const difficultyLabel: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil',
};

export interface MissionViewProps {
  mission: AnyPublicMission;
  state: MissionState;
  total: number;
  draft: MissionAnswer;
  onDraftChange: (answer: MissionAnswer) => void;
  outcome: EvaluationOutcome | null;
  hint: string | null;
  explanation: string | null;
  pending: 'submit' | 'hint' | null;
  hasNext: boolean;
  onSubmit: () => void;
  onHint: () => void;
  onSkip: () => void;
  onNext: () => void;
}

function statusChip(state: MissionState) {
  switch (state.status) {
    case 'solved':
      return <Chip tone="success">Resuelta</Chip>;
    case 'failed':
      return <Chip tone="danger">Sin puntos</Chip>;
    case 'skipped':
      return <Chip tone="warning">Omitida</Chip>;
    default:
      return <Chip tone="primary">En curso</Chip>;
  }
}

function OutcomeAlert({ outcome }: { outcome: EvaluationOutcome }) {
  switch (outcome.kind) {
    case 'correct':
      return (
        <Alert tone="success" title="Correcto" live>
          {outcome.feedback}
        </Alert>
      );
    case 'incorrect':
      return (
        <Alert tone="danger" title="Revisa tu respuesta" live>
          {outcome.feedback}
        </Alert>
      );
    case 'invalid-input':
      return (
        <Alert tone="info" title="Completa tu respuesta" live>
          {outcome.message} No se consumió ningún intento.
        </Alert>
      );
    case 'technical':
      return (
        <Alert tone="warning" title="Servicio no disponible" live>
          {outcome.message}
        </Alert>
      );
  }
}

export function MissionView({
  mission,
  state,
  total,
  draft,
  onDraftChange,
  outcome,
  hint,
  explanation,
  pending,
  hasNext,
  onSubmit,
  onHint,
  onSkip,
  onNext,
}: MissionViewProps) {
  const [confirmSkip, setConfirmSkip] = useState(false);
  const closed = isClosed(state);
  const running = state.timer.runningSince !== null;
  const now = useNow(running);
  const used = scoredAttempts(state).length;
  const written = mission.interactionType === 'write-query';
  const practice = closed && state.status !== 'solved';
  const inputDisabled = pending !== null || state.status === 'solved';
  const titleId = `mission-${mission.id}-title`;

  return (
    <article className="ch-mission" aria-labelledby={titleId}>
      <header className="ch-mission__header">
        <div>
          <span className="eyebrow">
            Misión {String(mission.order).padStart(2, '0')} de {total}
          </span>
          <h2 id={titleId} className="ch-mission__title" tabIndex={-1}>
            {mission.title}
          </h2>
        </div>
        <div className="ch-mission__meta">
          <Chip tone="neutral">{difficultyLabel[mission.difficulty]}</Chip>
          {statusChip(state)}
          <span className="ch-meta">
            {closed
              ? `Intentos usados: ${used} de ${PRACTICE_RULES.maxScoredAttempts}`
              : `Intento ${Math.min(used + 1, PRACTICE_RULES.maxScoredAttempts)} de ${PRACTICE_RULES.maxScoredAttempts}`}
          </span>
          <span className="ch-meta ch-meta--timer">
            <span className="ds-sr-only">Tiempo en esta misión: </span>
            <span aria-hidden="true">⏱ </span>
            {formatDuration(elapsedMs(state.timer, now))}
          </span>
        </div>
      </header>

      <blockquote className="ch-request">
        <span className="ch-request__label">Pedido</span>
        <p>«{mission.request}»</p>
      </blockquote>
      <p className="ch-instructions">{mission.instructions}</p>

      <MissionInteraction
        mission={mission}
        answer={draft}
        onChange={onDraftChange}
        disabled={inputDisabled}
      />

      <div className="ch-feedback">
        {outcome && <OutcomeAlert outcome={outcome} />}
        {hint && (
          <Alert tone="info" title={`Pista (−${PRACTICE_RULES.hintPenalty} puntos)`}>
            {hint}
          </Alert>
        )}
        {practice && (
          <Alert tone="info" title="Práctica sin puntos">
            La oportunidad puntuada terminó. Puedes seguir ensayando: estos intentos no suman
            puntos.
          </Alert>
        )}
        {explanation && (
          <Alert tone="success" title="Explicación">
            {explanation}
          </Alert>
        )}
      </div>

      <div className="ch-actions">
        {state.status !== 'solved' && (
          <Button
            onClick={onSubmit}
            pending={pending === 'submit'}
            pendingLabel="Corrigiendo…"
            disabled={pending !== null}
          >
            {practice ? 'Comprobar (práctica)' : written ? 'Enviar para evaluar' : 'Comprobar'}
          </Button>
        )}
        {!closed && (
          <Button
            variant="secondary"
            onClick={onHint}
            pending={pending === 'hint'}
            pendingLabel="Pidiendo pista…"
            disabled={pending !== null}
          >
            {state.hint ? 'Ver pista' : `Pedir pista (−${PRACTICE_RULES.hintPenalty} puntos)`}
          </Button>
        )}
        {closed && (
          <Button onClick={onNext} variant={state.status === 'solved' ? 'primary' : 'secondary'}>
            {hasNext ? 'Siguiente misión' : 'Ver resultados'}
          </Button>
        )}
        {!closed && (
          <Button variant="text" onClick={() => setConfirmSkip(true)} disabled={pending !== null}>
            Omitir misión
          </Button>
        )}
      </div>

      <Dialog
        open={confirmSkip}
        onClose={() => setConfirmSkip(false)}
        title="¿Omitir esta misión?"
        description="La misión se cerrará con cero puntos y quedará marcada para repasar. Después podrás ver su explicación."
      >
        <div className="ch-actions">
          <Button
            onClick={() => {
              setConfirmSkip(false);
              onSkip();
            }}
          >
            Omitir con cero puntos
          </Button>
          <Button variant="secondary" onClick={() => setConfirmSkip(false)}>
            Seguir intentando
          </Button>
        </div>
      </Dialog>
    </article>
  );
}
