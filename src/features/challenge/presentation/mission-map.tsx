'use client';

import { Progress } from '@/presentation/components/ui';
import type {
  AnyPublicMission,
  ChallengeResult,
  MissionId,
  MissionStatus,
} from '../application/challenge-api';

const statusText: Record<MissionStatus, string> = {
  'not-started': 'Pendiente',
  'in-progress': 'En curso',
  solved: 'Resuelta',
  failed: 'Sin puntos',
  skipped: 'Omitida',
};

export interface MissionMapProps {
  missions: readonly AnyPublicMission[];
  result: ChallengeResult;
  currentId: MissionId | null;
  disabled: boolean;
  onOpen: (id: MissionId) => void;
}

/** Recorrido de las diez misiones: se puede saltar y volver sin perder intentos (U05). */
export function MissionMap({ missions, result, currentId, disabled, onOpen }: MissionMapProps) {
  return (
    <nav className="ch-map" aria-label="Mapa de misiones">
      <div className="ch-map__score">
        <span className="ch-map__points">
          <strong>{result.totalScore}</strong> / {result.maxScore} puntos
        </span>
        <Progress
          label={`Progreso: ${result.progress.closed} de ${result.progress.total} misiones cerradas`}
          value={result.progress.closed}
          max={result.progress.total}
        />
      </div>
      <ol className="ch-map__list">
        {missions.map((mission) => {
          const summary = result.missions.find((item) => item.missionId === mission.id);
          const status = summary?.status ?? 'not-started';
          const current = mission.id === currentId;
          return (
            <li key={mission.id}>
              <button
                type="button"
                className={`ch-map__item ch-map__item--${status}${current ? ' ch-map__item--current' : ''}`}
                aria-current={current ? 'step' : undefined}
                aria-label={`Misión ${mission.order}: ${mission.title}. ${statusText[status]}${summary?.solved ? `, ${summary.score.total} puntos` : ''}.`}
                onClick={() => onOpen(mission.id)}
                disabled={disabled}
              >
                <span className="ch-map__number" aria-hidden="true">
                  {String(mission.order).padStart(2, '0')}
                </span>
                <span className="ch-map__text">
                  <span className="ch-map__title">{mission.title}</span>
                  <span className="ch-map__status">
                    {statusText[status]}
                    {summary?.solved ? ` · ${summary.score.total} pts` : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
