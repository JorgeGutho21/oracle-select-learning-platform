'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, LoadingState } from '@/presentation/components/ui';
import {
  getMission,
  isClosed,
  PRACTICE_RULES,
  type ChallengeEngine,
  type EvaluationOutcome,
  type MissionAnswer,
  type MissionId,
  type MissionState,
  type RestoreStatus,
} from '../application/challenge-api';
import { ChallengeSummary } from './challenge-summary';
import { emptyAnswer } from './interactions/mission-interaction';
import { MissionMap } from './mission-map';
import { MissionView } from './mission-view';
import { useChallengeState } from './use-challenge';

type Drafts = Partial<Record<MissionId, MissionAnswer>>;
type Texts = Partial<Record<MissionId, string>>;
type Outcomes = Partial<Record<MissionId, EvaluationOutcome>>;

/** Tras recargar, el último intento guardado restituye su feedback. */
function lastAttemptOutcome(state: MissionState): EvaluationOutcome | null {
  const last = state.attempts.at(-1);
  if (!last) return null;
  return { kind: last.correct ? 'correct' : 'incorrect', feedback: last.feedback };
}

/** Destino del foco: el título, un botón de la misión actual o el resumen. */
type FocusTarget = 'title' | 'next' | 'submit' | 'hint' | 'summary';

export interface ChallengeExperienceProps {
  engine: ChallengeEngine;
  /**
   * Partida dentro de una sala en vivo: el servidor registra los puntos y la cierra el
   * profesor, así que no se ofrecen «Terminar» ni «Reiniciar».
   */
  live?: { readonly roomCode: string };
}

