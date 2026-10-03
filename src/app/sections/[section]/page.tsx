import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContinueLearningLink } from '@/composition/sections/learning-progress-root';
import {
  getSection,
  SECTION_IDS,
  SECTION_LIST,
  sectionNeighbors,
} from '@/features/sections/application/sections-api';
import { SectionDetail } from '@/features/sections/presentation/section-detail';
import { sectionProgress } from '@/composition/sections/progress-slots';

// Solo existen las tres secciones del registro: cualquier otra dirección es un 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const section = getSection((await params).section);
  if (!section) return { title: 'Sección no encontrada' };
  return {
    title: `${section.title} · ${section.kicker}`,
    description: section.summary,
  };
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const section = getSection((await params).section);
  if (!section) notFound();
  const { previous, next } = sectionNeighbors(section.id);
  return (
    <SectionDetail
      section={section}
      sections={SECTION_LIST}
      previous={previous}
      next={next}
      progress={section.status === 'available' ? sectionProgress(section) : undefined}
      primaryAction={
        section.status === 'available' ? (
          <ContinueLearningLink className="hero-action hero-action--primary">
            Continuar con {section.title} <span aria-hidden="true">→</span>
          </ContinueLearningLink>
        ) : undefined
      }
    />
  );
}
