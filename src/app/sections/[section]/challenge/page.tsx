import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ChallengeRoot } from '@/composition/curriculum/curriculum-client';
import { missionViews } from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import { ModeHeader } from '@/features/curriculum/presentation/curriculum-pages';
import { getSection } from '@/features/sections/application/sections-api';

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.map(({ section }) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<'/sections/[section]/challenge'>): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section ? `Challenge · ${section.title}` : 'Sección no encontrada' };
}

export default async function Page({ params }: PageProps<'/sections/[section]/challenge'>) {
  const id = (await params).section;
  if (id === 'fundamentos-sql') redirect('/challenge');
  const section = getSection(id);
  const missions = section ? missionViews(section.id) : [];
  if (!section || missions.length === 0) notFound();
  return (
    <div className="study-shell cu-shell">
      <ModeHeader
        section={{ id: section.id, number: section.number, title: section.title }}
        mode="challenge"
        title={`Challenge de la Sección ${section.number}`}
        lead="Diez misiones de dificultad creciente. Cada una plantea un caso y pide razonar: no basta con recordar la sintaxis."
      />
      <div className="site-container cu-page">
        <ChallengeRoot section={section.id} missions={missions} />
      </div>
    </div>
  );
}
