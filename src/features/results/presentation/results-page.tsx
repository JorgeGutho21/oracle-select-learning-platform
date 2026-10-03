'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  ChallengeEngine,
  ChallengeResult,
} from '@/features/challenge/application/challenge-api';
import type {
  Failure,
  ParticipantView,
  PresenterView,
} from '@/features/classroom/application/classroom-api';
import { ParticipantSummary, personalSentence } from '@/features/classroom/presentation/join-flow';
import {
  MissionProgressList,
  RankingTable,
} from '@/features/classroom/presentation/presenter-console';
import { StatisticsPanel } from '@/features/classroom/presentation/statistics-panel';
import { formatDuration, formatPercent } from '@/features/classroom/presentation/use-room-sync';
import { Alert, LoadingState } from '@/presentation/components/ui';

export interface ResultsPageProps {
  /** Código de sala ya normalizado (`?sala=`), o `null`. */
  readonly roomCode: string | null;
  readonly loadPresenter: (code: string) => Promise<PresenterView | Failure>;
  readonly loadParticipant: (code: string) => Promise<ParticipantView | Failure>;
  /** Motor de la práctica individual, solo para leer el resultado guardado en este navegador. */
  readonly practice: ChallengeEngine;
}

type RoomResult =
  | { readonly kind: 'loading' }
  | { readonly kind: 'presenter'; readonly view: PresenterView }
  | { readonly kind: 'participant'; readonly view: ParticipantView }
  | { readonly kind: 'none'; readonly message: string };

type PracticeResult =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly result: ChallengeResult | null };

const ROOM_STATUS: Readonly<Record<PresenterView['room']['status'], string>> = {
  lobby: 'La sala aún no comenzó.',
  running: 'La sala sigue en curso: los datos pueden cambiar.',
  finished: 'Resultados finales.',
  cancelled: 'La sala se canceló.',
  expired: 'La sala caducó.',
};

/** `/results`: resultados de una sala (profesor o estudiante) y de la práctica local. */
export function ResultsPage({
  roomCode,
  loadPresenter,
  loadParticipant,
  practice,
}: ResultsPageProps) {
  const [room, setRoom] = useState<RoomResult>(
    roomCode ? { kind: 'loading' } : { kind: 'none', message: '' },
  );
  const [local, setLocal] = useState<PracticeResult>({ kind: 'loading' });

  useEffect(() => {
    if (!roomCode) return;
    let active = true;
    const load = async (): Promise<RoomResult> => {
      // La cookie del navegador decide qué vista corresponde; nadie ve la de otro rol.
      const presenter = await loadPresenter(roomCode);
      if (!('ok' in presenter)) return { kind: 'presenter', view: presenter };
      const participant = await loadParticipant(roomCode);
      if (!('ok' in participant)) return { kind: 'participant', view: participant };
      return {
        kind: 'none',
        message:
          participant.reason === 'not-found'
            ? 'No existe una sala con ese código.'
            : 'Este navegador no participó en esa sala ni la dirigió.',
      };
    };
    load()
      .then((next) => active && setRoom(next))
      .catch(() => active && setRoom({ kind: 'none', message: 'No se pudo consultar la sala.' }));
    return () => {
      active = false;
    };
  }, [roomCode, loadPresenter, loadParticipant]);

  useEffect(() => {
    let active = true;
    practice
      .restore()
      .then(() => active && setLocal({ kind: 'ready', result: practice.getResult() }))
      .catch(() => active && setLocal({ kind: 'ready', result: null }));
    return () => {
      active = false;
    };
  }, [practice]);

  return (
    <div className="site-container feature-page classroom-page">
      <header className="feature-heading">
        <span className="eyebrow">Revisar</span>
        <h1>Resultados</h1>
        <p className="muted">
          Los resultados de una sala los calcula el servidor. La práctica individual se guarda solo
          en este navegador.
        </p>
      </header>

      {roomCode && (
        <section className="classroom-results" aria-labelledby="room-results-title">
          <h2 id="room-results-title">Sala {roomCode}</h2>
          {room.kind === 'loading' && <LoadingState label="Cargando la sala…" />}
          {room.kind === 'none' && (
            <Alert tone="info" title="Sin resultados de esta sala">
              {room.message}
            </Alert>
          )}
          {room.kind === 'presenter' && <PresenterResults view={room.view} />}
          {room.kind === 'participant' && (
            <>
              <p className="muted">
                {ROOM_STATUS[room.view.room.status]} {personalSentence(room.view)}
              </p>
              <ParticipantSummary view={room.view} headingLevel={3} />
            </>
          )}
        </section>
      )}

      <section className="classroom-results" aria-labelledby="practice-results-title">
        <h2 id="practice-results-title">Práctica individual</h2>
        {local.kind === 'loading' ? (
          <LoadingState label="Leyendo la práctica guardada…" />
        ) : local.result ? (
          <PracticeSummary result={local.result} />
        ) : (
          <Alert tone="info" title="Aún no hay práctica guardada">
            Cuando juegues el <Link href="/challenge">SQL Oracle Challenge</Link>, tu resultado
            aparecerá aquí.
          </Alert>
        )}
      </section>

      {!roomCode && (
        <p className="classroom-hint">
          Los resultados de una sala en vivo se abren desde la propia sala, al finalizar.
        </p>
      )}
    </div>
  );
}

function PresenterResults({ view }: { readonly view: PresenterView }) {
  return (
    <>
      <p className="muted">{ROOM_STATUS[view.room.status]}</p>
      <StatisticsPanel statistics={view.statistics} headingLevel={3} />
      <div className="classroom-board">
        <section className="classroom-card" aria-labelledby="results-ranking-title">
          <h3 id="results-ranking-title">
            {view.room.status === 'finished' ? 'Ranking final' : 'Ranking'}
          </h3>
          <RankingTable participants={view.participants} />
        </section>
        <section className="classroom-card" aria-labelledby="results-progress-title">
          <h3 id="results-progress-title">Progreso por misión</h3>
          <MissionProgressList missions={view.missions} participants={view.participants.length} />
        </section>
      </div>
      <Link className="inline-action" href={`/presenter/${view.room.code}` as Route}>
        Volver a la consola de la sala <span aria-hidden="true">→</span>
      </Link>
    </>
  );
}

function PracticeSummary({ result }: { readonly result: ChallengeResult }) {
  const attempts = result.missions.reduce((sum, mission) => sum + mission.scoredAttempts, 0);
  const items = [
    { label: 'Puntuación', value: `${result.totalScore} / ${result.maxScore}` },
    { label: 'Misiones resueltas', value: `${result.solvedCount} de ${result.missionCount}` },
    { label: 'Precisión', value: formatPercent(result.accuracy) },
    { label: 'Tiempo activo', value: formatDuration(result.totalTimeMs) },
    { label: 'Intentos puntuados', value: String(attempts) },
    { label: 'Pistas usadas', value: String(result.hintsUsed) },
  ];
  return (
    <div className="classroom-card">
      <p className="muted">
        {result.status === 'finished' ? 'Práctica terminada.' : 'Práctica en curso.'} Resultado
        local e informativo: no alimenta ninguna sala.
      </p>
      <dl className="classroom-stats">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <Link className="inline-action" href="/challenge">
        {result.status === 'finished' ? 'Ver el detalle en el Challenge' : 'Continuar la práctica'}{' '}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
