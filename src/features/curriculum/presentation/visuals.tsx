import type {
  CellValue,
  ChipState,
  ExampleView,
  GroupVisualView,
  JoinChip,
  JoinKind,
  JoinVisualView,
  PipelineStageView,
  TableView,
} from '../application/curriculum-api';
import { CodeView, CurriculumTable, ExampleOutcome, tableSummary } from './example-parts';
import { formatCell } from '@/presentation/components/data/cell-format';

/**
 * Visualizaciones didácticas del currículo. Son estáticas y accesibles: el estado de cada
 * fila se dice con texto y símbolo (✓, ∅, ✗), no solo con color, y no dependen de
 * animaciones. `density="stage"` es la variante compacta para proyectar.
 */

type Density = 'study' | 'stage';

const JOIN_TITLE: Readonly<Record<JoinKind, string>> = {
  inner: 'INNER JOIN: solo las parejas',
  left: 'LEFT JOIN: todas las filas de la izquierda',
  right: 'RIGHT JOIN: todas las filas de la derecha',
  full: 'FULL JOIN: parejas y sobrantes de los dos lados',
};

const CHIP_STATE: Readonly<Record<ChipState, { readonly symbol: string; readonly text: string }>> =
  {
    matched: { symbol: '✓', text: 'con pareja' },
    'kept-null': { symbol: '∅', text: 'sin pareja: se conserva con NULL' },
    discarded: { symbol: '✗', text: 'sin pareja: no aparece' },
  };

function keyText(value: CellValue): string {
  return value === null ? 'NULL' : formatCell(value);
}

function Chip({ chip }: { readonly chip: JoinChip }) {
  const state = CHIP_STATE[chip.state];
  return (
    <li className={`join-chip join-chip--${chip.state}`}>
      <span className="join-chip__symbol" aria-hidden="true">
        {state.symbol}
      </span>
      <span className="join-chip__label">{chip.label}</span>
      <span className="join-chip__key">{keyText(chip.key)}</span>
      <span className="visually-hidden">
        , {state.text}
        {chip.partners.length > 0 ? ` (${chip.partners.join(', ')})` : ''}
      </span>
      {chip.partners.length > 0 && (
        <span className="join-chip__partners" aria-hidden="true">
          → {chip.partners.join(', ')}
        </span>
      )}
    </li>
  );
}

export function JoinVisual({
  visual,
  density = 'study',
}: {
  readonly visual: JoinVisualView;
  readonly density?: Density;
}) {
  const side = (part: JoinVisualView['left'], name: string) => (
    <div className="join-visual__side">
      <p className="join-visual__table">
        <strong>{part.table}</strong> <span>{name}</span> · clave <code>{part.key}</code>
      </p>
      <ul className="join-visual__chips" aria-label={`Filas de ${part.table} (${name})`}>
        {part.chips.map((chip, index) => (
          <Chip key={`${chip.label}-${index}`} chip={chip} />
        ))}
      </ul>
    </div>
  );
  return (
    <figure className={`join-visual join-visual--${visual.join} join-visual--${density}`}>
      <figcaption className="join-visual__title">{JOIN_TITLE[visual.join]}</figcaption>
      <div className="join-visual__grid">
        {side(visual.left, 'izquierda')}
        <div className="join-visual__condition">
          <span className="join-visual__on">ON</span>
          <code>{visual.condition}</code>
          <span className="join-visual__pairs">
            {visual.pairs} {visual.pairs === 1 ? 'pareja' : 'parejas'}
          </span>
        </div>
        {side(visual.right, 'derecha')}
      </div>
      <ul className="join-visual__legend" aria-label="Leyenda">
        {(['matched', 'kept-null', 'discarded'] as const).map((state) => (
          <li key={state} className={`join-chip join-chip--${state} join-chip--legend`}>
            <span className="join-chip__symbol" aria-hidden="true">
              {CHIP_STATE[state].symbol}
            </span>
            {CHIP_STATE[state].text}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function GroupVisual({
  visual,
  density = 'study',
}: {
  readonly visual: GroupVisualView;
  readonly density?: Density;
}) {
  const single = visual.by.length === 0;
  return (
    <figure className={`group-visual group-visual--${density}`}>
      <figcaption className="group-visual__title">
        {single
          ? `Sin GROUP BY: las ${visual.rows} filas forman un solo grupo`
          : `GROUP BY ${visual.by.join(', ')}: ${visual.rows} filas → ${visual.groups.length} grupos`}
      </figcaption>
      <ol className="group-visual__groups">
        {visual.groups.map((group) => (
          <li key={JSON.stringify(group.key)} className="group-box">
            <p className="group-box__key">
              {single
                ? 'Todas las filas'
                : visual.by.map((column, index) => (
                    <span key={column}>
                      {column} = <strong>{keyText(group.key[index] ?? null)}</strong>
                    </span>
                  ))}
            </p>
            <ul className="group-box__members" aria-label="Filas del grupo">
              {group.members.map((member, index) => (
                <li key={`${member}-${index}`}>{member}</li>
              ))}
            </ul>
            <p className="group-box__count">
              {group.members.length} {group.members.length === 1 ? 'fila' : 'filas'}
            </p>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function stageCount(example: ExampleView): string {
  if (example.error) return example.error.code;
  return example.result ? tableSummary(example.result) : '';
}

export function PipelineVisual({
  stages,
  density = 'study',
}: {
  readonly stages: readonly PipelineStageView[];
  readonly density?: Density;
}) {
  return (
    <ol
      className={`pipeline-visual pipeline-visual--${density}`}
      aria-label="Etapas de la consulta"
    >
      {stages.map((stage, index) => (
        <li key={stage.label} className="pipeline-visual__stage">
          <p className="pipeline-visual__label">
            <span className="pipeline-visual__number" aria-hidden="true">
              {index + 1}
            </span>
            {stage.label}
          </p>
          <p className="pipeline-visual__count">{stageCount(stage.example)}</p>
          {density === 'study' && (
            <details className="study-fold pipeline-visual__details">
              <summary>Ver la consulta y el resultado de esta etapa</summary>
              <CodeView code={stage.example.code} label="Consulta de la etapa" />
              <ExampleOutcome example={stage.example} size="compact" />
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

export function CompareVisual({
  first,
  second,
  labels,
  density = 'study',
}: {
  readonly first: ExampleView;
  readonly second: ExampleView;
  readonly labels: readonly [string, string];
  readonly density?: Density;
}) {
  const column = (example: ExampleView, label: string) => (
    <article className="compare-visual__column">
      <h4 className="compare-visual__label">{label}</h4>
      <CodeView code={example.code} label={label} />
      <ExampleOutcome example={example} size="compact" />
    </article>
  );
  return (
    <div className={`compare-visual compare-visual--${density}`}>
      {column(first, labels[0])}
      {column(second, labels[1])}
    </div>
  );
}

/** Tablas de origen de un ejemplo de consulta. */
export function SourceTables({
  tables,
  size = 'regular',
}: {
  readonly tables: readonly TableView[];
  readonly size?: 'regular' | 'compact';
}) {
  return (
    <div className={`cu-sources${tables.length > 1 ? ' cu-sources--many' : ''}`}>
      {tables.map((table) => (
        <CurriculumTable
          key={table.title}
          table={table}
          label={tables.length > 1 ? `Tabla original: ${table.title}` : 'Tabla original'}
          caption={table.title}
          size={size}
        />
      ))}
    </div>
  );
}
