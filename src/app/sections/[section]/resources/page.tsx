import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { resourceBlocks } from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import { ModeHeader, ResourceBlocks } from '@/features/curriculum/presentation/curriculum-pages';
import { getSection } from '@/features/sections/application/sections-api';

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.map(({ section }) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<'/sections/[section]/resources'>): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section ? `Recursos · ${section.title}` : 'Sección no encontrada' };
}

export default async function Page({ params }: PageProps<'/sections/[section]/resources'>) {
  const id = (await params).section;
  if (id === 'fundamentos-sql') redirect('/resources');
  const section = getSection(id);
  const blocks = section ? resourceBlocks(section.id) : [];
  if (!section || blocks.length === 0) notFound();
  return (
    <div className="study-shell cu-shell">
      <ModeHeader
        section={{ id: section.id, number: section.number, title: section.title }}
        mode="resources"
        title="Referencia de la sección"
        lead="Cada ficha resume qué es, para qué sirve, la sintaxis, un mini ejemplo verificado en Oracle y el error más frecuente."
      />
      <div className="site-container cu-page">
        <ResourceBlocks blocks={blocks} />
      </div>
    </div>
  );
}
