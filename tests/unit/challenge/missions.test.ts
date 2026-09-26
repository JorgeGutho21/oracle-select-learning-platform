// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_COLUMNS } from '@/domain/dataset/empleados';
import {
  evaluateMissionAnswer,
  getMissionDefinition,
  MISSION_DEFINITIONS,
} from '@/features/challenge/domain/missions/definitions';
import {
  CHALLENGE_VERSION,
  PUBLIC_MISSIONS,
} from '@/features/challenge/domain/missions/public-catalog';
import { MISSION_PRIVATE } from '@/features/challenge/domain/missions/rubrics';
import {
  INTERACTION_TYPES,
  MISSION_IDS,
  type MissionAnswer,
  type MissionId,
  type RubricVerdict,
} from '@/features/challenge/domain/types';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';

const check = (id: MissionId, answer: MissionAnswer): RubricVerdict =>
  evaluateMissionAnswer(getMissionDefinition(id), answer);
const kind = (id: MissionId, answer: MissionAnswer) => check(id, answer).kind;
const feedback = (id: MissionId, answer: MissionAnswer) => {
  const outcome = check(id, answer);
  return outcome.kind === 'correct' || outcome.kind === 'incorrect' ? outcome.feedback : '';
};

describe('Catálogo público de misiones (Challenge v3)', () => {
  it('contiene exactamente diez misiones M01–M10 en orden', () => {
    expect(CHALLENGE_VERSION).toBe('select-challenge-v3');
    expect(PUBLIC_MISSIONS.map(({ id }) => id)).toEqual([...MISSION_IDS]);
    expect(PUBLIC_MISSIONS.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('suma 1000 puntos y 900 segundos base, como GAME_SPEC', () => {
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

  it('cada misión tiene pedido, tipo soportado, datos del mismo tipo y lecciones existentes', () => {
    const lessonIds = LESSON_INDEX.map(({ id }) => id as string);
    for (const mission of PUBLIC_MISSIONS) {
      expect(INTERACTION_TYPES).toContain(mission.interactionType);
      expect(mission.publicData.type).toBe(mission.interactionType);
      expect(mission.request.length).toBeGreaterThan(0);
      expect(mission.lessons.length).toBeGreaterThan(0);
      for (const lesson of mission.lessons) expect(lessonIds, mission.id).toContain(lesson);
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

  it('C03: ninguna misión exige construcciones de niveles futuros', () => {
    const serialized = JSON.stringify(PUBLIC_MISSIONS).toUpperCase();
    for (const future of [' JOIN ', ' GROUP BY ', ' HAVING ', 'UPPER(', 'COUNT(', 'NVL(']) {
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
    expect(feedback('M01', answer(['NOMBRE', 'SALARIO']))).toContain('20 empleados');
  });
  it('explica orden invertido, columnas de más, incompletas y asterisco', () => {
    expect(feedback('M01', answer(['SALARIO', 'NOMBRE']))).toContain('orden');
    expect(feedback('M01', answer(['ID_EMPLEADO', 'NOMBRE', 'SALARIO']))).toContain(
      'Sobran columnas',
    );
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

describe('M02 — orden de SQL con WHERE', () => {
  const solution = [
    'm02-select',
    'm02-nombre',
    'm02-comma',
    'm02-ciudad',
    'm02-from',
    'm02-empleados',
    'm02-where',
    'm02-condition',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'reorder-sql', pieceIds });
  it('acepta el orden correcto con o sin terminador', () => {
    expect(kind('M02', answer(solution))).toBe('correct');
    expect(kind('M02', answer([...solution, 'm02-end']))).toBe('correct');
  });
  it('explica columnas invertidas, WHERE antes de FROM, falta de piezas y SELECT al final', () => {
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
          'm02-where',
          'm02-condition',
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
          'm02-ciudad',
          'm02-where',
          'm02-condition',
          'm02-from',
          'm02-empleados',
        ]),
      ),
    ).toContain('Falta FROM antes de WHERE');
    expect(feedback('M02', answer(['m02-select', 'm02-nombre']))).toContain('Usa todas las piezas');
    expect(feedback('M02', answer([...solution.slice(1), 'm02-select']))).toContain('SELECT');
    expect(kind('M02', answer(['m02-end', ...solution]))).toBe('incorrect');
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M02', answer([]))).toBe('invalid-input');
  });
});

describe('M03 — SELECT *', () => {
  const headers = [...EMPLEADOS_COLUMNS];
  const answer = (h: string[], rowCount: number | null): MissionAnswer => ({
    type: 'predict-result',
    headers: h,
    sourceRowIds: [],
    rowCount,
  });
  it('acepta los 12 encabezados en orden y 20 filas', () => {
    expect(kind('M03', answer(headers, 20))).toBe('correct');
  });
  it('rechaza *, orden cambiado, columnas faltantes y conteo erróneo', () => {
    expect(feedback('M03', answer(['*'], 20))).toContain('asterisco no es una columna');
    expect(feedback('M03', answer([...headers].reverse(), 20))).toContain('orden del esquema');
    expect(kind('M03', answer(headers.slice(0, 11), 20))).toBe('incorrect');
    expect(feedback('M03', answer(headers, 6))).toContain('cuántas filas');
    expect(kind('M03', answer(headers, null))).toBe('incorrect');
    expect(kind('M03', answer([], null))).toBe('invalid-input');
  });
});

describe('M04 — predecir las filas de WHERE', () => {
  const cali = [4, 8, 11, 13, 16];
  const answer = (headers: string[], sourceRowIds: number[]): MissionAnswer => ({
    type: 'predict-result',
    headers,
    sourceRowIds,
    rowCount: null,
  });
  it('acepta NOMBRE, SALARIO con los empleados de Cali en cualquier orden', () => {
    expect(kind('M04', answer(['NOMBRE', 'SALARIO'], cali))).toBe('correct');
    expect(kind('M04', answer(['nombre', 'salario'], [...cali].reverse()))).toBe('correct');
  });
  it('explica filas de más (no son de Cali) y filas que faltan', () => {
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO'], [...cali, 1]))).toContain(
      'Ana no trabaja en Cali',
    );
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO'], [4, 8, 11]))).toContain(
      'Faltan 2 empleados de Cali',
    );
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO'], cali.slice(1)))).toContain(
      'Falta 1 empleado de Cali',
    );
  });
  it('explica encabezados en otro orden o columnas ajenas', () => {
    expect(feedback('M04', answer(['SALARIO', 'NOMBRE'], cali))).toContain(
      'orden escrito en SELECT',
    );
    expect(feedback('M04', answer(['NOMBRE', 'SALARIO', 'CIUDAD'], cali))).toContain(
      'solo tiene las columnas',
    );
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M04', answer([], []))).toBe('invalid-input');
  });
});

describe('M05 — expresión calculada', () => {
  const expression = ['m05-salario', 'm05-times', 'm05-12'];
  const values = (ana: number | null, sofia: number | null, felipe: number | null) => [
    { employeeId: 1, value: ana },
    { employeeId: 9, value: sofia },
    { employeeId: 18, value: felipe },
  ];
  const answer = (
    pieceIds: string[],
    predictions = values(108000000, 36000000, 25200000),
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
    expect(feedback('M05', answer(['m05-bono', 'm05-times', 'm05-12']))).toContain('SALARIO');
    expect(feedback('M05', answer(['m05-salario', 'm05-plus', 'm05-bono']))).toContain(
      'no calcula',
    );
    expect(feedback('M05', answer(['m05-salario', 'm05-times']))).toContain('incompleta');
    expect(feedback('M05', answer(['m05-salario', 'x']))).toContain('no pertenecen');
  });
  it('señala por nombre los valores calculados erróneos o vacíos', () => {
    expect(feedback('M05', answer(expression, values(108000000, 3000000, 25200000)))).toContain(
      'Sofía López',
    );
    expect(feedback('M05', answer(expression, values(null, 36000000, 25200000)))).toContain(
      'Ana Rojas',
    );
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

describe('M07 — DISTINCT sobre un resultado filtrado', () => {
  // Departamentos de Bogotá: Operaciones, TI, Recursos Humanos, TI, Ventas, Finanzas, Operaciones.
  const answer = (keptIndexes: number[]): MissionAnswer => ({
    type: 'distinct-result',
    keptIndexes,
  });
  it('la lista de partida sale de la consulta sin DISTINCT', () => {
    const data = getMissionDefinition('M07').publicData;
    expect(data.type === 'distinct-result' ? data.candidateValues : []).toEqual([
      'Operaciones',
      'TI',
      'Recursos Humanos',
      'TI',
      'Ventas',
      'Finanzas',
      'Operaciones',
    ]);
  });
  it('acepta un ejemplar de cada departamento, sea cual sea la fila conservada', () => {
    expect(kind('M07', answer([0, 1, 2, 4, 5]))).toBe('correct');
    expect(kind('M07', answer([6, 3, 2, 4, 5]))).toBe('correct');
  });
  it('explica duplicados restantes y departamentos eliminados por completo', () => {
    expect(feedback('M07', answer([0, 1, 2, 3, 4, 5, 6]))).toContain('repetidos');
    expect(feedback('M07', answer([0, 1, 2, 4]))).toContain('Finanzas');
  });
  it('ignora índices repetidos o ajenos y la respuesta vacía no es intento', () => {
    expect(kind('M07', answer([0, 0, 1, 2, 4, 5, 99]))).toBe('correct');
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

describe('M09 — lenguaje a SQL con ORDER BY', () => {
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
  const ordered = [...base, 'm09-order', 'm09-salario-orden', 'm09-desc'];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'build-query', pieceIds });
  it('acepta la consulta ordenada, sin depender de qué coma o pieza salario se use', () => {
    expect(kind('M09', answer(ordered))).toBe('correct');
    expect(kind('M09', answer([...ordered, 'm09-end']))).toBe('correct');
    const swapped = ordered.map((id) =>
      id === 'm09-salario'
        ? 'm09-salario-orden'
        : id === 'm09-salario-orden'
          ? 'm09-salario'
          : id === 'm09-comma-a'
            ? 'm09-comma-b'
            : id === 'm09-comma-b'
              ? 'm09-comma-a'
              : id,
    );
    expect(kind('M09', answer(swapped))).toBe('correct');
  });
  it('explica que falta el orden, que está al revés o que no sigue el salario', () => {
    expect(feedback('M09', answer(base))).toContain('sin ORDER BY');
    expect(
      feedback('M09', answer([...base, 'm09-order', 'm09-salario-orden', 'm09-asc'])),
    ).toContain('del más alto al más bajo');
    expect(feedback('M09', answer([...base, 'm09-order', 'm09-salario-orden']))).toContain(
      'del más alto al más bajo',
    );
    expect(feedback('M09', answer([...base, 'm09-order', 'm09-nombre', 'm09-desc']))).toContain(
      'no siguen el orden de SALARIO',
    );
  });
  it('explica coma ausente, asterisco, DISTINCT y columnas de más o faltantes', () => {
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
    expect(
      feedback('M09', answer(['m09-select', 'm09-star', 'm09-from', 'm09-empleados'])),
    ).toContain('asterisco');
    expect(feedback('M09', answer(['m09-select', 'm09-distinct', ...ordered.slice(1)]))).toContain(
      'DISTINCT',
    );
    expect(
      feedback(
        'M09',
        answer([...base.slice(0, 6), 'm09-comma-a', 'm09-bono', 'm09-from', 'm09-empleados']),
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
  });
  it('una respuesta vacía no es un intento y piezas ajenas se rechazan', () => {
    expect(kind('M09', answer([]))).toBe('invalid-input');
    expect(feedback('M09', answer(['m09-select', 'm02-nombre']))).toContain('no pertenecen');
  });
});

describe('M10 — reto escrito (motor compartido + Oracle)', () => {
  const m10 = (sql: string) => check('M10', { type: 'write-query', sql });
  const reference = `SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual
FROM empleados
WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá'
ORDER BY proyeccion_anual DESC;`;

  it('rechaza el editor vacío sin consumir intento', () => {
    expect(m10('   ').kind).toBe('invalid-input');
  });

  it('una consulta que cumple estructura y requisitos exige ejecución en Oracle con la sentencia canónica', () => {
    expect(m10(reference)).toEqual({
      kind: 'requires-execution',
      statement:
        "SELECT NOMBRE, CARGO, (SALARIO + 100000) * 12 AS PROYECCION_ANUAL FROM EMPLEADOS WHERE ESTADO = 'ACTIVO' AND CIUDAD = 'Bogotá' ORDER BY PROYECCION_ANUAL DESC",
    });
    expect(
      m10(
        "select nombre, cargo, 12 * (100000 + salario) as Proyeccion_Anual from empleados where ciudad = 'Bogotá' and estado = 'ACTIVO' order by salario desc",
      ),
    ).toMatchObject({ kind: 'requires-execution' });
  });

  it.each([
    ['un error de sintaxis', 'SELECT nombre cargo salario FROM empleados', 'Falta una coma'],
    [
      'una columna desconocida',
      "SELECT nombre, cargo, (sueldo + 100000) * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá' ORDER BY 3 DESC",
      'SUELDO',
    ],
    ['el asterisco', 'SELECT * FROM empleados', 'asterisco'],
    [
      'DISTINCT',
      "SELECT DISTINCT nombre, cargo, salario * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá' ORDER BY 3",
      'DISTINCT',
    ],
    [
      'dos columnas',
      'SELECT nombre, (salario + 100000) * 12 AS proyeccion_anual FROM empleados',
      'tres columnas',
    ],
    [
      'sin cálculo sobre SALARIO',
      'SELECT nombre, cargo, bono * 12 AS proyeccion_anual FROM empleados',
      'SALARIO',
    ],
    ['sin alias', 'SELECT nombre, cargo, (salario + 100000) * 12 FROM empleados', 'Usa AS'],
    [
      'alias implícito',
      'SELECT nombre, cargo, (salario + 100000) * 12 proyeccion_anual FROM empleados',
      'exige escribir AS',
    ],
    [
      'otro encabezado',
      'SELECT nombre, cargo, (salario + 100000) * 12 AS anual FROM empleados',
      'PROYECCION_ANUAL',
    ],
    [
      'sin WHERE',
      'SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados ORDER BY 3 DESC',
      'activos de Bogotá',
    ],
    [
      'sin ORDER BY',
      "SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá'",
      'orden',
    ],
    ['una construcción de un nivel futuro', 'SELECT nombre, COUNT(*) FROM empleados', 'Nivel 3'],
  ])('rechaza como intento académico %s', (_label, sql, text) => {
    expect(m10(sql)).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining(text) });
  });

  it('califica el resultado de Oracle: filas, columnas y orden de mayor a menor', () => {
    const grade = getMissionDefinition('M10').rubric.gradeExecution!;
    const expected = {
      columns: ['NOMBRE', 'CARGO', 'PROYECCION_ANUAL'],
      rows: [
        ['Ana', 'Gerente general', 109200000],
        ['Carlos', 'Líder de área', 91200000],
        ['Laura', 'Líder de área', 70800000],
        ['Andrés', 'Analista', 51600000],
        ['Mario', 'Representante comercial', 43200000],
        ['Felipe', 'Asistente', 26400000],
      ],
    };
    expect(grade(expected).kind).toBe('correct');
    expect(grade({ ...expected, rows: [...expected.rows].reverse() })).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('del más alto al más bajo'),
    });
    expect(grade({ ...expected, columns: ['NOMBRE', 'CARGO', 'TOTAL'] })).toMatchObject({
      kind: 'incorrect',
    });
    expect(grade({ ...expected, rows: expected.rows.slice(1) })).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('5 filas'),
    });
  });
});
