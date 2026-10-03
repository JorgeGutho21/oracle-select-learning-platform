import type { ReactNode } from 'react';
import { Alert } from '@/presentation/components/ui';
import {
  finishedAttempts,
  minutesAvailable,
  openAttempt,
  studentState,
  type StudentAssessment,
} from '../application/student-assessments';
import { formatGrade, SUBMITTED_BY_LABEL } from '../application/assessment-api';
import { formatDateTime, minutesLabel, questionsLabel } from './format';

/**
 * Pantalla previa: qué es, cuánto dura, reglas y qué se registra. El tiempo empieza al
 * pulsar «Comenzar evaluación», nunca antes.
 */

export const SUPERVISION_NOTICE =
  'Durante esta evaluación se registran eventos del navegador como pérdida de foco, desconexión o salida de pantalla completa.';

export function AssessmentIntro({
  assessment,
  sectionTitle,
  now,
  startForm,
  connection,
  result,
}: {
  readonly assessment: StudentAssessment;
  readonly sectionTitle: string;
  readonly now: number;
  /** Formulario con la acción de servidor que comienza o retoma el intento. */
  readonly startForm: (label: string) => ReactNode;
  /** Estado de la conexión (componente de cliente). */
  readonly connection: ReactNode;
  /** Resultado del último intento entregado (si existe). */
  readonly result?: ReactNode;
}) {
  const state = studentState(assessment);
  const open = openAttempt(assessment);
  const done = finishedAttempts(assessment);
  const minutes = minutesAvailable(assessment, now);
  const attemptsLeft = Math.max(0, assessment.maxAttempts - assessment.attempts.length);
  return (
    <div className="assessment-intro">
      <section className="assessment-intro__card" aria-labelledby="assessment-facts-title">
        <h2 id="assessment-facts-title">Datos de la evaluación</h2>
        <dl className="assessment-facts">
          <div>
            <dt>Sección</dt>
            <dd>{sectionTitle}</dd>
          </div>
          <div>
            <dt>Preguntas</dt>
            <dd>{questionsLabel(assessment.questionCount)}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{minutesLabel(assessment.durationMinutes)}</dd>
          </div>
          <div>
            <dt>Apertura</dt>
            <dd>
              {assessment.opensAt
                ? formatDateTime(assessment.opensAt)
                : 'Disponible desde su publicación'}
            </dd>
          </div>
          <div>
            <dt>Cierre</dt>
            <dd>
              {assessment.closesAt ? formatDateTime(assessment.closesAt) : 'Sin fecha de cierre'}
            </dd>
          </div>
          <div>
            <dt>Intentos</dt>
            <dd>
              {assessment.maxAttempts === 1
                ? 'Un intento'
                : `${assessment.maxAttempts} intentos (te quedan ${attemptsLeft})`}
            </dd>
          </div>
          <div>
            <dt>Nota</dt>
            <dd>De 0.0 a 5.0 · se aprueba con {formatGrade(assessment.passGrade)}</dd>
          </div>
        </dl>
        {assessment.description && (
          <p className="assessment-intro__description">{assessment.description}</p>
        )}
      </section>

      {(state === 'available' || state === 'in_progress') && (
        <section className="assessment-intro__card" aria-labelledby="assessment-rules-title">
          <h2 id="assessment-rules-title">Antes de comenzar</h2>
          <ul className="assessment-rules">
            <li>
              {state === 'in_progress'
                ? 'Tu intento sigue abierto: el reloj no se detuvo mientras estabas fuera.'
                : `Al pulsar «Comenzar evaluación» empieza a correr el tiempo: tendrás ${minutesLabel(minutes)}.`}
            </li>
            <li>Tus respuestas se guardan solas. Puedes cambiarlas hasta entregar.</li>
            <li>
              Si recargas la página o pierdes la conexión, vuelves al mismo examen con lo guardado.
            </li>
            <li>Puedes marcar preguntas para revisarlas antes de entregar.</li>
            <li>
              Al terminar el tiempo, la evaluación se entrega automáticamente con lo guardado.
            </li>
            <li>
              {assessment.feedbackMode === 'hidden'
                ? 'El profesor decidirá cuándo ver la nota y la retroalimentación.'
                : 'Verás la retroalimentación que el profesor haya habilitado.'}
            </li>
          </ul>
          <div className="assessment-supervision" role="note">
            <p className="assessment-supervision__title">Supervisión</p>
            <p>{SUPERVISION_NOTICE}</p>
            {assessment.recordClipboard && (
              <p>También se registran los intentos de copiar, pegar o abrir el menú contextual.</p>
            )}
            <p>No se usa la cámara, el micrófono ni capturas de pantalla.</p>
          </div>
          {connection}
          {startForm(state === 'in_progress' ? 'Continuar evaluación' : 'Comenzar evaluación')}
          {open && (
            <p className="assessment-intro__deadline">
              Tu intento termina a las {formatDateTime(open.expiresAt)}.
            </p>
          )}
        </section>
      )}

      {state === 'upcoming' && (
        <Alert tone="info" title="Aún no abre.">
          Podrás comenzar a partir del {formatDateTime(assessment.opensAt)}.
        </Alert>
      )}
      {state === 'missed' && (
        <Alert tone="info" title="No presentaste esta evaluación.">
          La evaluación ya no admite nuevos intentos.
        </Alert>
      )}

      {done.length > 0 && (
        <section className="assessment-intro__card" aria-labelledby="assessment-attempts-title">
          <h2 id="assessment-attempts-title">Tus intentos</h2>
          <ul className="assessment-attempts">
            {done.map((attempt) => (
              <li key={attempt.id}>
                <span>
                  Intento {attempt.number} · entregado{' '}
                  {SUBMITTED_BY_LABEL[attempt.submittedBy ?? 'student']} el{' '}
                  {formatDateTime(attempt.submittedAt)}
                </span>
                <strong>
                  {attempt.grade !== null
                    ? `Nota ${formatGrade(attempt.grade)} / 5.0`
                    : 'Nota pendiente de publicación'}
                </strong>
              </li>
            ))}
          </ul>
          {result}
        </section>
      )}
    </div>
  );
}