/** Práctica individual del SQL Oracle Challenge (UX_FLOWS, Flujo E). */
export function ChallengeExperience({ engine, live }: ChallengeExperienceProps) {
  const state = useChallengeState(engine);
  const [restore, setRestore] = useState<RestoreStatus | 'loading'>('loading');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [outcomes, setOutcomes] = useState<Outcomes>({});
  const [hints, setHints] = useState<Texts>({});
  const [explanations, setExplanations] = useState<Texts>({});
  const [pending, setPending] = useState<'submit' | 'hint' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [session, setSession] = useState(0);
  // Destino del foco tras una acción. Es estado (no una referencia) para que siempre haya
  // un render que lo aplique; se aplica cuando el elemento destino ya existe.
  const [focusRequest, setFocusRequest] = useState<{
    readonly target: FocusTarget;
    readonly seq: number;
  } | null>(null);
  const appliedFocus = useRef(0);
  const requestFocus = useCallback((target: FocusTarget) => {
    setFocusRequest((current) => ({ target, seq: (current?.seq ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    let active = true;
    engine.restore().then((status) => {
      if (active) setRestore(status);
    });
    return () => {
      active = false;
    };
  }, [engine]);

  // El cronómetro se detiene al ocultar o abandonar la pestaña.
  useEffect(() => {
    const onVisibility = () => {
      void (document.visibilityState === 'hidden' ? engine.pause() : engine.resume());
    };
    const onHide = () => void engine.pause();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      void engine.pause();
    };
  }, [engine]);

  const currentId = state?.currentMissionId ?? null;
  const finished = state?.status === 'finished';
  const summaryVisible = finished || showSummary;

  // Recupera la explicación cuando una misión queda cerrada (G15).
  useEffect(() => {
    if (!state || currentId === null || explanations[currentId]) return;
    if (!isClosed(getMission(state, currentId))) return;
    let active = true;
    engine
      .getExplanation(currentId)
      .then((text) => active && setExplanations((items) => ({ ...items, [currentId]: text })))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [engine, state, currentId, explanations]);

  useEffect(() => {
    if (!focusRequest || focusRequest.seq === appliedFocus.current) return;
    const id =
      focusRequest.target === 'summary'
        ? 'summary-title'
        : currentId && `mission-${currentId}-${focusRequest.target}`;
    const element = id ? document.getElementById(id) : null;
    if (!element) return;
    appliedFocus.current = focusRequest.seq;
    element.focus();
    // WebKit ignora el foco en el mismo turno en que se cierra un <dialog> modal (el resto de
    // la página sigue inerte): se repite en el siguiente fotograma solo si el foco quedó
    // perdido en la página, para no quitárselo a un control que la persona ya eligió.
    window.requestAnimationFrame(() => {
      const lost = !document.activeElement || document.activeElement === document.body;
      if (lost && element.isConnected) element.focus();
    });
  }, [focusRequest, currentId, state, showSummary]);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la acción.');
    }
  }, []);

  const start = () =>
    run(async () => {
      setDrafts({});
      setOutcomes({});
      setHints({});
      setExplanations({});
      setShowSummary(false);
      setRestore('empty');
      setSession((value) => value + 1);
      await engine.reset();
      requestFocus('title');
    });

  const open = (id: MissionId) =>
    run(async () => {
      setShowSummary(false);
      await engine.openMission(id);
      requestFocus('title');
    });

  if (restore === 'loading') {
    return (
      <div className="site-container feature-page">
        <LoadingState label="Preparando el Challenge…" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="site-container feature-page">
        <header className="feature-heading">
          <span className="eyebrow">Aplicar</span>
          <h1>SQL Oracle Challenge</h1>
          <p className="readable muted">
            Diez misiones para construir, predecir y reparar consultas SELECT sobre la tabla
            EMPLEADOS.
          </p>
        </header>
        <section className="ch-intro" aria-labelledby="intro-title">
          <h2 id="intro-title">Cómo funciona</h2>
          <ul className="ch-rules">
            <li>Cada misión vale {PRACTICE_RULES.maxScorePerMission} puntos; el máximo es 1000.</li>
            <li>
              Tienes {PRACTICE_RULES.maxScoredAttempts} intentos puntuados. Acertar en el segundo
              resta {PRACTICE_RULES.attemptPenalty} puntos.
            </li>
            <li>La pista es opcional y resta {PRACTICE_RULES.hintPenalty} puntos.</li>
            <li>El cronómetro solo informa tu tiempo y se pausa al salir de la pestaña.</li>
            <li>Puedes arrastrar piezas, tocarlas o usar el teclado.</li>
            <li>
              {live
                ? 'Tus puntos los registra el servidor y aparecen en el ranking de la clase.'
                : 'Es práctica individual: tu resultado se guarda solo en este navegador.'}
            </li>
          </ul>
          {restore === 'discarded' && (
            <Alert tone="info" title="Partida anterior descartada">
              La práctica guardada pertenecía a otra versión del Challenge o estaba dañada.
            </Alert>
          )}
          {restore === 'unavailable' && (
            <Alert tone="warning" title="Sin almacenamiento local">
              Este navegador no permite guardar la partida. Podrás jugar, pero el progreso se
              perderá al recargar.
            </Alert>
          )}
          <div className="ch-actions">
            <Button onClick={start}>{live ? 'Comenzar el Challenge' : 'Comenzar práctica'}</Button>
          </div>
          {error && (
            <Alert tone="danger" title="No se pudo iniciar" live>
              {error}
            </Alert>
          )}
        </section>
      </div>
    );
  }

  const result = engine.getResult()!;
  const mission = currentId ? engine.getMission(currentId) : null;
  const missionState = currentId ? getMission(state, currentId) : null;
  const hasNext = state.missionOrder.some(
    (id) => id !== currentId && !isClosed(getMission(state, id)),
  );

  const submit = () =>
    run(async () => {
      if (!mission) return;
      setPending('submit');
      try {
        const answer = drafts[mission.id] ?? emptyAnswer(mission);
        const submitted = await engine.submit(answer);
        setOutcomes((items) => ({ ...items, [mission.id]: submitted.outcome }));
        // Al acertar desaparece el botón de enviar: el foco pasa a «Siguiente misión». Si no,
        // vuelve al botón de enviar, que se deshabilita mientras se corrige y pierde el foco.
        // El resultado ya lo anuncia la región de estado.
        requestFocus(submitted.mission.status === 'solved' ? 'next' : 'submit');
      } finally {
        setPending(null);
      }
    });

  const requestHint = () =>
    run(async () => {
      if (!mission) return;
      setPending('hint');
      try {
        const delivered = await engine.requestHint();
        if (delivered.status === 'delivered') {
          setHints((items) => ({ ...items, [mission.id]: delivered.hint }));
        } else {
          setError(delivered.message);
        }
        requestFocus('hint');
      } finally {
        setPending(null);
      }
    });

  // Omitir cierra la misión: el botón que abrió el diálogo desaparece y el foco pasa a
  // «Siguiente misión».
  const skip = () =>
    run(async () => {
      await engine.skip();
      requestFocus('next');
    });

  const next = () =>
    run(async () => {
      const nextId = await engine.advance();
      if (nextId) requestFocus('title');
      else {
        setShowSummary(true);
        requestFocus('summary');
      }
    });

  const finish = () =>
    run(async () => {
      setConfirmFinish(false);
      await engine.finish();
      requestFocus('summary');
    });

  return (
    <div className="site-container feature-page ch-page">
      <header className="feature-heading ch-page__heading">
        <span className="eyebrow">
          {live ? `Sala en vivo · ${live.roomCode}` : 'Aplicar · Práctica individual'}
        </span>
        <h1>SQL Oracle Challenge</h1>
        {engine.getPersistenceStatus() === 'unavailable' && (
          <Alert tone="warning" title="Progreso sin guardar">
            Este navegador no permite guardar la partida; se perderá al recargar.
          </Alert>
        )}
        {restore === 'restored' && (
          <p className="ch-muted">Recuperamos tu práctica guardada en este navegador.</p>
        )}
      </header>

      {error && (
        <Alert tone="danger" title="No se pudo completar la acción" live>
          {error}
        </Alert>
      )}

      <div className="ch-layout">
        <aside className="ch-layout__map">
          <MissionMap
            missions={engine.missions}
            result={result}
            currentId={summaryVisible ? null : currentId}
            disabled={pending !== null || finished}
            onOpen={open}
          />
          {!finished && !live && (
            <Button variant="secondary" onClick={() => setConfirmFinish(true)}>
              Terminar y ver resultados
            </Button>
          )}
        </aside>
        <div className="ch-layout__main">
          {summaryVisible ? (
            <ChallengeSummary
              result={result}
              missions={engine.missions}
              {...(live ? {} : { onRestart: start })}
              {...(!finished ? { onReview: () => setShowSummary(false) } : {})}
            />
          ) : mission && missionState ? (
            <MissionView
              key={`${session}-${mission.id}`}
              mission={mission}
              state={missionState}
              total={engine.missions.length}
              draft={drafts[mission.id] ?? emptyAnswer(mission)}
              onDraftChange={(answer) => setDrafts((items) => ({ ...items, [mission.id]: answer }))}
              outcome={outcomes[mission.id] ?? lastAttemptOutcome(missionState)}
              hint={hints[mission.id] ?? null}
              explanation={explanations[mission.id] ?? null}
              pending={pending}
              hasNext={hasNext}
              onSubmit={submit}
              onHint={requestHint}
              onSkip={skip}
              onNext={next}
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="¿Terminar la práctica?"
        description="Las misiones que sigan abiertas se cerrarán con cero puntos. Después podrás reiniciar desde cero."
      >
        <div className="ch-actions">
          <Button onClick={finish}>Terminar y ver resultados</Button>
          <Button variant="secondary" onClick={() => setConfirmFinish(false)}>
            Seguir jugando
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
