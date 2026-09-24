'use client';

import { useState } from 'react';
import type { EvaluationRequest } from '@/features/challenge/application/ports';
import { ChallengeEngine } from '@/features/challenge/application/challenge-engine';
import type { EvaluationOutcome } from '@/features/challenge/domain/types';
import {
  BrowserChallengeRepository,
  browserLocalStorage,
} from '@/features/challenge/infrastructure/browser-challenge-repository';
import { randomIdGenerator, systemClock } from '@/features/challenge/infrastructure/system-clock';
import { ChallengeExperience } from '@/features/challenge/presentation/challenge-experience';
import { liveExplanationAction, liveHintAction, liveSubmitAction } from './actions';
import { uuidV4 } from './client-support';

const NETWORK_FAILURE: EvaluationOutcome = {
  kind: 'technical',
  reason: 'service-unavailable',
  message: 'No se pudo enviar la respuesta. Comprueba la conexión e inténtalo de nuevo.',
};

/**
 * Challenge dentro de una sala: el mismo motor y la misma interfaz que la práctica, con la
 * corrección y los puntos registrados por el servidor. Cada envío lleva un identificador
 * propio; si la red falla se reintenta una vez con el mismo, y el servidor no lo duplica.
 */
export function LiveChallengeRoot({
  code,
  roomId,
}: {
  readonly code: string;
  readonly roomId: string;
}) {
  const [engine] = useState(
    () =>
      new ChallengeEngine({
        evaluator: {
          evaluate: async (request: EvaluationRequest) => {
            const payload = { ...request, requestId: uuidV4() };
            for (let attempt = 0; attempt < 2; attempt += 1) {
              try {
                return await liveSubmitAction(code, payload);
              } catch {
                // Reintento idempotente con el mismo requestId.
              }
            }
            return NETWORK_FAILURE;
          },
          getHint: (missionId) => liveHintAction(code, missionId),
          getExplanation: (missionId) => liveExplanationAction(code, missionId),
        },
        repository: new BrowserChallengeRepository(
          browserLocalStorage,
          `sql-select-lab:challenge:live:${code}:${roomId}`,
        ),
        clock: systemClock,
        ids: randomIdGenerator,
      }),
  );
  return <ChallengeExperience engine={engine} live={{ roomCode: code }} />;
}
