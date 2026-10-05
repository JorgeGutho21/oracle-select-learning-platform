'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  DECK_CHANNEL,
  isDeckMessage,
  SCENE_BLOCKS,
  SCENES,
  type DeckMessage,
  type SceneMemory,
  type SceneNotes,
} from '../application/presentation-api';
import { SceneStepContext } from './scene-step';
import { Dialog } from '@/presentation/components/ui/dialog';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

/** Escena de una clase: lo que la exposición necesita saber de ella. */
export interface DeckScene {
  readonly number: number;
  readonly title: string;
  readonly shortTitle: string;
  readonly block: string;
  readonly steps: number;
  readonly notes: SceneNotes;
}

/**
 * Clase que proyecta la exposición: la de la Sección 1 o la de una sección de la fuente
 * curricular, cuyas escenas llegan ya renderizadas desde el servidor.
 */
export interface DeckDefinition {
  readonly scenes: readonly DeckScene[];
  readonly blocks: readonly { readonly id: string; readonly title: string }[];
  /** Ruta de la exposición (`?scene=N` se añade al cambiar de escena). */
  readonly path: string;
  /** Vista del presentador en otra ventana, si la hay. */
  readonly presenterPath: string | null;
  readonly channel: string;
  /** Contenido de la escena N (1 = primera). */
  readonly render: (scene: number) => ReactNode;
}

/**
 * Clase de la Sección 1 (`/presentation`). Recibe sus escenas desde fuera para que la
 * exposición no cargue el contenido de ninguna clase en concreto.
 */
export function sectionOneDeck(render: (scene: number) => ReactNode): DeckDefinition {
  return {
    scenes: SCENES,
    blocks: SCENE_BLOCKS,
    path: '/presentation',
    presenterPath: '/presentation/presentador',
    channel: DECK_CHANNEL,
    render,
  };
}

interface PresentationDeckProps {
  /** Escena pedida en la URL; `null` si se entra sin indicarla. */
  readonly requestedScene: number | null;
  readonly memory: SceneMemory;
  readonly deck: DeckDefinition;
}

const noSubscription = () => () => {};
/** Tras este tiempo sin actividad, la pantalla completa atenúa los controles. */
const IDLE_MS = 3000;

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

/** Ancho mínimo del lienzo 16:9 para que las tablas no bajen de 12 px (1,72 % × 0,8). */
const MIN_STAGE_WIDTH = 870;
/** Alto aproximado de la barra de controles y ancho del panel de notas. */
const CONTROLS_HEIGHT = 56;
const NOTES_WIDTH = 336;

