import type { Route } from 'next';
import Link from 'next/link';
import { getVideo } from '../application/resources-api';
import { analyzeLabQuery, LAB_EXAMPLES } from '@/features/laboratory/application/lab-api';
import { LESSONS, lessonLabHref } from '@/features/study/application/study-api';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { CodeBlock } from '@/presentation/components/ui';
import { PrintButton } from './print-button';

/** Conceptos de la chuleta: las lecciones que enseñan una pieza de SELECT (L01–L07). */
const CHEATSHEET = LESSONS.flatMap((lesson) =>
  lesson.concept ? [{ ...lesson, conceptTitle: lesson.concept.title }] : [],
);

/** LAB10 es un error intencional (coma ausente): se estudia en la lección y en el Challenge. */
const EXAMPLES = LAB_EXAMPLES.filter((example) => example.id !== 'LAB10');

const SHORTCUTS = [
  {
    href: '/learn',
    title: 'Modo Estudio',
    text: 'Nueve lecciones con la tabla, la consulta y su resultado.',
  },
  {
    href: '/presentation',
    title: 'Modo Exposición',
    text: 'Dieciséis escenas para explicar SELECT en clase.',
  },
  { href: '/lab', title: 'Laboratorio SQL', text: 'Escribe una consulta y revisa su análisis.' },
  {
    href: '/challenge',
    title: 'SQL Challenge',
    text: 'Diez misiones para practicar lo aprendido.',
  },
] as const;

const WARNINGS = [
  'SELECT solo lee: las consultas de esta unidad no modifican la tabla EMPLEADOS.',
  'AS cambia el encabezado del resultado, no el nombre de la columna guardada.',
  'DISTINCT compara la fila completa que muestras, no una sola columna.',
  'Sin ORDER BY, Oracle no garantiza el orden de las filas.',
] as const;

