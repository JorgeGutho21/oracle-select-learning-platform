import type { HTMLAttributes } from 'react';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan';
}

export function Chip({ tone = 'neutral', className = '', children, ...props }: ChipProps) {
  return (
    <span {...props} className={`ds-chip ds-chip--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}
