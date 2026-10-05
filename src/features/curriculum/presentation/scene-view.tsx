import type { ReactNode } from 'react';
import type { LessonExampleView, SceneView } from '../application/curriculum-api';
import { ActivityPlayer } from './activity-player';
import {
  CodeView,
  CurriculumTable,
  SetupFold,
  ExampleOutcome,
  NumberedCode,
  OracleError,
  OutputConsole,
  tableSummary,
} from './example-parts';
import { ExecutionStepper } from './execution-stepper';
import { ExamplePrimer } from './example-primer';
import { CompareVisual, GroupVisual, JoinVisual, PipelineVisual } from './visuals';
import { Reveal } from '@/features/presentation/presentation/scene-step';

/**
 * Escenas de clase de las secciones de la fuente curricular, con la plantilla del Modo
 * Exposición: número, bloque, título, contenido e idea clave. Una escena de lección proyecta
 * el ejemplo de su lección en tres pasos: CÓDIGO → QUÉ HACE (visualización) → RESULTADO.
 */

function Frame({
  scene,
  tone = 'light',
  layout = 'concept',
  children,
}: {
  readonly scene: SceneView;
  readonly tone?: 'light' | 'night';
  readonly layout?: string;
  readonly children: ReactNode;
}) {
  return (
    <article
      className={`scene scene--${tone} scene--${layout} cu-scene cu-scene--${scene.kind}${scene.intent ? ` cu-scene--${scene.intent}` : ''}`}
      aria-labelledby={`scene-title-${scene.number}`}
      data-scene={scene.number}
      data-scene-id={scene.id}
    >
      <header className="scene__header">
        <span className="scene__number" aria-hidden="true">
          {String(scene.number).padStart(2, '0')}
        </span>
        <div className="scene__heading">
          <p className="scene__eyebrow">{scene.block.title}</p>
          <h1 id={`scene-title-${scene.number}`} className="scene__title" tabIndex={-1}>
            {scene.title}
          </h1>
        </div>
      </header>
      <div className="scene__main">{children}</div>
      {scene.keyIdea && (
        <Reveal at={scene.steps}>
          <p className="scene-takeaway">
            <span className="scene-takeaway__label">Idea clave</span> <span>{scene.keyIdea}</span>
          </p>
        </Reveal>
      )}
    </article>
  );
}

function sourcesLine(entry: LessonExampleView): string {
  return entry.example.sources.map((table) => `${table.title}: ${tableSummary(table)}`).join(' · ');
}

function LessonScene({ entry }: { readonly entry: LessonExampleView }) {
  const { example, visual } = entry;
  if (example.kind === 'plsql') {
    const cursor = visual.kind === 'cursor' ? visual.query.result : null;
    return (
      <div
        className={`cu-stage cu-stage--plsql${example.trace.length > 0 ? ' cu-stage--trace' : ''}`}
      >
        <Reveal at={1} className="cu-stage__code">
          <p className="cu-stage__question">{entry.question}</p>
          <p className="cu-stage__reading">{entry.reading}</p>
          <ExamplePrimer example={example} compact />
          <SetupFold setup={example.setup} />
        </Reveal>
        <Reveal at={2} className="cu-stage__visual">
          {example.trace.length > 0 ? (
            <ExecutionStepper
              code={example.code}
              trace={example.trace}
              cursor={cursor}
              density="stage"
            />
          ) : (
            <NumberedCode code={example.code} label="Código" />
          )}
        </Reveal>
        <Reveal at={3} className="cu-stage__result">
          {example.trace.length === 0 && example.output.length > 0 && (
            <OutputConsole lines={example.output} />
          )}
          {example.error && <OracleError error={example.error} />}
          {example.after.map((table, index) => (
            <CurriculumTable
              key={index}
              table={table}
              label={`Después: ${table.title}`}
              caption={`${table.title} después de ejecutar`}
              size="compact"
            />
          ))}
        </Reveal>
      </div>
    );
  }
  return (
    <div className={`cu-stage cu-stage--${visual.kind}`}>
      <Reveal at={1} className="cu-stage__code">
        <p className="cu-stage__question">{entry.question}</p>
        {example.sources.length > 0 && (
          <p className="cu-stage__sources">
            <span className="cu-stage__label">Antes</span> {sourcesLine(entry)}
          </p>
        )}
        {visual.kind !== 'compare' && <CodeView code={example.code} label="Consulta" />}
      </Reveal>
      <Reveal at={2} className="cu-stage__visual">
        {visual.kind === 'join' && <JoinVisual visual={visual} density="stage" />}
        {visual.kind === 'group' && <GroupVisual visual={visual} density="stage" />}
        {visual.kind === 'pipeline' && <PipelineVisual stages={visual.stages} density="stage" />}
        {visual.kind === 'compare' && (
          <CompareVisual
            first={example}
            second={visual.other}
            labels={visual.labels}
            density="stage"
          />
        )}
        {visual.kind === 'transform' && (
          <>
            <p className="cu-stage__reading">{entry.reading}</p>
            <ExampleOutcome example={example} size="compact" />
          </>
        )}
      </Reveal>
      {visual.kind !== 'compare' && visual.kind !== 'transform' && (
        <Reveal at={3} className="cu-stage__result">
          <ExampleOutcome example={example} size="compact" />
        </Reveal>
      )}
    </div>
  );
}

