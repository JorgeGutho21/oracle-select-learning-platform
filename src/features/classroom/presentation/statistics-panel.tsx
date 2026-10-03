import { missionLabel, type RoomStatistics } from '../application/classroom-api';
import { formatDuration, formatPercent } from './use-room-sync';

/** Una o varias misiones (empate explícito, GAME_SPEC) con su tasa sobre el grupo. */
function missionNames(missions: RoomStatistics['easiest']): string {
  const labels = missions.map(({ missionId }) => missionLabel(missionId)).filter(Boolean);
  const first = missions[0];
  if (!first || labels.length === 0) return 'Sin datos';
  const rate = `${formatPercent(first.successRate)} del grupo acertó`;
  return labels.length === 1 ? `${labels[0]} (${rate})` : `Empate: ${labels.join(', ')} (${rate})`;
}

/** Estadísticas del grupo calculadas por el servidor; sin intentos se muestra «Sin datos». */
export function StatisticsPanel({
  statistics,
  headingLevel = 2,
}: {
  readonly statistics: RoomStatistics;
  readonly headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const items = [
    { label: 'Participantes', value: String(statistics.participants) },
    {
      label: 'Promedio de puntos',
      value:
        statistics.averageScore === null
          ? 'Sin datos'
          : String(Math.round(statistics.averageScore)),
    },
    { label: 'Precisión del grupo', value: formatPercent(statistics.accuracy) },
    {
      label: 'Tiempo medio',
      value:
        statistics.averageTimeMs === null ? 'Sin datos' : formatDuration(statistics.averageTimeMs),
    },
    { label: 'Misión más fácil', value: missionNames(statistics.easiest) },
    { label: 'Misión más difícil', value: missionNames(statistics.hardest) },
  ];
  return (
    <section className="classroom-card" aria-labelledby="statistics-title">
      <Heading id="statistics-title">Estadísticas de la sala</Heading>
      <dl className="classroom-stats">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
