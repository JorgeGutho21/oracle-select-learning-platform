import type { Route } from 'next';
import Link from 'next/link';
import {
  LESSON_COUNT,
  LESSONS,
  lessonLabHref,
  lessonNeighbors,
  STUDY_BLOCKS,
  STUDY_DATASET,
  type LessonView,
} from '../application/study-api';
import { getVideo, type VideoResource } from '@/features/resources/application/resources-api';
import {
  FlowTableView,
  QueryFlow,
  transformationLabel,
} from '@/presentation/components/data/query-flow';
import { SqlCode } from '@/presentation/components/data/sql-code';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import {
  LessonCheck,
  LessonToc,
  StudyAlerts,
  StudyLessonList,
  StudyProgressPanel,
} from './study-progress';

/**
 * Páginas del Modo Estudio, renderizadas en el servidor: el contenido y las tablas no viajan
 * como JavaScript. Solo el progreso, el temario y la mini comprobación son interactivos.
 */

const TEMPLATE = [
  'En una frase',
  '¿Qué hace?',
  '¿Para qué sirve?',
  'Sintaxis',
  'Cómo leerla',
  'Ejemplo',
  'Tabla de origen',
  'Resultado',
  'Qué cambió',
  'Error frecuente',
  'Mini comprobación',
  'Abrir en el laboratorio',
];

function UnitVideo({ video }: { readonly video: VideoResource }) {
  return (
    <VideoPlayer
      title={video.title}
      description={video.description}
      orientation={video.orientation}
      source={video.source}
      poster={video.poster}
      captions={video.captions}
      transcriptUrl={video.transcriptUrl}
    />
  );
}

