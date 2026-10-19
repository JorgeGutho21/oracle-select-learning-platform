import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudyRoot } from '@/composition/study/study-root';
import { LESSON_COUNT, STUDY_BLOCKS } from '@/features/study/application/lesson-index';
import { unitBlocks } from '@/features/curriculum/application/curriculum-api';

/** La cabecera cuenta toda la oferta; el progreso inicial conserva su denominador. */
describe('Resumen del temario S1', () => {
  it('cuenta las ampliaciones reales sin alterar el progreso de las lecciones iniciales', () => {
    const extensions = unitBlocks('fundamentos-sql');
    const extra = extensions.reduce((total, block) => total + block.lessons.length, 0);
    render(<StudyRoot />);
    expect(
      screen.getByText(
        `Modo Estudio · ${STUDY_BLOCKS.length + extensions.length} bloques · ${LESSON_COUNT + extra} lecciones`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${LESSON_COUNT} lecciones iniciales + ${extra} de ampliación. El progreso inicial y el de ampliación se registran por separado.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `0 de ${LESSON_COUNT} lecciones` }),
    ).toBeInTheDocument();
  });
});
