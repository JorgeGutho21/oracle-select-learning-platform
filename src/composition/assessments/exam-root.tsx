'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AnswerQueue } from '@/features/assessments/application/answer-queue';
import { EventBuffer } from '@/features/assessments/application/event-buffer';
import {
  isAnswered,
  type Answer,
  type AttemptView,
} from '@/features/assessments/application/exam-wire';
import {
  clockTone,
  formatClock,
  remainingMs,
  spokenClock,
  thresholdAnnouncement,
} from '@/features/assessments/application/exam-timer';
import type { ClientEventType } from '@/features/assessments/domain/assessment';
import {
  BrowserExamDraftStore,
  markExamVisit,
} from '@/features/assessments/infrastructure/browser-exam-storage';
import { HttpExamGateway } from '@/features/assessments/infrastructure/http-exam-gateway';
import {
  ExamHeader,
  ExamQuestion,
  QuestionNavigator,
  SubmitDialog,
} from '@/features/assessments/presentation/exam-parts';
import { Button } from '@/presentation/components/ui';
import { useFullscreenAvailable, useOnline } from '@/presentation/hooks/use-online';
import { useServerClock } from '@/presentation/hooks/use-server-clock';

/**
 * Examen en el navegador. El reloj es el del servidor (`expires_at`); las respuestas se
 * guardan solas; los eventos de supervisión se agrupan con la señal de conexión cada 30 s.
 * Si el tiempo se acaba, entrega por tiempo; si el profesor finaliza, lleva al resultado.
 */

type InProgress = Extract<AttemptView, { status: 'in_progress' }>;
type Finish = 'entregada' | 'tiempo' | 'cerrada';

const HEARTBEAT_MS = 30_000;
const EVENTS_FLUSH_MS = 5_000;

const scheduler = {
  setTimeout: (callback: () => void, ms: number) => window.setTimeout(callback, ms),
  clearTimeout: (handle: unknown) => window.clearTimeout(handle as number),
};

