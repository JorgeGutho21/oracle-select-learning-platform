'use client';

import { useState } from 'react';
import { BrowserSceneMemory } from '@/features/presentation/infrastructure/browser-scene-memory';
import { PresentationDeck } from '@/features/presentation/presentation/presentation-deck';

export function PresentationRoot({ requestedScene }: { readonly requestedScene: number | null }) {
  const [memory] = useState(() => new BrowserSceneMemory());
  return <PresentationDeck requestedScene={requestedScene} memory={memory} />;
}
