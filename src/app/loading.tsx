import { LoadingState } from '@/presentation/components/ui/loading-state';

export default function Loading() {
  return (
    <div className="site-container feature-page">
      <LoadingState label="Cargando vista" variant="skeleton" />
    </div>
  );
}
