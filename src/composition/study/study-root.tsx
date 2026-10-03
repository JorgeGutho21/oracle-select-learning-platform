import { lessonView, type StudyLesson } from '@/features/study/application/study-api';
import { LessonPage, StudyIndexPage } from '@/features/study/presentation/study-page';
import { unitBlocks } from '@/features/curriculum/application/curriculum-api';
import { ExtensionLessons } from '@/features/curriculum/presentation/curriculum-pages';
import { LessonStatus } from '../curriculum/curriculum-client';
import { StudyProvider } from './study-provider';

/** Modo Estudio: contenido renderizado en el servidor con el progreso del navegador. */
export function StudyRoot({ lesson }: { lesson?: StudyLesson }) {
  return (
    <StudyProvider>
      {lesson ? (
        <LessonPage view={lessonView(lesson)} />
      ) : (
        <StudyIndexPage
          extension={
            <ExtensionLessons
              blocks={unitBlocks('fundamentos-sql')}
              letter="I"
              status={(lessonId, version) => (
                <LessonStatus
                  section="fundamentos-sql"
                  lessonId={lessonId}
                  version={version}
                  pendingLabel="Pendiente"
                />
              )}
            />
          }
        />
      )}
    </StudyProvider>
  );
}
