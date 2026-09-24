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
  type MissionAnswer,
  type MissionId,
  type RubricVerdict,
} from '@/features/challenge/domain/types';

const check = (id: MissionId, answer: MissionAnswer): RubricVerdict =>
  evaluateMissionAnswer(getMissionDefinition(id), answer);
const kind = (id: MissionId, answer: MissionAnswer) => check(id, answer).kind;
const feedback = (id: MissionId, answer: MissionAnswer) => {
  const outcome = check(id, answer);
  return outcome.kind === 'correct' || outcome.kind === 'incorrect' ? outcome.feedback : '';
};

describe('Catálogo público de misiones (Challenge v2)', () => {
  it('contiene exactamente diez misiones M01–M10 en orden', () => {
    expect(PUBLIC_MISSIONS.map(({ id }) => id)).toEqual([...MISSION_IDS]);
    expect(PUBLIC_MISSIONS.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('suma 1000 puntos y 900 segundos base', () => {
    expect(PUBLIC_MISSIONS.reduce((sum, mission) => sum + mission.maxScore, 0)).toBe(1000);
    expect(PUBLIC_MISSIONS.reduce((sum, mission) => sum + mission.baseDurationSeconds, 0)).toBe(
      900,
    );
  });

  it('la dificultad no disminuye de M01 a M10', () => {
    const rank = { facil: 0, media: 1, dificil: 2 } as const;
    const levels = PUBLIC_MISSIONS.map(({ difficulty }) => rank[difficulty]);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(levels[0]).toBe(0);
    expect(levels.at(-1)).toBe(2);
  });

  it('cada misión tiene pedido, tipo soportado y datos del mismo tipo', () => {
    for (const mission of PUBLIC_MISSIONS) {
      expect(INTERACTION_TYPES).toContain(mission.interactionType);
      expect(mission.publicData.type).toBe(mission.interactionType);
      expect(mission.request.length).toBeGreaterThan(0);
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
    for (const id of ['M02', 'M06', 'M09'] as const) {
      const data = getMissionDefinition(id).publicData;
      if (!('pieces' in data)) throw new Error('sin piezas');
      const presented = data.pieces.map((piece) => piece.id);
      const type = data.type as 'reorder-sql' | 'alias-builder' | 'build-query';
      expect(kind(id, { type, pieceIds: presented } as MissionAnswer)).toBe('incorrect');
    }
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

describe('M01 — columnas', () => {
  const answer = (columns: string[]): MissionAnswer => ({ type: 'drag-column', columns });
  it('acepta NOMBRE, SALARIO sin distinguir caja', () => {
    expect(kind('M01', answer(['NOMBRE', 'SALARIO']))).toBe('correct');
    expect(kind('M01', answer(['nombre', 'salario']))).toBe('correct');
  });
  it('explica orden invertido, columnas de más, incompletas y asterisco', () => {
    expect(feedback('M01', answer(['SALARIO', 'NOMBRE']))).toContain('orden');
    expect(feedback('M01', answer(['ID', 'NOMBRE', 'SALARIO']))).toContain('Sobran columnas');
    expect(feedback('M01', answer(['NOMBRE']))).toContain('Falta mostrar SALARIO');
    expect(feedback('M01', answer(['*']))).toContain('asterisco');
    expect(feedback('M01', answer(['SUELDO']))).toContain(
      'SUELDO no pertenece a la tabla EMPLEADOS',
    );
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M01', answer([]))).toBe('invalid-input');
  });
});

describe('M02 — orden de SQL', () => {
  const solution = [
    'm02-select',
    'm02-nombre',
    'm02-comma',
    'm02-ciudad',
    'm02-from',
    'm02-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'reorder-sql', pieceIds });
  it('acepta el orden correcto con o sin terminador', () => {
    expect(kind('M02', answer(solution))).toBe('correct');
    expect(kind('M02', answer([...solution, 'm02-end']))).toBe('correct');
  });
  it('explica columnas invertidas, columna tras FROM, falta de piezas y SELECT al final', () => {
    expect(
      feedback(
        'M02',
        answer([
          'm02-select',
          'm02-ciudad',
          'm02-comma',
          'm02-nombre',
          'm02-from',
          'm02-empleados',
        ]),
      ),
    ).toContain('orden');
    expect(
      feedback(
        'M02',
        answer([
          'm02-select',
          'm02-nombre',
          'm02-comma',
          'm02-empleados',
          'm02-from',
          'm02-ciudad',
        ]),
      ),
    ).toContain('es el nombre de la tabla');
    expect(feedback('M02', answer(['m02-select', 'm02-nombre']))).toContain('Usa todas las piezas');
    expect(
      feedback(
        'M02',
        answer([
          'm02-nombre',
          'm02-comma',
          'm02-ciudad',
          'm02-from',
          'm02-empleados',
          'm02-select',
        ]),
      ),
    ).toContain('SELECT');
    expect(kind('M02', answer(['m02-end', ...solution]))).toBe('incorrect');
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M02', answer([]))).toBe('invalid-input');
  });
});

describe('M03 — SELECT *', () => {
  const headers = ['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO'];
  const answer = (h: string[], rowCount: number | null): MissionAnswer => ({
    type: 'predict-result',
    headers: h,
    sourceRowIds: [],
    rowCount,
  });
  it('acepta los seis encabezados en orden y seis filas', () => {
    expect(kind('M03', answer(headers, 6))).toBe('correct');
  });
  it('rechaza *, orden cambiado, columnas faltantes y conteo erróneo', () => {
    expect(feedback('M03', answer(['*'], 6))).toContain('asterisco no es una columna');
    expect(feedback('M03', answer([...headers].reverse(), 6))).toContain('orden del esquema');
    expect(kind('M03', answer(headers.slice(0, 5), 6))).toBe('incorrect');
    expect(feedback('M03', answer(headers, 1))).toContain('cuántas filas');
    expect(kind('M03', answer(headers, null))).toBe('incorrect');
    expect(kind('M03', answer([], null))).toBe('invalid-input');
  });
});

describe('M04 — predicción de resultado', () => {
  const all = [1, 2, 3, 4, 5, 6];
  const answer = (headers: string[], sourceRowIds: number[]): MissionAnswer => ({
    type: 'predict-result',
    headers,
    sourceRowIds,
    rowCount: null,
  });
  it('acepta NOMBRE, SALARIO con los seis empleados en cualquier orden', () => {
    expect(kind('M04', answer(['NOMBRE', 'SALARIO'], all))).toBe('correct');
    expect(kind('M04', answer(['nombre', 'salario'], [...all].reverse()))).toBe('correct');
  });
  it('explica filas faltantes: proyectar no filtra', () => {
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO'], [1, 2, 3]))).toContain(
      'Faltan 3 empleados',
    );
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO'], [1, 2, 3, 4, 5]))).toContain(
      'Faltan 1 empleado:',
    );
  });
  it('explica encabezados en otro orden o columnas ajenas', () => {
    expect(feedback('M04', answer(['SALARIO', 'NOMBRE'], all))).toContain(
      'orden escrito en SELECT',
    );
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO', 'EDAD'], all))).toContain(
      'solo tiene las columnas',
    );
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M04', answer([], []))).toBe('invalid-input');
  });
});

describe('M05 — expresión calculada', () => {
  const expression = ['m05-salario', 'm05-times', 'm05-12'];
  const values = (ana: number | null, pedro: number | null, maria: number | null) => [
    { employeeId: 1, value: ana },
    { employeeId: 4, value: pedro },
    { employeeId: 5, value: maria },
  ];
  const answer = (
    pieceIds: string[],
    predictions = values(36000000, 21600000, 44400000),
  ): MissionAnswer => ({
    type: 'expression-builder',
    pieceIds,
    predictions,
  });
  it('acepta salario * 12 y su forma conmutada con los valores exactos', () => {
    expect(kind('M05', answer(expression))).toBe('correct');
    expect(kind('M05', answer(['m05-12', 'm05-times', 'm05-salario']))).toBe('correct');
  });
  it('explica expresiones que no anualizan, sin SALARIO o incompletas', () => {
    expect(feedback('M05', answer(['m05-salario', 'm05-plus', 'm05-12']))).toContain('no calcula');
    expect(feedback('M05', answer(['m05-salario', 'm05-times', 'm05-100']))).toContain(
      'no calcula',
    );
    expect(feedback('M05', answer(['m05-edad', 'm05-times', 'm05-12']))).toContain('SALARIO');
    expect(feedback('M05', answer(['m05-salario', 'm05-times']))).toContain('incompleta');
    expect(feedback('M05', answer(['m05-salario', 'x']))).toContain('no pertenecen');
  });
  it('señala por nombre los valores calculados erróneos o vacíos', () => {
    expect(feedback('M05', answer(expression, values(36000000, 1800000, 44400000)))).toContain(
      'Pedro',
    );
    expect(feedback('M05', answer(expression, values(null, 21600000, 44400000)))).toContain('Ana');
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M05', answer([], values(null, null, null)))).toBe('invalid-input');
  });
});

describe('M06 — alias con AS', () => {
  const solution = [
    'm06-select',
    'm06-nombre',
    'm06-comma',
    'm06-expr',
    'm06-as',
    'm06-from',
    'm06-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'alias-builder', pieceIds });
  it('acepta el alias tras la expresión, con o sin terminador', () => {
    expect(kind('M06', answer(solution))).toBe('correct');
    expect(kind('M06', answer([...solution, 'm06-end']))).toBe('correct');
  });
  it('explica el alias junto a NOMBRE, sin AS o tras la tabla', () => {
    expect(
      feedback(
        'M06',
        answer([
          'm06-select',
          'm06-nombre',
          'm06-as',
          'm06-comma',
          'm06-expr',
          'm06-from',
          'm06-empleados',
        ]),
      ),
    ).toContain('NOMBRE');
    expect(feedback('M06', answer(solution.filter((id) => id !== 'm06-as')))).toContain('Sin AS');
    expect(
      feedback(
        'M06',
        answer([
          'm06-select',
          'm06-nombre',
          'm06-comma',
          'm06-expr',
          'm06-from',
          'm06-empleados',
          'm06-as',
        ]),
      ),
    ).toContain('después de la tabla');
  });
  it('rechaza consultas incompletas y la respuesta vacía no es intento', () => {
    expect(kind('M06', answer(['m06-expr', 'm06-as']))).toBe('incorrect');
    expect(kind('M06', answer([]))).toBe('invalid-input');
  });
});

describe('M07 — DISTINCT', () => {
  // Proyección: Bogotá, Cali, Bogotá, Medellín, Cali, Bogotá.
  const answer = (keptIndexes: number[]): MissionAnswer => ({
    type: 'distinct-result',
    keptIndexes,
  });
  it('acepta un ejemplar de cada ciudad, sea cual sea la fila conservada', () => {
    expect(kind('M07', answer([0, 1, 3]))).toBe('correct');
    expect(kind('M07', answer([5, 4, 3]))).toBe('correct');
  });
  it('explica duplicados restantes y ciudades eliminadas por completo', () => {
    expect(feedback('M07', answer([0, 1, 2, 3, 4, 5]))).toContain('repetidas');
    expect(feedback('M07', answer([0, 1]))).toContain('Medellín');
    expect(feedback('M07', answer([0, 2, 3]))).toContain('Cali');
  });
  it('ignora índices repetidos o ajenos y la respuesta vacía no es intento', () => {
    expect(kind('M07', answer([0, 0, 1, 3, 99]))).toBe('correct');
    expect(kind('M07', answer([]))).toBe('invalid-input');
  });
});

describe('M08 — detectar el error', () => {
  // Tokens: SELECT nombre salario FROM empleados ;  → huecos 1..5
  const answer = (gapIndex: number | null): MissionAnswer => ({ type: 'hotspot-error', gapIndex });
  it('acepta la coma entre nombre y salario', () => {
    expect(kind('M08', answer(2))).toBe('correct');
  });
  it('rechaza otros huecos con feedback de objetivo, no de sintaxis', () => {
    for (const gap of [1, 3, 4, 5]) expect(kind('M08', answer(gap))).toBe('incorrect');
    expect(feedback('M08', answer(1))).toContain('sigue sin cumplir el pedido');
  });
  it('la explicación aclara que sin coma es un alias implícito válido (LAB10)', () => {
    expect(getMissionDefinition('M08').explanation).toContain('Oracle lee salario como un alias');
  });
  it('rechaza huecos inexistentes y la respuesta vacía no es intento', () => {
    expect(kind('M08', answer(0))).toBe('incorrect');
    expect(kind('M08', answer(6))).toBe('incorrect');
    expect(kind('M08', answer(null))).toBe('invalid-input');
  });
});

describe('M09 — lenguaje a SQL', () => {
  const base = [
    'm09-select',
    'm09-nombre',
    'm09-comma-a',
    'm09-ciudad',
    'm09-comma-b',
    'm09-salario',
    'm09-from',
    'm09-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'build-query', pieceIds });
  it('acepta la consulta sin depender de qué coma se use ni del terminador', () => {
    expect(kind('M09', answer(base))).toBe('correct');
    const swappedCommas = [
      'm09-select',
      'm09-nombre',
      'm09-comma-b',
      'm09-ciudad',
      'm09-comma-a',
      'm09-salario',
      'm09-from',
      'm09-empleados',
      'm09-end',
    ];
    expect(kind('M09', answer(swappedCommas))).toBe('correct');
  });
  it('explica una coma ausente como alias implícito', () => {
    const noComma = [
      'm09-select',
      'm09-nombre',
      'm09-ciudad',
      'm09-comma-b',
      'm09-salario',
      'm09-from',
      'm09-empleados',
    ];
    expect(feedback('M09', answer(noComma))).toContain('como un alias');
  });
  it('explica asterisco, DISTINCT, columnas de más, faltantes y desordenadas', () => {
    expect(
      feedback('M09', answer(['m09-select', 'm09-star', 'm09-from', 'm09-empleados'])),
    ).toContain('asterisco');
    expect(feedback('M09', answer(['m09-select', 'm09-distinct', ...base.slice(1)]))).toContain(
      'DISTINCT',
    );
    expect(
      feedback(
        'M09',
        answer([...base.slice(0, 6), 'm09-comma-a', 'm09-edad', 'm09-from', 'm09-empleados']),
      ),
    ).toContain('Sobran');
    expect(
      feedback(
        'M09',
        answer([
          'm09-select',
          'm09-nombre',
          'm09-comma-a',
          'm09-ciudad',
          'm09-from',
          'm09-empleados',
        ]),
      ),
    ).toContain('Falta mostrar SALARIO');
    expect(
      feedback(
        'M09',
        answer([
          'm09-select',
          'm09-ciudad',
          'm09-comma-a',
          'm09-nombre',
          'm09-comma-b',
          'm09-salario',
          'm09-from',
          'm09-empleados',
        ]),
      ),
    ).toContain('orden');
    expect(
      feedback(
        'M09',
        answer(['m09-select', 'm09-nombre', 'm09-distinct', 'm09-from', 'm09-empleados']),
      ),
    ).toContain('DISTINCT va inmediatamente');
  });
  it('una respuesta vacía no es un intento y piezas ajenas se rechazan', () => {
    expect(kind('M09', answer([]))).toBe('invalid-input');
    expect(feedback('M09', answer(['m09-select', 'm02-nombre']))).toContain('no pertenecen');
  });
});

describe('M10 — reto escrito (motor compartido + Oracle)', () => {
  const m10 = (sql: string) => check('M10', { type: 'write-query', sql });
  const reference =
    'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados;';

  it('rechaza el editor vacío sin consumir intento', () => {
    expect(m10('   ').kind).toBe('invalid-input');
  });

  it('una consulta que cumple estructura y requisitos exige ejecución en Oracle con la sentencia canónica', () => {
    expect(m10(reference)).toEqual({
      kind: 'requires-execution',
      statement:
        'SELECT NOMBRE, CIUDAD, (SALARIO + 100000) * 12 AS PROYECCION_ANUAL FROM EMPLEADOS',
    });
    expect(
      m10('select nombre, ciudad, 12 * (100000 + salario) as Proyeccion_Anual from empleados'),
    ).toMatchObject({
      kind: 'requires-execution',
    });
  });

  it.each([
    [
      'un error de sintaxis del parser',
      'SELECT nombre ciudad salario FROM empleados',
      'Falta una coma',
    ],
    [
      'una columna desconocida',
      'SELECT nombre, ciudad, (sueldo + 100000) * 12 AS proyeccion_anual FROM empleados',
      'SUELDO',
    ],
    ['el asterisco', 'SELECT * FROM empleados', 'asterisco'],
    [
      'DISTINCT',
      'SELECT DISTINCT nombre, ciudad, salario * 12 AS proyeccion_anual FROM empleados',
      'DISTINCT',
    ],
    [
      'dos columnas',
      'SELECT nombre, (salario + 100000) * 12 AS proyeccion_anual FROM empleados',
      'tres columnas',
    ],
    [
      'sin cálculo sobre SALARIO',
      'SELECT nombre, ciudad, edad * 12 AS proyeccion_anual FROM empleados',
      'SALARIO',
    ],
    ['sin alias', 'SELECT nombre, ciudad, (salario + 100000) * 12 FROM empleados', 'Usa AS'],
    [
      'alias implícito',
      'SELECT nombre, ciudad, (salario + 100000) * 12 proyeccion_anual FROM empleados',
      'exige escribir AS',
    ],
    [
      'otro encabezado',
      'SELECT nombre, ciudad, (salario + 100000) * 12 AS anual FROM empleados',
      'PROYECCION_ANUAL',
    ],
    [
      'una consulta fuera de alcance',
      'SELECT nombre FROM empleados WHERE edad > 20',
      'unidad futura',
    ],
  ])('rechaza como intento académico %s', (_label, sql, text) => {
    expect(m10(sql)).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining(text) });
  });

  it('califica el resultado devuelto por Oracle comparándolo con la referencia', () => {
    const grade = getMissionDefinition('M10').rubric.gradeExecution!;
    const expected = {
      columns: ['NOMBRE', 'CIUDAD', 'PROYECCION_ANUAL'],
      rows: [
        ['Ana', 'Bogotá', 37200000],
        ['Carlos', 'Cali', 61200000],
        ['Laura', 'Bogotá', 51600000],
        ['Pedro', 'Medellín', 22800000],
        ['María', 'Cali', 45600000],
        ['Jorge', 'Bogotá', 34800000],
      ],
    };
    expect(grade(expected).kind).toBe('correct');
    expect(grade({ ...expected, rows: [...expected.rows].reverse() }).kind).toBe('correct');
    expect(grade({ ...expected, columns: ['NOMBRE', 'CIUDAD', 'TOTAL'] })).toMatchObject({
      kind: 'incorrect',
    });
    expect(grade({ ...expected, rows: expected.rows.slice(1) }).kind).toBe('incorrect');
  });
});
