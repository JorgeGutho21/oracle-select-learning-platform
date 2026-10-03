'use client';

import { useState } from 'react';
import { SyncedSceneMemory } from '../progress/progress-sync-client';
import {
  PresentationDeck,
  sectionOneDeck,
} from '@/features/presentation/presentation/presentation-deck';
import { renderScene } from '@/features/presentation/presentation/presentation-scenes';

const DECK = sectionOneDeck(renderScene);

export function PresentationRoot({ requestedScene }: { readonly requestedScene: number | null }) {
  const [memory] = useState(() => new SyncedSceneMemory());
  return <PresentationDeck requestedScene={requestedScene} memory={memory} deck={DECK} />;
}