export function CurriculumSceneView({
  scene,
  section,
}: {
  readonly scene: SceneView;
  readonly section: { readonly number: number; readonly title: string };
}) {
  switch (scene.kind) {
    case 'cover':
      return (
        <Frame scene={scene} tone="night" layout="cover">
          <div className="cu-cover">
            <p className="cu-cover__section">Sección {section.number}</p>
            <p className="cu-cover__title">{section.title}</p>
            <p className="cu-cover__lead">
              DB LAB · Plataforma interactiva de Bases de Datos con Oracle
            </p>
          </div>
        </Frame>
      );
    case 'agenda':
    case 'closing':
      return (
        <Frame scene={scene} layout="summary">
          <ol className={`cu-points cu-points--${scene.kind}`}>
            {scene.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </Frame>
      );
    case 'idea':
      return (
        <Frame scene={scene}>
          <div className="cu-idea">
            <ol className="cu-points">
              {scene.points.map((point, index) => (
                <li key={point}>
                  <Reveal at={1}>
                    <span className="cu-points__number" aria-hidden="true">
                      {index + 1}
                    </span>
                    {point}
                  </Reveal>
                </li>
              ))}
            </ol>
            {scene.code &&
              (scene.intent === 'syntax' ? (
                <CodeView code={scene.code} label="Forma general" size="large" />
              ) : (
                <pre className="cu-idea__diagram">{scene.code}</pre>
              ))}
          </div>
        </Frame>
      );
    case 'dataset':
      return (
        <Frame scene={scene}>
          <div className="cu-dataset-map">
            <p>Antes de unir tablas, identifica qué hecho guarda cada una y cómo se conecta.</p>
            <p>
              Una fila registra un hecho; una columna indica un atributo. PK identifica una fila sin
              duplicados; FK referencia una clave de otra tabla.
            </p>
            <ol className="cu-dataset-map__tables">
              {scene.tables.map((table) => (
                <li key={table.name}>
                  <h2>{table.name}</h2>
                  <p>{table.purpose}</p>
                  <p>
                    {table.rowCount} filas · PK: <code>{table.primaryKey.join(', ')}</code>
                  </p>
                  {table.foreignKeys.map((key) => (
                    <p key={key.columns}>
                      <code>{key.columns}</code> → <code>{key.references}</code>
                    </p>
                  ))}
                  <details>
                    <summary>Columnas y primeras filas de {table.name}</summary>
                    <p>Datos versionados de la empresa; no es una consulta recién ejecutada.</p>
                    <CurriculumTable
                      table={table.sample}
                      label={`Datos: ${table.name}`}
                      caption={`Primeras filas de ${table.name}`}
                      size="compact"
                    />
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </Frame>
      );
    case 'check':
      return (
        <Frame scene={scene} layout="practice">
          {scene.activity && (
            <ActivityPlayer
              activity={scene.activity}
              eyebrow="Pregunta para la clase"
              showReview={false}
            />
          )}
        </Frame>
      );
    case 'lesson':
      return (
        <Frame scene={scene} layout="transformation">
          {scene.example && <LessonScene entry={scene.example} />}
        </Frame>
      );
  }
}
