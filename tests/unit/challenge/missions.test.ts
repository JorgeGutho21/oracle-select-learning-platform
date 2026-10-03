// @vitest-environment node
import { describe, expect, it } from 'vitest';
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
  type EvaluationOutcome,
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
const incorrect = (id: MissionId, answer: MissionAnswer) => {
  const outcome = check(id, answer);
  if (outcome.kind !== 'incorrect') throw new Error(`Se esperaba incorrecta: ${outcome.kind}`);
  return outcome as Extract<EvaluationOutcome, { kind: 'incorrect' }>;
};

describe('Catálogo público de misiones (Challenge v4)', () => {
  it('contiene exactamente diez misiones M01–M10 en orden', () => {
    expect(CHALLENGE_VERSION).toBe('select-challenge-v4');
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

  it('ninguna misión es de opción única ABCD: M03 clasifica afirmaciones con su porqué', () => {
    const m03 = getMissionDefinition('M03').publicData;
    if (m03.type !== 'predict-result') throw new Error('M03');
    expect(m03.asks).toMatchObject({ columnCount: true, rowCount: true, claims: true });
    expect(m03.claims!.length).toBeGreaterThanOrEqual(4);
  });

  it('G15: la parte pública no incluye pistas, explicaciones, rúbricas ni correcciones', () => {
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
    // Ni la condición de M04 ni las correcciones de M08 viajan al navegador.
    expect(serialized).not.toContain("ciudad = 'Cali'");
    expect(serialized).not.toContain('IS NULL');
    expect(serialized).not.toContain('DISTINCT ciudad FROM empleados;');
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
      expect(definition.guide.concept).not.toBe(definition.guide.locate);
      expect(MISSION_PRIVATE[definition.id].interactionType).toBe(definition.interactionType);
    }
  });

  it('una respuesta de otro tipo no consume intento', () => {
    expect(kind('M01', { type: 'write-query', sql: 'SELECT 1' })).toBe('invalid-input');
  });
});

describe('M01 — columnas para contactar, sin datos salariales', () => {
  const answer = (columns: string[]): MissionAnswer => ({ type: 'drag-column', columns });
  it('acepta NOMBRE, CIUDAD, CORREO en ese orden, sin distinguir caja', () => {
    expect(kind('M01', answer(['NOMBRE', 'CIUDAD', 'CORREO']))).toBe('correct');
    expect(kind('M01', answer(['nombre', 'ciudad', 'correo']))).toBe('correct');
    expect(feedback('M01', answer(['NOMBRE', 'CIUDAD', 'CORREO']))).toContain(
      'Las filas siguen siendo las mismas',
    );
  });
  it('reconoce lo que está bien y explica lo que falta, sobra o el orden', () => {
    const missing = incorrect('M01', answer(['NOMBRE', 'CIUDAD']));
    expect(missing.good).toBe('Seleccionaste NOMBRE y CIUDAD correctamente.');
    expect(missing.feedback).toBe('El pedido también necesita CORREO.');
    expect(missing.category).toBe('columna');
    expect(feedback('M01', answer(['NOMBRE', 'CIUDAD', 'SALARIO', 'CORREO']))).toContain(
      'información salarial',
    );
    expect(feedback('M01', answer(['NOMBRE', 'APELLIDO', 'CIUDAD', 'CORREO']))).toContain(
      'Sobra APELLIDO',
    );
    const order = incorrect('M01', answer(['CIUDAD', 'NOMBRE', 'CORREO']));
    expect(order.feedback).toContain('El orden de las columnas importa');
    expect(order.category).toBe('orden');
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M01', answer([]))).toBe('invalid-input');
  });
});

describe('M02 — el orden de SQL con piezas que sobran', () => {
  const solution = [
    'm02-select',
    'm02-nombre',
    'm02-comma',
    'm02-ciudad',
    'm02-from',
    'm02-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'reorder-sql', pieceIds });
  it('acepta SELECT nombre, ciudad FROM empleados con o sin terminador', () => {
    expect(kind('M02', answer(solution))).toBe('correct');
    expect(kind('M02', answer([...solution, 'm02-end']))).toBe('correct');
  });
  it('explica por qué sobran WHERE, DISTINCT y el asterisco', () => {
    const where = incorrect('M02', answer([...solution, 'm02-where']));
    expect(where.feedback).toContain('no necesita WHERE');
    expect(where.category).toBe('concepto');
    expect(where.good).toContain('SELECT y FROM');
    expect(feedback('M02', answer(['m02-select', 'm02-distinct', ...solution.slice(1)]))).toContain(
      'sin quitar ninguno',
    );
    expect(
      feedback('M02', answer(['m02-select', 'm02-star', 'm02-from', 'm02-empleados'])),
    ).toContain('asterisco');
  });
  it('explica el orden de cláusulas y de columnas', () => {
    expect(
      feedback('M02', answer(['m02-from', 'm02-empleados', 'm02-select', 'm02-nombre'])),
    ).toContain('primero SELECT');
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
  });
  it('una respuesta vacía no es un intento', () => {
    expect(kind('M02', answer([]))).toBe('invalid-input');
  });
});

describe('M03 — qué hace y qué no hace SELECT *', () => {
  const right = {
    'star-column': false,
    'table-order': true,
    'drops-null': false,
    sorts: false,
    'select-controls': true,
  };
  const answer = (
    columnCount: number | null,
    rowCount: number | null,
    claims: Record<string, boolean | null> = right,
  ): MissionAnswer => ({
    type: 'predict-result',
    headers: [],
    sourceRowIds: [],
    rowCount,
    columnCount,
    claims: Object.entries(claims).map(([id, value]) => ({ id, value })),
  });
  it('acepta 12 columnas, 20 filas y las afirmaciones bien clasificadas', () => {
    expect(kind('M03', answer(12, 20))).toBe('correct');
  });
  it('explica columnas, filas y cada afirmación sin revelar la respuesta', () => {
    expect(feedback('M03', answer(11, 20))).toContain('representa todas las columnas');
    const rows = incorrect('M03', answer(12, 8));
    expect(rows.feedback).toContain('Sin WHERE ninguna fila se descarta');
    expect(rows.good).toContain('12 columnas');
    const claim = incorrect('M03', answer(12, 20, { ...right, 'drops-null': true }));
    expect(claim.feedback).toContain('Descarta a los empleados que tienen BONO en NULL');
    expect(claim.feedback).toContain('¿Hay alguna condición WHERE');
    expect(claim.feedback).not.toMatch(/\b(verdadera|falsa)\b/);
  });
  it('una respuesta incompleta no consume intento', () => {
    expect(kind('M03', answer(null, null, {}))).toBe('invalid-input');
    expect(kind('M03', answer(12, null))).toBe('invalid-input');
    expect(kind('M03', answer(12, 20, { ...right, sorts: null }))).toBe('invalid-input');
  });
});

describe('M04 — WHERE selecciona filas', () => {
  const condition = ['m04-where', 'm04-ciudad', 'm04-equals', 'm04-cali-text'];
  const cali = [4, 11, 16];
  const answer = (sourceRowIds: number[], conditionPieceIds = condition): MissionAnswer => ({
    type: 'predict-result',
    headers: [],
    sourceRowIds,
    rowCount: null,
    conditionPieceIds,
  });
  it('acepta las tres filas de Cali de la muestra y la condición con el texto entre comillas', () => {
    expect(kind('M04', answer(cali))).toBe('correct');
    expect(kind('M04', answer([...cali].reverse()))).toBe('correct');
    const success = feedback('M04', answer(cali));
    expect(success).toContain('WHERE selecciona FILAS');
    expect(success).toContain('SELECT selecciona COLUMNAS');
  });
  it('explica filas de más y filas que faltan, sin nombrar las que faltan', () => {
    expect(feedback('M04', answer([...cali, 1]))).toContain('Ana no trabaja en Cali');
    const missing = incorrect('M04', answer([4, 11]));
    expect(missing.feedback).toContain('Falta 1 fila');
    expect(missing.feedback).not.toContain('Julián');
    expect(missing.good).toContain('condición de WHERE es correcta');
  });
  it('explica la condición: comillas, columna equivocada y WHERE', () => {
    expect(
      feedback('M04', answer(cali, ['m04-where', 'm04-ciudad', 'm04-equals', 'm04-cali-bare'])),
    ).toContain('comillas simples');
    expect(
      feedback('M04', answer(cali, ['m04-where', 'm04-salario', 'm04-greater', 'm04-cali-text'])),
    ).toContain('numérica');
    expect(
      feedback('M04', answer(cali, ['m04-where', 'm04-ciudad', 'm04-greater', 'm04-cali-text'])),
    ).toContain('no conserva solo a los empleados de Cali');
    expect(feedback('M04', answer(cali, ['m04-ciudad', 'm04-equals', 'm04-cali-text']))).toContain(
      'empieza con WHERE',
    );
  });
  it('una respuesta incompleta no es un intento', () => {
    expect(kind('M04', answer([], []))).toBe('invalid-input');
    expect(kind('M04', answer(cali, []))).toBe('invalid-input');
    expect(kind('M04', answer([], condition))).toBe('invalid-input');
  });
});

describe('M05 — precedencia con y sin paréntesis', () => {
  const target = [
    'm05-open',
    'm05-salario',
    'm05-plus',
    'm05-bono',
    'm05-close',
    'm05-times',
    'm05-12',
  ];
  // Ana: SALARIO 9.000.000 y BONO 900.000.
  const predictions = (a: number | null, b: number | null) => [
    { employeeId: 1, expression: 'salario + bono * 12', value: a },
    { employeeId: 1, expression: '(salario + bono) * 12', value: b },
  ];
  const answer = (
    pieceIds: string[],
    values = predictions(19800000, 118800000),
  ): MissionAnswer => ({
    type: 'expression-builder',
    pieceIds,
    predictions: values,
  });
  it('acepta (salario + bono) * 12 y cualquier expresión equivalente', () => {
    expect(kind('M05', answer(target))).toBe('correct');
    expect(
      kind(
        'M05',
        answer([
          'm05-12',
          'm05-times',
          'm05-open',
          'm05-bono',
          'm05-plus',
          'm05-salario',
          'm05-close',
        ]),
      ),
    ).toBe('correct');
  });
  it('explica la precedencia cuando faltan los paréntesis', () => {
    const outcome = incorrect(
      'M05',
      answer(['m05-salario', 'm05-plus', 'm05-bono', 'm05-times', 'm05-12']),
    );
    expect(outcome.feedback).toContain('Sin paréntesis, * se calcula antes que +');
    expect(outcome.category).toBe('operador');
    expect(outcome.good).toContain('predicciones son correctas');
  });
  it('explica que falta el bono o que la expresión está incompleta', () => {
    expect(feedback('M05', answer(['m05-salario', 'm05-times', 'm05-12']))).toContain(
      'las dos columnas',
    );
    expect(feedback('M05', answer(['m05-open', 'm05-salario', 'm05-plus', 'm05-bono']))).toContain(
      'incompleta',
    );
  });
  it('orienta la predicción equivocada sin dar el valor', () => {
    const outcome = incorrect('M05', answer(target, predictions(118800000, 118800000)));
    expect(outcome.feedback).toContain('salario + bono * 12');
    expect(outcome.feedback).toContain('¿qué operación hace Oracle primero?');
    expect(outcome.feedback).not.toContain('19');
  });
  it('una respuesta incompleta no es un intento', () => {
    expect(kind('M05', answer([], predictions(null, null)))).toBe('invalid-input');
    expect(kind('M05', answer(target, predictions(19800000, null)))).toBe('invalid-input');
    expect(kind('M05', answer([]))).toBe('invalid-input');
  });
});

describe('M06 — AS cambia solo el encabezado', () => {
  const solution = [
    'm06-select',
    'm06-nombre',
    'm06-comma',
    'm06-expr',
    'm06-as',
    'm06-alias',
    'm06-from',
    'm06-empleados',
  ];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'alias-builder', pieceIds });
  const swap = (from: string, to: string) => solution.map((id) => (id === from ? to : id));
  it('acepta AS salario_anual tras la expresión, con o sin terminador', () => {
    expect(kind('M06', answer(solution))).toBe('correct');
    expect(kind('M06', answer([...solution, 'm06-end']))).toBe('correct');
    expect(feedback('M06', answer(solution))).toContain('solo cambia el encabezado');
  });
  it('explica el alias entre comillas simples, sin AS o sin alias', () => {
    expect(feedback('M06', answer(swap('m06-alias', 'm06-quoted')))).toContain('comillas simples');
    expect(feedback('M06', answer(solution.filter((id) => id !== 'm06-as')))).toContain(
      'escribir AS',
    );
    expect(
      feedback('M06', answer(solution.filter((id) => id !== 'm06-as' && id !== 'm06-alias'))),
    ).toContain('SALARIO*12');
  });
  it('explica el alias junto a NOMBRE o tras la tabla', () => {
    expect(
      feedback(
        'M06',
        answer([
          'm06-select',
          'm06-nombre',
          'm06-as',
          'm06-alias',
          'm06-comma',
          'm06-expr',
          'm06-from',
          'm06-empleados',
        ]),
      ),
    ).toContain('NOMBRE');
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
          'm06-alias',
        ]),
      ),
    ).toContain('después de la tabla');
  });
  it('la respuesta vacía no es intento', () => {
    expect(kind('M06', answer([]))).toBe('invalid-input');
  });
});

