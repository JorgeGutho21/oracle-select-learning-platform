import type { CSSProperties } from 'react';

/**
 * Adapted from Cult UI HaloProgress, MIT, Jordan-Gilliam (2023).
 * Uses its clamped transform fill with DB LAB tokens and native ARIA semantics.
 * Base UI/Motion, blur, perpetual glow and indeterminate decoration are omitted.
 * Provenance and full license: THIRD_PARTY_NOTICES.md / UI_COMPONENT_REGISTRY.md.
 */
export interface HaloProgressProps {
  readonly label: string;
  readonly value: number;
  readonly max?: number;
}

export function HaloProgress({ label, value, max = 100 }: HaloProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const ratio = Math.min(1, Math.max(0, safeValue / safeMax));
  const percent = Math.round(ratio * 100);
  const style = { '--progress-ratio': ratio } as CSSProperties;
  return (
    <div className="ds-progress ds-progress--halo" data-ui-source="cult-ui">
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
