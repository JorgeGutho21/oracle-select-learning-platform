// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  evaluateMissionAnswer,
  getMissionDefinition,
  MISSION_DEFINITIONS,
} from '@/features/challenge/domain/missions/definitions';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { MISSION_PRIVATE } from '@/features/challenge/domain/missions/rubrics';
import {
  INTERACTION_TYPES,
  MISSION_IDS,
  type EvaluationOutcome,
  type MissionAnswer,
  type MissionId,
} from '@/features/challenge/domain/types';

const check = (id: MissionId, answer: MissionAnswer): EvaluationOutcome =>
  evaluateMissionAnswer(getMissionDefinition(id), answer);
const kind = (id: MissionId, answer: MissionAnswer) => check(id, answer).kind;

describe('Catálogo público de misiones', () => {
  it('contiene exactamente diez misiones M01–M10 en orden', () => {
    expect(PUBLIC_MISSIONS.map(({ id }) => id)).toEqual([...MISSION_IDS]);
    expect(PUBLIC_MISSIONS.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('suma 1000 puntos y 900 segundos base', () => {
    expect(PUBLIC_MISSIONS.reduce((sum, mission) => sum + mission.maxScore, 0)).toBe(1000);
    expect(PUBLIC_MISSIONS.map(({ baseDurationSeconds }) => baseDurationSeconds)).toEqual([
      45, 60, 60, 75, 90, 90, 90, 90, 120, 180,
    ]);
  });

  it('cada misión declara un tipo de interacción soportado y datos del mismo tipo', () => {
    for (const mission of PUBLIC_MISSIONS) {
      expect(INTERACTION_TYPES).toContain(mission.interactionType);
      expect(mission.publicData.type).toBe(mission.interactionType);
      expect(mission.lessons.length).toBeGreaterThan(0);
    }
  });

  it('G15: la parte pública no incluye pistas, explicaciones ni rúbricas', () => {
    const serialized = JSON.stringify(PUBLIC_MISSIONS);
    for (const hidden of Object.values(MISSION_PRIVATE)) {
      expect(serialized).not.toContain(hidden.hint);
      expect(serialized).not.toContain(hidden.explanation);
    }
    for (const mission of PUBLIC_MISSIONS) {
      expect(mission).not.toHaveProperty('hint');
      expect(mission).not.toHaveProperty('explanation');
      expect(mission).not.toHaveProperty('rubric');
    }
  });

  it('G15: las piezas públicas no se presentan en el orden de la solución', () => {
    const m02 = getMissionDefinition('M02');
    if (m02.publicData.type !== 'reorder-sql') throw new Error('tipo');
    const presented = m02.publicData.pieces.map(({ id }) => id).filter((id) => id !== 'm02-end');
    expect(kind('M02', { type: 'reorder-sql', pieceIds: presented })).toBe('incorrect');
  });

  it('C03: ninguna misión exige cláusulas futuras', () => {
    const serialized = JSON.stringify(PUBLIC_MISSIONS).toUpperCase();
    for (const future of [' WHERE ', ' ORDER BY ', ' JOIN ', ' GROUP BY ', ' BETWEEN ', ' LIKE ']) {
      expect(serialized).not.toContain(future);
    }
  });

  it('las definiciones completas combinan cada parte pública con su rúbrica', () => {
    expect(MISSION_DEFINITIONS).toHaveLength(10);
    for (const definition of MISSION_DEFINITIONS) {
      expect(definition.hint.length).toBeGreaterThan(0);
      expect(definition.explanation.length).toBeGreaterThan(0);
      expect(MISSION_PRIVATE[definition.id].interactionType).toBe(definition.interactionType);
    }
  });

  it('una respuesta de otro tipo no consume intento', () => {
    expect(kind('M01', { type: 'write-query', sql: 'SELECT 1' })).toBe('invalid-input');
  });
});

describe('G01 — M01 SELECT Visual', () => {
  const answer = (columns: string[]): MissionAnswer => ({ type: 'drag-column', columns });
  it('acepta NOMBRE, SALARIO sin distinguir caja', () => {
    expect(kind('M01', answer(['NOMBRE', 'SALARIO']))).toBe('correct');
    expect(kind('M01', answer(['nombre', 'salario']))).toBe('correct');
  });
  it('rechaza *, columnas de más, orden invertido, incompletas e inexistentes', () => {
    expect(check('M01', answer(['*'])).kind).toBe('incorrect');
    expect(check('M01', answer(['ID', 'NOMBRE', 'SALARIO']))).toMatchObject({ kind: 'incorrect' });
    expect(check('M01', answer(['SALARIO', 'NOMBRE']))).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('orden'),
    });
    expect(kind('M01', answer(['NOMBRE']))).toBe('incorrect');
    expect(check('M01', answer(['SUELDO']))).toMatchObject({
      feedback: expect.stringContaining('SUELDO'),
    });
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M01', answer([]))).toBe('invalid-input');
  });
});

describe('G02 — M02 Constructor de Consultas', () => {
  const solution = [
    'm02-select',
    'm02-ciudad',
    'm02-comma',
    'm02-nombre',
    'm02-from',
    'm02-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'reorder-sql', pieceIds });
  it('acepta el orden correcto con o sin terminador', () => {
    expect(kind('M02', answer(solution))).toBe('correct');
    expect(kind('M02', answer([...solution, 'm02-end']))).toBe('correct');
  });
  it('rechaza columnas invertidas, columna tras FROM y consultas incompletas', () => {
    expect(
      kind(
        'M02',
        answer([
          'm02-select',
          'm02-nombre',
          'm02-comma',
          'm02-ciudad',
          'm02-from',
          'm02-empleados',
        ]),
      ),
    ).toBe('incorrect');
    expect(
      check(
        'M02',
        answer([
          'm02-select',
          'm02-empleados',
          'm02-comma',
          'm02-nombre',
          'm02-from',
          'm02-ciudad',
        ]),
      ),
    ).toMatchObject({
      feedback: expect.stringContaining('FROM recibe el nombre de la tabla'),
    });
    expect(kind('M02', answer(['m02-select', 'm02-ciudad']))).toBe('incorrect');
    expect(kind('M02', answer(['m02-end', ...solution]))).toBe('incorrect');
    expect(kind('M02', answer([]))).toBe('invalid-input');
  });
});

describe('G03 — M03 asterisco', () => {
  const headers = ['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO'];
  const answer = (h: string[], rowCount: number | null): MissionAnswer => ({
    type: 'predict-result',
    headers: h,
    rows: [],
    rowCount,
  });
  it('acepta los seis encabezados en orden y seis filas', () => {
    expect(kind('M03', answer(headers, 6))).toBe('correct');
  });
  it('rechaza *, orden cambiado, columnas faltantes y conteo erróneo', () => {
    expect(check('M03', answer(['*'], 6))).toMatchObject({
      feedback: expect.stringContaining('asterisco no es una columna'),
    });
    expect(kind('M03', answer([...headers].reverse(), 6))).toBe('incorrect');
    expect(kind('M03', answer(headers.slice(0, 5), 6))).toBe('incorrect');
    expect(kind('M03', answer(headers, 1))).toBe('incorrect');
    expect(kind('M03', answer(headers, null))).toBe('incorrect');
    expect(kind('M03', answer([], null))).toBe('invalid-input');
  });
});

describe('G04 — M04 multiplicidad', () => {
  const six = [['Bogotá'], ['Cali'], ['Bogotá'], ['Medellín'], ['Cali'], ['Bogotá']];
  const answer = (headers: string[], rows: string[][]): MissionAnswer => ({
    type: 'predict-result',
    headers,
    rows,
    rowCount: null,
  });
  it('acepta el multiconjunto exacto en cualquier orden', () => {
    expect(kind('M04', answer(['CIUDAD'], six))).toBe('correct');
    expect(kind('M04', answer(['ciudad'], [...six].reverse()))).toBe('correct');
  });
  it('rechaza tres ciudades únicas con feedback sobre DISTINCT', () => {
    expect(check('M04', answer(['CIUDAD'], [['Bogotá'], ['Cali'], ['Medellín']]))).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('DISTINCT'),
    });
  });
  it('rechaza conteos equivocados, encabezado erróneo y tildes perdidas', () => {
    expect(kind('M04', answer(['CIUDAD'], [...six.slice(1), ['Cali']]))).toBe('incorrect');
    expect(kind('M04', answer(['NOMBRE'], six))).toBe('incorrect');
    expect(
      kind(
        'M04',
        answer(
          ['CIUDAD'],
          six.map(([city]) => [city!.replace('á', 'a')]),
        ),
      ),
    ).toBe('incorrect');
    expect(kind('M04', answer([], []))).toBe('invalid-input');
  });
});

