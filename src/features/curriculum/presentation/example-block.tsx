import type { ExampleView, LessonExampleView, VisualView } from '../application/curriculum-api';
import {
  CodeView,
  CurriculumTable,
  ExampleOutcome,
  NumberedCode,
  OutputConsole,
  OracleError,
  tableSummary,
} from './example-parts';
import { ExecutionStepper } from './execution-stepper';
import { CompareVisual, GroupVisual, JoinVisual, PipelineVisual, SourceTables } from './visuals';

/**
 * Un ejemplo completo con el patrón de DB LAB: ANTES (tablas o estado inicial) → CÓDIGO →
 * QUÉ HACE (visualización) → DESPUÉS (resultado, salida o error de Oracle). Para SQL:
 * tabla original → consulta → resultado. Para JOIN: tabla A + tabla B → condición →
 * resultado. Para PL/SQL: estado inicial → bloque → recorrido → salida y estado final.
 */

type Density = 'study' | 'stage';

function Sources({ example, open }: { readonly example: ExampleView; readonly open: boolean }) {
  if (example.sources.length === 0) return null;
  if (open) return <SourceTables tables={example.sources} />;
  return (
    <details className="study-fold cu-sources-fold">
      <summary>
        <span className="study-part">Tablas originales</span>{' '}
        {example.sources.map((table) => `${table.title} (${tableSummary(table)})`).join(' · ')}
      </summary>
      <SourceTables tables={example.sources} />
    </details>
  );
}

function SourcesLine({ example }: { readonly example: ExampleView }) {
  if (example.sources.length === 0) return null;
  return (
    <p className="cu-sources-line">
      <span className="study-part">Antes</span>{' '}
      {example.sources.map((table) => `${table.title}: ${tableSummary(table)}`).join(' · ')}
    </p>
  );
}

function QueryExample({
  example,
  visual,
  density,
}: {
  readonly example: ExampleView;
  readonly visual: VisualView;
  readonly density: Density;
}) {
  const stage = density === 'stage';
  const size = stage ? 'compact' : 'regular';
  if (visual.kind === 'compare') {
    return (
      <>
        {stage ? <SourcesLine example={example} /> : <Sources example={example} open={false} />}
        <CompareVisual
          first={example}
          second={visual.other}
          labels={visual.labels}
          density={density}
        />
      </>
    );
  }
  const code = <CodeView code={example.code} label="Consulta" size={stage ? 'large' : 'regular'} />;
  return (
    <>
      {visual.kind === 'join' ? (
        <>
          <JoinVisual visual={visual} density={density} />
          {!stage && <Sources example={example} open={false} />}
        </>
      ) : visual.kind === 'group' ? (
        <>
          {!stage && <Sources example={example} open={false} />}
          {code}
          <GroupVisual visual={visual} density={density} />
        </>
      ) : stage ? (
        <SourcesLine example={example} />
      ) : (
        <Sources example={example} open={!example.error} />
      )}
      {visual.kind !== 'group' && code}
      {visual.kind === 'pipeline' && <PipelineVisual stages={visual.stages} density={density} />}
      <ExampleOutcome example={example} size={size} />
    </>
  );
}

function PlsqlExample({
  example,
  visual,
  density,
}: {
  readonly example: ExampleView;
  readonly visual: VisualView;
  readonly density: Density;
}) {
  const stage = density === 'stage';
  const cursor = visual.kind === 'cursor' ? visual.query.result : null;
  return (
    <>
      {visual.kind === 'trigger' && (
        <ol className="trigger-visual" aria-label="Qué dispara el trigger">
          <li className="trigger-visual__step">
            <span className="trigger-visual__label">Evento</span>
            <strong>{visual.event}</strong>
          </li>
          <li className="trigger-visual__step">
            <span className="trigger-visual__label">Momento</span>
            <strong>{visual.timing}</strong>
          </li>
          <li className="trigger-visual__step">
            <span className="trigger-visual__label">Acción</span>
            <strong>el cuerpo del trigger</strong>
          </li>
        </ol>
      )}
      {example.setup.map((code, index) => (
        <CodeView
          key={index}
          code={code}
          label={example.setup.length > 1 ? `Antes se crea (${index + 1})` : 'Antes se crea'}
        />
      ))}
      {!stage &&
        example.before.map((table, index) => (
          <CurriculumTable
            key={`before-${index}`}
            table={table}
            label={`Antes: ${table.title}`}
            caption={`${table.title} antes de ejecutar`}
            size="compact"
          />
        ))}
      {example.trace.length > 0 ? (
        <ExecutionStepper
          code={example.code}
          trace={example.trace}
          cursor={cursor}
          density={density}
        />
      ) : (
        <NumberedCode
          code={example.code}
          label={
            /^\s*(?:INSERT|UPDATE|DELETE)\b/i.test(example.code) ? 'Sentencia' : 'Código PL/SQL'
          }
        />
      )}
      {example.trace.length === 0 && example.output.length > 0 && (
        <OutputConsole lines={example.output} />
      )}
      {example.trace.length > 0 && !stage && example.output.length > 0 && (
        <details className="study-fold">
          <summary>
            <span className="study-part">Salida completa</span> de DBMS_OUTPUT en Oracle
          </summary>
          <OutputConsole lines={example.output} />
        </details>
      )}
      {example.error && <OracleError error={example.error} />}
      {example.after.map((table, index) => (
        <CurriculumTable
          key={`after-${index}`}
          table={table}
          label={`Después: ${table.title}`}
          caption={`${table.title} después de ejecutar`}
          size="compact"
        />
      ))}
    </>
  );
}

export function ExampleBlock({
  entry,
  density = 'study',
  headingLevel = 3,
}: {
  readonly entry: LessonExampleView;
  readonly density?: Density;
  readonly headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={`cu-example cu-example--${density}`}>
      {density === 'study' && <Heading className="cu-example__question">{entry.question}</Heading>}
      {entry.example.kind === 'query' ? (
        <QueryExample example={entry.example} visual={entry.visual} density={density} />
      ) : (
        <PlsqlExample example={entry.example} visual={entry.visual} density={density} />
      )}
      {density === 'study' && (
        <p className="cu-example__reading">
          <span className="study-part">Qué hace</span> {entry.reading}
        </p>
      )}
    </div>
  );
}
