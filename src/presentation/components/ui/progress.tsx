import type { CSSProperties } from 'react';

export interface ProgressProps {
  label: string;
  value: number;
  max?: number;
}

export function Progress({ label, value, max = 100 }: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const percent = Math.round((safeValue / safeMax) * 100);
  const style = { '--progress-value': `${percent}%` } as CSSProperties;
  return (
    <div className="ds-progress">
      <div className="ds-progress__label">
        <span>{label}</span>
        <span aria-hidden="true">{percent} %</span>
      </div>
      <div
        className="ds-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percent} %`}
      >
        <span className="ds-progress__fill" style={style} />
      </div>
    </div>
  );
}
