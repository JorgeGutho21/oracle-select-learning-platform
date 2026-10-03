'use client';

import { useState } from 'react';
import { Alert, Button, Chip, CodeBlock, Dialog } from '@/presentation/components/ui';
import {
  elapsedMs,
  isClosed,
  PRACTICE_RULES,
  scoredAttempts,
  type AnyPublicMission,
  type Difficulty,
  type EvaluationOutcome,
  type FeedbackCategory,
  type MissionAnswer,
  type MissionState,
} from '../application/challenge-api';
import { formatDuration } from './format';
import { MissionInteraction } from './interactions/mission-interaction';
import { MISSION_CONTEXT } from './mission-context';
import { ConceptNote, FullDataset, SchemaOverview, WorkingSample } from './mission-data';
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

const QUERY_LABEL: Partial<Record<AnyPublicMission['interactionType'], string>> = {
  'predict-result': 'Consulta',
  'expression-builder': 'Consulta con un espacio por completar',
  'distinct-result': 'Consulta objetivo',
};

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  sintaxis: 'Sintaxis',
  semantica: 'Semántica',
  concepto: 'Concepto',
  orden: 'Orden de las cláusulas',
  columna: 'Columnas',
  condicion: 'Condición',
  operador: 'Operador',
  resultado: 'Resultado',
  alcance: 'Alcance educativo',
};

/**
 * Respuesta incorrecta sin tono de castigo: tipo de error, qué está bien, qué revisar y una
 * pista (conceptual en el primer intento, más localizada después).
 */
function IncorrectFeedback({
  outcome,
  retry,
  attempts,
}: {
  outcome: Extract<EvaluationOutcome, { kind: 'incorrect' }>;
  retry: boolean;
  attempts: number;
}) {
  return (
    <div className="ds-alert ds-alert--warning ch-outcome" role="alert">
      <span className="ds-alert__icon" aria-hidden="true">
        !
      </span>
      <div className="ds-alert__body">
        <p className="ch-outcome__title">
          <strong>Revisa tu respuesta</strong>
          {outcome.category && (
            <span className="ch-outcome__category">
              <span className="ch-outcome__category-label">Tipo de error: </span>
              {CATEGORY_LABEL[outcome.category]}
            </span>
          )}
        </p>
        <dl className="ch-outcome__parts">
          {outcome.good && (
            <div className="ch-outcome__part ch-outcome__part--good">
              <dt>
                <span aria-hidden="true">✓ </span>Qué está bien
              </dt>
              <dd>{outcome.good}</dd>
            </div>
          )}
          <div className="ch-outcome__part ch-outcome__part--adjust">
            <dt>
              <span aria-hidden="true">→ </span>Qué debes revisar
            </dt>
            <dd>{outcome.feedback}</dd>
          </div>
          {outcome.guidance && (
            <div className="ch-outcome__part ch-outcome__part--guide">
              <dt>
                <span aria-hidden="true">? </span>
                {attempts > 1 ? 'Dónde mirar' : 'Pista conceptual'}
              </dt>
              <dd>{outcome.guidance}</dd>
            </div>
          )}
        </dl>
        {retry && <p className="ch-outcome__retry">Ajusta tu respuesta y vuelve a intentarlo.</p>}
      </div>
    </div>
  );
}

function OutcomeAlert({
  outcome,
  retry,
  attempts,
}: {
  outcome: EvaluationOutcome;
  retry: boolean;
  attempts: number;
}) {
  switch (outcome.kind) {
    case 'correct':
      return (
        <Alert tone="success" title="Correcto" live>
          {/* El título ya dice «Correcto»: el texto empieza por el porqué. */}
          {outcome.feedback.replace(/^Correcto[.:]\s*/, '')}
        </Alert>
      );
    case 'incorrect':
      return <IncorrectFeedback outcome={outcome} retry={retry} attempts={attempts} />;
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
  const context = MISSION_CONTEXT[mission.id];
  // La consulta de la misión acompaña al pedido: es parte de la pregunta, no de la respuesta.
  const query = 'query' in mission.publicData ? mission.publicData.query : null;
  const highlighted = draft.type === 'drag-column' ? draft.columns : [];
  // M08 presenta una de sus variantes: su pedido es el de la consulta con error.
  const variant =
    mission.publicData.type === 'hotspot-error' && draft.type === 'hotspot-error'
      ? mission.publicData.variants.find((entry) => entry.id === draft.variantId)
      : undefined;
  const request = variant?.request ?? mission.request;

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

      <div className="ch-mission__grid">
        <div className="ch-mission__context">
          <blockquote className="ch-request">
            <span className="ch-request__label">Pedido</span>
            <p>«{request}»</p>
          </blockquote>
          {variant && <p className="ch-muted">{mission.request}</p>}
          {query && (
            <CodeBlock code={query} label={QUERY_LABEL[mission.interactionType] ?? 'Consulta'} />
          )}
          <ConceptNote ids={context.concepts} />
          {context.sample ? (
            <WorkingSample spec={context.sample} highlighted={highlighted} />
          ) : (
            <FullDataset />
          )}
        </div>
        <div className="ch-mission__work">
          <p className="ch-instructions">{mission.instructions}</p>
          {context.schema && <SchemaOverview />}

          <MissionInteraction
            mission={mission}
            answer={draft}
            onChange={onDraftChange}
            disabled={inputDisabled}
            reveal={closed}
            solved={state.status === 'solved'}
          />

          <div className="ch-feedback">
            {outcome && <OutcomeAlert outcome={outcome} retry={!closed} attempts={used} />}
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
                id={`mission-${mission.id}-submit`}
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
                id={`mission-${mission.id}-hint`}
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
              <Button
                id={`mission-${mission.id}-next`}
                onClick={onNext}
                variant={state.status === 'solved' ? 'primary' : 'secondary'}
              >
                {hasNext ? 'Siguiente misión' : 'Ver resultados'}
              </Button>
            )}
            {!closed && (
              <Button
                variant="text"
                onClick={() => setConfirmSkip(true)}
                disabled={pending !== null}
              >
                Omitir misión
              </Button>
            )}
          </div>
        </div>
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
