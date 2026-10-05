import type { ExampleView } from '../application/curriculum-api';
import { codePrerequisites } from '../application/learning-feedback';

/** Vocabulary comes before composite code, including the objects used by its setup. */
export function ExamplePrimer({
  example,
  compact = false,
}: {
  readonly example: ExampleView;
  readonly compact?: boolean;
}) {
  if (example.code.split('\n').length <= 8 && example.setup.length === 0) return null;
  const parts = codePrerequisites([...example.setup, example.code].join('\n'));
  if (parts.length === 0) return null;
  return (
    <details className="study-fold cu-example-primer" open={!compact}>
      <summary>Antes de leer este ejemplo: vocabulario necesario</summary>
      <dl>
        {parts.map((part) => (
          <div key={part.term}>
            <dt>{part.term}</dt>
            <dd>{part.definition}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