describe('M07 — DISTINCT con una columna y con un par', () => {
  const answer = (values: string[], pairCount: number | null): MissionAnswer => ({
    type: 'distinct-result',
    values,
    pairCount,
  });
  it('acepta las tres ciudades de los analistas, en cualquier orden, y 6 pares', () => {
    expect(kind('M07', answer(['Bogotá', 'Medellín', 'Cali'], 6))).toBe('correct');
    expect(kind('M07', answer(['Cali', 'Bogotá', 'Medellín'], 6))).toBe('correct');
  });
  it('explica valores inventados y valores que faltan', () => {
    expect(feedback('M07', answer(['Bogotá', 'Medellín', 'Cali', 'Barranquilla'], 6))).toContain(
      'Barranquilla no aparece',
    );
    expect(feedback('M07', answer(['Bogotá', 'Medellín'], 6))).toContain('Falta 1 ciudad');
  });
  it('explica que con dos columnas se compara el par completo', () => {
    const pair = incorrect('M07', answer(['Bogotá', 'Medellín', 'Cali'], 3));
    expect(pair.feedback).toContain('PAR completo');
    expect(pair.category).toBe('concepto');
    expect(pair.good).toContain('ciudades que marcaste');
    expect(feedback('M07', answer(['Bogotá', 'Medellín', 'Cali'], 4))).toContain(
      'Cuenta los pares',
    );
  });
  it('una respuesta incompleta no es intento', () => {
    expect(kind('M07', answer([], null))).toBe('invalid-input');
    expect(kind('M07', answer(['Cali'], null))).toBe('invalid-input');
  });
});

