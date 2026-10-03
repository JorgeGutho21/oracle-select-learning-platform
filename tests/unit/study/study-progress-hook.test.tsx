import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type {
  StoredStudyProgress,
  StudyProgressRepository,
  StudyProgressState,
} from '@/features/study/application/progress';
import { useStudyProgress } from '@/features/study/presentation/study-progress';

function fakeRepository(stored: StoredStudyProgress = { status: 'empty' }) {
  const saved: StudyProgressState[] = [];
  const repository: StudyProgressRepository = {
    load: vi.fn(async () => stored),
    save: vi.fn(async (progress: StudyProgressState) => {
      saved.push(progress);
      return true;
    }),
    clear: vi.fn(async () => true),
  };
  return { repository, saved };
}

/**
 * Como una lección: el proveedor tiene el estado y un hijo registra la visita en cuanto el
 * progreso está listo. El efecto del hijo corre antes que el de guardado del proveedor.
 */
function LessonVisit({ ready, visit }: { ready: boolean; visit: (id: 'L11') => void }) {
  useEffect(() => {
    if (ready) visit('L11');
  }, [ready, visit]);
  return null;
}

function Visitor({ repository }: { repository: StudyProgressRepository }) {
  const { ready, visit, progress } = useStudyProgress(repository);
  return (
    <>
      <LessonVisit ready={ready} visit={visit} />
      <p>{progress.lastLesson ?? 'ninguna'}</p>
    </>
  );
}

describe('progreso del Modo Estudio en el navegador', () => {
  it('guarda la visita registrada en el mismo ciclo en que termina la lectura', async () => {
    const { repository, saved } = fakeRepository();
    render(<Visitor repository={repository} />);
    await screen.findByText('L11');
    await waitFor(() => expect(saved.at(-1)?.lastLesson).toBe('L11'));
    expect(saved.every((progress) => progress.completed.length === 0)).toBe(true);
  });

  it('no reescribe el almacenamiento solo por leerlo', async () => {
    const { repository } = fakeRepository();
    function Reader() {
      const { ready } = useStudyProgress(repository);
      return <p>{ready ? 'lista' : 'cargando'}</p>;
    }
    render(<Reader />);
    await screen.findByText('lista');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
