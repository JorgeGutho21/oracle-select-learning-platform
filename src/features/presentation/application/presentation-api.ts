export {
  clampScene,
  isSceneNumber,
  parseSceneParam,
  SCENE_TOTAL,
  sceneNumber,
  SCENES,
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
