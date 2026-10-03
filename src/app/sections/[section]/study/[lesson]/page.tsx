import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonCheck, LessonVisit } from '@/composition/curriculum/curriculum-client';
import {
  lessonPage,
  lessonSlugs,
  verification,
} from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import { LessonArticle, ModeTabs } from '@/features/curriculum/presentation/curriculum-pages';
import { getSection } from '@/features/sections/application/sections-api';

export const dynamicParams = false;

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.flatMap(({ section }) =>
    lessonSlugs(section).map((lesson) => ({ section, lesson })),
  );
}

type Props = PageProps<'/sections/[section]/study/[lesson]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, lesson } = await params;
  const sectionDto = getSection(section);
  const view = sectionDto ? lessonPage(sectionDto.id, lesson) : null;
  return {
    title: view ? `${view.lesson.shortTitle} · ${sectionDto!.title}` : 'Lección no encontrada',
    ...(view ? { description: view.lesson.summary } : {}),
  };
}

export default async function Page({ params }: Props) {
  const { section: sectionId, lesson } = await params;
  const section = getSection(sectionId);
  const view = section ? lessonPage(section.id, lesson) : null;
  if (!section || !view) notFound();
  return (
    <div className="study-shell cu-shell">
      <div className="site-container cu-page cu-page--lesson">
        <ModeTabs section={section.id} current="study" />
        <LessonArticle
          view={view}
          verification={verification()}
          tracker={
            <LessonVisit
              section={section.id}
              lessonId={view.lesson.id}
              version={view.lesson.version}
            />
          }
          check={
            <LessonCheck
              section={section.id}
              lessonId={view.lesson.id}
              version={view.lesson.version}
              activity={view.check}
            />
          }
        />
      </div>
    </div>
  );
}
