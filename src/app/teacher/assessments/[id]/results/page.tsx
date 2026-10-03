import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { loadResults } from '@/composition/assessments/teacher-pages';
import { PHASE_LABEL } from '@/features/assessments/application/assessment-api';
import {
  QuestionAnalysis,
  ResultsSummaryView,
  ResultsTable,
} from '@/features/assessments/presentation/results-view';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Resultados · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadResults(id);
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Resultados</h1>
        <Alert tone="warning" title="No pudimos leer los resultados.">
          Inténtalo de nuevo en unos minutos.
        </Alert>
      </div>
    );
  }
  const exportHref = (query: string) => `/teacher/assessments/${id}/export${query}` as Route;
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={
          <>
            <Link href={`/teacher/assessments/${id}` as Route}>{data.record.title}</Link> ·{' '}
            {SECTION_TITLES[data.record.sectionKey]}
          </>
        }
        title="Resultados"
        lead={`${PHASE_LABEL[data.phase]}. Notas de 0.0 a 5.0 calculadas por la base con las preguntas congeladas y sus pesos. Ausente no es 0.0.`}
        actions={
          <div className="results-export">
            <a className="ds-button ds-button--primary" href={exportHref('')} download>
              Exportar CSV
            </a>
            <a
              className="ds-button ds-button--secondary"
              href={exportHref('?formato=excel')}
              download
            >
              CSV para Excel
            </a>
            <a className="ds-button ds-button--secondary" href={exportHref('?detalle=1')} download>
              Detalle por pregunta
            </a>
          </div>
        }
      />
      <div className="site-container teacher-page__content">
        <ResultsSummaryView summary={data.summary} passGrade={data.record.passGrade} />
        <section className="teacher-block" aria-labelledby="results-students-title">
          <h2 id="results-students-title">Por estudiante</h2>
          <ResultsTable rows={data.rows} assessmentId={id} />
        </section>
        <section className="teacher-block" aria-labelledby="results-questions-title">
          <h2 id="results-questions-title">Por pregunta</h2>
          <p className="ds-field__hint">
            Porcentaje de quienes la recibieron que la respondieron completamente bien. Un
            distractor muy elegido puede indicar una pregunta ambigua o un concepto mal comprendido.
          </p>
          {data.questions.length === 0 ? (
            <p className="assessment-empty">Todavía no hay intentos entregados para analizar.</p>
          ) : (
            <QuestionAnalysis stats={data.questions} sectionKey={data.record.sectionKey} />
          )}
          {data.notPresented > 0 && (
            <p className="ds-field__hint">
              {data.notPresented} preguntas del conjunto aleatorio no le tocaron a nadie todavía.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