export function ExamRoot({ view }: { readonly view: InProgress }) {
  const router = useRouter();
  const resultHref = `/evaluations/${view.assessment.id}`;
  const finishedRef = useRef(false);
  const finishRef = useRef<(notice: Finish) => void>(() => undefined);
  const gateway = useMemo(() => new HttpExamGateway(), []);
  const buffer = useMemo(() => new EventBuffer(), []);
  const [queue] = useState(
    () =>
      new AnswerQueue(view.attemptId, view.items, {
        gateway,
        store: new BrowserExamDraftStore(),
        scheduler,
      }),
  );
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);
  const [current, setCurrent] = useState(() =>
    Math.min(Math.max(1, view.currentPosition), Math.max(1, view.items.length)),
  );
  const currentRef = useRef(current);
  const [serverNow, setServerNow] = useState(view.serverNow);
  const [expiresAt, setExpiresAt] = useState(view.expiresAt);
  const now = useServerClock(serverNow);
  const remaining = remainingMs(expiresAt, now, 0);
  const online = useOnline();
  const canFullscreen = useFullscreenAvailable();
  const [moveMessage, setMoveMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timerRetry, setTimerRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const finish = useCallback(
    (notice: Finish) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      queue.dispose();
      router.replace(`${resultHref}?aviso=${notice}` as Route);
      router.refresh();
    },
    [queue, resultHref, router],
  );

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  // Copia local de este dispositivo y envío pendiente.
  useEffect(() => {
    queue.start(() => finishRef.current('cerrada'));
    return () => queue.dispose();
  }, [queue]);

  const record = useCallback(
    (type: ClientEventType) => buffer.record(type, Date.now(), currentRef.current),
    [buffer],
  );

  const heartbeat = useCallback(
    async (keepalive = false) => {
      if (finishedRef.current) return;
      const { batch, taken } = buffer.take(Date.now());
      const outcome = await gateway.heartbeat(view.attemptId, currentRef.current, batch, keepalive);
      if (outcome.status === 'finished') {
        finishRef.current('cerrada');
        return;
      }
      if (outcome.status === 'network') {
        buffer.restore(taken);
        return;
      }
      if (outcome.serverNow) setServerNow(outcome.serverNow);
      if (outcome.expiresAt) setExpiresAt(outcome.expiresAt);
    },
    [buffer, gateway, view.attemptId],
  );

  // Señal de conexión y eventos agrupados.
  useEffect(() => {
    if (markExamVisit(view.attemptId) === 'reloaded') record('reloaded');
    void heartbeat();
    const beat = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);
    const flush = window.setInterval(() => {
      if (buffer.size() > 0) void heartbeat();
    }, EVENTS_FLUSH_MS);
    return () => {
      window.clearInterval(beat);
      window.clearInterval(flush);
    };
  }, [buffer, heartbeat, record, view.attemptId]);

  // Eventos del navegador técnicamente verificables. No se bloquea nada.
  useEffect(() => {
    const onBlur = () => record('focus_lost');
    const onFocus = () => record('focus_returned');
    const onVisibility = () =>
      record(document.visibilityState === 'hidden' ? 'visibility_hidden' : 'visibility_visible');
    const onFullscreen = () =>
      record(document.fullscreenElement ? 'fullscreen_entered' : 'fullscreen_exited');
    const onCopy = () => record('copy_attempt');
    const onPaste = () => record('paste_attempt');
    const onContext = () => record('context_menu');
    const onOffline = () => record('offline');
    const onOnline = () => {
      record('online');
      void queue.flushNow();
      void heartbeat();
    };
    const onExit = () => {
      if (finishedRef.current) return;
      record('page_exit');
      void heartbeat(true);
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('pagehide', onExit);
    if (view.assessment.recordClipboard) {
      document.addEventListener('copy', onCopy);
      document.addEventListener('paste', onPaste);
      document.addEventListener('contextmenu', onContext);
    }
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pagehide', onExit);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContext);
    };
  }, [heartbeat, queue, record, view.assessment.recordClipboard]);

  // Tiempo terminado: envía lo pendiente y entrega por tiempo (el servidor lo confirma).
  const expired = remaining <= 0;
  useEffect(() => {
    if (!expired || finishedRef.current) return;
    let cancelled = false;
    void (async () => {
      await queue.flushNow();
      const outcome = await gateway.submit(view.attemptId, 'timer');
      if (cancelled) return;
      if (outcome === 'submitted') finishRef.current('tiempo');
      else if (outcome === 'not-expired') void heartbeat();
      else window.setTimeout(() => setTimerRetry((value) => value + 1), 3000);
    })();
    return () => {
      cancelled = true;
    };
  }, [expired, gateway, heartbeat, queue, timerRetry, view.attemptId]);

  useEffect(() => {
    currentRef.current = current;
    queue.setPosition(current);
    if (moved.current) headingRef.current?.focus();
  }, [current, queue]);

  const goTo = (position: number) => {
    moved.current = true;
    setCurrent(position);
  };

  const items = view.items;
  const total = items.length;
  const item = items.find((entry) => entry.position === current) ?? items[0];
  const state = (position: number) => snapshot.items.get(position);
  const answerOf = (position: number): Answer | null => state(position)?.answer ?? null;
  const navItems = items.map((entry) => ({
    position: entry.position,
    answered: isAnswered(answerOf(entry.position)),
    flagged: state(entry.position)?.flagged ?? entry.flagged,
  }));
  const answered = navItems.filter((entry) => entry.answered).length;
  const flagged = navItems.filter((entry) => entry.flagged).length;

  const submit = async () => {
    if (submitting || finishedRef.current) return;
    setSubmitting(true);
    setSubmitError(null);
    await queue.flushNow();
    if (queue.hasPending()) {
      setSubmitting(false);
      setSubmitError(
        'Sin conexión: todavía no se puede entregar. Tus respuestas siguen guardadas en este dispositivo; inténtalo de nuevo en unos segundos.',
      );
      return;
    }
    const outcome = await gateway.submit(view.attemptId, 'student');
    if (outcome === 'submitted') {
      finishRef.current('entregada');
      return;
    }
    setSubmitting(false);
    setSubmitError(
      'No pudimos entregar ahora. Tus respuestas están guardadas; inténtalo de nuevo.',
    );
  };

  if (!item) return null;

  return (
    <div className="exam-shell">
      <ExamHeader
        title={view.assessment.title}
        answered={answered}
        total={total}
        clock={formatClock(remaining)}
        clockLabel={`Tiempo restante: ${spokenClock(remaining)}`}
        clockTone={clockTone(remaining)}
        saveStatus={snapshot.status}
        online={online}
      />
      {/* Avisos de tiempo solo al cruzar 10, 5 y 1 minuto: el contenido cambia tres veces. */}
      <p className="visually-hidden" aria-live="polite">
        {thresholdAnnouncement(remaining)}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {moveMessage}
      </p>
      <div className="exam-layout">
        <div className="exam-main">
          <ExamQuestion
            key={item.position}
            item={item}
            total={total}
            answer={answerOf(item.position)}
            flagged={state(item.position)?.flagged ?? item.flagged}
            onAnswer={(answer) => queue.answer(item.position, answer)}
            onFlag={(value) => queue.flag(item.position, value)}
            announce={setMoveMessage}
            headingRef={headingRef}
          />
          <div className="exam-controls">
            <Button
              variant="secondary"
              onClick={() => goTo(item.position - 1)}
              disabled={item.position <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() => goTo(item.position + 1)}
              disabled={item.position >= total}
            >
              Siguiente
            </Button>
            <Button className="exam-controls__submit" onClick={() => setConfirming(true)}>
              Entregar evaluación
            </Button>
          </div>
        </div>
        <aside className="exam-aside">
          <QuestionNavigator items={navItems} current={item.position} onSelect={goTo} />
          {canFullscreen && (
            <Button
              variant="text"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void document.documentElement.requestFullscreen().catch(() => undefined);
              }}
            >
              Pantalla completa (opcional)
            </Button>
          )}
        </aside>
      </div>
      <SubmitDialog
        open={confirming}
        onClose={() => {
          setConfirming(false);
          setSubmitError(null);
        }}
        onConfirm={() => void submit()}
        unanswered={total - answered}
        flagged={flagged}
        pending={snapshot.pending > 0}
        submitting={submitting}
        error={submitError}
      />
    </div>
  );
}
