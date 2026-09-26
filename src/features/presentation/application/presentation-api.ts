export {
  clampScene,
  isSceneNumber,
  parseSceneParam,
  SCENE_BLOCKS,
  SCENE_TOTAL,
  sceneBlock,
  sceneNumber,
  SCENES,
  scenesOfBlock,
  type SceneBlock,
  type SceneBlockId,
  type SceneNotes,
  type SceneOutline,
} from '../domain/scenes';

/** Recuerda en este navegador la última escena proyectada, para ofrecer reanudarla. */
export interface SceneMemory {
  load(): number | null;
  save(scene: number): void;
}

/** Memoria vacía: se usa cuando no hay almacenamiento disponible. */
export const NO_SCENE_MEMORY: SceneMemory = {
  load: () => null,
  save: () => {},
};

/** Mensajes entre la exposición proyectada y la vista del presentador (misma máquina). */
export type DeckMessage =
  | { readonly type: 'state'; readonly scene: number; readonly step: number }
  | { readonly type: 'goto'; readonly scene: number; readonly step: number }
  | { readonly type: 'request-state' };

export const DECK_CHANNEL = 'sql-select-lab-deck';

export function isDeckMessage(value: unknown): value is DeckMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as { type?: unknown; scene?: unknown; step?: unknown };
  if (message.type === 'request-state') return true;
  return (
    (message.type === 'state' || message.type === 'goto') &&
    typeof message.scene === 'number' &&
    typeof message.step === 'number'
  );
}