describe('G05 — M05 expresión', () => {
  const answer = (pieceIds: string[], value: number | null): MissionAnswer => ({
    type: 'expression-builder',
    pieceIds,
    value,
  });
  const withParens = [
    'm05-open',
    'm05-salario',
    'm05-plus',
    'm05-100000',
    'm05-close',
    'm05-times',
    'm05-12',
  ];
  it('acepta la expresión y su equivalente conmutada', () => {
    expect(kind('M05', answer(withParens, 37200000))).toBe('correct');
    expect(
      kind(
        'M05',
        answer(
          ['m05-12', 'm05-times', 'm05-open', 'm05-salario', 'm05-plus', 'm05-100000', 'm05-close'],
          37200000,
        ),
      ),
    ).toBe('correct');
    expect(
      kind(
        'M05',
        answer(
          ['m05-open', 'm05-100000', 'm05-plus', 'm05-salario', 'm05-close', 'm05-times', 'm05-12'],
          37200000,
        ),
      ),
    ).toBe('correct');
  });
  it('rechaza la versión sin paréntesis con feedback de precedencia', () => {
    expect(
      check(
        'M05',
        answer(['m05-salario', 'm05-plus', 'm05-100000', 'm05-times', 'm05-12'], 4200000),
      ),
    ).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('paréntesis'),
    });
  });
  it('rechaza valor erróneo, expresiones sin SALARIO, incompletas y piezas ajenas', () => {
    expect(check('M05', answer(withParens, 4200000))).toMatchObject({
      feedback: expect.stringContaining('valor'),
    });
    expect(kind('M05', answer(withParens, null))).toBe('incorrect');
    expect(kind('M05', answer(['m05-100000', 'm05-times', 'm05-12'], 37200000))).toBe('incorrect');
    expect(kind('M05', answer(['m05-open', 'm05-salario', 'm05-plus'], 37200000))).toBe(
      'incorrect',
    );
    expect(kind('M05', answer(['m05-salario', 'x'], 37200000))).toBe('incorrect');
    expect(kind('M05', answer([], null))).toBe('invalid-input');
  });
});

