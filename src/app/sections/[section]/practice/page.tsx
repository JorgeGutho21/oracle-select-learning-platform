import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PracticeRoot } from '@/composition/curriculum/curriculum-client';
import { practiceBlocks, verification } from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import { ModeHeader } from '@/features/curriculum/presentation/curriculum-pages';
import { VerifiedNote } from '@/features/curriculum/presentation/example-parts';
import { getSection } from '@/features/sections/application/sections-api';

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.map(({ section }) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<'/sections/[section]/practice'>): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section ? `Practicar · ${section.title}` : 'Sección no encontrada' };
}

export default async function Page({ params }: PageProps<'/sections/[section]/practice'>) {
  const id = (await params).section;
  if (id === 'fundamentos-sql') redirect('/lab');
  const section = getSection(id);
  const blocks = section ? practiceBlocks(section.id) : [];
  if (!section || blocks.length === 0) notFound();
  return (
    <div className="study-shell cu-shell">
      <ModeHeader
        section={{ id: section.id, number: section.number, title: section.title }}
        mode="practice"
        title="Prácticas guiadas"
        lead="Completa, predice, corrige y construye. Cada intento fallido explica qué error representa tu respuesta; las pistas llegan de a una y la respuesta solo al final."
      />
      <div className="site-container cu-page">
        <VerifiedNote verification={verification()} />
        <p className="cu-oracle-pending">
          <strong>Ejecución real en Oracle:</strong> en estas prácticas no escribes SQL libre que se
          ejecute en el servidor. Los resultados que ves son los que Oracle devolvió al verificar el
          contenido. Para ejecutar tus propias consultas, carga el dataset en tu esquema de Oracle
          (Estudiar → «Datos de la sección»).
        </p>
        <PracticeRoot section={section.id} blocks={blocks} />
      </div>
    </div>
  );
}
