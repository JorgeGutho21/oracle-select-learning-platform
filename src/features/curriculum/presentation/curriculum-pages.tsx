import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  BlockView,
  ConceptView,
  CurriculumIndexView,
  LessonPageView,
  ResourceBlockView,
  TableDictionaryView,
  VerificationView,
} from '../application/curriculum-api';
import { ExampleBlock } from './example-block';
import { CodeView, ExampleOutcome, VerifiedNote } from './example-parts';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { Breadcrumb, PageHeader } from '@/presentation/components/ui';

/**
 * Páginas de las secciones descritas en la fuente curricular: temario, lección y recursos.
 * Se renderizan en el servidor; solo el progreso, las actividades y los recorridos PL/SQL son
 * interactivos. Mantienen las clases del Modo Estudio de la Sección 1 (`study-*`).
 */

export interface SectionRef {
  readonly id: string;
  readonly number: number;
  readonly title: string;
}

export type ModeKey = 'class' | 'study' | 'practice' | 'challenge' | 'resources';

const MODE_LABEL: Readonly<Record<ModeKey | 'evaluation', string>> = {
  class: 'Iniciar clase',
  study: 'Estudiar',
  practice: 'Practicar',
  challenge: 'Challenge',
  resources: 'Recursos',
  evaluation: 'Evaluación',
};

export function modeHref(section: string, mode: ModeKey): string {
  return `/sections/${section}/${mode}`;
}

