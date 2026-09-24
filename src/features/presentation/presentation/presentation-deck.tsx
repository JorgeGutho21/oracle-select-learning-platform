'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { clampScene, SCENE_TOTAL, SCENES, type SceneMemory } from '../application/presentation-api';
import { renderScene } from './presentation-scenes';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

interface PresentationDeckProps {
  /** Escena pedida en la URL; `null` si se entra sin indicarla. */
  readonly requestedScene: number | null;
  readonly memory: SceneMemory;
}

const noSubscription = () => () => {};

/** Las teclas de la exposición no actúan mientras se escribe, se usa un control o hay un diálogo. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const dialog = target.closest('dialog');
  if (dialog) return dialog.open;
  return Boolean(
    target.closest('input, textarea, select, video, [contenteditable="true"], .cm-editor'),
  );
}

function isActivatable(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, summary'));
}

function sceneTitle(scene: number): string {
  return SCENES[scene - 1]?.title ?? '';
}

export function PresentationDeck({ requestedScene, memory }: PresentationDeckProps) {
  const [scene, setScene] = useState(() => clampScene(requestedScene ?? 1));
  const [resumeHandled, setResumeHandled] = useState(requestedScene !== null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState('');
  const deckRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const stored = useSyncExternalStore(
    noSubscription,
    () => memory.load(),
    () => null,
  );
  const resumeScene = !resumeHandled && stored !== null && stored > 1 ? stored : null;

  useEffect(() => {
    if (requestedScene !== null) memory.save(clampScene(requestedScene));
  }, [memory, requestedScene]);

  const goTo = useCallback(
    (target: number) => {
      const next = clampScene(target);
      setResumeHandled(true);
      if (next === scene) return;
      // Sin entradas nuevas en el historial: «Atrás» sale de la exposición.
      window.history.replaceState(null, '', `/presentation?scene=${next}`);
      memory.save(next);
      setScene(next);
    },
    [memory, scene],
  );

  const toggleFullscreen = useCallback(async () => {
    setFullscreenNotice('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (deckRef.current?.requestFullscreen) await deckRef.current.requestFullscreen();
      else throw new Error('Pantalla completa no disponible');
    } catch {
      setFullscreenNotice(
        'El navegador no permitió la pantalla completa; la exposición sigue en la ventana.',
      );
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === deckRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key;
      let target: number | null = null;
      if (key === 'ArrowRight' || key === 'PageDown') target = scene + 1;
      else if (key === 'ArrowLeft' || key === 'PageUp') target = scene - 1;
      else if (key === 'Home') target = 1;
      else if (key === 'End') target = SCENE_TOTAL;
      else if (key === ' ' && !isActivatable(event.target)) {
        target = event.shiftKey ? scene - 1 : scene + 1;
      } else if (key === 'f' || key === 'F') {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (target === null) return;
      event.preventDefault();
      goTo(target);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goTo, scene, toggleFullscreen]);

  const percent = Math.round((scene / SCENE_TOTAL) * 100);

  return (
    <div
      className="deck"
      ref={deckRef}
      data-ready={hydrated}
      data-fullscreen={isFullscreen || undefined}
    >
      <div className="deck__viewport">
        <div className="deck__stage" key={scene}>
          {renderScene(scene)}
        </div>
        {resumeScene !== null && (
          <div className="deck-resume" role="region" aria-label="Reanudar la exposición">
            <p>
              Última escena proyectada en este navegador:{' '}
              <strong>
                {resumeScene} · {sceneTitle(resumeScene)}
              </strong>
            </p>
            <div>
              <button
                type="button"
                className="deck-resume__primary"
                onClick={() => goTo(resumeScene)}
              >
                Continuar en la escena {resumeScene}
              </button>
              <button type="button" onClick={() => setResumeHandled(true)}>
                Empezar desde la portada
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="deck-controls" role="group" aria-label="Controles de la exposición">
        <div
          className="deck-progress"
          role="progressbar"
          aria-label="Avance de la exposición"
          aria-valuemin={1}
          aria-valuemax={SCENE_TOTAL}
          aria-valuenow={scene}
          aria-valuetext={`Escena ${scene} de ${SCENE_TOTAL}`}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <button
          type="button"
          className="deck-button"
          onClick={() => goTo(scene - 1)}
          disabled={!hydrated || scene === 1}
          aria-label="Escena anterior"
          aria-keyshortcuts="ArrowLeft PageUp"
        >
          <span aria-hidden="true">←</span>
          <span className="deck-button__label">Anterior</span>
        </button>
        <div className="deck-controls__center">
          <span className="deck-counter" aria-hidden="true">
            <strong>{String(scene).padStart(2, '0')}</strong> / {SCENE_TOTAL}
          </span>
          <label className="visually-hidden" htmlFor="deck-scene-select">
            Ir a la escena
          </label>
          <select
            id="deck-scene-select"
            className="deck-select"
            value={scene}
            disabled={!hydrated}
            onChange={(event) => goTo(Number(event.target.value))}
          >
            {SCENES.map(({ number, title }) => (
              <option key={number} value={number}>
                {number} · {title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="deck-button deck-button--ghost"
          onClick={() => void toggleFullscreen()}
          disabled={!hydrated}
          aria-pressed={isFullscreen}
          aria-label="Pantalla completa"
          aria-keyshortcuts="F"
        >
          <span aria-hidden="true">{isFullscreen ? '⤡' : '⤢'}</span>
          <span className="deck-button__label">Pantalla completa</span>
        </button>
        <button
          type="button"
          className="deck-button deck-button--primary"
          onClick={() => goTo(scene + 1)}
          disabled={!hydrated || scene === SCENE_TOTAL}
          aria-label="Escena siguiente"
          aria-keyshortcuts="ArrowRight PageDown Space"
        >
          <span className="deck-button__label">Siguiente</span>
          <span aria-hidden="true">→</span>
        </button>
        <p className="visually-hidden" role="status">
          Escena {scene} de {SCENE_TOTAL}: {sceneTitle(scene)}
        </p>
        {fullscreenNotice && (
          <p className="deck-notice" role="status">
            {fullscreenNotice}
          </p>
        )}
      </div>
      <p className="deck-help">
        <kbd>←</kbd> <kbd>→</kbd> o <kbd>Av Pág</kbd> cambian de escena · <kbd>Inicio</kbd>{' '}
        <kbd>Fin</kbd> van al principio o al final · <kbd>F</kbd> pantalla completa · <kbd>Esc</kbd>{' '}
        sale sin perder la escena
      </p>
    </div>
  );
}
