import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OracleQueryExecutor } from '@/application/oracle-executor';
import { EMPLEADOS_COLUMNS } from '@/domain/dataset/empleados';
import { queryTrace } from '@/features/challenge/application/challenge-api';
import { getMissionDefinition } from '@/features/challenge/domain/missions/definitions';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { MISSION_PRIVATE } from '@/features/challenge/domain/missions/rubrics';
import { FEEDBACK_CATEGORIES, MISSION_IDS } from '@/features/challenge/domain/types';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import { MISSION_CONTEXT } from '@/features/challenge/presentation/mission-context';
import { MissionData, MissionSample } from '@/features/challenge/presentation/mission-data';
import { RowPicker } from '@/features/challenge/presentation/row-picker';

/**
 * Densidad del Challenge (addendum pedagógico): cada misión muestra solo los datos que
 * necesita, la respuesta nunca depende de filas ocultas y el feedback explica el porqué.
 */

const offline: OracleQueryExecutor = {
  status: async () => ({ available: false, reason: 'not-configured', message: 'Sin Oracle.' }),
  execute: async () => ({
    status: 'unavailable',
    reason: 'not-configured',
    message: 'Sin Oracle.',
  }),
};
const evaluator = new InProcessMissionEvaluator(offline);

describe('datos de cada misión', () => {
  it('ninguna misión muestra EMPLEADOS completa por defecto: 7 columnas y 12 filas como máximo', () => {
    for (const id of MISSION_IDS) {
      const { data } = MISSION_CONTEXT[id];
      if (!data.fullSchema) expect(data.columns.length, id).toBeLessThanOrEqual(7);
      expect(data.rowIds.length, id).toBeLessThanOrEqual(12);
    }
    for (const mission of PUBLIC_MISSIONS) {
      const data = mission.publicData;
      if (data.type === 'drag-column') expect(data.availableColumns.length).toBeLessThanOrEqual(7);
      if (data.type === 'predict-result' && data.asks.rowSelection) {
        expect(data.sampleIds?.length ?? 99, mission.id).toBeLessThanOrEqual(12);
        expect(data.sourceColumns?.length ?? 99, mission.id).toBeLessThanOrEqual(7);
      }
    }
  });

  it('M03 enseña el asterisco con el esquema, no con 240 celdas, y el total de filas es visible', () => {
    const { container } = render(<MissionData spec={MISSION_CONTEXT.M03.data} />);
    const schema = container.querySelectorAll('.ch-schema--numbered li');
    expect([...schema].map((item) => item.querySelector('code')?.textContent)).toEqual([
      ...EMPLEADOS_COLUMNS,
    ]);
    expect(container.textContent).toContain('20 filas');
    // La tabla completa existe, pero plegada: es consulta secundaria.
    const details = container.querySelector<HTMLDetailsElement>('details.ch-data__more');
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toMatch(/Ver tabla completa/);
  });

  it('M04: la muestra contiene todas las filas del resultado y basta para acertar', async () => {
    const mission = PUBLIC_MISSIONS.find((item) => item.id === 'M04')!;
    const data = mission.publicData;
    if (data.type !== 'predict-result') throw new Error('M04 no es de predicción');
    const kept = queryTrace(data.query).keptIds;
    expect(kept.length).toBeGreaterThan(0);
    for (const id of kept) expect(data.sampleIds).toContain(id);
    // La muestra también tiene filas que no cumplen: hay que razonar la condición.
    expect(data.sampleIds!.some((id) => !kept.includes(id))).toBe(true);
    const outcome = await evaluator.evaluate({
      missionId: 'M04',
      missionVersion: mission.version,
      answer: {
        type: 'predict-result',
        headers: ['NOMBRE', 'SALARIO'],
        sourceRowIds: data.sampleIds!.filter((id) => kept.includes(id)),
        rowCount: null,
      },
    });
    expect(outcome.kind).toBe('correct');
  });

  it('M10: vista previa de 8 filas y columnas relevantes; Oracle evalúa la tabla completa', () => {
    const { container } = render(<MissionSample spec={MISSION_CONTEXT.M10.data} />);
    expect(container.querySelectorAll('.dv__table tbody tr')).toHaveLength(8);
    expect(container.querySelectorAll('.dv__table thead th')).toHaveLength(5);
    expect(MISSION_CONTEXT.M10.data.note).toMatch(/Oracle evalúa la tabla completa/);
    expect(getMissionDefinition('M10').publicData).toMatchObject({ requiresOracle: true });
  });

  it('la selección de filas conserva la relación campo → valor y un nombre accesible', () => {
    const { container, getByRole } = render(
      <RowPicker
        legend="¿Qué filas aparecen?"
        columns={['ID_EMPLEADO', 'NOMBRE', 'CIUDAD']}
        rowIds={[1, 4]}
        selected={[4]}
        onToggle={() => {}}
        disabled={false}
        kept={[4]}
        focusColumns={['CIUDAD']}
      />,
    );
    const box = getByRole('checkbox', { name: 'Incluir a Jorge' });
    const fields = container.querySelector(`#${CSS.escape(box.getAttribute('aria-describedby')!)}`);
    expect(fields?.tagName).toBe('DL');
    expect([...fields!.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([
      'ID_EMPLEADO',
      'NOMBRE',
      'CIUDAD',
    ]);
    expect(fields!.querySelector('.is-focus dd')?.textContent).toBe('Cali');
    // Al revelar, el estado tiene texto y símbolo, no solo color.
    expect(container.textContent).toContain('Cumple');
    expect(container.textContent).toContain('No cumple');
  });
});

describe('feedback pedagógico', () => {
  it('un error dice qué está bien, qué ajustar y da una pista conceptual y luego localizada', async () => {
    const request = {
      missionId: 'M01' as const,
      missionVersion: PUBLIC_MISSIONS[0]!.version,
      answer: { type: 'drag-column' as const, columns: ['SALARIO', 'NOMBRE'] },
    };
    const first = await evaluator.evaluate({ ...request, attempt: 1 });
    const second = await evaluator.evaluate({ ...request, attempt: 2 });
    expect(first).toMatchObject({ kind: 'incorrect', category: 'columna' });
    if (first.kind !== 'incorrect' || second.kind !== 'incorrect') throw new Error('incorrecto');
    expect(first.good).toBeTruthy();
    expect(first.guidance).toBe(MISSION_PRIVATE.M01.guide.concept);
    expect(second.guidance).toBe(MISSION_PRIVATE.M01.guide.locate);
    expect(first.guidance).not.toBe(second.guidance);
  });

  it('todas las misiones tienen orientación progresiva que no revela la consulta de la solución', () => {
    for (const id of MISSION_IDS) {
      const { guide, explanation } = MISSION_PRIVATE[id];
      expect(guide.concept.length, id).toBeGreaterThan(20);
      expect(guide.locate.length, id).toBeGreaterThan(20);
      const solution = /SELECT [^;]+FROM [^;]+/i.exec(explanation)?.[0];
      if (solution) {
        expect(guide.concept, id).not.toContain(solution);
        expect(guide.locate, id).not.toContain(solution);
      }
    }
  });

  it('los errores del motor SQL llegan con su tipo (sintaxis, columna, condición…)', async () => {
    const outcome = await evaluator.evaluate({
      missionId: 'M10',
      missionVersion: getMissionDefinition('M10').version,
      answer: { type: 'write-query', sql: 'SELECT nombre, sueldo FROM empleados' },
    });
    expect(outcome.kind).toBe('incorrect');
    if (outcome.kind === 'incorrect') {
      expect(FEEDBACK_CATEGORIES).toContain(outcome.category);
      expect(outcome.category).toBe('columna');
    }
  });

  it('un acierto explica por qué es correcto', async () => {
    const outcome = await evaluator.evaluate({
      missionId: 'M01',
      missionVersion: PUBLIC_MISSIONS[0]!.version,
      answer: { type: 'drag-column', columns: ['NOMBRE', 'SALARIO'] },
    });
    expect(outcome).toMatchObject({
      kind: 'correct',
      feedback: expect.stringContaining('¿qué quiero mostrar?'),
    });
  });

  it('el punto y coma no es obligatorio: sin él la consulta se corrige igual', async () => {
    const pieces = ['m02-select', 'm02-nombre', 'm02-comma', 'm02-ciudad', 'm02-from'];
    const outcome = await evaluator.evaluate({
      missionId: 'M02',
      missionVersion: getMissionDefinition('M02').version,
      answer: {
        type: 'reorder-sql',
        pieceIds: [...pieces, 'm02-empleados', 'm02-where', 'm02-condition'],
      },
    });
    expect(outcome.kind).toBe('correct');
  });
});
