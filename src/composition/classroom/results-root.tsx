'use client';

import { useState } from 'react';
import { ChallengeEngine } from '@/features/challenge/application/challenge-engine';
import { SyncedChallengeRepository } from '../progress/progress-sync-client';
import { randomIdGenerator, systemClock } from '@/features/challenge/infrastructure/system-clock';
import { ResultsPage } from '@/features/results/presentation/results-page';
import { participantViewAction, presenterViewAction } from './actions';

const READ_ONLY_EVALUATOR = {
  evaluate: () => Promise.reject(new Error('Solo lectura.')),
  getHint: () => Promise.reject(new Error('Solo lectura.')),
  getExplanation: () => Promise.reject(new Error('Solo lectura.')),
};

/** `/results`: lee la práctica guardada (sin corregir nada) y la sala indicada por código. */
export function ResultsRoot({ roomCode }: { readonly roomCode: string | null }) {
  const [practice] = useState(
    () =>
      new ChallengeEngine({
        evaluator: READ_ONLY_EVALUATOR,
        repository: new SyncedChallengeRepository(),
        clock: systemClock,
        ids: randomIdGenerator,
      }),
  );
  return (
    <ResultsPage
      roomCode={roomCode}
      loadPresenter={presenterViewAction}
      loadParticipant={participantViewAction}
      practice={practice}
    />
  );
}
