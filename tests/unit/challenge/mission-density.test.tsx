import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OracleQueryExecutor } from '@/application/oracle-executor';
import { EMPLEADOS_COLUMNS } from '@/domain/dataset/empleados';
import {
  calculationSteps,
  errorVariantFor,
  sampleResult,
  variantSql,
} from '@/features/challenge/application/challenge-api';
import { getMissionDefinition } from '@/features/challenge/domain/missions/definitions';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { MISSION_PRIVATE } from '@/features/challenge/domain/missions/rubrics';
import { FEEDBACK_CATEGORIES, MISSION_IDS } from '@/features/challenge/domain/types';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import { emptyAnswer } from '@/features/challenge/presentation/interactions/mission-interaction';
import { MISSION_CONTEXT, SAMPLE_LIMITS } from '@/features/challenge/presentation/mission-context';
import { SchemaOverview, WorkingSample } from '@/features/challenge/presentation/mission-data';
import { RowPicker } from '@/features/challenge/presentation/row-picker';

/**
 * Densidad del Challenge: cada misión razona sobre una muestra de trabajo pequeña (hasta 8
 * registros y 3–4 columnas), siempre como tabla; la tabla completa es consulta secundaria;
 * la respuesta nunca depende de filas ocultas y el feedback explica el porqué.
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

describe('muestra de trabajo de cada misión', () => {
  it('ninguna misión muestra EMPLEADOS completa: como mucho 8 registros y 5 columnas', () => {
    expect(SAMPLE_LIMITS).toEqual({ rows: 8, columns: 5 });
    for (const id of MISSION_IDS) {
      const { sample } = MISSION_CONTEXT[id];
      if (!sample) continue;
      expect(sample.rowIds.length, id).toBeLessThanOrEqual(SAMPLE_LIMITS.rows);
      expect(sample.rowIds.length, id).toBeGreaterThanOrEqual(4);
      expect(sample.columns.length, id).toBeLessThanOrEqual(SAMPLE_LIMITS.columns);
      // 3–4 columnas relevantes; 5 solo si hace falta.
      expect(sample.columns.length, id).toBeLessThanOrEqual(4);
    }
    for (const mission of PUBLIC_MISSIONS) {
      const data = mission.publicData;
      if (data.type === 'predict-result' && data.asks.rowSelection) {
        expect(data.sampleIds?.length ?? 99, mission.id).toBeLessThanOrEqual(8);
        expect(data.sourceColumns?.length ?? 99, mission.id).toBeLessThanOrEqual(4);
      }
    }
  });

  it('la muestra es una tabla real, rotulada, con el dataset completo como consulta secundaria', () => {
    const { container, getByRole } = render(<WorkingSample spec={MISSION_CONTEXT.M09.sample!} />);
    const table = container.querySelector('.dv__table table')!;
    expect(table.querySelectorAll('thead th')).toHaveLength(3);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(8);
    expect(container.querySelectorAll('.dv-record')).toHaveLength(0);
    expect(container.textContent).toContain(
      'Muestra de trabajo: 8 registros · 3 columnas relevantes',
    );
    expect(container.textContent).toContain('Dataset completo: 20 registros · 12 columnas');
    // El dataset completo no se abre por defecto: la misión se resuelve sin él.
    expect(getByRole('button', { name: 'Consultar dataset EMPLEADOS completo' })).toBeTruthy();
    expect(container.querySelectorAll('tbody tr').length).toBeLessThanOrEqual(8);
  });

  it('M03 enseña el asterisco con el esquema compacto (12 columnas numeradas), no con 240 celdas', () => {
    const { container } = render(<SchemaOverview />);
    const grid = container.querySelectorAll('.ch-schema--grid .ch-schema__item code');
    expect([...grid].map((item) => item.textContent)).toEqual([...EMPLEADOS_COLUMNS]);
    // En el móvil, por grupos; los datos de las filas no aparecen.
    expect(container.querySelectorAll('.ch-schema__group').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector('table')).toBeNull();
    expect(container.textContent).toContain('20 registros');
  });

  it('M04: la muestra tiene filas que cumplen y que no, y basta para acertar', async () => {
    const mission = PUBLIC_MISSIONS.find((item) => item.id === 'M04')!;
    const data = mission.publicData;
    if (data.type !== 'predict-result') throw new Error('M04 no es de predicción');
    const cali = sampleResult(
      "SELECT nombre FROM empleados WHERE ciudad = 'Cali'",
      data.sampleIds!,
    )!.keptIds;
    expect(cali.length).toBeGreaterThan(0);
    expect(data.sampleIds!.some((id) => !cali.includes(id))).toBe(true);
    const outcome = await evaluator.evaluate({
      missionId: 'M04',
      missionVersion: mission.version,
      answer: {
        type: 'predict-result',
        headers: [],
        sourceRowIds: [...cali],
        rowCount: null,
        conditionPieceIds: ['m04-where', 'm04-ciudad', 'm04-equals', 'm04-cali-text'],
      },
    });
    expect(outcome.kind).toBe('correct');
  });

  it('M10: vista previa de 8 filas y 4 columnas; Oracle evalúa la tabla completa', () => {
    const { container } = render(<WorkingSample spec={MISSION_CONTEXT.M10.sample!} />);
    expect(container.querySelectorAll('.dv__table:not(.dv__table--band) tbody tr')).toHaveLength(8);
    expect(container.querySelectorAll('.dv__table:not(.dv__table--band) thead th')).toHaveLength(4);
    expect(MISSION_CONTEXT.M10.sample!.note).toMatch(/Oracle evalúa la tabla completa/);
    expect(getMissionDefinition('M10').publicData).toMatchObject({ requiresOracle: true });
  });

  it('la selección de filas es una tabla con casillas y, al cerrar, dice qué se conserva', () => {
    const { container, getByRole } = render(
      <RowPicker
        legend="¿Qué filas aparecen?"
        columns={['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'SALARIO']}
        rowIds={[1, 4]}
        selected={[4]}
        onToggle={() => {}}
        disabled={false}
        kept={[4]}
        focusColumns={['CIUDAD']}
      />,
    );
    const table = container.querySelector('table.ch-pick__table')!;
    // «ID» a la vista (cabe en el móvil); el nombre completo, para lectores de pantalla.
    const header = (th: Element) =>
      th.querySelector('abbr')?.getAttribute('title') ?? th.textContent;
    expect([...table.querySelectorAll('thead th')].slice(1).map(header)).toEqual([
      'ID_EMPLEADO',
      'NOMBRE',
      'CIUDAD',
      'SALARIO',
    ]);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(table.querySelector('tbody th[scope="row"]')?.textContent).toBe('1');
    const box = getByRole('checkbox', { name: 'Incluir a Jorge (ID 4)' }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    // Al revelar, el estado tiene texto y símbolo, no solo color.
    expect(table.querySelector('tr.is-kept')?.textContent).toContain('Se conserva');
    expect(table.querySelector('tr.is-discarded')?.textContent).toContain('Se descarta');
    expect(container.querySelectorAll('dl')).toHaveLength(0);
  });
});

describe('ayudas de las misiones', () => {
  it('el resultado sobre la muestra conserva las mismas filas cuando solo cambia SELECT', () => {
    const ids = MISSION_CONTEXT.M01.sample!.rowIds;
    const result = sampleResult('SELECT nombre, ciudad, correo FROM empleados', ids)!;
    expect(result.rows).toHaveLength(ids.length);
    expect(result.columns).toEqual(['NOMBRE', 'CIUDAD', 'CORREO']);
  });

  it('el orden de cálculo muestra la precedencia sin valores', () => {
    expect(calculationSteps('salario + bono * 12')).toEqual(['bono * 12', 'salario + ①']);
    expect(calculationSteps('( salario + bono ) * 12')).toEqual(['salario + bono', '① * 12']);
    expect(calculationSteps('salario +')).toBeNull();
  });

  it('M08 elige una variante estable por partida y la consulta se ve como se escribiría', () => {
    const data = getMissionDefinition('M08').publicData;
    if (data.type !== 'hotspot-error') throw new Error('M08');
    expect(errorVariantFor(data, 'sesion-a')).toBe(errorVariantFor(data, 'sesion-a'));
    const seen = new Set(
      Array.from({ length: 40 }, (_, index) => errorVariantFor(data, `sesion-${index}`).id),
    );
    expect(seen.size).toBeGreaterThan(4);
    const parentesis = data.variants.find((variant) => variant.id === 'parentesis')!;
    expect(variantSql(parentesis)).toBe('SELECT nombre, (salario + bono * 12 FROM empleados;');
    const answer = emptyAnswer(PUBLIC_MISSIONS[7]!, 'sesion-a');
    expect(answer).toMatchObject({ type: 'hotspot-error', kind: null, tokenIndex: null });
  });
});

describe('feedback pedagógico', () => {
  it('un error dice qué está bien, qué revisar y da una pista conceptual y luego localizada', async () => {
    const request = {
      missionId: 'M01' as const,
      missionVersion: PUBLIC_MISSIONS[0]!.version,
      answer: { type: 'drag-column' as const, columns: ['NOMBRE', 'CIUDAD'] },
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
      const { guide, explanation, hint } = MISSION_PRIVATE[id];
      expect(guide.concept.length, id).toBeGreaterThan(20);
      expect(guide.locate.length, id).toBeGreaterThan(20);
      const solution = /SELECT [^;]+FROM [^;]+/i.exec(explanation)?.[0];
      if (solution) {
        expect(guide.concept, id).not.toContain(solution);
        expect(guide.locate, id).not.toContain(solution);
        expect(hint, id).not.toContain(solution);
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
      answer: { type: 'drag-column', columns: ['NOMBRE', 'CIUDAD', 'CORREO'] },
    });
    expect(outcome).toMatchObject({
      kind: 'correct',
      feedback: expect.stringContaining('SELECT decide qué columnas aparecen'),
    });
  });

  it('el punto y coma no es obligatorio: sin él la consulta se corrige igual', async () => {
    const outcome = await evaluator.evaluate({
      missionId: 'M02',
      missionVersion: getMissionDefinition('M02').version,
      answer: {
        type: 'reorder-sql',
        pieceIds: [
          'm02-select',
          'm02-nombre',
          'm02-comma',
          'm02-ciudad',
          'm02-from',
          'm02-empleados',
        ],
      },
    });
    expect(outcome.kind).toBe('correct');
  });
});
