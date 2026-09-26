'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { Alert, Button, Chip, DataTable, Dialog, Heading } from '@/presentation/components/ui';
import type {
  AnyPublicMission,
  ChallengeResult,
  MissionResult,
  MissionStatus,
} from '../application/challenge-api';
import { formatDuration, formatPercent } from './format';

const statusText: Record<MissionStatus, string> = {
  'not-started': 'Pendiente',
  'in-progress': 'En curso',
  solved: 'Resuelta',
  failed: 'Sin puntos',
  skipped: 'Omitida',
};

export interface ChallengeSummaryProps {
  result: ChallengeResult;
  missions: readonly AnyPublicMission[];
  /** Sin esta acción (sala en vivo) no se ofrece reiniciar: la partida la cierra el profesor. */
  onRestart?: () => void;
  onReview?: () => void;
}

/** Resultado final de la práctica: puntuación, precisión, tiempo, intentos, pistas y detalle. */
export function ChallengeSummary({ result, missions, onRestart, onReview }: ChallengeSummaryProps) {
  const [confirm, setConfirm] = useState(false);
  const attempts = result.missions.reduce((sum, mission) => sum + mission.scoredAttempts, 0);
  const oracleMissions = missions.filter((mission) => mission.interactionType === 'write-query');
  const stats = [
    { label: 'Puntuación', value: `${result.totalScore} / ${result.maxScore}` },
    { label: 'Precisión', value: formatPercent(result.accuracy) },
    { label: 'Tiempo activo', value: formatDuration(result.totalTimeMs) },
    { label: 'Intentos puntuados', value: String(attempts) },
    { label: 'Pistas usadas', value: String(result.hintsUsed) },
    { label: 'Misiones resueltas', value: `${result.solvedCount} de ${result.missionCount}` },
  ];

  return (
    <section className="ch-summary" aria-labelledby="summary-title">
      <div>
        <span className="eyebrow">{result.label} · resultado local</span>
        <Heading level={2} id="summary-title" tabIndex={-1}>
          Resultado del Challenge
        </Heading>
        <p className="ch-muted">
          Resultado informativo guardado solo en este navegador. No es una calificación ni participa
          en el ranking de una sala.
        </p>
      </div>
      <dl className="ch-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="ch-stat">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <DataTable<MissionResult>
        caption="Resumen por misión"
        rowKey={(row) => row.missionId}
        rows={result.missions}
        columns={[
          {
            id: 'mision',
            header: 'Misión',
            cell: (row) => `${String(row.order).padStart(2, '0')} · ${row.title}`,
          },
          { id: 'estado', header: 'Estado', cell: (row) => statusText[row.status] },
          { id: 'intentos', header: 'Intentos', numeric: true, cell: (row) => row.scoredAttempts },
          { id: 'pista', header: 'Pista', cell: (row) => (row.hintUsed ? 'Sí' : 'No') },
          {
            id: 'tiempo',
            header: 'Tiempo',
            numeric: true,
            cell: (row) => formatDuration(row.timeMs),
          },
          {
            id: 'puntos',
            header: 'Puntos',
            numeric: true,
            cell: (row) => `${row.score.total} / ${row.score.max}`,
          },
        ]}
      />
      {oracleMissions.length > 0 && (
        <Alert tone="info" title="Misiones que requieren Oracle">
          {oracleMissions.map((mission) => mission.id).join(', ')} se corrige ejecutando la consulta
          en Oracle. Mientras el servicio no esté disponible, no suma puntos.
        </Alert>
      )}
      {result.reviewLessons.length > 0 && (
        <div className="ch-review">
          <p className="ch-builder__label">Conceptos para repasar</p>
          <div className="ch-review__chips">
            {result.reviewLessons.map((id) => {
              const lesson = LESSON_INDEX.find((entry) => entry.id === id);
              return lesson ? (
                <Link key={id} className="ch-review__link" href={`/learn/${lesson.slug}` as Route}>
                  {lesson.shortTitle}
                </Link>
              ) : (
                <Chip key={id} tone="warning">
                  {id}
                </Chip>
              );
            })}
          </div>
        </div>
      )}
      <div className="ch-actions">
        {onRestart && <Button onClick={() => setConfirm(true)}>Reiniciar práctica</Button>}
        {onReview && (
          <Button variant="secondary" onClick={onReview}>
            Volver a las misiones
          </Button>
        )}
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="¿Reiniciar la práctica?"
        description="Se borrará esta partida del navegador y comenzarás desde cero."
      >
        <div className="ch-actions">
          <Button
            onClick={() => {
              setConfirm(false);
              onRestart?.();
            }}
          >
            Reiniciar desde cero
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
