import { FeaturePlaceholder } from '@/presentation/components/feature-placeholder';

export function LaboratoryPage() {
  return (
    <FeaturePlaceholder
      title="Laboratorio SQL"
      description="El espacio para escribir y comprobar consultas en Oracle."
      emptyTitle="Servicio no disponible"
      emptyDescription="El laboratorio todavía no está conectado a Oracle. No se ejecutan consultas ni se muestran resultados simulados."
      section="Practicar"
    />
  );
}
