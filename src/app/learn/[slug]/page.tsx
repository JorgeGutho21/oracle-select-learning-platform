import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudyRoot } from '@/composition/study/study-root';
import { getLesson, LESSONS } from '@/features/study/application/study-api';
export function generateStaticParams() {
  return LESSONS.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const lesson = getLesson((await params).slug);
  return { title: lesson ? `${lesson.shortTitle} · Modo Estudio` : 'Lección no encontrada' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  return <StudyRoot lesson={lesson} />;
}
