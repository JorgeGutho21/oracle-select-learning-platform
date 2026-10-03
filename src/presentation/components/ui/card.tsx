import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'white' | 'soft' | 'primary' | 'night';
}

export function Card({ tone = 'white', className = '', children, ...props }: CardProps) {
  return (
    <div {...props} className={`ds-card ds-card--${tone} ${className}`.trim()}>
      {children}
    </div>
  );
}
