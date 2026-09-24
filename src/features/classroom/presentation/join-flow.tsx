'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  NICKNAME_MAX,
  type Failure,
  type ParticipantView,
  type RoomStatus,
} from '../application/classroom-api';
import { useFocusHeadingOnChange } from './use-focus-on-change';
import { formatDuration, formatPercent, useRoomSync, type RoomSubscriber } from './use-room-sync';
import { Alert, Button, Chip, Dialog, LoadingState } from '@/presentation/components/ui';

export interface JoinFlowProps {
  readonly code: string;
  readonly checkCode: (
    code: string,
  ) => Promise<{ ok: true; code: string; status: RoomStatus } | Failure>;
  readonly join: (code: string, nickname: string) => Promise<{ ok: true; code: string } | Failure>;
  readonly loadView: (code: string) => Promise<ParticipantView | Failure>;
  readonly leave: (code: string) => Promise<{ ok: true } | Failure>;
  readonly subscribe?: RoomSubscriber | undefined;
  /** El Challenge en vivo lo crea la raíz de composición: presentación no conoce el motor. */
  readonly renderChallenge: (room: { readonly code: string; readonly id: string }) => ReactNode;
}

type Stage =
  | { readonly kind: 'checking' }
  | { readonly kind: 'form'; readonly code: string }
  | { readonly kind: 'joined'; readonly code: string }
  | { readonly kind: 'blocked'; readonly title: string; readonly message: string };

function blockedFor(failure: Failure | RoomStatus): Stage {
  switch (
    failure === 'running' ? 'closed' : typeof failure === 'string' ? failure : failure.reason
  ) {
    case 'closed':
      return {
        kind: 'blocked',
        title: 'La actividad ya comenzó',
        message:
          'La inscripción se cerró al iniciar el Challenge. Pide al profesor que abra una sala nueva o practica por tu cuenta.',
      };
    case 'finished':
    case 'cancelled':
      return {
        kind: 'blocked',
        title: 'La sala terminó',
        message: 'Esta sala ya no recibe participantes.',
      };
    case 'expired':
      return {
        kind: 'blocked',
        title: 'La sala caducó',
        message: 'Las salas duran como máximo cuatro horas. Pide al profesor un código nuevo.',
      };
    case 'full':
      return {
        kind: 'blocked',
        title: 'La sala está llena',
        message: 'Se alcanzó el número máximo de participantes para esta sala.',
      };
    case 'not-found':
      return {
        kind: 'blocked',
        title: 'No encontramos la sala',
        message: 'Revisa el código que muestra el profesor en la pantalla.',
      };
    case 'invalid':
      return {
        kind: 'blocked',
        title: 'Código no válido',
        message: 'El código tiene seis letras o números, por ejemplo AB3K9X.',
      };
    case 'unconfigured':
      return {
        kind: 'blocked',
        title: 'Sala en vivo no disponible',
        message: 'La sala en vivo no está configurada en este servidor.',
      };
    default:
      return {
        kind: 'blocked',
        title: 'No se pudo entrar',
        message: typeof failure === 'string' ? 'Inténtalo de nuevo.' : failure.message,
      };
  }
}

