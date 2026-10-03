'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { ChallengeEngine, ChallengeState } from '../application/challenge-api';

/** Estado del motor para React; se actualiza con cada cambio confirmado. */
export function useChallengeState(engine: ChallengeEngine): ChallengeState | null {
  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine]);
  return useSyncExternalStore(
    subscribe,
    () => engine.getState(),
    () => null,
  );
}

/** Instante actual, renovado cada segundo mientras `active` sea verdadero. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}
