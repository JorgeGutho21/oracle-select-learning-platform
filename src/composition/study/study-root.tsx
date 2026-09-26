import { lessonView, type StudyLesson } from '@/features/study/application/study-api';
import { LessonPage, StudyIndexPage } from '@/features/study/presentation/study-page';
import { StudyProvider } from './study-provider';

/** Modo Estudio: contenido renderizado en el servidor con el progreso del navegador. */
export function StudyRoot({ lesson }: { lesson?: StudyLesson }) {
  return (
    <StudyProvider>
      {lesson ? <LessonPage view={lessonView(lesson)} /> : <StudyIndexPage />}
    </StudyProvider>
  );
}
