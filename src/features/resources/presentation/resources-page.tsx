import type { Route } from 'next';
import Link from 'next/link';
import { getVideo } from '../application/resources-api';
import { CONCEPT_CATEGORY_LABEL, SQL_CONCEPTS, type SqlConcept } from '@/application/sql-concepts';
import {
  analyzeLabQuery,
  EMPLEADOS,
  LAB_EXAMPLES,
} from '@/features/laboratory/application/lab-api';
import { upcomingLevels } from '@/features/modules/application/modules-api';
import { SCENE_TOTAL } from '@/features/presentation/application/presentation-api';
import {
  LESSON_COUNT,
  LESSONS,
  lessonLabHref,
  type StudyLesson,
} from '@/features/study/application/study-api';
import { DataView } from '@/presentation/components/data/data-view';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { CodeBlock } from '@/presentation/components/ui';
import { PrintButton } from './print-button';

/**
 * Recursos: chuleta por categorías, referencia rápida, ejemplos, videos y fuentes. Las
 * definiciones, la sintaxis y los ejemplos de la chuleta salen de la fuente conceptual
 * única; el código se muestra formateado (una cláusula por línea) y sin barra horizontal.
 */

type CheatLesson = StudyLesson & { readonly concept: NonNullable<StudyLesson['concept']> };

/** Conceptos de la chuleta: las lecciones que enseñan una pieza de la consulta. */
const CHEATSHEET = LESSONS.flatMap((lesson): CheatLesson[] =>
  lesson.concept ? [{ ...lesson, concept: lesson.concept }] : [],
);

const GROUPS: readonly {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly string[];
}[] = [
  { id: 'consultar', title: 'Consultar', lessons: ['select', 'from', 'asterisco', 'columnas'] },
  {
    id: 'transformar',
    title: 'Transformar el resultado',
    lessons: ['expresiones', 'precedencia', 'alias', 'concatenacion', 'distinct'],
  },
  { id: 'filtrar', title: 'Filtrar', lessons: ['where', 'comparaciones', 'and-or', 'parentesis'] },
  { id: 'operadores', title: 'Operadores de filtro', lessons: ['between', 'in', 'like'] },
  { id: 'ausentes', title: 'Valores ausentes', lessons: ['null'] },
  { id: 'ordenar', title: 'Ordenar', lessons: ['order-by'] },
];

/** Los ejemplos con errores intencionales se estudian en el laboratorio y en la lección 22. */
const EXAMPLES = LAB_EXAMPLES.filter((example) => example.group !== 'Errores para analizar');

const SHORTCUTS = [
  {
    href: '/learn',
    title: 'Modo Estudio',
    text: `${LESSON_COUNT} lecciones con la tabla, la consulta, lo que hace y el resultado.`,
  },
  {
    href: '/presentation',
    title: 'Modo Exposición',
    text: `${SCENE_TOTAL} escenas para explicar la unidad en clase.`,
  },
  {
    href: '/lab',
    title: 'Laboratorio SQL',
    text: 'Escribe una consulta, lee su diagnóstico y ejecútala en Oracle.',
  },
  {
    href: '/challenge',
    title: 'SQL Challenge',
    text: 'Diez misiones para practicar lo aprendido.',
  },
] as const;

const WARNINGS = [
  'SELECT solo lee: las consultas de esta unidad no modifican la tabla EMPLEADOS.',
  'AS cambia el encabezado del resultado, no el nombre de la columna guardada; no se usa en WHERE.',
  'DISTINCT compara la fila completa que muestras y no ordena.',
  "Los textos van entre comillas simples: 'Bogotá'. Mayúsculas y tildes cuentan.",
  'AND se evalúa antes que OR: usa paréntesis cuando los mezcles.',
  'BETWEEN incluye los dos límites y el menor va primero.',
  'NULL se pregunta con IS NULL; = NULL nunca es verdadero.',
  'Sin ORDER BY, Oracle no garantiza el orden de las filas.',
] as const;

function resultSize(sql: string): string {
  const preview = analyzeLabQuery(sql).preview;
  if (!preview) return '—';
  const columns = preview.columns.length;
  return `${preview.rows.length} filas × ${columns} ${columns === 1 ? 'columna' : 'columnas'}`;
}

function labHref(sql: string): Route {
  return `/lab?${new URLSearchParams({ sql }).toString()}` as Route;
}

function conceptsOf(lesson: CheatLesson): readonly SqlConcept[] {
  return lesson.concept.concepts.map((id) => SQL_CONCEPTS[id]);
}

function Definition({ concept }: { readonly concept: SqlConcept }) {
  const { definition, title } = concept;
  return definition.startsWith(title) ? (
    <>
      <strong>{title}</strong>
      {definition.slice(title.length)}
    </>
  ) : (
    <>{definition}</>
  );
}

