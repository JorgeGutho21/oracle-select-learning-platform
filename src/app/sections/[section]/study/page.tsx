import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { LessonStatus, StudySummary } from '@/composition/curriculum/curriculum-client';
import {
  curriculumIndex,
  datasetDictionary,
} from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import {
  CurriculumIndex,
  DatasetDictionary,
  ModeHeader,
} from '@/features/curriculum/presentation/curriculum-pages';
import { getSection } from '@/features/sections/application/sections-api';

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.map(({ section }) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<'/sections/[section]/study'>): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section ? `Estudiar · ${section.title}` : 'Sección no encontrada' };
}

export default async function Page({ params }: PageProps<'/sections/[section]/study'>) {
  const id = (await params).section;
  if (id === 'fundamentos-sql') redirect('/learn');
  const section = getSection(id);
  const index = section ? curriculumIndex(section.id) : null;
  if (!section || !index) notFound();
  const lessons = index.blocks.flatMap((block) => block.lessons);
  return (
    <div className="study-shell cu-shell">
      <ModeHeader
        section={{ id: section.id, number: section.number, title: section.title }}
        mode="study"
        title="Temario de la sección"
        lead={`${index.lessonCount} lecciones en ${index.blocks.length} bloques. Cada una muestra las tablas originales, el código, qué hace y el resultado verificado en Oracle.`}
        aside={
          <StudySummary
            section={section.id}
            lessons={lessons.map(({ id: lessonId, version }) => ({ id: lessonId, version }))}
          />
        }
      />
      <div className="site-container cu-page">
        <CurriculumIndex
          index={index}
          status={(lessonId) => {
            const lesson = lessons.find((entry) => entry.id === lessonId)!;
            return (
              <LessonStatus section={section.id} lessonId={lessonId} version={lesson.version} />
            );
          }}
        />
        <DatasetDictionary
          tables={datasetDictionary()}
          scriptHref="/datasets/dblab-empresa-v1.sql"
        />
      </div>
    </div>
  );
}
