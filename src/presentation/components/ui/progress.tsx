import { HaloProgress } from './halo-progress';

export interface ProgressProps {
  label: string;
  value: number;
  max?: number;
}

export function Progress({ label, value, max = 100 }: ProgressProps) {
  return <HaloProgress label={label} value={value} max={max} />;
}
