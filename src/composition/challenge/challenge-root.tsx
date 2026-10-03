'use client';

import { useState } from 'react';
import { ChallengeEngine } from '@/features/challenge/application/challenge-engine';
import { BrowserChallengeRepository } from '@/features/challenge/infrastructure/browser-challenge-repository';
import { randomIdGenerator, systemClock } from '@/features/challenge/infrastructure/system-clock';
import { ChallengeExperience } from '@/features/challenge/presentation/challenge-experience';
import { evaluatePracticeAnswer, getPracticeExplanation, getPracticeHint } from './actions';

/**
 * Raíz de composición del Challenge: une el motor con la persistencia local del
 * navegador y con la corrección en el servidor. Presentación solo recibe el motor.
 */
export function ChallengeRoot() {
  const [engine] = useState(
    () =>
      new ChallengeEngine({
        evaluator: {
          evaluate: evaluatePracticeAnswer,
          getHint: getPracticeHint,
          getExplanation: getPracticeExplanation,
        },
        repository: new BrowserChallengeRepository(),
        clock: systemClock,
        ids: randomIdGenerator,
      }),
  );
  return <ChallengeExperience engine={engine} />;
}