/** Navegación entre los seis modos de la sección. */
export function ModeTabs({
  section,
  current,
}: {
  readonly section: string;
  readonly current: ModeKey;
}) {
  const modes: readonly (ModeKey | 'evaluation')[] = [
    'study',
    'class',
    'practice',
    'challenge',
    'resources',
    'evaluation',
  ];
  return (
    <nav className="cu-mode-tabs" aria-label="Modos de la sección">
      <ul>
        {modes.map((mode) => {
          const href =
            mode === 'evaluation' ? `/evaluations?seccion=${section}` : modeHref(section, mode);
          return (
            <li key={mode}>
              <Link
                href={href as Route}
                className="cu-mode-tabs__link"
                {...(mode === current ? { 'aria-current': 'page' as const } : {})}
              >
                {MODE_LABEL[mode]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ModeHeader({
  section,
  mode,
  title,
  lead,
  actions,
  aside,
}: {
  readonly section: SectionRef;
  readonly mode: ModeKey;
  readonly title: string;
  readonly lead: string;
  readonly actions?: ReactNode;
  readonly aside?: ReactNode;
}) {
  return (
    <>
      <PageHeader
        tone="night"
        breadcrumb={
          <Breadcrumb
            tone="dark"
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Secciones', href: '/sections' },
              { label: section.title, href: `/sections/${section.id}` },
              { label: MODE_LABEL[mode] },
            ]}
          />
        }
        eyebrow={
          <>
            Sección {section.number} · {MODE_LABEL[mode]}
          </>
        }
        title={title}
        lead={lead}
        {...(actions ? { actions } : {})}
        {...(aside ? { aside } : {})}
      />
      <div className="site-container">
        <ModeTabs section={section.id} current={mode} />
      </div>
    </>
  );
}

/* ---------- Temario ---------- */

export function LessonBlocks({
  blocks,
  status,
}: {
  readonly blocks: readonly BlockView[];
  /** Marca de avance por lección (cliente). */
  readonly status?: (lessonId: string) => ReactNode;
}) {
  return (
    <ol className="cu-blocks">
      {blocks.map((block) => (
        <li key={block.id} className="cu-block" id={`bloque-${block.number}`}>
          <h2 className="cu-block__title">
            <span className="cu-block__number">{String(block.number).padStart(2, '0')}</span>{' '}
            {block.title}
          </h2>
          <p className="cu-block__summary">{block.summary}</p>
          <ol className="cu-block__lessons">
            {block.lessons.map((lesson) => (
              <li key={lesson.id} className="cu-lesson-link">
                <Link href={lesson.href as Route}>
                  <span className="cu-lesson-link__number">Lección {lesson.number}</span>
                  <span className="cu-lesson-link__title">{lesson.title}</span>
                  <span className="cu-lesson-link__summary">{lesson.summary}</span>
                </Link>
                {status?.(lesson.id)}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export function DatasetDictionary({
  tables,
  scriptHref,
}: {
  readonly tables: readonly TableDictionaryView[];
  readonly scriptHref: string;
}) {
  return (
    <section className="cu-dataset" aria-labelledby="dataset-title">
      <p className="study-eyebrow">Datos de la sección</p>
      <h2 id="dataset-title">Las tablas que usan todos los ejemplos</h2>
      <p>
        Un solo dataset pequeño y coherente para toda la sección: las mismas 20 personas de la
        Sección 1, ahora con su departamento como clave foránea, más proyectos y asignaciones.
      </p>
      <ul className="cu-dataset__map" aria-label="Relaciones entre las tablas">
        {tables.flatMap((table) =>
          table.foreignKeys.map((key) => (
            <li key={`${table.name}.${key.columns}`}>
              <code>
                {table.name}.{key.columns}
              </code>{' '}
              <span aria-hidden="true">→</span>
              <span className="visually-hidden">apunta a</span> <code>{key.references}</code>
              {key.references.startsWith(`${table.name} `) && ' (la misma tabla)'}
            </li>
          )),
        )}
      </ul>
      <div className="cu-dataset__tables">
        {tables.map((table) => (
          <details key={table.name} className="study-fold cu-dataset__table">
            <summary>
              <strong>{table.name}</strong> · {table.purpose}
            </summary>
            <p>
              Clave primaria: <code>{table.primaryKey.join(', ')}</code>
              {table.foreignKeys.length > 0 && (
                <>
                  {' '}
                  · Claves foráneas:{' '}
                  {table.foreignKeys.map((key) => (
                    <span key={key.columns}>
                      <code>{key.columns}</code> → <code>{key.references}</code>{' '}
                    </span>
                  ))}
                </>
              )}
            </p>
            <table className="cu-dictionary">
              <caption className="visually-hidden">Columnas de {table.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Columna y tipo Oracle</th>
                  <th scope="col">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <th scope="row">
                      <code>{column.name}</code>
                      <span className="cu-dictionary__type">
                        <code>{column.type}</code> · {column.nullable ? 'admite NULL' : 'NOT NULL'}
                      </span>
                    </th>
                    <td>{column.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
      <p className="cu-dataset__script">
        ¿Quieres ejecutar los ejemplos en Oracle real? Descarga el{' '}
        <a href={scriptHref} download>
          script del dataset (Oracle SQL)
        </a>{' '}
        y ejecútalo en tu propio esquema, por ejemplo en FreeSQL u Oracle Live SQL.
      </p>
    </section>
  );
}

export function CurriculumIndex({
  index,
  status,
}: {
  readonly index: CurriculumIndexView;
  readonly status?: (lessonId: string) => ReactNode;
}) {
  return <LessonBlocks blocks={index.blocks} {...(status ? { status } : {})} />;
}

/* ---------- Lección ---------- */

function ConceptDefinition({ concept }: { readonly concept: ConceptView }) {
  return (
    <div className="cu-definition">
      <p className="study-one-liner">
        <span className="study-part">
          {concept.term} <span className="study-category">{concept.category}</span>
        </span>{' '}
        {concept.definition}
      </p>
    </div>
  );
}

export function LessonArticle({
  view,
  verification,
  check,
  tracker,
}: {
  readonly view: LessonPageView;
  readonly verification: VerificationView;
  /** Mini comprobación interactiva (cliente). */
  readonly check: ReactNode;
  /** Registro de la visita (cliente). */
  readonly tracker?: ReactNode;
}) {
  const base = `/sections/${view.section}`;
  return (
    <article className="study-lesson cu-lesson">
      {tracker}
      <header className="study-lesson__header">
        <p className="study-eyebrow">
          Bloque {view.block.number} · {view.block.title} · Lección {view.lesson.number} de{' '}
          {view.total}
        </p>
        <h1>{view.lesson.title}</h1>
        <p className="cu-lesson__summary">{view.lesson.summary}</p>
        {view.concepts.map((concept) => (
          <ConceptDefinition key={concept.id} concept={concept} />
        ))}
        <nav className="study-onpage" aria-label="En esta lección">
          <a href="#sintaxis">Sintaxis</a>
          <a href="#practica">Predicción</a>
          <a href="#ejemplo">Ejemplo</a>
          <a href="#errores">Errores frecuentes</a>
        </nav>
      </header>

      <div className="study-intro">
        <section className="study-card-block" aria-labelledby="purpose-title">
          <p className="study-part">¿Para qué sirve?</p>
          <h2 id="purpose-title" className="visually-hidden">
            Para qué sirve
          </h2>
          <p>{view.purpose}</p>
        </section>
        <section className="study-card-block" aria-labelledby="how-title">
          <p className="study-part">Cómo funciona</p>
          <h2 id="how-title" className="visually-hidden">
            Cómo funciona
          </h2>
          {view.explanation.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      </div>

      <section className="study-syntax-block" id="sintaxis" aria-labelledby="syntax-title">
        <p className="study-part">Sintaxis</p>
        <h2 id="syntax-title" className="visually-hidden">
          Sintaxis
        </h2>
        <CodeView code={view.syntax} label="Forma general" />
      </section>

      <div id="practica" className="study-anchor">
        {check}
      </div>

      <section
        className="study-example cu-lesson__examples"
        id="ejemplo"
        aria-labelledby="example-title"
      >
        <p className="study-part">Ejemplo</p>
        <h2 id="example-title" className="visually-hidden">
          Ejemplos
        </h2>
        <VerifiedNote verification={verification} />
        {view.examples.map((entry, index) => (
          <div
            key={entry.example.id}
            className={index === 0 ? 'cu-lesson__main' : 'cu-lesson__more'}
          >
            <ExampleBlock entry={entry} />
          </div>
        ))}
      </section>

      <section className="study-changes cu-changes" aria-labelledby="changes-title">
        <div className="study-changes__col study-changes__col--changed">
          <p className="study-part">Qué cambió</p>
          <h2 id="changes-title" className="visually-hidden">
            Qué cambió
          </h2>
          <ul>
            {view.changed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cu-mistakes" id="errores" aria-labelledby="errors-title">
        <p className="study-part">Errores frecuentes</p>
        <h2 id="errors-title" className="visually-hidden">
          Errores frecuentes
        </h2>
        <ol className="study-catalog__list">
          {view.mistakes.map((mistake) => (
            <li key={mistake.title} className="study-error">
              <span className="study-error__mark" aria-hidden="true">
                !
              </span>
              <div className="study-error__body">
                <h3>{mistake.title}</h3>
                <p>{mistake.why}</p>
                {(mistake.wrong || mistake.right) && (
                  <div className="study-catalog__pair">
                    {mistake.wrong && (
                      <CodeView code={mistake.wrong} label="✗ Con error" tone="error" />
                    )}
                    {mistake.right && (
                      <CodeView code={mistake.right} label="✓ Corregida" tone="success" />
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="cu-key-idea">
        <span className="study-part">Idea clave</span> {view.keyIdea}
      </p>

      <section className="study-lab-cta cu-next-steps" aria-labelledby="next-title">
        <p className="study-part">Sigue practicando</p>
        <h2 id="next-title">Usa lo aprendido</h2>
        <ul>
          {view.practiceCount > 0 && (
            <li>
              <Link href={`${base}/practice` as Route}>
                {view.practiceCount} {view.practiceCount === 1 ? 'práctica' : 'prácticas'} de esta
                lección
              </Link>
            </li>
          )}
          {view.missions.map((mission) => (
            <li key={mission.id}>
              <Link href={`${base}/challenge` as Route}>Misión: {mission.title}</Link>
            </li>
          ))}
          <li>
            <Link href={`${base}/resources` as Route}>Ficha de referencia en Recursos</Link>
          </li>
        </ul>
      </section>

      <nav className="study-pager" aria-label="Navegación entre lecciones">
        {view.previous ? (
          <Link className="ds-button ds-button--secondary" href={view.previous.href as Route}>
            ← {view.previous.shortTitle}
          </Link>
        ) : (
          <span />
        )}
        {view.next ? (
          <Link className="ds-button ds-button--primary" href={view.next.href as Route}>
            {view.next.shortTitle} →
          </Link>
        ) : (
          <Link className="ds-button ds-button--primary" href={`${base}/challenge` as Route}>
            Ir al Challenge de la sección →
          </Link>
        )}
      </nav>
    </article>
  );
}

/* ---------- Recursos ---------- */

function ConceptCard({ concept }: { readonly concept: ConceptView }) {
  return (
    <SpotlightCard className="cu-resource">
      <article aria-labelledby={`concept-${concept.id}`}>
        <p className="cu-resource__category">{concept.category}</p>
        <h3 id={`concept-${concept.id}`} className="cu-resource__term">
          {concept.term}
        </h3>
        <dl className="cu-resource__facts">
          <div>
            <dt>Qué es</dt>
            <dd>{concept.definition}</dd>
          </div>
          <div>
            <dt>Para qué sirve</dt>
            <dd>{concept.purpose}</dd>
          </div>
        </dl>
        <CodeView code={concept.syntax} label="Sintaxis" />
        <details className="study-fold cu-resource__example">
          <summary>
            <span className="study-part">Mini ejemplo</span> verificado en Oracle
          </summary>
          <CodeView code={concept.example.code} label="Ejemplo" />
          <ExampleOutcome example={concept.example} size="compact" />
        </details>
        <div className="cu-resource__mistake">
          <p>
            <strong>Error frecuente:</strong> {concept.mistake.title}. {concept.mistake.why}
          </p>
        </div>
        <p className="cu-resource__key">
          <strong>Idea clave:</strong> {concept.keyIdea}
        </p>
        <p className="cu-resource__links">
          {concept.lesson && (
            <Link href={concept.lesson.href as Route}>Lección: {concept.lesson.title}</Link>
          )}
          <a href={concept.reference.url} rel="noopener noreferrer" target="_blank">
            {concept.reference.document} · «{concept.reference.topic}»
            <span className="visually-hidden"> (abre en otra pestaña)</span>
          </a>
        </p>
      </article>
    </SpotlightCard>
  );
}

export function ResourceBlocks({ blocks }: { readonly blocks: readonly ResourceBlockView[] }) {
  return (
    <div className="cu-resources">
      <nav className="cu-resources__index" aria-label="Bloques de la referencia">
        <ol>
          {blocks.map((block) => (
            <li key={block.id}>
              <a href={`#recursos-${block.id}`}>
                {block.number}. {block.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {blocks.map((block) => (
        <section
          key={block.id}
          id={`recursos-${block.id}`}
          className="cu-resources__block"
          aria-labelledby={`recursos-${block.id}-title`}
        >
          <h2 id={`recursos-${block.id}-title`}>
            {block.number}. {block.title}
          </h2>
          <div className="cu-resources__grid">
            {block.concepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- Ampliación de una sección con modos propios ---------- */

/**
 * Bloque de lecciones de la fuente curricular dentro del temario de una sección que conserva
 * su propio Modo Estudio (la Sección 1): mismo aspecto que sus bloques, con letra propia.
 */
export function ExtensionLessons({
  blocks,
  letter,
  status,
}: {
  readonly blocks: readonly BlockView[];
  readonly letter: string;
  readonly status?: (lessonId: string, version: number) => ReactNode;
}) {
  return (
    <div className="study-blocks cu-extension">
      {blocks.map((block) => (
        <section key={block.id} className="study-block" aria-labelledby={`bloque-${block.id}`}>
          <header className="study-block__header">
            <span className="study-block__letter" aria-hidden="true">
              {letter}
            </span>
            <div>
              <h2 id={`bloque-${block.id}`}>
                <span className="visually-hidden">Bloque {letter}: </span>
                {block.title}
              </h2>
              <p>{block.summary} Resultados obtenidos al ejecutar cada consulta en Oracle.</p>
            </div>
          </header>
          <ol className="study-path" aria-label={`Lecciones del bloque ${block.title}`}>
            {block.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link className="study-card" href={lesson.href as Route}>
                  <span className="study-card__number">
                    {String(lesson.number).padStart(2, '0')}
                  </span>
                  <span className="study-card__body">
                    <strong>{lesson.shortTitle}</strong>
                    <span>{lesson.summary}</span>
                  </span>
                  <span className="study-card__state">
                    {status?.(lesson.id, lesson.version) ?? 'Pendiente'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