describe('G06 — M06 alias', () => {
  const solution = [
    'm06-select',
    'm06-nombre',
    'm06-comma',
    'm06-expr',
    'm06-as',
    'm06-from',
    'm06-empleados',
  ];
  const answer = (pieceIds: string[], labeledColumnIndex: number | null): MissionAnswer => ({
    type: 'alias-builder',
    pieceIds,
    labeledColumnIndex,
  });
  it('acepta el alias tras la expresión y la etiqueta en la columna calculada', () => {
    expect(kind('M06', answer(solution, 1))).toBe('correct');
  });
  it('rechaza el alias junto a NOMBRE o tras la tabla', () => {
    expect(
      check(
        'M06',
        answer(
          [
            'm06-select',
            'm06-nombre',
            'm06-as',
            'm06-comma',
            'm06-expr',
            'm06-from',
            'm06-empleados',
          ],
          1,
        ),
      ),
    ).toMatchObject({
      feedback: expect.stringContaining('NOMBRE'),
    });
    expect(
      check(
        'M06',
        answer(
          [
            'm06-select',
            'm06-nombre',
            'm06-comma',
            'm06-expr',
            'm06-from',
            'm06-empleados',
            'm06-as',
          ],
          1,
        ),
      ),
    ).toMatchObject({
      feedback: expect.stringContaining('tabla'),
    });
  });
  it('rechaza la etiqueta en el encabezado equivocado, sin alias o incompleta', () => {
    expect(kind('M06', answer(solution, 0))).toBe('incorrect');
    expect(
      kind(
        'M06',
        answer(
          solution.filter((id) => id !== 'm06-as'),
          1,
        ),
      ),
    ).toBe('incorrect');
    expect(kind('M06', answer(['m06-expr', 'm06-as'], 1))).toBe('incorrect');
    expect(kind('M06', answer([], null))).toBe('invalid-input');
  });
});

describe('G07 — M07 DISTINCT compuesto', () => {
  const five = [
    ['Cali', 'Contabilidad'],
    ['Bogotá', 'Sistemas'],
    ['Medellín', 'Ventas'],
    ['Cali', 'Sistemas'],
    ['Bogotá', 'Ventas'],
  ];
  const answer = (rows: string[][]): MissionAnswer => ({ type: 'distinct-result', rows });
  it('acepta los cinco pares en cualquier orden', () => {
    expect(kind('M07', answer(five))).toBe('correct');
  });
  it('rechaza conservar repeticiones idénticas', () => {
    expect(check('M07', answer([...five, ['Bogotá', 'Sistemas']]))).toMatchObject({
      feedback: expect.stringContaining('idénticas'),
    });
  });
  it('rechaza reducir Bogotá a un único departamento', () => {
    expect(
      check(
        'M07',
        answer([
          ['Bogotá', 'Sistemas'],
          ['Cali', 'Sistemas'],
          ['Medellín', 'Ventas'],
        ]),
      ),
    ).toMatchObject({
      feedback: expect.stringContaining('igual ciudad y diferente departamento'),
    });
  });
  it('rechaza pares inventados y la respuesta vacía no es intento', () => {
    expect(kind('M07', answer([...five.slice(1), ['Cali', 'Ventas']]))).toBe('incorrect');
    expect(kind('M07', answer([]))).toBe('invalid-input');
  });
});

