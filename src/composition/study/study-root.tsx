import { lessonView, type StudyLesson } from '@/features/study/application/study-api';
import { LessonPage, StudyIndexPage } from '@/features/study/presentation/study-page';
import { unitBlocks } from '@/features/curriculum/application/curriculum-api';
import { ExtensionLessons } from '@/features/curriculum/presentation/curriculum-pages';
import { LessonStatus } from '../curriculum/curriculum-client';
import { StudyProvider } from './study-provider';

/** Modo Estudio: contenido renderizado en el servidor con el progreso del navegador. */
export function StudyRoot({ lesson }: { lesson?: StudyLesson }) {
  const extensionBlocks = unitBlocks('fundamentos-sql');
  return (
    <StudyProvider>
      {lesson ? (
        <LessonPage view={lessonView(lesson)} />
      ) : (
        <StudyIndexPage
          extensionBlockCount={extensionBlocks.length}
          extensionLessonCount={extensionBlocks.reduce(
            (total, block) => total + block.lessons.length,
            0,
          )}
          extension={
            <ExtensionLessons
              blocks={extensionBlocks}
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
