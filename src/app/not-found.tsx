import { FeaturePlaceholder } from '@/presentation/components/feature-placeholder';

export default function NotFound() {
  return (
    <FeaturePlaceholder
      title="Página no encontrada"
      description="Esta dirección no corresponde a una página disponible."
      emptyTitle="Vuelve a un lugar conocido"
      emptyDescription="Desde el inicio puedes acceder a todas las rutas de la plataforma."
      section="Navegación"
    />
  );
}