function ConceptCard({ lesson }: { readonly lesson: CheatLesson }) {
  const [primary, ...secondary] = conceptsOf(lesson);
  const concept = primary!;
  return (
    <article className="resource-card" id={`chuleta-${lesson.slug}`}>
      <header className="resource-card__header">
        <h4>{lesson.concept.title}</h4>
        <span className="resource-card__category">{CONCEPT_CATEGORY_LABEL[concept.category]}</span>
      </header>
      <p className="resource-card__definition">
        <Definition concept={concept} />
      </p>
      {/* Siempre presente (aunque vacía) para alinear las filas del subgrid. */}
      <ul className="resource-card__more" aria-hidden={secondary.length === 0 || undefined}>
        {secondary.map((item) => (
          <li key={item.id}>
            <Definition concept={item} />
          </li>
        ))}
      </ul>
      <div className="resource-card__syntax">
        <p className="resource-card__label">Sintaxis</p>
        <code className="resource-syntax">{concept.syntax}</code>
      </div>
      <CodeBlock
        code={concept.example}
        format
        label={`Ejemplo de ${lesson.concept.title}`}
        labHref={lessonLabHref(concept.example, `/learn/${lesson.slug}`) as Route}
        lessonHref={`/learn/${lesson.slug}` as Route}
      />
    </article>
  );
}

const REFERENCE_COLUMNS = [
  { name: 'ELEMENTO', type: 'text' as const },
  { name: 'QUÉ HACE', type: 'text' as const },
  { name: 'SINTAXIS', type: 'text' as const },
  { name: 'RESULTADO DEL EJEMPLO', type: 'text' as const },
];

export function ResourcesPage() {
  const intro = getVideo('intro');
  const summary = getVideo('summary');
  const byLesson = new Map(CHEATSHEET.map((lesson) => [lesson.slug, lesson]));
  return (
    <div className="site-container feature-page resources-page">
      <header className="feature-heading">
        <span className="eyebrow">Consultar y repasar</span>
        <h1>Recursos de SELECT</h1>
        <p className="muted readable">
          La chuleta por categorías, una tabla de referencia, ejemplos listos para el laboratorio,
          los videos de la unidad y sus fuentes. Todo usa la misma tabla EMPLEADOS que el Estudio y
          el laboratorio.
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
        <Link href="/modules">Ruta de aprendizaje</Link>
      </nav>

      <section id="chuleta" className="resources-section" aria-labelledby="cheatsheet-title">
        <div className="resources-section__heading">
          <div>
            <h2 id="cheatsheet-title">Chuleta de SELECT</h2>
            <p>
              {CHEATSHEET.length} piezas en {GROUPS.length} categorías para leer y escribir
              cualquier consulta de esta unidad.
            </p>
          </div>
          <PrintButton />
        </div>
        {GROUPS.map((group) => (
          <section key={group.id} className="resources-group" aria-labelledby={`grupo-${group.id}`}>
            <h3 id={`grupo-${group.id}`} className="resources-group__title">
              {group.title}
            </h3>
            <div className="resources-grid">
              {group.lessons.map((slug) => {
                const lesson = byLesson.get(slug);
                return lesson ? <ConceptCard key={slug} lesson={lesson} /> : null;
              })}
            </div>
          </section>
        ))}
        <section className="resources-group resources-group--future" aria-labelledby="grupo-futuro">
          <h3 id="grupo-futuro" className="resources-group__title">
            Futuro · Próximamente
          </h3>
          <ul className="resources-future">
            {upcomingLevels().map((level) => (
              <li key={level.number}>
                <Link href={`/modules#nivel-${level.number}` as Route}>
                  <span className="resources-future__level">Nivel {level.number}</span>
                  <strong>{level.title}</strong>
                  <span className="resources-future__topics">
                    {level.topics
                      .slice(0, 4)
                      .map((topic) => topic.title)
                      .join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
        <p>
          El resultado de cada ejemplo se calcula sobre la tabla EMPLEADOS de{' '}
          {EMPLEADOS.rows.length} filas.
        </p>
        <DataView
          caption="Elementos de SELECT: qué hacen, su sintaxis y el tamaño del resultado de su ejemplo"
          columns={REFERENCE_COLUMNS}
          rows={CHEATSHEET.map((lesson) => {
            const concept = conceptsOf(lesson)[0]!;
            return [
              lesson.concept.title,
              concept.definition,
              concept.syntax,
              resultSize(concept.example),
            ];
          })}
          rowHeader={0}
          wrapColumns={['QUÉ HACE']}
          codeColumns={['SINTAXIS']}
          schema={{
            titleColumns: ['ELEMENTO'],
            priorityColumns: ['QUÉ HACE', 'SINTAXIS', 'RESULTADO DEL EJEMPLO'],
            fieldGroups: [],
          }}
        />
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
                format
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
              Contraste técnico de SELECT, alias, DISTINCT, condiciones, NULL y ORDER BY. Prevalece
              ante cualquier duda.
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
