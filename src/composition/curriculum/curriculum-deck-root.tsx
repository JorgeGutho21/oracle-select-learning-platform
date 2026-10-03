'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { SceneMemory } from '@/features/presentation/application/presentation-api';
import {
  PresentationDeck,
  type DeckScene,
} from '@/features/presentation/presentation/presentation-deck';
import { curriculumProgress } from '../progress/progress-sync-client';

/**
 * Clase de una sección de la fuente curricular: la misma exposición de la Sección 1
 * (teclado, pantalla completa, notas, paso a paso, navegador de escenas), con las escenas
 * renderizadas en el servidor y la escena guardada en el progreso de la sección.
 */
export function CurriculumDeckRoot({
  section,
  requestedScene,
  scenes,
  blocks,
  content,
}: {
  readonly section: string;
  readonly requestedScene: number | null;
  readonly scenes: readonly DeckScene[];
  readonly blocks: readonly { readonly id: string; readonly title: string }[];
  readonly content: readonly ReactNode[];
}) {
  const [memory] = useState<SceneMemory>(() => ({
    load: () => {
      const scene = curriculumProgress().lastScene(section);
      return scene !== null && scene <= scenes.length ? scene : null;
    },
    save: (scene) => curriculumProgress().scene(section, scene, scenes.length),
  }));
  const deck = useMemo(
    () => ({
      scenes,
      blocks,
      path: `/sections/${section}/class`,
      presenterPath: null,
      channel: `dblab-deck-${section}`,
      render: (scene: number) => content[scene - 1] ?? null,
    }),
    [blocks, content, scenes, section],
  );
  return <PresentationDeck requestedScene={requestedScene} memory={memory} deck={deck} />;
}