describe('M08 — clasificar, localizar y corregir', () => {
  const variants = [
    ['coma', 'concepto', 1, 'SELECT nombre, salario FROM empleados;'],
    ['from', 'sintaxis', 4, 'SELECT nombre, ciudad FROM empleados;'],
    ['comillas', 'semantica', 7, "SELECT nombre FROM empleados WHERE ciudad = 'Cali';"],
    ['doble-coma', 'sintaxis', 3, 'SELECT nombre, cargo, ciudad FROM empleados;'],
    ['parentesis', 'sintaxis', 6, 'SELECT nombre, (salario + bono) * 12 FROM empleados;'],
    ['igual-null', 'concepto', 7, 'SELECT nombre FROM empleados WHERE bono IS NULL;'],
    ['in', 'sintaxis', 6, "SELECT nombre FROM empleados WHERE ciudad IN ('Cali', 'Medellín');"],
    ['distinct', 'sintaxis', 2, 'SELECT DISTINCT ciudad FROM empleados;'],
  ] as const;
  const answer = (
    variantId: string,
    errorKind: 'sintaxis' | 'semantica' | 'concepto' | null,
    tokenIndex: number | null,
    sql: string,
  ): MissionAnswer => ({ type: 'hotspot-error', variantId, kind: errorKind, tokenIndex, sql });

  it('cubre los ocho errores estudiados', () => {
    const data = getMissionDefinition('M08').publicData;
    if (data.type !== 'hotspot-error') throw new Error('M08');
    expect(data.variants.map(({ id }) => id)).toEqual(variants.map(([id]) => id));
  });

  it.each(variants)(
    'acepta la variante %s bien clasificada, localizada y corregida',
    (id, errorKind, token, fix) => {
      const outcome = check('M08', answer(id, errorKind, token, fix));
      expect(outcome.kind).toBe('correct');
      expect(feedback('M08', answer(id, errorKind, token, fix))).toContain(
        { sintaxis: 'sintaxis', semantica: 'semántica', concepto: 'concepto' }[errorKind],
      );
    },
  );

  it('un tipo equivocado orienta con preguntas, sin revelarlo', () => {
    const outcome = incorrect(
      'M08',
      answer('coma', 'sintaxis', 1, 'SELECT nombre, salario FROM empleados'),
    );
    expect(outcome.feedback).toContain('¿Oracle podría leer esta consulta?');
    expect(outcome.category).toBeUndefined();
    expect(outcome.good).toContain('Localizaste bien');
  });

  it('una zona equivocada o una corrección que no cumple el pedido se explican', () => {
    expect(
      feedback(
        'M08',
        answer('comillas', 'semantica', 1, "SELECT nombre FROM empleados WHERE ciudad = 'Cali'"),
      ),
    ).toContain('no está en la parte que tocaste');
    const fix = incorrect(
      'M08',
      answer('in', 'sintaxis', 6, "SELECT nombre FROM empleados WHERE ciudad IN ('Cali')"),
    );
    expect(fix.feedback).toContain('5 filas');
    expect(fix.good).toContain('Clasificaste bien: es un error de sintaxis');
    expect(
      feedback('M08', answer('distinct', 'sintaxis', 2, 'SELECT ciudad, DISTINCT FROM empleados')),
    ).toBeTruthy();
  });

  it('una respuesta incompleta o sin corregir no es un intento', () => {
    expect(kind('M08', answer('coma', null, null, ''))).toBe('invalid-input');
    expect(
      kind('M08', answer('coma', 'concepto', null, 'SELECT nombre, salario FROM empleados')),
    ).toBe('invalid-input');
    expect(
      kind('M08', answer('coma', 'concepto', 1, 'SELECT nombre salario FROM empleados;')),
    ).toBe('invalid-input');
    expect(kind('M08', answer('inexistente', 'concepto', 1, 'x'))).toBe('invalid-input');
  });
});

