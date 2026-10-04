import { RecordTable } from '@/presentation/components/data/record-table';
import type { Route } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  formatGrade,
  PARTICIPANT_LABEL,
  QUESTION_TYPE_LABEL,
  topicLabel,
} from '../application/assessment-api';
import {
  OBSERVED_LABEL,
  type ParticipantRow,
  type QuestionStat,
  type ResultsSummary,
} from '../application/results';
import { formatDateTime, formatDuration } from './format';
import { OptionBody } from './question-content';

/**
 * Resultados del profesor en la escala 0–5: resumen, distribución, tabla por estudiante y
 * análisis por pregunta (para detectar preguntas ambiguas y conceptos mal comprendidos).
 */

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="teacher-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ResultsSummaryView({
  summary,
  passGrade,
}: {
  readonly summary: ResultsSummary;
  readonly passGrade: number;
}) {
  const { stats } = summary;
  const max = Math.max(1, ...stats.distribution.map((bucket) => bucket.count));
  return (
    <>
      <section aria-labelledby="results-summary-title" className="teacher-block">
        <h2 id="results-summary-title">Resumen</h2>
        <dl className="teacher-stats teacher-stats--wide">
          <Stat label="Participantes" value={String(summary.participants)} />
          <Stat label="Entregaron" value={String(summary.submitted)} />
          <Stat label="En curso" value={String(summary.inProgress)} />
          <Stat
            label={summary.notStarted > 0 ? 'Sin iniciar' : 'Ausentes'}
            value={String(summary.notStarted > 0 ? summary.notStarted : summary.absent)}
          />
          <Stat label="Promedio" value={formatGrade(stats.mean)} />
          <Stat label="Mediana" value={formatGrade(stats.median)} />
          <Stat label="Nota máxima" value={formatGrade(stats.max)} />
          <Stat label="Nota mínima" value={formatGrade(stats.min)} />
          <Stat
            label={`Aprobación (≥ ${formatGrade(passGrade)})`}
            value={stats.passRate === null ? '—' : `${stats.passRate} % (${stats.passed})`}
          />
        </dl>
      </section>
      <section aria-labelledby="results-distribution-title" className="teacher-block">
        <h2 id="results-distribution-title">Distribución de notas</h2>
        <table className="grade-distribution">
          <caption className="visually-hidden">Cantidad de estudiantes por rango de nota</caption>
          <thead>
            <tr>
              <th scope="col">Rango</th>
              <th scope="col">Estudiantes</th>
            </tr>
          </thead>
          <tbody>
            {stats.distribution.map((bucket) => (
              <tr key={bucket.label}>
                <th scope="row">{bucket.label}</th>
                <td>
                  <span
                    className="grade-distribution__bar"
                    style={{ '--bar': `${(bucket.count / max) * 100}%` } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="grade-distribution__value">{bucket.count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function ResultsTable({
  rows,
  assessmentId,
}: {
  readonly rows: readonly ParticipantRow[];
  readonly assessmentId: string;
}) {
  if (rows.length === 0)
    return <p className="assessment-empty">No hay estudiantes en la audiencia.</p>;
  return (
    <RecordTable
      className="results-table"
      caption="Resultados por estudiante"
      columns={[
        'Estudiante',
        'Correo',
        'Estado',
        'Inicio',
        'Entrega',
        'Tiempo',
        'Correctas',
        'Nota',
        'Acciones',
      ]}
      rows={rows.map(({ student, status, attempt }) => {
        const finished = attempt && attempt.status !== 'in_progress';
        return {
          key: student.id,
          cells: [
            student.firstName + ' ' + student.lastName,
            <span key="email" className="results-table__email">
              {student.email}
            </span>,
            PARTICIPANT_LABEL[status],
            attempt ? formatDateTime(attempt.startedAt) : '—',
            finished ? formatDateTime(attempt.submittedAt) : '—',
            finished ? formatDuration(attempt.durationSeconds) : '—',
            finished ? (attempt.correctCount ?? 0) + '/' + attempt.questionTotal : '—',
            <span key="grade" className="results-table__grade">
              {finished ? formatGrade(attempt.grade) : status === 'absent' ? 'Ausente' : '—'}
            </span>,
            attempt ? (
              <Link
                key="review"
                href={('/teacher/assessments/' + assessmentId + '/results/' + attempt.id) as Route}
              >
                Ver intento
                <span className="visually-hidden">
                  {' '}
                  de {student.firstName} {student.lastName}
                </span>
              </Link>
            ) : null,
          ],
        };
      })}
    />
  );
}

export function QuestionAnalysis({
  stats,
  sectionKey,
}: {
  readonly stats: readonly QuestionStat[];
  readonly sectionKey: string;
}) {
  return (
    <ol className="analysis-list">
      {stats.map((stat) => (
        <li key={stat.question.questionId} className="analysis-item">
          <details>
            <summary>
              <span className="analysis-item__rate">
                {stat.correctRate === null ? '—' : `${stat.correctRate} %`}
                <span className="visually-hidden"> de respuestas correctas</span>
              </span>
              <span className="analysis-item__text">
                <span className="analysis-item__meta">
                  {stat.question.externalKey ?? 'Propia'} ·{' '}
                  {topicLabel(sectionKey as never, stat.question.topic)} ·{' '}
                  {QUESTION_TYPE_LABEL[stat.question.type]}
                  {stat.observed ? ` · ${OBSERVED_LABEL[stat.observed]}` : ''}
                </span>
                <span>{stat.question.prompt}</span>
                {stat.topDistractor && stat.topDistractor.share >= 25 && (
                  <span className="analysis-item__alert">
                    Distractor frecuente ({stat.topDistractor.share} %): revisa si la pregunta es
                    ambigua o el concepto no quedó claro.
                  </span>
                )}
              </span>
            </summary>
            <p className="analysis-item__counts">
              Presentada a {stat.presented} · respondida por {stat.answered} · correcta completa{' '}
              {stat.fullyCorrect} · crédito medio {stat.averageCredit ?? '—'}
            </p>
            {stat.options.length > 0 && (
              <ul className="analysis-options">
                {stat.options.map((option) => (
                  <li key={option.id} className={option.correct ? 'is-correct' : undefined}>
                    <span className="analysis-options__share">
                      {option.chosen} ({option.share} %)
                    </span>
                    <span className="analysis-options__body">
                      <OptionBody body={option.body} kind="text" result={null} />
                      {option.correct && <span className="frozen-item__key"> · correcta</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </li>
      ))}
    </ol>
  );
}