export function StudyIndexPage() {
  return (
    <div className="study-shell">
      <header className="study-hero">
        <div className="site-container study-hero__inner">
          <div>
            <p className="study-eyebrow">
              Modo Estudio · {STUDY_BLOCKS.length} bloques · {LESSON_COUNT} lecciones
            </p>
            <h1>Aprende SELECT en Oracle SQL paso a paso</h1>
            <p className="study-hero__lead">
              Desde qué es una tabla hasta una consulta completa con WHERE y ORDER BY. Cada lección
              muestra la tabla EMPLEADOS, la consulta, lo que hace y el resultado, y termina con una
              comprobación breve.
            </p>
          </div>
          <StudyProgressPanel />
        </div>
      </header>
      <div className="site-container study-index">
        <StudyAlerts />
        <section className="study-start" aria-labelledby="study-start-title">
          <div className="study-start__copy">
            <p className="study-eyebrow">Cómo está hecha cada lección</p>
            <h2 id="study-start-title">La misma estructura, doce partes</h2>
            <ol className="study-template">
              {TEMPLATE.map((part) => (
                <li key={part}>{part}</li>
              ))}
            </ol>
            <Link className="ds-button ds-button--primary" href="/learn/introduccion">
              Empezar por «¿Qué es SQL?»
            </Link>
          </div>
          <UnitVideo video={getVideo('intro')} />
        </section>
        <StudyLessonList />
        <aside className="study-next-level" aria-labelledby="study-next-title">
          <p className="study-eyebrow">Después de esta unidad</p>
          <h2 id="study-next-title">Funciones, agrupación, JOIN y más</h2>
          <p>
            La ruta continúa con funciones, resúmenes con GROUP BY, varias tablas con JOIN y la
            modificación de datos. Cada tema ya tiene su ficha en Próximamente.
          </p>
          <Link className="inline-action" href="/modules">
            Ver la ruta completa <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Dictionary() {
  return (
    <section className="study-dictionary" aria-labelledby="dictionary-title">
      <p className="study-eyebrow">Diccionario de datos</p>
      <h2 id="dictionary-title">Las 12 columnas de EMPLEADOS</h2>
      <div
        className="study-dictionary__scroll"
        role="region"
        aria-label="Columnas de EMPLEADOS"
        tabIndex={0}
      >
        <table className="study-dictionary__table">
          <caption className="visually-hidden">Columnas, tipos y reglas de EMPLEADOS</caption>
          <thead>
            <tr>
              <th scope="col">Columna</th>
              <th scope="col">Tipo Oracle</th>
              <th scope="col">¿Admite NULL?</th>
              <th scope="col">Qué guarda</th>
            </tr>
          </thead>
          <tbody>
            {STUDY_DATASET.columns.map((column) => (
              <tr key={column.name}>
                <th scope="row">
                  <code>{column.name}</code>
                </th>
                <td>
                  <code>{column.oracleType}</code>
                </td>
                <td>{column.nullable ? 'Sí' : 'No'}</td>
                <td>{column.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LessonPage({ view }: { readonly view: LessonView }) {
  const { lesson, example, comparisons, steps, check } = view;
  const { content } = lesson;
  const { previous, next } = lessonNeighbors(lesson.slug);
  const returnTo = `/learn/${lesson.slug}`;
  const labHref = lessonLabHref(content.example.sql, returnTo) as Route;
  const errorLab = content.error.wrong
    ? (lessonLabHref(content.error.wrong, returnTo) as Route)
    : null;

  return (
    <div className="study-shell">
      <div className="site-container study-layout">
        <LessonToc current={lesson.slug} />
        <article className="study-lesson">
          <header className="study-lesson__header">
            <p className="study-eyebrow">
              Bloque {lesson.blockInfo.letter} · {lesson.blockInfo.title} · Lección {lesson.number}{' '}
              de {LESSONS.length}
            </p>
            <h1>{lesson.title}</h1>
            <p className="study-one-liner">
              <span className="study-part">En una frase</span>
              {content.oneLiner}
            </p>
          </header>
          <StudyAlerts />

          <div className="study-intro">
            <section className="study-card-block" aria-labelledby="what-title">
              <p className="study-part">¿Qué hace?</p>
              <h2 id="what-title" className="visually-hidden">
                ¿Qué hace?
              </h2>
              <p>{content.whatItDoes}</p>
            </section>
            <section className="study-card-block" aria-labelledby="purpose-title">
              <p className="study-part">¿Para qué sirve?</p>
              <h2 id="purpose-title" className="visually-hidden">
                ¿Para qué sirve?
              </h2>
              <p>{content.purpose}</p>
            </section>
          </div>

          <section className="study-syntax-block" aria-labelledby="syntax-title">
            <div>
              <p className="study-part">Sintaxis</p>
              <h2 id="syntax-title" className="visually-hidden">
                Sintaxis
              </h2>
              <SqlCode sql={content.syntax} size="large" />
            </div>
            <div>
              <p className="study-part">Cómo leerla</p>
              <p className="study-reading">{content.syntaxReading}</p>
              {content.terminology && (
                <p className="study-terminology">
                  <strong>Término técnico:</strong> {content.terminology}
                </p>
              )}
            </div>
          </section>

          <section className="study-example" aria-labelledby="example-title">
            <p className="study-part">Ejemplo</p>
            <h2 id="example-title">De la pregunta al resultado</h2>
            <QueryFlow
              explained={example}
              question={content.example.question}
              reading={content.example.reading}
            />
            <Link className="ds-button ds-button--primary study-lab-link" href={labHref}>
              Abrir este ejemplo en el laboratorio <span aria-hidden="true">→</span>
            </Link>
          </section>

          <section className="study-changes" aria-labelledby="changes-title">
            <h2 id="changes-title" className="visually-hidden">
              Qué cambió y qué no
            </h2>
            <div className="study-changes__col study-changes__col--changed">
              <p className="study-part">Qué cambió</p>
              <ul>
                {content.changed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="study-changes__col study-changes__col--kept">
              <p className="study-part">Qué no cambió</p>
              <ul>
                {content.unchanged.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {content.dictionary && <Dictionary />}

          {steps.length > 0 && (
            <section className="study-steps" aria-labelledby="steps-title">
              <p className="study-part">Construcción paso a paso</p>
              <h2 id="steps-title">De 20 filas a la respuesta</h2>
              <ol className="study-steps__list">
                {steps.map((step) => (
                  <li key={step.label} className="study-step">
                    <div className="study-step__copy">
                      <h3>{step.label}</h3>
                      <p>{step.note}</p>
                      <p className="study-step__count">{transformationLabel(step.explained)}</p>
                      <SqlCode sql={step.sql} />
                    </div>
                    {step.explained.result && (
                      <FlowTableView
                        table={step.explained.result}
                        caption={`Resultado de ${step.label}`}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {comparisons.length > 0 && (
            <section className="study-comparisons" aria-labelledby="comparisons-title">
              <p className="study-part">Compara</p>
              <h2 id="comparisons-title">Variaciones del ejemplo</h2>
              <div className="study-comparisons__grid">
                {comparisons.map((comparison) => (
                  <article key={comparison.label} className="study-comparison">
                    <h3>{comparison.label}</h3>
                    <SqlCode sql={comparison.sql} />
                    <p>{comparison.note}</p>
                    <p className="study-comparison__count">
                      {transformationLabel(comparison.explained)}
                    </p>
                    {comparison.explained.result && (
                      <FlowTableView
                        table={comparison.explained.result}
                        caption={`Resultado: ${comparison.label}`}
                      />
                    )}
                    <Link
                      className="inline-action"
                      href={lessonLabHref(comparison.sql, returnTo) as Route}
                    >
                      Probar en el laboratorio <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {content.catalog && (
            <section className="study-catalog" aria-labelledby="catalog-title">
              <p className="study-part">Catálogo</p>
              <h2 id="catalog-title">Los errores más frecuentes</h2>
              <ol className="study-catalog__list">
                {content.catalog.map((item) => (
                  <li key={item.title} className="study-catalog__item">
                    <h3>{item.title}</h3>
                    <p>{item.why}</p>
                    <div className="study-catalog__pair">
                      {item.wrong && <SqlCode sql={item.wrong} label="✗ Con error" tone="error" />}
                      {item.right && (
                        <SqlCode sql={item.right} label="✓ Corregida" tone="success" />
                      )}
                    </div>
                    {item.wrong && (
                      <Link
                        className="inline-action"
                        href={lessonLabHref(item.wrong, returnTo) as Route}
                      >
                        Ver el diagnóstico en el laboratorio <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {content.notes && content.notes.length > 0 && (
            <section className="study-notes" aria-label="Notas sobre Oracle">
              {content.notes.map((note) => (
                <aside key={note.title} className="study-note">
                  <h3>{note.title}</h3>
                  <p>{note.text}</p>
                </aside>
              ))}
            </section>
          )}

          <section className="study-error" aria-labelledby="error-title">
            <span className="study-error__mark" aria-hidden="true">
              !
            </span>
            <div className="study-error__body">
              <p className="study-part">Error frecuente</p>
              <h2 id="error-title">{content.error.title}</h2>
              <p>{content.error.why}</p>
              {(content.error.wrong || content.error.right) && (
                <div className="study-catalog__pair">
                  {content.error.wrong && (
                    <SqlCode sql={content.error.wrong} label="✗ Con error" tone="error" />
                  )}
                  {content.error.right && (
                    <SqlCode sql={content.error.right} label="✓ Corregida" tone="success" />
                  )}
                </div>
              )}
              {errorLab && (
                <Link className="inline-action" href={errorLab}>
                  Ver qué dice el laboratorio de este error <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </section>

          <LessonCheck lessonId={lesson.id} check={check} />

          <section className="study-lab-cta" aria-labelledby="lab-cta-title">
            <p className="study-part">Abrir en el laboratorio</p>
            <h2 id="lab-cta-title">Pruébalo tú</h2>
            <p>
              Cambia una columna, un valor o un operador y compara el resultado. El laboratorio
              explica cada error y ejecuta la consulta en Oracle.
            </p>
            <Link className="ds-button ds-button--primary" href={labHref}>
              Abrir en el laboratorio <span aria-hidden="true">→</span>
            </Link>
          </section>

          {!next && (
            <section className="study-closing" aria-labelledby="study-closing-title">
              <p className="study-eyebrow">Final del recorrido</p>
              <h2 id="study-closing-title">Repasa y pon a prueba lo aprendido</h2>
              <UnitVideo video={getVideo('summary')} />
              <p>
                Después, resuelve el <Link href="/challenge">SQL Challenge</Link>, repasa la{' '}
                <Link href={'/resources#chuleta' as Route}>chuleta</Link> o mira lo que viene en{' '}
                <Link href="/modules">la ruta completa</Link>.
              </p>
            </section>
          )}

          <nav className="study-pager" aria-label="Navegación entre lecciones">
            {previous ? (
              <Link
                className="ds-button ds-button--secondary"
                href={`/learn/${previous.slug}` as Route}
              >
                ← {previous.shortTitle}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="ds-button ds-button--primary" href={`/learn/${next.slug}` as Route}>
                {next.shortTitle} →
              </Link>
            ) : (
              <Link className="ds-button ds-button--primary" href="/challenge">
                Ir al SQL Challenge →
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