describe('G08 — M08 Debug Terminal', () => {
  const repaired = [
    'SELECT',
    'nombre',
    ',',
    'salario',
    '*',
    '12',
    'AS',
    'salario_anual',
    'FROM',
    'empleados',
    ';',
  ];
  const answer = (selectedTokenIndex: number | null, repairedTokens: string[]): MissionAnswer => ({
    type: 'hotspot-error',
    selectedTokenIndex,
    repairedTokens,
  });
  it('acepta localizar la coma y retirarla, con o sin terminador y con la expresión conmutada', () => {
    expect(kind('M08', answer(8, repaired))).toBe('correct');
    expect(kind('M08', answer(8, repaired.slice(0, -1)))).toBe('correct');
    expect(
      kind(
        'M08',
        answer(8, [
          'SELECT',
          'nombre',
          ',',
          '12',
          '*',
          'salario',
          'AS',
          'salario_anual',
          'FROM',
          'empleados',
        ]),
      ),
    ).toBe('correct');
  });
  it('rechaza una localización incorrecta aunque la reparación sea buena', () => {
    expect(kind('M08', answer(2, repaired))).toBe('incorrect');
    expect(kind('M08', answer(null, repaired))).toBe('incorrect');
  });
  it('rechaza borrar la expresión para que compile, con feedback de objetivo', () => {
    expect(check('M08', answer(8, ['SELECT', 'nombre', 'FROM', 'empleados']))).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('no cumple el pedido'),
    });
  });
  it('rechaza una consulta todavía rota y la respuesta vacía no es intento', () => {
    expect(
      kind(
        'M08',
        answer(8, [
          'SELECT',
          'nombre',
          ',',
          'salario',
          '*',
          '12',
          'AS',
          'salario_anual',
          ',',
          'FROM',
          'empleados',
        ]),
      ),
    ).toBe('incorrect');
    expect(kind('M08', answer(null, []))).toBe('invalid-input');
  });
});

describe('G09 — M09 reconstrucción', () => {
  const solution = [
    'm09-select',
    'm09-distinct',
    'm09-ciudad',
    'm09-as-ciudad',
    'm09-comma',
    'm09-depto',
    'm09-as-depto',
    'm09-from',
    'm09-empleados',
  ];
  const answer = (pieceIds: string[], rowCount: number | null): MissionAnswer => ({
    type: 'build-query',
    pieceIds,
    rowCount,
  });
  it('acepta la consulta con predicción 5, con o sin terminador', () => {
    expect(kind('M09', answer(solution, 5))).toBe('correct');
    expect(kind('M09', answer([...solution, 'm09-end'], 5))).toBe('correct');
  });
  it('rechaza predicciones 6 y 3', () => {
    expect(kind('M09', answer(solution, 6))).toBe('incorrect');
    expect(kind('M09', answer(solution, 3))).toBe('incorrect');
  });
  it('rechaza DISTINCT fuera de lugar y alias intercambiados', () => {
    const misplaced = [
      'm09-select',
      'm09-ciudad',
      'm09-as-ciudad',
      'm09-comma',
      'm09-distinct',
      'm09-depto',
      'm09-as-depto',
      'm09-from',
      'm09-empleados',
    ];
    expect(check('M09', answer(misplaced, 5))).toMatchObject({
      feedback: expect.stringContaining('DISTINCT'),
    });
    const swapped = [
      'm09-select',
      'm09-distinct',
      'm09-ciudad',
      'm09-as-depto',
      'm09-comma',
      'm09-depto',
      'm09-as-ciudad',
      'm09-from',
      'm09-empleados',
    ];
    expect(check('M09', answer(swapped, 5))).toMatchObject({
      feedback: expect.stringContaining('alias'),
    });
  });
  it('rechaza encabezados en otro orden y la respuesta vacía no es intento', () => {
    const reversed = [
      'm09-select',
      'm09-distinct',
      'm09-depto',
      'm09-as-depto',
      'm09-comma',
      'm09-ciudad',
      'm09-as-ciudad',
      'm09-from',
      'm09-empleados',
    ];
    expect(kind('M09', answer(reversed, 5))).toBe('incorrect');
    expect(kind('M09', answer([], null))).toBe('invalid-input');
  });
});

describe('G10 — M10 reto escrito', () => {
  it('rechaza el editor vacío sin consumir intento', () => {
    expect(kind('M10', { type: 'write-query', sql: '   ' })).toBe('invalid-input');
  });
  it('sin Oracle real declara indisponibilidad técnica en vez de simular la corrección', () => {
    expect(
      check('M10', {
        type: 'write-query',
        sql: 'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados;',
      }),
    ).toMatchObject({ kind: 'technical', reason: 'oracle-unavailable' });
  });
});
