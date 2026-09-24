'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { publicUrlFromEnvironment } from '@/application/public-url';
import type { Failure, PresenterView, RoomCommand } from '../application/classroom-api';
import { StatisticsPanel } from './statistics-panel';
import { useFocusHeadingOnChange } from './use-focus-on-change';
import { formatDuration, useRoomSync, type RoomSubscriber } from './use-room-sync';
import { QrCode } from '@/presentation/components/media/qr-code';
import { Alert, Button, Chip, Dialog, LoadingState } from '@/presentation/components/ui';

export interface PresenterConsoleProps {
  readonly code: string;
  readonly loadView: (code: string) => Promise<PresenterView | Failure>;
  readonly runCommand: (code: string, command: RoomCommand) => Promise<PresenterView | Failure>;
  readonly subscribe?: RoomSubscriber | undefined;
}

const noSubscription = () => () => {};
const currentOrigin = () => window.location.origin;
const serverOrigin = () => '';

const STATUS_LABEL: Readonly<Record<PresenterView['room']['status'], string>> = {
  lobby: 'En espera',
  running: 'En curso',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
  expired: 'Caducada',
};

function useServerClock(offset: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now + offset;
}

/** Consola del profesor: código y QR, participantes, inicio, progreso, ranking y cierre. */
export function PresenterConsole({ code, loadView, runCommand, subscribe }: PresenterConsoleProps) {
  const { view, failure, offline, realtime, clockOffset, refresh } = useRoomSync({
    load: () => loadView(code),
    subscribe,
  });
  const serverNow = useServerClock(clockOffset);
  useFocusHeadingOnChange(view?.room.status ?? null);
  const origin = useSyncExternalStore(noSubscription, currentOrigin, serverOrigin);
  const base = publicUrlFromEnvironment(origin || undefined);
  const joinUrl = base.url ? `${base.url}/join/${code}` : `/join/${code}`;
  const [pending, setPending] = useState<RoomCommand | null>(null);
  const [confirm, setConfirm] = useState<'finish' | 'cancel' | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);

  const command = async (action: RoomCommand) => {
    setConfirm(null);
    setPending(action);
    setCommandError(null);
    try {
      const result = await runCommand(code, action);
      if ('ok' in result && result.ok === false) setCommandError(result.message);
      await refresh();
    } catch {
      setCommandError('No se pudo completar la orden. Comprueba la conexión.');
    } finally {
      setPending(null);
    }
  };

  if (!view) {
    if (failure) {
      return (
        <div className="site-container feature-page classroom-page">
          <header className="feature-heading">
            <span className="eyebrow">Sala en vivo · Profesor</span>
            <h1>Sala {code}</h1>
          </header>
          <Alert tone="warning" title="No puedes dirigir esta sala">
            {failure.message} Solo el navegador que creó la sala puede dirigirla.
          </Alert>
          <Link className="inline-action" href="/presenter">
            Crear una sala nueva <span aria-hidden="true">→</span>
          </Link>
        </div>
      );
    }
    return (
      <div className="site-container feature-page classroom-page">
        <h1 className="visually-hidden">Sala {code}</h1>
        <LoadingState label="Cargando la sala…" />
      </div>
    );
  }

  const { room, participants } = view;
  const elapsed = room.startedAt
    ? (room.finishedAt ?? Math.min(serverNow, room.expiresAt)) - room.startedAt
    : 0;
  const terminal =
    room.status === 'finished' || room.status === 'cancelled' || room.status === 'expired';

  return (
    <div className="site-container feature-page classroom-page">
      <header className="feature-heading classroom-heading">
        <span className="eyebrow">Sala en vivo · Profesor</span>
        <h1>Sala {room.code}</h1>
        <div className="classroom-status" aria-live="polite">
          <Chip tone={room.status === 'running' ? 'cyan' : terminal ? 'neutral' : 'primary'}>
            {STATUS_LABEL[room.status]}
          </Chip>
          <span>
            {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
          </span>
          {room.status === 'running' && (
            <span>
              Tiempo <strong>{formatDuration(elapsed)}</strong>
            </span>
          )}
          <span className="classroom-realtime">
            {offline
              ? 'Sin conexión: reintentando…'
              : realtime === 'connected'
                ? 'Tiempo real conectado'
                : 'Actualización automática cada pocos segundos'}
          </span>
        </div>
      </header>

      {commandError && (
        <Alert tone="danger" title="No se pudo completar la orden" live>
          {commandError}
        </Alert>
      )}

      {room.status === 'lobby' && (
        <section className="classroom-lobby" aria-labelledby="lobby-title">
          <div className="classroom-card classroom-join">
            <h2 id="lobby-title">Entrar a la sala</h2>
            <p
              className="classroom-code"
              aria-label={`Código de la sala: ${room.code.split('').join(' ')}`}
            >
              {room.code}
            </p>
            <div className="classroom-qr">
              <QrCode value={joinUrl} label={`Código QR para entrar a la sala ${room.code}`} />
            </div>
            <p className="classroom-url">{joinUrl}</p>
            {base.isLocal && (
              <Alert tone="warning" title="Dirección local">
                Este QR apunta a esta máquina: los móviles no podrán abrirlo. Configura
                NEXT_PUBLIC_SITE_URL con la dirección publicada o abre la plataforma con la IP de la
                red local.
              </Alert>
            )}
          </div>
          <div className="classroom-card">
            <h2>Participantes</h2>
            {participants.length === 0 ? (
              <p className="classroom-empty">Aún no hay participantes.</p>
            ) : (
              <ul className="classroom-people" aria-label="Participantes en la sala">
                {participants.map((person) => (
                  <li key={person.participantId}>
                    <span
                      className={`classroom-dot ${person.connected ? 'is-on' : ''}`}
                      aria-hidden="true"
                    />
                    {person.nickname}
                    <span className="visually-hidden">
                      {person.connected ? ' (conectado)' : ' (sin conexión reciente)'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="classroom-actions">
              <Button
                onClick={() => void command('start')}
                disabled={participants.length === 0 || pending !== null}
              >
                {pending === 'start' ? 'Iniciando…' : 'Iniciar el Challenge'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirm('cancel')}
                disabled={pending !== null}
              >
                Cancelar sala
              </Button>
            </div>
            <p className="classroom-hint">
              Al iniciar se cierra la inscripción: quien entre después verá que la actividad ya
              comenzó.
            </p>
          </div>
        </section>
      )}

      {room.status === 'running' && (
        <section className="classroom-running" aria-labelledby="running-title">
          <h2 id="running-title" className="visually-hidden">
            Actividad en curso
          </h2>
          <ul className="classroom-counters">
            <li>
              <strong>{participants.length}</strong> participantes
            </li>
            <li>
              <strong>{view.connected}</strong> conectados
            </li>
            <li>
              <strong>{view.responded}</strong> respondieron
            </li>
          </ul>
          <div className="classroom-actions">
            <Button onClick={() => setConfirm('finish')} disabled={pending !== null}>
              {pending === 'finish' ? 'Finalizando…' : 'Finalizar la sala'}
            </Button>
          </div>
        </section>
      )}

      {(room.status === 'running' || terminal) && (
        <div className="classroom-board">
          <section className="classroom-card" aria-labelledby="ranking-title">
            <h2 id="ranking-title">{terminal ? 'Ranking final' : 'Ranking en vivo'}</h2>
            <RankingTable participants={participants} />
          </section>
          <section className="classroom-card" aria-labelledby="progress-title">
            <h2 id="progress-title">Progreso por misión</h2>
            <MissionProgressList missions={view.missions} participants={participants.length} />
          </section>
        </div>
      )}

      {terminal && (
        <>
          <StatisticsPanel statistics={view.statistics} />
          <Link className="inline-action" href={`/results?sala=${room.code}` as Route}>
            Ver el resumen de resultados <span aria-hidden="true">→</span>
          </Link>
        </>
      )}

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'cancel' ? '¿Cancelar la sala?' : '¿Finalizar la sala?'}
        description={
          confirm === 'cancel'
            ? 'La sala se cierra sin registrar resultados finales.'
            : 'Se detienen las respuestas y se publica el ranking final con las estadísticas.'
        }
      >
        <div className="classroom-actions">
          <Button onClick={() => void command(confirm ?? 'finish')}>
            {confirm === 'cancel' ? 'Cancelar sala' : 'Finalizar y ver resultados'}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Volver
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export function RankingTable({
  participants,
}: {
  readonly participants: PresenterView['participants'];
}) {
  if (participants.length === 0) return <p className="classroom-empty">Sin resultados.</p>;
  return (
    <div className="classroom-table" role="region" aria-label="Ranking" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Alias</th>
            <th scope="col" className="is-number">
              Puntos
            </th>
            <th scope="col" className="is-number">
              Resueltas
            </th>
            <th scope="col" className="is-number">
              Tiempo
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((person) => (
            <tr key={person.participantId}>
              <td>{person.position}</td>
              <th scope="row">
                <span
                  className={`classroom-dot ${person.connected ? 'is-on' : ''}`}
                  aria-hidden="true"
                />
                {person.nickname}
              </th>
              <td className="is-number">{person.score}</td>
              <td className="is-number">{person.solvedMissions}</td>
              <td className="is-number">
                {person.solvedMissions > 0 ? formatDuration(person.timeMs) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MissionProgressList({
  missions,
  participants,
}: {
  readonly missions: PresenterView['missions'];
  readonly participants: number;
}) {
  return (
    <ol className="classroom-missions">
      {missions.map((mission) => (
        <li key={mission.missionId}>
          <span className="classroom-missions__name">
            {String(mission.order).padStart(2, '0')} · {mission.title}
          </span>
          <span className="classroom-bar" aria-hidden="true">
            <span
              style={{ width: `${participants ? (mission.solved / participants) * 100 : 0}%` }}
            />
          </span>
          <span className="classroom-missions__count">
            {mission.solved} {mission.solved === 1 ? 'resuelta' : 'resueltas'} · {mission.answered}{' '}
            {mission.answered === 1 ? 'respondió' : 'respondieron'}
          </span>
        </li>
      ))}
    </ol>
  );
}