function compact(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resultSize(sql: string): string {
  const preview = analyzeLabQuery(sql).preview;
  if (!preview) return '—';
  const columns = preview.columns.length;
  return `${preview.rows.length} filas × ${columns} ${columns === 1 ? 'columna' : 'columnas'}`;
}

function labHref(sql: string): Route {
  return `/lab?${new URLSearchParams({ sql }).toString()}` as Route;
}

export function ResourcesPage() {
  const intro = getVideo('intro');
  const summary = getVideo('summary');
  return (
    <div className="site-container feature-page resources-page">
      <header className="feature-heading">
        <span className="eyebrow">Consultar y repasar</span>
        <h1>Recursos de SELECT</h1>
        <p className="muted">
          La chuleta, una tabla de referencia, ejemplos listos para el laboratorio, los videos de la
          unidad y sus fuentes. Todo usa la misma tabla EMPLEADOS que el Estudio y el laboratorio.
        </p>
      </header>

      <nav className="resources-shortcuts" aria-label="Accesos directos">
        {SHORTCUTS.map(({ href, title, text }) => (
          <Link key={href} href={href} className="resources-shortcut">
            <strong>{title}</strong>
            <span>{text}</span>
          </Link>
        ))}
      </nav>

      <nav className="resources-toc" aria-label="Secciones de recursos">
        <a href="#chuleta">Chuleta</a>
        <a href="#referencia">Referencia rápida</a>
        <a href="#ejemplos">Ejemplos SQL</a>
        <a href="#videos">Videos</a>
        <a href="#fuentes">Fuentes</a>
        <Link href="/modules">Catálogo de módulos</Link>
      </nav>

      <section id="chuleta" className="resources-section" aria-labelledby="cheatsheet-title">
        <div className="resources-section__heading">
          <div>
            <h2 id="cheatsheet-title">Chuleta de SELECT</h2>
            <p>Siete piezas para leer y escribir cualquier consulta de esta unidad.</p>
          </div>
          <PrintButton />
        </div>
        <div className="resources-grid">
          {CHEATSHEET.map((lesson) => (
            <article className="resource-card" id={`chuleta-${lesson.slug}`} key={lesson.id}>
              <h3>{lesson.conceptTitle}</h3>
              <p>{lesson.summary}</p>
              <p className="resource-card__label">Patrón</p>
              <pre className="resource-syntax">
                <code>{lesson.syntax}</code>
              </pre>
              <CodeBlock
                code={lesson.sql}
                label={`Ejemplo de ${lesson.conceptTitle}`}
                labHref={lessonLabHref(lesson.sql, `/learn/${lesson.slug}`) as Route}
              />
              <Link className="inline-action" href={`/learn/${lesson.slug}` as Route}>
                Repasar la lección <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
        <aside className="resources-warnings" aria-labelledby="warnings-title">
          <h3 id="warnings-title">Para recordar</h3>
          <ul>
            {WARNINGS.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section id="referencia" className="resources-section" aria-labelledby="reference-title">
        <h2 id="reference-title">Tabla de referencia rápida</h2>
        <p>El resultado se calcula sobre la tabla EMPLEADOS de seis filas.</p>
        <div
          className="resources-table"
          role="region"
          aria-labelledby="reference-title"
          tabIndex={0}
        >
          <table>
            <caption className="visually-hidden">
              Elementos de SELECT: qué hacen, su patrón, un ejemplo y el tamaño del resultado
            </caption>
            <thead>
              <tr>
                <th scope="col">Elemento</th>
                <th scope="col">Qué hace</th>
                <th scope="col">Patrón</th>
                <th scope="col">Ejemplo</th>
                <th scope="col">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {CHEATSHEET.map((lesson) => (
                <tr key={lesson.id}>
                  <th scope="row">{lesson.conceptTitle}</th>
                  <td>{lesson.summary}</td>
                  <td>
                    <code>{compact(lesson.syntax)}</code>
                  </td>
                  <td>
                    <code>{compact(lesson.sql)}</code>
                  </td>
                  <td className="resources-table__size">{resultSize(lesson.sql)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="ejemplos" className="resources-section" aria-labelledby="examples-title">
        <h2 id="examples-title">Ejemplos SQL</h2>
        <p>Consultas válidas del laboratorio. Ábrelas, cámbialas y observa el resultado.</p>
        <div className="resources-examples">
          {EXAMPLES.map((example) => (
            <article className="resource-example" key={example.id}>
              <h3>{example.title}</h3>
              <CodeBlock
                code={example.sql}
                label={`Ejemplo: ${example.title}`}
                labHref={labHref(example.sql)}
              />
              <p className="resource-example__size">Resultado: {resultSize(example.sql)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="videos" className="resources-section" aria-labelledby="videos-title">
        <h2 id="videos-title">Videos de la unidad</h2>
        <p>Ninguno reproduce solo ni con sonido: tú decides cuándo verlos.</p>
        <div className="resources-videos">
          <VideoPlayer
            id="video-introduccion"
            title={intro.title}
            description={intro.description}
            plannedDuration={intro.plannedDuration}
            duration={intro.duration}
            orientation={intro.orientation}
            source={intro.source}
            poster={intro.poster}
            captions={intro.captions}
            transcriptUrl={intro.transcriptUrl}
          />
          <VideoPlayer
            id="video-resumen"
            title={summary.title}
            description={summary.description}
            plannedDuration={summary.plannedDuration}
            duration={summary.duration}
            orientation={summary.orientation}
            source={summary.source}
            poster={summary.poster}
            captions={summary.captions}
            transcriptUrl={summary.transcriptUrl}
          />
        </div>
      </section>

      <section id="fuentes" className="resources-section" aria-labelledby="sources-title">
        <h2 id="sources-title">Fuentes</h2>
        <ul className="resources-sources">
          <li>
            <strong>Referencia oficial</strong>
            <a
              href="https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html"
              target="_blank"
              rel="noreferrer"
            >
              Oracle Database 19c, SQL Language Reference: SELECT
            </a>
            <span>
              Contraste técnico de proyección, alias y DISTINCT. Prevalece ante cualquier duda.
            </span>
          </li>
          <li>
            <strong>Material del curso</strong>
            <span>
              Presentación de sentencias SQL (fuente principal de explicaciones, ejemplos y datos) y
              presentación complementaria de Oracle SQL, adaptadas por lección.
            </span>
          </li>
        </ul>
        <p className="muted">
          Los resultados de esta página son vistas educativas calculadas sobre EMPLEADOS. La
          ejecución real en Oracle se hace desde el laboratorio cuando el servicio está conectado.
        </p>
      </section>
    </div>
  );
}
