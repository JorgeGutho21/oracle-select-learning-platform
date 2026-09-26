'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampScene,
  DECK_CHANNEL,
  isDeckMessage,
  SCENE_TOTAL,
  sceneBlock,
  SCENES,
  type DeckMessage,
} from '../application/presentation-api';
import { renderScene } from './presentation-scenes';
import { SceneStepContext } from './scene-kit';

/**
 * Vista del presentador: una segunda ventana para quien expone, nunca para el proyector.
 * Muestra la escena actual y la siguiente, las notas, un cronómetro y los controles. Se
 * sincroniza con la exposición abierta en el mismo navegador (BroadcastChannel); sin ella,
 * funciona por sí sola.
 */

/** Ancho del lienzo virtual de las miniaturas: la escena se compone como en el proyector. */
const PREVIEW_WIDTH = 1280;

/**
 * Miniatura fiel de una escena: se compone en un lienzo de 1280×720 y se escala al hueco
 * disponible, así los mínimos de letra del proyector no la desbordan. Es solo una vista.
 */
function ScenePreview({
  scene,
  small = false,
}: {
  readonly scene: number;
  readonly small?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / PREVIEW_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={frameRef}
      className={`presenter-stage${small ? ' presenter-stage--small' : ''}`}
      // Duplicado visual de la escena: fuera del foco y del lector de pantalla.
      inert
      aria-hidden="true"
    >
      <div className="presenter-stage__canvas" style={{ transform: `scale(${scale})` }}>
        <SceneStepContext.Provider value={{ step: Number.POSITIVE_INFINITY }}>
          {renderScene(scene)}
        </SceneStepContext.Provider>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function PresenterView({ requestedScene }: { readonly requestedScene: number | null }) {
  const [scene, setScene] = useState(() => clampScene(requestedScene ?? 1));
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(DECK_CHANNEL);
    channelRef.current = channel;
    channel.addEventListener('message', (event: MessageEvent) => {
      if (!isDeckMessage(event.data) || event.data.type !== 'state') return;
      setConnected(true);
      setScene(clampScene(event.data.scene));
    });
    channel.postMessage({ type: 'request-state' } satisfies DeckMessage);
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const goTo = useCallback((target: number) => {
    const next = clampScene(target);
    setScene(next);
    channelRef.current?.postMessage({ type: 'goto', scene: next, step: 1 } satisfies DeckMessage);
  }, []);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select'))
        return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goTo(scene + 1);
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') goTo(scene - 1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [goTo, scene]);

  const outline = SCENES[scene - 1]!;
  const next = SCENES[scene] ?? null;
  const notes = outline.notes;

  return (
    <div className="site-container presenter-view">
      <header className="presenter-view__header">
        <div>
          <p className="eyebrow">Vista del presentador · no la proyectes</p>
          <h1>
            {String(scene).padStart(2, '0')} · {outline.title}
          </h1>
          <p className="muted">
            {sceneBlock(outline).title} · escena {scene} de {SCENE_TOTAL} ·{' '}
            {connected
              ? 'Sincronizada con la exposición abierta en este navegador.'
              : 'Sin exposición abierta: abre la exposición en otra ventana para sincronizarla.'}
          </p>
        </div>
        <div className="presenter-view__timer" role="timer" aria-live="off">
          <span className="presenter-view__clock">{formatTime(elapsed)}</span>
          <div className="presenter-view__timer-actions">
            <button
              type="button"
              className="ds-button ds-button--secondary"
              onClick={() => setRunning(!running)}
            >
              {running ? 'Pausar' : 'Iniciar'} cronómetro
            </button>
            <button
              type="button"
              className="ds-button ds-button--text"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
            >
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <div className="presenter-view__grid">
        <section className="presenter-view__current" aria-label="Escena actual">
          <ScenePreview scene={scene} />
        </section>
        <aside className="presenter-view__side">
          <section className="presenter-view__notes" aria-labelledby="presenter-notes-title">
            <h2 id="presenter-notes-title">Notas</h2>
            <dl>
              <div>
                <dt>Qué explicar</dt>
                <dd>{notes.explain}</dd>
              </div>
              {notes.mistake && (
                <div>
                  <dt>Error frecuente</dt>
                  <dd>{notes.mistake}</dd>
                </div>
              )}
              {notes.question && (
                <div>
                  <dt>Pregunta para la clase</dt>
                  <dd>{notes.question}</dd>
                </div>
              )}
              {notes.transition && (
                <div>
                  <dt>Transición</dt>
                  <dd>{notes.transition}</dd>
                </div>
              )}
            </dl>
          </section>
          <section className="presenter-view__next" aria-label="Escena siguiente">
            <h2>Siguiente</h2>
            {next ? (
              <>
                <p>
                  {String(next.number).padStart(2, '0')} · {next.title}
                </p>
                <ScenePreview scene={next.number} small />
              </>
            ) : (
              <p>Es la última escena.</p>
            )}
          </section>
        </aside>
      </div>

      <nav className="presenter-view__controls" aria-label="Controles de la exposición">
        <button
          type="button"
          className="ds-button ds-button--secondary"
          onClick={() => goTo(scene - 1)}
          disabled={scene === 1}
        >
          ← Anterior
        </button>
        <a
          className="ds-button ds-button--text"
          href={`/presentation?scene=${scene}`}
          target="_blank"
          rel="noopener"
        >
          Abrir la exposición <span aria-hidden="true">↗</span>
        </a>
        <button
          type="button"
          className="ds-button ds-button--primary"
          onClick={() => goTo(scene + 1)}
          disabled={scene === SCENE_TOTAL}
        >
          Siguiente →
        </button>
      </nav>
    </div>
  );
}
