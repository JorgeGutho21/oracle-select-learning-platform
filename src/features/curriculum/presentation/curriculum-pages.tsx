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
import { ResourceExplorer, ResourceSearchBlock, ResourceSearchItem } from './resource-explorer';
import { CodeView, CurriculumTable, ExampleOutcome, VerifiedNote } from './example-parts';
import {
  ChangeColumns,
  Prerequisites,
  SyntaxParts,
  TierBadge,
  TopicPreviews,
  TopicTables,
} from './topic-contract';
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
                prefetch={false}
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
  // Cuadrícula continua: cada lección es una tarjeta y el bloque viaja dentro de ella. La
  // primera tarjeta del bloque lleva su título (h2) y su resumen; las demás, solo el rótulo.
  // La explicación de «Ampliación» se lee una vez, en el primer bloque que la lleva.
  const firstExtension = blocks.find((block) => block.tier === 'extension')?.id;
  return (
    <ol className="cu-blocks">
      {blocks.map((block) => {
        const number = String(block.number).padStart(2, '0');
        return (
          <li key={block.id} className="cu-block">
            <ol className="cu-block__lessons" aria-label={`Lecciones del bloque ${block.title}`}>
              {block.lessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className={`cu-lesson-link${index === 0 ? ' cu-lesson-link--first' : ''}`}
                >
                  {index === 0 ? (
                    <div className="cu-block__head">
                      <h2 className="cu-block__title" id={`bloque-${block.number}`}>
                        <span className="cu-block__number">{number}</span> {block.title}
                      </h2>
                      {block.tier === 'extension' && (
                        <p className="cu-block__tier">
                          <TierBadge tier="extension" label="Ampliación" />
                          {block.id === firstExtension &&
                            ' Después del núcleo; no hace falta para entender los temas centrales.'}
                        </p>
                      )}
                      <p className="cu-block__summary">{block.summary}</p>
                    </div>
                  ) : (
                    <p className="cu-block__label" aria-hidden="true">
                      <span className="cu-block__number">{number}</span> {block.title}
                    </p>
                  )}
                  <Link href={lesson.href as Route}>
                    <span className="cu-lesson-link__number">
                      Lección {lesson.number}
                      {lesson.tier === 'extension' && (
                        <>
                          {' '}
                          <TierBadge tier="extension" label="Ampliación" />
                        </>
                      )}
                    </span>
                    <span className="cu-lesson-link__title">{lesson.title}</span>
                    <span className="cu-lesson-link__summary">{lesson.summary}</span>
                  </Link>
                  {status?.(lesson.id)}
                </li>
              ))}
            </ol>
          </li>
        );
      })}
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
            <p>Primeras filas del dataset versionado · {table.rowCount} filas en total.</p>
            <CurriculumTable
              table={table.sample}
              label={`Datos: ${table.name}`}
              caption={`Filas de ${table.name} antes de consultar`}
              size="compact"
            />
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

/**
 * Temario lateral de una lección de las Secciones 2 y 3: la misma pieza que en la Sección 1
 * (`study-toc` desde 992 px y desplegable «Temario» en pantallas menores).
 */
