// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  evaluatePracticeAnswer,
  getPracticeExplanation,
  getPracticeHint,
} from '@/composition/challenge/actions';
import type { EvaluationRequest } from '@/features/challenge/application/ports';

describe('Server Functions de corrección de la práctica', () => {
  it('corrigen una respuesta válida con la rúbrica del servidor', async () => {
    await expect(
      evaluatePracticeAnswer({
        missionId: 'M01',
        missionVersion: 1,
        answer: { type: 'drag-column', columns: ['NOMBRE', 'SALARIO'] },
      }),
    ).resolves.toMatchObject({ kind: 'correct' });
  });

  it.each([
    ['sin objeto', null],
    [
      'misión desconocida',
      { missionId: 'M99', missionVersion: 1, answer: { type: 'drag-column', columns: [] } },
    ],
    [
      'versión no entera',
      { missionId: 'M01', missionVersion: 1.5, answer: { type: 'drag-column', columns: [] } },
    ],
    [
      'tipo de respuesta desconocido',
      { missionId: 'M01', missionVersion: 1, answer: { type: 'hack' } },
    ],
    [
      'respuesta demasiado grande',
      {
        missionId: 'M01',
        missionVersion: 1,
        answer: { type: 'drag-column', columns: ['X'.repeat(5000)] },
      },
    ],
    [
      'campos malformados',
      { missionId: 'M01', missionVersion: 1, answer: { type: 'drag-column', columns: 'NOMBRE' } },
    ],
  ])('rechazan sin consumir intento una petición con %s', async (_label, request) => {
    await expect(
      evaluatePracticeAnswer(request as unknown as EvaluationRequest),
    ).resolves.toMatchObject({
      kind: 'invalid-input',
    });
  });

  it('una versión antigua de la misión es un fallo técnico, no un intento', async () => {
    await expect(
      evaluatePracticeAnswer({
        missionId: 'M02',
        missionVersion: 1,
        answer: { type: 'reorder-sql', pieceIds: [] },
      }),
    ).resolves.toMatchObject({ kind: 'technical' });
  });

  it('entregan pista y explicación solo para misiones existentes', async () => {
    await expect(getPracticeHint('M08')).resolves.toContain('columnas');
    await expect(getPracticeExplanation('M08')).resolves.toContain('alias SALARIO');
    await expect(getPracticeHint('M99' as never)).rejects.toThrow('Misión desconocida');
  });
});
