import type { ReactNode } from 'react';

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  children?: ReactNode;
  live?: boolean;
}

const icons = { info: 'i', success: '✓', warning: '!', danger: '!' } as const;

export function Alert({ tone = 'info', title, children, live = false }: AlertProps) {
  return (
    <div
      className={`ds-alert ds-alert--${tone}`}
      role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}
    >
      <span className="ds-alert__icon" aria-hidden="true">
        {icons[tone]}
      </span>
      <div className="ds-alert__body">
        <strong>{title}</strong>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
