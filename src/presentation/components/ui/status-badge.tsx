import type { ReactNode } from 'react';

export type StatusBadgeTone = 'available' | 'coming-soon' | 'planned' | 'info';

export interface StatusBadgeProps {
  readonly tone: StatusBadgeTone;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Forma propia por estado: el color nunca es la única pista. */
function StatusIcon({ tone }: { readonly tone: StatusBadgeTone }) {
  if (tone === 'available') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (tone === 'coming-soon') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (tone === 'planned') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray="3 2"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7v4.5M8 4.5v.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function StatusBadge({ tone, children, className = '' }: StatusBadgeProps) {
  return (
    <span className={`ds-status ds-status--${tone} ${className}`.trim()}>
      <StatusIcon tone={tone} />
      <span>{children}</span>
    </span>
  );
}
