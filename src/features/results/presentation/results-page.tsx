import { FeaturePlaceholder } from '@/presentation/components/feature-placeholder';

export function ResultsPage() {
  return (
    <FeaturePlaceholder
      title="Resultados"
      description="Un espacio para revisar tu práctica."
      emptyTitle="Sin resultados"
      emptyDescription="Todavía no hay actividad registrada para mostrar."
      section="Revisar"
    />
  );
}