describe('M09 — del lenguaje al SQL con WHERE combinado y ORDER BY', () => {
  const select = [
    'm09-select',
    'm09-nombre',
    'm09-comma-a',
    'm09-ciudad',
    'm09-comma-b',
    'm09-salario',
    'm09-from',
    'm09-empleados',
  ];
  const where = (join = 'm09-and', operator = 'm09-gte') => [
    'm09-where',
    'm09-ciudad-w',
    'm09-in',
    'm09-list',
    join,
    'm09-salario-w',
    operator,
    'm09-4200000',
  ];
  const order = (direction = 'm09-desc') => ['m09-order', 'm09-salario-o', direction];
  const answer = (pieceIds: string[]): MissionAnswer => ({ type: 'build-query', pieceIds });
  it('acepta la consulta completa, sin depender de qué pieza salario se use', () => {
    expect(kind('M09', answer([...select, ...where(), ...order()]))).toBe('correct');
    expect(kind('M09', answer([...select, ...where(), ...order(), 'm09-end']))).toBe('correct');
    const swapped = [...select, ...where(), ...order()].map((id) =>
      id === 'm09-salario' ? 'm09-salario-o' : id === 'm09-salario-o' ? 'm09-salario' : id,
    );
    expect(kind('M09', answer(swapped))).toBe('correct');
  });
  it('explica OR en lugar de AND y > en lugar de >=', () => {
    expect(feedback('M09', answer([...select, ...where('m09-or'), ...order()]))).toContain(
      'cómo se une',
    );
    const limit = incorrect('M09', answer([...select, ...where('m09-and', 'm09-gt'), ...order()]));
    expect(limit.feedback).toContain('exactamente 4.200.000');
    expect(limit.category).toBe('operador');
  });
  it('explica la falta de condiciones, el orden y DISTINCT', () => {
    expect(feedback('M09', answer([...select, ...order()]))).toContain('Faltan las condiciones');
    expect(feedback('M09', answer([...select, ...where()]))).toContain('sin ORDER BY');
    expect(feedback('M09', answer([...select, ...where(), ...order('m09-asc')]))).toContain(
      'del más alto al más bajo',
    );
    expect(
      feedback(
        'M09',
        answer(['m09-select', 'm09-distinct', ...select.slice(1), ...where(), ...order()]),
      ),
    ).toContain('DISTINCT');
  });
  it('una respuesta vacía no es un intento y piezas ajenas se rechazan', () => {
    expect(kind('M09', answer([]))).toBe('invalid-input');
    expect(feedback('M09', answer(['m09-select', 'm02-nombre']))).toContain('no pertenecen');
  });
});

