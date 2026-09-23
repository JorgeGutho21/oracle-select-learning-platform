export interface LoadingStateProps {
  label?: string;
  variant?: 'spinner' | 'skeleton';
  lines?: number;
}

export function LoadingState({
  label = 'Cargando…',
  variant = 'spinner',
  lines = 3,
}: LoadingStateProps) {
  const count = Number.isFinite(lines) ? Math.min(6, Math.max(1, Math.round(lines))) : 3;
  return (
    <div className={`ds-loading ds-loading--${variant}`} role="status">
      {variant === 'spinner' ? (
        <span className="ds-spinner" aria-hidden="true" />
      ) : (
        <div className="ds-skeleton" aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <span key={index} className="ds-skeleton__line" />
          ))}
        </div>
      )}
      <span>{label}</span>
    </div>
  );
}
