import type { ReactNode } from 'react';

/**
 * Magic UI CodeComparison adaptation (MIT, © Magic UI).
 * Two labelled panels use DB LAB's server-rendered SQL and verified outcomes.
 * No Shiki, theme provider, HTML injection or additional client runtime.
 */
export function CodeComparison({
  before,
  after,
  label,
  className = '',
}: {
  readonly className?: string;
  readonly before: ReactNode;
  readonly after: ReactNode;
  readonly label: string;
}) {
  return (
    <div
      className={`db-code-comparison compare-visual ${className}`}
      role="group"
      aria-label={label}
      data-ui-source="magic-ui"
    >
      {before}
      {after}
    </div>
  );
}