describe('M10 — reto escrito (motor compartido + Oracle)', () => {
  const m10 = (sql: string) => check('M10', { type: 'write-query', sql });
  const reference = `SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual
FROM empleados
WHERE estado = 'ACTIVO' AND ciudad IN ('Bogotá', 'Cali')
ORDER BY proyeccion_anual DESC;`;

  it('rechaza el editor vacío sin consumir intento', () => {
    expect(m10('   ').kind).toBe('invalid-input');
  });

  it('una consulta que cumple estructura y requisitos exige ejecución en Oracle con la sentencia canónica', () => {
    expect(m10(reference)).toEqual({
      kind: 'requires-execution',
      statement:
        "SELECT NOMBRE, CIUDAD, (SALARIO + 100000) * 12 AS PROYECCION_ANUAL FROM EMPLEADOS WHERE ESTADO = 'ACTIVO' AND CIUDAD IN ('Bogotá', 'Cali') ORDER BY PROYECCION_ANUAL DESC",
    });
    expect(
      m10(
        "select nombre, ciudad, 12 * (100000 + salario) as Proyeccion_Anual from empleados where (ciudad = 'Bogotá' or ciudad = 'Cali') and estado = 'ACTIVO' order by salario desc",
      ),
    ).toMatchObject({ kind: 'requires-execution' });
  });

  it.each([
    ['un error de sintaxis', 'SELECT nombre ciudad salario FROM empleados', 'Falta una coma'],
    [
      'una columna desconocida',
      "SELECT nombre, ciudad, (sueldo + 100000) * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá' ORDER BY 3 DESC",
      'SUELDO',
    ],
    ['el asterisco', 'SELECT * FROM empleados', 'asterisco'],
    [
      'DISTINCT',
      "SELECT DISTINCT nombre, ciudad, salario * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá' ORDER BY 3",
      'DISTINCT',
    ],
    [
      'dos columnas',
      'SELECT nombre, (salario + 100000) * 12 AS proyeccion_anual FROM empleados',
      'tres columnas',
    ],
    [
      'sin cálculo sobre SALARIO',
      'SELECT nombre, ciudad, bono * 12 AS proyeccion_anual FROM empleados',
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
      'sin WHERE',
      'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados ORDER BY 3 DESC',
      'activos de Bogotá o Cali',
    ],
    [
      'sin ORDER BY',
      "SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE ciudad = 'Bogotá'",
      'orden',
    ],
    ['una construcción de un nivel futuro', 'SELECT nombre, COUNT(*) FROM empleados', 'Nivel 3'],
  ])('rechaza como intento académico %s', (_label, sql, text) => {
    expect(m10(sql)).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining(text) });
  });

  it('califica el resultado de Oracle: filas, columnas y orden de mayor a menor', () => {
    const grade = getMissionDefinition('M10').rubric.gradeExecution!;
    const expected = {
      columns: ['NOMBRE', 'CIUDAD', 'PROYECCION_ANUAL'],
      rows: [
        ['Ana', 'Bogotá', 109200000],
        ['Carlos', 'Bogotá', 91200000],
        ['Jorge', 'Cali', 82800000],
        ['Laura', 'Bogotá', 70800000],
        ['Camila', 'Cali', 55200000],
        ['Andrés', 'Bogotá', 51600000],
        ['Mario', 'Bogotá', 43200000],
        ['Valentina', 'Cali', 36000000],
        ['Julián', 'Cali', 28800000],
        ['Felipe', 'Bogotá', 26400000],
      ],
    };
    expect(grade(expected).kind).toBe('correct');
    expect(grade({ ...expected, rows: [...expected.rows].reverse() })).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('del más alto al más bajo'),
    });
    expect(grade({ ...expected, columns: ['NOMBRE', 'CIUDAD', 'TOTAL'] })).toMatchObject({
      kind: 'incorrect',
    });
    // AND sin paréntesis alrededor de OR: Oscar (Cali, INACTIVO) entra de más.
    expect(
      grade({ ...expected, rows: [...expected.rows, ['Oscar', 'Cali', 46800000]] }),
    ).toMatchObject({
      kind: 'incorrect',
      feedback: expect.stringContaining('AND se evalúa antes que OR'),
    });
  });
});