/** Entrada del estudiante desde el móvil: código, alias, espera, Challenge y resultado. */
export function JoinFlow(props: JoinFlowProps) {
  const { code, checkCode, loadView } = props;
  const [stage, setStage] = useState<Stage>({ kind: 'checking' });
  const [retry, setRetry] = useState(0);

  const locate = useCallback(async (): Promise<Stage> => {
    // Con la cookie de esta sala la persona vuelve directamente (recarga o reconexión).
    const view = await loadView(code);
    if (!('ok' in view)) return { kind: 'joined', code: view.room.code };
    if (view.reason !== 'forbidden') return blockedFor(view);
    const checked = await checkCode(code);
    if (!checked.ok) return blockedFor(checked);
    return checked.status === 'lobby'
      ? { kind: 'form', code: checked.code }
      : blockedFor(checked.status);
  }, [code, checkCode, loadView]);

  useEffect(() => {
    let active = true;
    locate()
      .then((next) => {
        if (active) setStage(next);
      })
      .catch(() => {
        if (active) {
          setStage({
            kind: 'blocked',
            title: 'Sin conexión',
            message: 'No se pudo consultar la sala. Comprueba la conexión e inténtalo de nuevo.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [locate, retry]);

  if (stage.kind === 'checking') {
    return (
      <div className="site-container feature-page classroom-page">
        <h1 className="visually-hidden">Entrar a la sala</h1>
        <LoadingState label="Buscando la sala…" />
      </div>
    );
  }
  if (stage.kind === 'blocked') {
    return (
      <div className="site-container feature-page classroom-page">
        <header className="feature-heading">
          <span className="eyebrow">Sala en vivo</span>
          <h1>{stage.title}</h1>
        </header>
        <Alert tone="warning" title={stage.title}>
          {stage.message}
        </Alert>
        <div className="classroom-actions">
          <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
            Volver a comprobar
          </Button>
          <Link className="inline-action" href="/live">
            Escribir otro código <span aria-hidden="true">→</span>
          </Link>
          <Link className="inline-action" href="/challenge">
            Practicar por mi cuenta <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }
  if (stage.kind === 'form') {
    return (
      <NicknameForm
        code={stage.code}
        join={props.join}
        onJoined={() => setStage({ kind: 'joined', code: stage.code })}
        onBlocked={(failure) => setStage(blockedFor(failure))}
      />
    );
  }
  return (
    <ParticipantRoom
      code={stage.code}
      loadView={loadView}
      leave={props.leave}
      subscribe={props.subscribe}
      renderChallenge={props.renderChallenge}
      onLost={() => {
        setStage({ kind: 'checking' });
        setRetry((value) => value + 1);
      }}
    />
  );
}

function NicknameForm({
  code,
  join,
  onJoined,
  onBlocked,
}: {
  readonly code: string;
  readonly join: JoinFlowProps['join'];
  readonly onJoined: () => void;
  readonly onBlocked: (failure: Failure) => void;
}) {
  const inputId = useId();
  const noticeId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Campo no controlado: lo escrito antes de que la página termine de cargar también cuenta.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nickname = String(new FormData(event.currentTarget).get('nickname') ?? '');
    if (nickname.trim().length < 2) {
      setError(`Escribe un alias de 2 a ${NICKNAME_MAX} caracteres.`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await join(code, nickname);
      if (result.ok) onJoined();
      else if (result.reason === 'invalid' || result.reason === 'nickname-taken')
        setError(result.message);
      else onBlocked(result);
    } catch {
      setError('No se pudo entrar. Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="site-container feature-page classroom-page classroom-page--narrow">
      <header className="feature-heading">
        <span className="eyebrow">Sala en vivo · {code}</span>
        <h1>Entrar a la sala</h1>
        <p className="muted">Elige un alias para jugar el SQL Challenge con tu clase.</p>
      </header>
      <form
        className="classroom-card classroom-form"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <label htmlFor={inputId}>Tu alias</label>
        <input
          id={inputId}
          name="nickname"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="go"
          spellCheck={false}
          maxLength={NICKNAME_MAX}
          onInput={() => setError(null)}
          aria-describedby={noticeId}
          aria-invalid={error ? true : undefined}
          required
        />
        <p id={noticeId} className="classroom-hint">
          Tu alias será visible para toda la clase en el ranking. No uses tu nombre completo, correo
          ni teléfono. No necesitas cuenta ni contraseña.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
        {error && (
          <Alert tone="danger" title="Revisa tu alias" live>
            {error}
          </Alert>
        )}
      </form>
    </div>
  );
}

function ParticipantRoom({
  code,
  loadView,
  leave,
  subscribe,
  renderChallenge,
  onLost,
}: {
  readonly code: string;
  readonly loadView: JoinFlowProps['loadView'];
  readonly leave: JoinFlowProps['leave'];
  readonly subscribe?: RoomSubscriber | undefined;
  readonly renderChallenge: JoinFlowProps['renderChallenge'];
  readonly onLost: () => void;
}) {
  const { view, failure, offline } = useRoomSync({ load: () => loadView(code), subscribe });
  useFocusHeadingOnChange(view?.room.status ?? null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Sin cookie válida (se borró o caducó) se vuelve a comprobar el código.
    if (failure?.reason === 'forbidden') onLost();
  }, [failure, onLost]);

  if (!view) {
    return (
      <div className="site-container feature-page classroom-page">
        <h1 className="visually-hidden">Sala {code}</h1>
        {failure ? (
          <Alert tone="warning" title="No se pudo cargar la sala">
            {failure.message}
          </Alert>
        ) : (
          <LoadingState label="Entrando a la sala…" />
        )}
      </div>
    );
  }

  const { room, me } = view;
  const offlineNotice = offline && (
    <Alert tone="warning" title="Sin conexión" live>
      Reintentando… Tus respuestas se envían cuando vuelva la conexión.
    </Alert>
  );

  if (room.status === 'running') {
    return (
      <>
        <div className="site-container classroom-live-bar" aria-live="polite">
          <Chip tone="cyan">En curso</Chip>
          <span>
            <strong>{me.nickname}</strong>
          </span>
          <span>
            Puntos del servidor: <strong>{me.score}</strong>
          </span>
          <span>
            Posición <strong>{me.position}</strong> de {view.participants}
          </span>
          {offlineNotice}
        </div>
        {renderChallenge({ code: room.code, id: room.id })}
      </>
    );
  }

  if (room.status === 'lobby') {
    return (
      <div className="site-container feature-page classroom-page classroom-page--narrow">
        <header className="feature-heading">
          <span className="eyebrow">Sala en vivo · {room.code}</span>
          <h1>Estás dentro, {me.nickname}</h1>
          <p className="muted" aria-live="polite">
            Espera a que el profesor inicie el Challenge. {view.participants}{' '}
            {view.participants === 1 ? 'persona en la sala' : 'personas en la sala'}.
          </p>
        </header>
        {offlineNotice}
        <div className="classroom-card classroom-waiting">
          <LoadingState label="Esperando el inicio…" />
          <p className="classroom-hint">
            No cierres esta página. Si se recarga o pierdes la conexión, vuelves a entrar con el
            mismo alias desde este navegador.
          </p>
          <Button variant="secondary" onClick={() => setConfirmLeave(true)} disabled={leaving}>
            Salir de la sala
          </Button>
        </div>
        <Dialog
          open={confirmLeave}
          onClose={() => setConfirmLeave(false)}
          title="¿Salir de la sala?"
          description="Tu alias deja de aparecer en la sala. Podrás volver a entrar mientras no comience."
        >
          <div className="classroom-actions">
            <Button
              onClick={() => {
                setConfirmLeave(false);
                setLeaving(true);
                void leave(code)
                  .catch(() => undefined)
                  .finally(() => {
                    setLeaving(false);
                    onLost();
                  });
              }}
            >
              Salir
            </Button>
            <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
              Quedarme
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }

  if (room.status === 'cancelled' || room.status === 'expired') {
    return (
      <div className="site-container feature-page classroom-page classroom-page--narrow">
        <header className="feature-heading">
          <span className="eyebrow">Sala en vivo · {room.code}</span>
          <h1>{room.status === 'cancelled' ? 'El profesor canceló la sala' : 'La sala caducó'}</h1>
        </header>
        <Alert tone="info" title="Sin resultados finales">
          Esta sala se cerró sin publicar un ranking final.
        </Alert>
        <Link className="inline-action" href="/challenge">
          Practicar por mi cuenta <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return <PersonalResult view={view} />;
}

export function PersonalResult({ view }: { readonly view: ParticipantView }) {
  const { me, room } = view;
  return (
    <div className="site-container feature-page classroom-page">
      <header className="feature-heading">
        <span className="eyebrow">Sala en vivo · {room.code}</span>
        <h1>Tu resultado, {me.nickname}</h1>
        <p className="muted">{personalSentence(view)}</p>
      </header>
      <ParticipantSummary view={view} />
      <div className="classroom-actions">
        <Link className="inline-action" href={`/results?sala=${room.code}` as Route}>
          Ver en resultados <span aria-hidden="true">→</span>
        </Link>
        <Link className="inline-action" href="/challenge">
          Seguir practicando <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

export function personalSentence(view: ParticipantView): string {
  const { me } = view;
  return me.attempts === 0
    ? 'No registraste respuestas en esta sala.'
    : `Resolviste ${me.solvedMissions} de ${view.missionCount} misiones con ${me.attempts} ${me.attempts === 1 ? 'intento' : 'intentos'}.`;
}

/** Resultado personal calculado por el servidor y el ranking visible para la persona. */
export function ParticipantSummary({
  view,
  headingLevel = 2,
}: {
  readonly view: ParticipantView;
  readonly headingLevel?: 2 | 3;
}) {
  const { me } = view;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const finished = view.room.status === 'finished';
  const items = [
    { label: 'Posición', value: `${me.position} de ${view.participants}` },
    { label: 'Puntos', value: String(me.score) },
    { label: 'Misiones resueltas', value: `${me.solvedMissions} de ${view.missionCount}` },
    { label: 'Precisión', value: formatPercent(me.accuracy) },
    {
      label: 'Tiempo hasta tu último acierto',
      value: me.solvedMissions > 0 ? formatDuration(me.timeMs) : 'Sin datos',
    },
    { label: 'Intentos', value: String(me.attempts) },
    { label: 'Pistas usadas', value: String(me.hintsUsed) },
  ];
  return (
    <>
      <section className="classroom-card" aria-label={`Resumen de ${me.nickname}`}>
        <Heading>Resumen</Heading>
        <dl className="classroom-stats">
          {items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        className="classroom-card"
        aria-label={finished ? 'Ranking final' : 'Primeros puestos'}
      >
        <Heading>{finished ? 'Ranking final' : 'Primeros puestos'}</Heading>
        <ol className="classroom-podium">
          {view.ranking.map((entry) => (
            <li
              key={`${entry.position}-${entry.nickname}`}
              className={entry.isMe ? 'is-me' : undefined}
            >
              <span className="classroom-podium__position">{entry.position}</span>
              <span className="classroom-podium__name">
                {entry.nickname}
                {entry.isMe && <span className="visually-hidden"> (tú)</span>}
              </span>
              <span className="classroom-podium__score">{entry.score} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
