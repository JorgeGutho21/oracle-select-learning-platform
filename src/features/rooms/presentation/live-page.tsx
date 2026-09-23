import { FeaturePlaceholder } from '@/presentation/components/feature-placeholder';

export function RoomsPage() {
  return (
    <FeaturePlaceholder
      title="Sala en vivo"
      description="El espacio para participar junto a la clase."
      emptyTitle="Las salas todavía no están disponibles"
      emptyDescription="La conexión y la inscripción se incorporarán en una fase posterior."
      section="Participar"
    />
  );
}