export function PresentationDeck({ requestedScene, memory, deck }: PresentationDeckProps) {
  const total = deck.scenes.length;
  const clampScene = useCallback(
    (value: number) => (Number.isInteger(value) ? Math.min(Math.max(value, 1), total) : 1),
    [total],
  );
  const outlineOf = useCallback((value: number) => deck.scenes[value - 1]!, [deck]);
  const scenesOfBlock = useMemo(
    () => (id: string) => deck.scenes.filter((entry) => entry.block === id),
    [deck],
  );
  const [scene, setScene] = useState(() => clampScene(requestedScene ?? 1));
  const previousScene = useRef(scene);
  const [step, setStep] = useState(Number.POSITIVE_INFINITY);
  const [stepMode, setStepMode] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const navigatorTrigger = useRef<HTMLButtonElement>(null);
  const [resumeHandled, setResumeHandled] = useState(requestedScene !== null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState('');
  const deckRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hydrated = useHydrated();
  const stored = useSyncExternalStore(
    noSubscription,
    () => memory.load(),
    () => null,
  );
  const resumeScene = !resumeHandled && stored !== null && stored > 1 ? stored : null;
  const outline = outlineOf(scene);
  const steps = outline.steps;
  const visibleStep = stepMode ? Math.min(step, steps) : Number.POSITIVE_INFINITY;

  useEffect(() => {
    if (requestedScene !== null) memory.save(clampScene(requestedScene));
  }, [clampScene, memory, requestedScene]);

  const goTo = useCallback(
    (target: number, targetStep: 'first' | 'last' = 'first') => {
      const next = clampScene(target);
      setResumeHandled(true);
      setStep(targetStep === 'first' ? 1 : Number.POSITIVE_INFINITY);
      if (next === scene) return;
      // Sin entradas nuevas en el historial: «Atrás» sale de la exposición.
      window.history.replaceState(null, '', `${deck.path}?scene=${next}`);
      memory.save(next);
      setScene(next);
    },
    [clampScene, deck.path, memory, scene],
  );

  useEffect(() => {
    if (previousScene.current === scene) return;
    previousScene.current = scene;
    const currentDeck = deckRef.current;
    if (
      !currentDeck ||
      document.fullscreenElement ||
      getComputedStyle(currentDeck).display !== 'block'
    )
      return;
    const rootStyle = getComputedStyle(document.documentElement);
    const headerHeight =
      Number.parseFloat(rootStyle.getPropertyValue('--site-header-height')) || 73;
    window.scrollTo({
      top: Math.max(0, currentDeck.getBoundingClientRect().top + window.scrollY - headerHeight),
      behavior: 'instant',
    });
    currentDeck.querySelector<HTMLElement>('.scene__title')?.focus({ preventScroll: true });
  }, [scene]);

  const forward = useCallback(() => {
    if (stepMode && visibleStep < steps) setStep(visibleStep + 1);
    else if (scene < total) goTo(scene + 1, 'first');
  }, [goTo, scene, stepMode, steps, total, visibleStep]);

  const backward = useCallback(() => {
    if (stepMode && visibleStep > 1 && steps > 1) setStep(visibleStep - 1);
    else if (scene > 1) goTo(scene - 1, 'last');
  }, [goTo, scene, stepMode, steps, visibleStep]);

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

  // Lienzo demasiado pequeño en la ventana (zoom 125 %, portátil con poca altura): por
  // debajo de ~870 px la letra de las tablas bajaría de 12 px, así que la escena fluye como
  // una página (data-flow). En pantalla completa siempre hay lienzo 16:9.
  const [flow, setFlow] = useState(false);
  useEffect(() => {
    const measure = () => {
      if (document.fullscreenElement) {
        setFlow(false);
        return;
      }
      const root = getComputedStyle(document.documentElement);
      const header = Number.parseFloat(root.getPropertyValue('--site-header-height')) || 73;
      const height = window.innerHeight - header - CONTROLS_HEIGHT - 24;
      const width = window.innerWidth - 24 - (notesOpen ? NOTES_WIDTH : 0);
      setFlow(Math.min(width, (height * 16) / 9) < MIN_STAGE_WIDTH);
    };
    measure();
    window.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', measure);
    };
  }, [notesOpen]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === deckRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // En pantalla completa, los controles se atenúan sin actividad y vuelven con el puntero,
  // un toque o el teclado.
  useEffect(() => {
    if (!isFullscreen) return;
    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const events = ['mousemove', 'pointerdown', 'touchstart', 'keydown', 'focusin'] as const;
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, wake));
    };
  }, [isFullscreen]);

  // Vista del presentador en otra ventana: recibe el estado y puede mover la exposición.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(deck.channel);
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [deck.channel]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const post = () =>
      channel.postMessage({
        type: 'state',
        scene,
        step: Number.isFinite(visibleStep) ? visibleStep : steps,
      } satisfies DeckMessage);
    post();
    const handle = (event: MessageEvent) => {
      if (!isDeckMessage(event.data)) return;
      if (event.data.type === 'request-state') post();
      if (event.data.type === 'goto') {
        const target = clampScene(event.data.scene);
        if (target !== scene) goTo(target, 'first');
        if (stepMode) setStep(Math.max(1, event.data.step));
      }
    };
    channel.addEventListener('message', handle);
    return () => channel.removeEventListener('message', handle);
  }, [clampScene, goTo, scene, stepMode, steps, visibleStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown') forward();
      else if (key === 'ArrowLeft' || key === 'PageUp') backward();
      else if (key === 'Home') goTo(1);
      else if (key === 'End') goTo(total);
      else if (key === ' ' && !isActivatable(event.target)) {
        if (event.shiftKey) backward();
        else forward();
      } else if (key === 'f' || key === 'F') void toggleFullscreen();
      else if ((key === 'n' || key === 'N') && !isFullscreen) setNotesOpen((open) => !open);
      else handled = false;
      if (handled) event.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [backward, forward, goTo, isFullscreen, toggleFullscreen, total]);

  // Al abrir el navegador, el foco va a la escena actual.
  useEffect(() => {
    if (!navigatorOpen) return;
    document.querySelector<HTMLButtonElement>('.deck-navigator [aria-current="true"]')?.focus();
  }, [navigatorOpen]);

  const block = deck.blocks.find((entry) => entry.id === outline.block) ?? deck.blocks[0]!;
  const notes = outline.notes;
  const showNotes = notesOpen && !isFullscreen;

  return (
    <div
      className="deck"
      ref={deckRef}
      data-ready={hydrated}
      data-fullscreen={isFullscreen || undefined}
      data-idle={(isFullscreen && idle) || undefined}
      data-notes={showNotes || undefined}
      data-flow={flow || undefined}
    >
      <div className="deck__viewport">
        <div className="deck__stage" key={scene}>
          <SceneStepContext.Provider value={{ step: visibleStep }}>
            {deck.render(scene)}
          </SceneStepContext.Provider>
        </div>
        {resumeScene !== null && (
          <div className="deck-resume" role="region" aria-label="Reanudar la exposición">
            <p>
              Última escena proyectada en este navegador:{' '}
              <strong>
                {resumeScene} · {outlineOf(resumeScene).title}
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

      {showNotes && (
        <aside className="deck-notes" aria-labelledby="deck-notes-title">
          <h2 id="deck-notes-title" className="deck-notes__title">
            Notas del expositor · escena {scene}
          </h2>
          <p className="deck-notes__private">No se proyectan en pantalla completa.</p>
          <dl className="deck-notes__list">
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
          {deck.presenterPath && (
            <a
              className="deck-notes__presenter"
              href={`${deck.presenterPath}?scene=${scene}`}
              target="_blank"
              rel="noopener"
            >
              Abrir la vista del presentador <span aria-hidden="true">↗</span>
            </a>
          )}
        </aside>
      )}

      <div className="deck-controls" role="group" aria-label="Controles de la exposición">
        <ol className="deck-progress" aria-hidden="true">
          {deck.blocks.map((entry) => {
            const members = scenesOfBlock(entry.id);
            const done = members.filter((member) => member.number <= scene).length;
            return (
              <li key={entry.id} style={{ flexGrow: members.length }}>
                <span style={{ width: `${(done / members.length) * 100}%` }} />
              </li>
            );
          })}
        </ol>
        <div
          className="visually-hidden"
          role="progressbar"
          aria-label="Avance de la exposición"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={scene}
          aria-valuetext={`Escena ${scene} de ${total}`}
        />
        <button
          type="button"
          className="deck-button"
          onClick={backward}
          disabled={!hydrated || (scene === 1 && !(stepMode && visibleStep > 1))}
          aria-label={stepMode && visibleStep > 1 ? 'Paso anterior' : 'Escena anterior'}
          aria-keyshortcuts="ArrowLeft PageUp"
        >
          <span aria-hidden="true">←</span>
          <span className="deck-button__label">Anterior</span>
        </button>
        <p className="deck-status" aria-hidden="true">
          <span className="deck-status__block">{block.title}</span>
          <span className="deck-status__counter">
            <strong>{String(scene).padStart(2, '0')}</strong> / {total}
          </span>
          <span className="deck-status__title">{outline.shortTitle}</span>
          {stepMode && steps > 1 && (
            <span className="deck-status__step">
              Paso {Math.min(visibleStep, steps)} de {steps}
            </span>
          )}
        </p>
        <div className="deck-controls__tools">
          <button
            type="button"
            ref={navigatorTrigger}
            className="deck-button deck-button--ghost"
            onClick={() => setNavigatorOpen(true)}
            disabled={!hydrated}
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">☰</span>
            <span className="deck-button__label">Escenas</span>
          </button>
          <button
            type="button"
            className="deck-button deck-button--ghost deck-button--optional"
            onClick={() => {
              setStepMode((mode) => !mode);
              setStep(1);
            }}
            disabled={!hydrated}
            aria-pressed={stepMode}
            title="Revela el contenido de algunas escenas en varios pasos"
          >
            <span aria-hidden="true">▸</span>
            <span className="deck-button__label">Paso a paso</span>
          </button>
          {!isFullscreen && (
            <button
              type="button"
              className="deck-button deck-button--ghost deck-button--optional"
              onClick={() => setNotesOpen((open) => !open)}
              disabled={!hydrated}
              aria-pressed={notesOpen}
              aria-keyshortcuts="N"
            >
              <span aria-hidden="true">✎</span>
              <span className="deck-button__label">Notas</span>
            </button>
          )}
          <button
            type="button"
            className="deck-button deck-button--ghost deck-button--compact"
            onClick={() => void toggleFullscreen()}
            disabled={!hydrated}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-keyshortcuts="F"
          >
            <span aria-hidden="true">{isFullscreen ? '⤡' : '⤢'}</span>
            <span className="deck-button__label">
              {isFullscreen ? 'Salir' : 'Pantalla completa'}
            </span>
          </button>
        </div>
        <button
          type="button"
          className="deck-button deck-button--primary"
          onClick={forward}
          disabled={!hydrated || (scene === total && !(stepMode && visibleStep < steps))}
          aria-label={stepMode && visibleStep < steps ? 'Paso siguiente' : 'Escena siguiente'}
          aria-keyshortcuts="ArrowRight PageDown Space"
        >
          <span className="deck-button__label">Siguiente</span>
          <span aria-hidden="true">→</span>
        </button>
        <p className="visually-hidden" role="status">
          Escena {scene} de {total}: {outline.title}
          {stepMode && steps > 1 ? `, paso ${Math.min(visibleStep, steps)} de ${steps}` : ''}
        </p>
        {fullscreenNotice && (
          <p className="deck-notice" role="status">
            {fullscreenNotice}
          </p>
        )}
      </div>

      <Dialog
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        returnFocusTo={navigatorTrigger}
        title="Escenas"
        description={`${total} escenas en ${deck.blocks.length} bloques.`}
        className="deck-navigator"
      >
        <nav aria-label="Escenas de la exposición">
          {deck.blocks.map((entry) => (
            <section key={entry.id} className="deck-navigator__block">
              <h3 className="deck-navigator__block-title">{entry.title}</h3>
              <ol>
                {scenesOfBlock(entry.id).map((member) => (
                  <li key={member.number}>
                    <button
                      type="button"
                      className="deck-navigator__scene"
                      aria-label={`Escena ${member.number}: ${member.title}`}
                      aria-current={member.number === scene ? 'true' : undefined}
                      onClick={() => {
                        setNavigatorOpen(false);
                        goTo(member.number);
                      }}
                    >
                      <span className="deck-navigator__number">
                        {String(member.number).padStart(2, '0')}
                      </span>
                      <span>{member.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </nav>
        <p className="deck-navigator__help">
          <kbd>←</kbd> <kbd>→</kbd> o <kbd>Av Pág</kbd> cambian de escena · <kbd>Inicio</kbd>{' '}
          <kbd>Fin</kbd> van al principio o al final · <kbd>F</kbd> pantalla completa · <kbd>N</kbd>{' '}
          notas · <kbd>Esc</kbd> cierra este panel
        </p>
      </Dialog>
    </div>
  );
}