export function SectionLessonToc({
  blocks,
  current,
  indexHref,
}: {
  readonly blocks: readonly BlockView[];
  /** Id de la lección abierta. */
  readonly current: string;
  readonly indexHref: string;
}) {
  const lessons = blocks.flatMap((block) => block.lessons);
  const position = lessons.findIndex((lesson) => lesson.id === current);
  const list = (
    <ol>
      {blocks.map((block) => (
        <li key={block.id} className="study-toc__block">
          <span className="study-toc__block-title">
            {String(block.number).padStart(2, '0')} · {block.title}
          </span>
          <ol>
            {block.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  aria-current={lesson.id === current ? 'page' : undefined}
                  href={lesson.href as Route}
                >
                  <span className="study-toc__number" aria-hidden="true">
                    {String(lesson.number).padStart(2, '0')}
                  </span>
                  <span>{lesson.shortTitle}</span>
                </Link>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <aside className="study-toc" aria-label="Temario">
        <Link href={indexHref as Route} className="study-toc__back">
          ← Temario completo
        </Link>
        {list}
      </aside>
      <details className="study-mobile-toc">
        <summary>
          Temario · Lección {position + 1} de {lessons.length}
        </summary>
        {list}
      </details>
    </>
  );
}

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
        {view.contract && view.contract.tier !== 'core' && (
          <p className="cu-lesson__tier">
            <TierBadge tier={view.contract.tier} label={view.contract.tierLabel} />{' '}
            {view.contract.tier === 'extension'
              ? 'Contenido de siguiente nivel: amplía lo central de la sección.'
              : 'Tema de apoyo: prepara o completa un tema central.'}
          </p>
        )}
        {view.contract && (
          <p className="cu-lesson__problem">
            <span className="study-part">El problema</span> {view.contract.problem}
          </p>
        )}
        <p className="cu-lesson__summary">{view.lesson.summary}</p>
        {view.concepts.map((concept) => (
          <ConceptDefinition key={concept.id} concept={concept} />
        ))}
        <nav className="study-onpage" aria-label="En esta lección">
          {view.contract && view.contract.tables.length > 0 && <a href="#datos">Datos</a>}
          <a href="#sintaxis">Sintaxis</a>
          <a href="#practica">Predicción</a>
          <a href="#ejemplo">Ejemplo</a>
          <a href="#errores">Errores frecuentes</a>
        </nav>
      </header>

      <div className="study-intro">
        {view.contract && (
          <section className="study-card-block cu-orientation" aria-label="Antes de empezar">
            <p className="study-part">Antes de empezar</p>
            <Prerequisites
              prerequisites={view.contract.prerequisites}
              prior={view.contract.prior}
            />
            <h2>Modelo mental</h2>
            <pre className="cu-orientation__model">{view.contract.model}</pre>
            <p className="cu-orientation__note">
              Es un esquema para entender la idea, no una ejecución de Oracle.
            </p>
          </section>
        )}
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

      {view.contract && view.contract.tables.length > 0 && (
        <section
          className="study-card-block cu-lesson__data"
          id="datos"
          aria-labelledby="data-title"
        >
          <p className="study-part">Con qué datos trabajamos</p>
          <h2 id="data-title" className="visually-hidden">
            Tablas de esta lección
          </h2>
          <TopicTables tables={view.contract.tables} />
        </section>
      )}

      <section className="study-syntax-block" id="sintaxis" aria-labelledby="syntax-title">
        <p className="study-part">Sintaxis</p>
        <h2 id="syntax-title" className="visually-hidden">
          Sintaxis
        </h2>
        <CodeView code={view.syntax} label="Forma general" />
        {view.contract && (
          <SyntaxParts parts={view.contract.parts} reading={view.contract.reading} />
        )}
        {view.contract && <TopicPreviews previews={view.contract.previews} />}
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
            {index === 0 || (index === 1 && view.examples[0]?.example.id.endsWith('-MICRO')) ? (
              <ExampleBlock entry={entry} />
            ) : (
              <details className="study-fold cu-additional-example">
                <summary>{entry.question}</summary>
                <ExampleBlock entry={entry} />
              </details>
            )}
          </div>
        ))}
      </section>

      <section className="study-changes cu-changes" aria-labelledby="changes-title">
        <ChangeColumns
          changed={view.changed}
          unchanged={view.contract?.unchanged ?? []}
          headingId="changes-title"
        />
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
    <ResourceSearchItem
      text={`${concept.term} ${concept.category} ${concept.definition} ${concept.purpose} ${concept.syntax} ${concept.mistake.title} ${concept.mistake.why}`}
    >
      <SpotlightCard className="cu-resource">
        <article aria-labelledby={`concept-${concept.id}`}>
          <p className="cu-resource__category">{concept.category}</p>
          <h3 id={`concept-${concept.id}`} className="cu-resource__term">
            {concept.term}
          </h3>
          <dl className="cu-resource__facts" data-resource-kind="concept">
            <div>
              <dt>Qué es</dt>
              <dd>{concept.definition}</dd>
            </div>
            <div>
              <dt>Para qué sirve</dt>
              <dd>{concept.purpose}</dd>
            </div>
          </dl>
          <div data-resource-kind="syntax">
            <CodeView code={concept.syntax} label="Sintaxis" />
          </div>
          <details className="study-fold cu-resource__example" data-resource-kind="example">
            <summary>
              <span className="study-part">Mini ejemplo</span> verificado en Oracle
            </summary>
            <CodeView code={concept.example.code} label="Ejemplo" />
            <ExampleOutcome example={concept.example} size="compact" />
          </details>
          <div className="cu-resource__mistake" data-resource-kind="error">
            <p>
              <strong>Error frecuente:</strong> {concept.mistake.title}. {concept.mistake.why}
            </p>
          </div>
          <p className="cu-resource__key" data-resource-kind="guide">
            <strong>Idea clave:</strong> {concept.keyIdea}
          </p>
          <p className="cu-resource__links">
            {concept.lesson && (
              <span data-resource-kind="guide">
                <Link href={concept.lesson.href as Route} prefetch={false}>
                  Lección: {concept.lesson.title}
                </Link>
              </span>
            )}
            <a
              data-resource-kind="reference"
              href={concept.reference.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {concept.reference.document} · «{concept.reference.topic}»
              <span className="visually-hidden"> (abre en otra pestaña)</span>
            </a>
          </p>
        </article>
      </SpotlightCard>
    </ResourceSearchItem>
  );
}

export function ResourceBlocks({ blocks }: { readonly blocks: readonly ResourceBlockView[] }) {
  return (
    <ResourceExplorer>
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
        {blocks.map((block, index) => (
          <section
            key={block.id}
            id={`recursos-${block.id}`}
            className="cu-resources__block"
            aria-labelledby={`recursos-${block.id}-title`}
          >
            <h2 id={`recursos-${block.id}-title`}>
              {block.number}. {block.title}
            </h2>
            <ResourceSearchBlock
              defaultOpen={index === 0}
              label={`Consultar ${block.concepts.length} fichas · ${block.title}`}
            >
              <div className="cu-resources__grid">
                {block.concepts.map((concept) => (
                  <ConceptCard key={concept.id} concept={concept} />
                ))}
              </div>
            </ResourceSearchBlock>
          </section>
        ))}
      </div>
    </ResourceExplorer>
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
          <ol className="study-path" aria-label={`Lecciones del bloque ${block.title}`}>
            {block.lessons.map((lesson, index) => (
              <li key={lesson.id} className={index === 0 ? 'study-path__first' : undefined}>
                {index === 0 ? (
                  <header className="study-block__header">
                    <span className="study-block__letter" aria-hidden="true">
                      {letter}
                    </span>
                    <div>
                      <h2 id={`bloque-${block.id}`}>
                        <span className="visually-hidden">Bloque {letter}: </span>
                        {block.title}
                      </h2>
                      <p>
                        {block.summary} Resultados obtenidos al ejecutar cada consulta en Oracle.
                      </p>
                    </div>
                  </header>
                ) : (
                  <p className="study-block__label" aria-hidden="true">
                    <span className="study-block__letter">{letter}</span> {block.title}
                  </p>
                )}
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
