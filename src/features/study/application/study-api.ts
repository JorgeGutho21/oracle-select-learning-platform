import {
  analyzeLabQuery,
  EMPLEADOS,
  type LabAnalysis,
} from '@/features/laboratory/application/lab-api';
import { compareResults } from '@/domain/results/result-table';
import { LESSON_OUTLINE, type LessonId, type LessonOutline } from '../domain/lesson-outline';

export type { LessonId } from '../domain/lesson-outline';

export const STUDY_RELEASE_ID = 'select-study-v1';

export type StudyActivity =
  | { readonly kind: 'table-parts' }
  | { readonly kind: 'select-columns' }
  | { readonly kind: 'expand-star' }
  | { readonly kind: 'order-columns' }
  | { readonly kind: 'assign-alias' }
  | {
      readonly kind: 'choice';
      readonly prompt: string;
      readonly options: readonly string[];
      readonly answer: number;
      readonly success: string;
    }
  | { readonly kind: 'precedence' }
  | { readonly kind: 'distinct-counts' }
  | { readonly kind: 'query'; readonly prompt: string };

/**
 * Paso del «efecto visual» de una lección. Los datos siempre salen del dataset único y
 * del motor educativo: la lección solo declara qué se resalta y qué consulta se muestra.
 */
export type TransformationStep =
  | {
      readonly kind: 'source';
      readonly title: string;
      readonly caption: string;
      /** Columnas resaltadas de la tabla fuente. */
      readonly columns: readonly string[];
      /** Fila resaltada (índice), para señalar un registro. */
      readonly row?: number;
    }
  | {
      readonly kind: 'result';
      readonly title: string;
      readonly caption: string;
      readonly sql: string;
      readonly analysis: LabAnalysis;
      /** Filas que repiten una anterior: DISTINCT las eliminaría. */
      readonly duplicateRows: readonly number[];
    };

type StepSeed =
  | Extract<TransformationStep, { kind: 'source' }>
  | {
      readonly kind: 'result';
      readonly title: string;
      readonly caption: string;
      readonly sql: string;
      readonly markDuplicates?: boolean;
    };

export interface StudyVisualExample {
  readonly label: string;
  readonly sql: string;
  readonly analysis: LabAnalysis;
}

export interface StudyLesson extends LessonOutline {
  readonly version: number;
  readonly objective: string;
  /** Explicación cotidiana, sin tecnicismos. */
  readonly explanation: string;
  /** Patrón general de la sintaxis. */
  readonly syntax: string;
  /** Ejemplo canónico con el dataset EMPLEADOS. */
  readonly sql: string;
  readonly translation: string;
  readonly frequentError: string;
  readonly sourceReference: string;
  readonly activity: StudyActivity;
  readonly analysis: LabAnalysis;
  readonly steps: readonly TransformationStep[];
  readonly visualExamples: readonly StudyVisualExample[];
}

interface LessonSeed {
  readonly id: LessonId;
  readonly objective: string;
  readonly explanation: string;
  readonly syntax: string;
  readonly sql: string;
  readonly translation: string;
  readonly frequentError: string;
  readonly sourceReference: string;
  readonly activity: StudyActivity;
  readonly steps: readonly StepSeed[];
  readonly visualExamples?: readonly Omit<StudyVisualExample, 'analysis'>[];
}

const seeds: readonly LessonSeed[] = [
  {
    id: 'L00',
    objective: 'Distinguir una tabla, una fila, una columna y su encabezado antes de escribir SQL.',
    explanation:
      'Una tabla se parece a una hoja de cálculo ordenada: cada fila describe a un empleado y cada columna guarda el mismo tipo de dato para todos. SQL es el lenguaje para pedirle datos a esa tabla.',
    syntax: 'SELECT columna\nFROM tabla;',
    sql: 'SELECT nombre\nFROM empleados;',
    translation: 'Muestra la columna NOMBRE de cada fila de EMPLEADOS.',
    frequentError:
      'SQL no es «solo lectura»: también puede modificar datos. En esta unidad usamos únicamente consultas SELECT, que leen sin cambiar nada.',
    sourceReference: 'F1, diapositivas 3–4; F2, diapositivas 2–3.',
    activity: { kind: 'table-parts' },
    steps: [
      {
        kind: 'source',
        title: 'Una fila',
        caption: 'Cada fila es un empleado. La primera guarda todos los datos de Ana.',
        columns: [],
        row: 0,
      },
      {
        kind: 'source',
        title: 'Una columna',
        caption: 'Cada columna es un dato de todos los empleados. CIUDAD es su encabezado.',
        columns: ['CIUDAD'],
      },
      {
        kind: 'result',
        title: 'Una consulta',
        caption: 'Una consulta pide datos a la tabla: aquí, el NOMBRE de cada fila.',
        sql: 'SELECT nombre FROM empleados;',
      },
    ],
  },
  {
    id: 'L01',
    objective: 'Elegir las columnas que aparecerán en el resultado sin cambiar la tabla fuente.',
    explanation:
      'SELECT funciona como pedir solo los campos útiles de una lista. Los seis empleados siguen allí; cambia la vista, no los datos guardados.',
    syntax: 'SELECT columna1, columna2\nFROM tabla;',
    sql: 'SELECT nombre, salario\nFROM empleados;',
    translation: 'De EMPLEADOS, muestra NOMBRE y SALARIO para las seis filas.',
    frequentError:
      'Seleccionar columnas no borra las demás de EMPLEADOS; solo decide qué muestra este resultado.',
    sourceReference: 'F1, diapositiva 4; F2, diapositivas 4 y 6.',
    activity: { kind: 'select-columns' },
    steps: [
      {
        kind: 'source',
        title: 'La tabla completa',
        caption: 'EMPLEADOS tiene seis columnas y seis filas.',
        columns: [],
      },
      {
        kind: 'source',
        title: 'SELECT elige',
        caption: 'SELECT nombre, salario toma solo esas dos columnas.',
        columns: ['NOMBRE', 'SALARIO'],
      },
      {
        kind: 'result',
        title: 'El resultado',
        caption: 'Dos columnas y las mismas seis filas. La tabla no cambió.',
        sql: 'SELECT nombre, salario FROM empleados;',
      },
    ],
  },
  {
    id: 'L02',
    objective: 'Reconocer FROM y ubicar la tabla después de la lista de columnas.',
    explanation:
      'Si SELECT responde «qué», FROM responde «de dónde». EMPLEADOS es la tabla; NOMBRE es una columna dentro de ella.',
    syntax: 'SELECT columnas\nFROM nombre_de_tabla;',
    sql: 'SELECT nombre\nFROM empleados;',
    translation: 'Muestra NOMBRE tomando los datos de la tabla EMPLEADOS.',
    frequentError: 'FROM recibe el nombre de una tabla, no el de una columna.',
    sourceReference: 'F1, diapositiva 5; F2, diapositiva 4.',
    activity: {
      kind: 'choice',
      prompt: 'Completa: SELECT nombre ___ empleados;',
      options: ['FROM', 'AS', 'DISTINCT'],
      answer: 0,
      success: 'Correcto: FROM conecta la proyección con su origen.',
    },
    steps: [
      {
        kind: 'source',
        title: 'FROM empleados',
        caption: 'FROM señala la tabla de la que salen los datos.',
        columns: [],
      },
      {
        kind: 'source',
        title: 'SELECT nombre',
        caption: 'Dentro de esa tabla, SELECT toma la columna NOMBRE.',
        columns: ['NOMBRE'],
      },
      {
        kind: 'result',
        title: 'El resultado',
        caption: 'Una columna, seis filas: una por empleado.',
        sql: 'SELECT nombre FROM empleados;',
      },
    ],
  },
  {
    id: 'L03',
    objective: 'Usar * para mostrar las seis columnas visibles de EMPLEADOS.',
    explanation:
      'Después de SELECT, el asterisco es un atajo para decir «todas las columnas», en el orden en que están en la tabla.',
    syntax: 'SELECT *\nFROM tabla;',
    sql: 'SELECT *\nFROM empleados;',
    translation: 'Muestra todas las columnas y todas las filas de EMPLEADOS.',
    frequentError:
      'Aquí * significa «todas las columnas»; dentro de una expresión numérica significa multiplicación.',
    sourceReference: 'F1, diapositiva 6; F2, diapositiva 5.',
    activity: { kind: 'expand-star' },
    steps: [
      {
        kind: 'source',
        title: 'SELECT *',
        caption: 'El asterisco no nombra columnas: las toma todas.',
        columns: [],
      },
      {
        kind: 'source',
        title: '* se expande',
        caption: '* equivale a ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO.',
        columns: ['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO'],
      },
      {
        kind: 'result',
        title: 'El resultado',
        caption: 'Seis columnas y seis filas, en el orden de la tabla.',
        sql: 'SELECT * FROM empleados;',
      },
    ],
  },
  {
    id: 'L04',
    objective: 'Separar columnas con coma y conservar en el resultado el orden escrito.',
    explanation:
      'Una consulta puede pedir una vista más pequeña y ordenarla para la pregunta actual. CIUDAD aparece antes de NOMBRE porque así se escribió.',
    syntax: 'SELECT columna_a, columna_b\nFROM tabla;',
    sql: 'SELECT ciudad, nombre\nFROM empleados;',
    translation: 'Muestra primero CIUDAD y después NOMBRE para los seis empleados.',
    frequentError: 'Proyectar una columna no elimina valores repetidos automáticamente.',
    sourceReference: 'F1, diapositiva 7; F2, diapositiva 6.',
    activity: { kind: 'order-columns' },
    steps: [
      {
        kind: 'source',
        title: 'Dos columnas',
        caption: 'En la tabla, NOMBRE está antes que CIUDAD.',
        columns: ['NOMBRE', 'CIUDAD'],
      },
      {
        kind: 'result',
        title: 'ciudad, nombre',
        caption: 'El resultado sigue el orden de SELECT: CIUDAD primero.',
        sql: 'SELECT ciudad, nombre FROM empleados;',
      },
      {
        kind: 'result',
        title: 'nombre, ciudad',
        caption: 'Al invertir la lista, se invierten las columnas. Las filas son las mismas.',
        sql: 'SELECT nombre, ciudad FROM empleados;',
      },
    ],
  },
  {
    id: 'L05',
    objective: 'Calcular valores y usar paréntesis para expresar el orden deseado.',
    explanation:
      'Una expresión calcula un valor nuevo en cada fila, sin modificar SALARIO. Como en aritmética, multiplicación y división van antes que suma y resta; los paréntesis cambian ese orden.',
    syntax: 'SELECT columna, expresión\nFROM tabla;\n-- expresión: columna operador valor',
    sql: 'SELECT nombre, salario * 12\nFROM empleados;',
    translation: 'Muestra cada nombre y calcula doce salarios mensuales.',
    frequentError:
      'salario + 100000 * 12 no suma primero: para Ana da 4.200.000; (salario + 100000) * 12 da 37.200.000.',
    sourceReference: 'F1, diapositiva 8; F2, diapositiva 8.',
    activity: { kind: 'precedence' },
    steps: [
      {
        kind: 'source',
        title: 'El dato de partida',
        caption: 'SALARIO guarda el salario mensual de cada empleado.',
        columns: ['SALARIO'],
      },
      {
        kind: 'result',
        title: 'Fila por fila',
        caption: 'Cada fila calcula su propio SALARIO × 12. La columna SALARIO no cambia.',
        sql: 'SELECT nombre, salario, salario * 12 FROM empleados;',
      },
      {
        kind: 'result',
        title: 'El resultado',
        caption: 'Sin alias, el encabezado del cálculo es la propia expresión.',
        sql: 'SELECT nombre, salario * 12 FROM empleados;',
      },
    ],
    visualExamples: [
      {
        label: 'Multiplicación antes que suma · Ana: 4.200.000',
        sql: 'SELECT salario + 100000 * 12 AS total FROM empleados;',
      },
      {
        label: 'Paréntesis primero · Ana: 37.200.000',
        sql: 'SELECT (salario + 100000) * 12 AS total FROM empleados;',
      },
    ],
  },
  {
    id: 'L06',
    objective: 'Asignar una etiqueta a un cálculo sin renombrar la columna almacenada.',
    explanation:
      'Un alias es el rótulo del resultado, como el título de una columna en un informe. AS hace explícita esa intención.',
    syntax: 'SELECT expresión AS alias\nFROM tabla;',
    sql: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    translation: 'Calcula doce salarios y llama SALARIO_ANUAL a esa columna del resultado.',
    frequentError: 'AS no cambia SALARIO en la tabla; solo cambia el encabezado de esta consulta.',
    sourceReference: 'F1, diapositiva 9; F2, diapositiva 8.',
    activity: { kind: 'assign-alias' },
    steps: [
      {
        kind: 'result',
        title: 'Sin alias',
        caption: 'El encabezado del cálculo es la expresión: difícil de leer.',
        sql: 'SELECT nombre, salario * 12 FROM empleados;',
      },
      {
        kind: 'result',
        title: 'Con AS',
        caption: 'AS salario_anual pone un encabezado claro al mismo cálculo.',
        sql: 'SELECT nombre, salario * 12 AS salario_anual FROM empleados;',
      },
      {
        kind: 'source',
        title: 'La tabla sigue igual',
        caption: 'EMPLEADOS conserva SALARIO: el alias solo existe en el resultado.',
        columns: ['SALARIO'],
      },
    ],
  },
  {
    id: 'L07',
    objective: 'Eliminar duplicados de toda la fila proyectada.',
    explanation:
      'DISTINCT conserva una sola copia de cada combinación seleccionada. Una columna produce tres ciudades; al añadir DEPTO se comparan pares completos y aparecen cinco.',
    syntax: 'SELECT DISTINCT columnas\nFROM tabla;',
    sql: 'SELECT DISTINCT ciudad\nFROM empleados;',
    translation: 'Muestra cada CIUDAD diferente una sola vez.',
    frequentError:
      'Con dos columnas, DISTINCT no mira solo CIUDAD: compara el par CIUDAD–DEPTO completo.',
    sourceReference: 'F1, diapositiva 10; F2, diapositiva 7.',
    activity: { kind: 'distinct-counts' },
    steps: [
      {
        kind: 'result',
        title: 'Sin DISTINCT',
        caption: 'SELECT ciudad devuelve seis filas; las marcadas repiten una anterior.',
        sql: 'SELECT ciudad FROM empleados;',
        markDuplicates: true,
      },
      {
        kind: 'result',
        title: 'Con DISTINCT',
        caption: 'Cada ciudad aparece una sola vez: tres filas.',
        sql: 'SELECT DISTINCT ciudad FROM empleados;',
      },
      {
        kind: 'result',
        title: 'Dos columnas',
        caption: 'Con CIUDAD y DEPTO se compara el par completo: cinco combinaciones.',
        sql: 'SELECT DISTINCT ciudad, depto FROM empleados;',
      },
    ],
    visualExamples: [
      {
        label: '6 filas → 3 ciudades distintas',
        sql: 'SELECT DISTINCT ciudad FROM empleados;',
      },
      {
        label: '6 filas → 5 pares distintos',
        sql: 'SELECT DISTINCT ciudad, depto FROM empleados;',
      },
    ],
  },
  {
    id: 'L08',
    objective: 'Traducir un pedido cotidiano a una consulta SELECT completa.',
    explanation:
      'Primero identifica qué debe verse, luego el origen y finalmente los cálculos o etiquetas necesarios. El orden de las columnas también forma parte del pedido.',
    syntax: 'SELECT columna, columna, expresión AS alias\nFROM tabla;',
    sql: 'SELECT nombre, ciudad,\n       salario * 12 AS salario_anual\nFROM empleados;',
    translation: 'De EMPLEADOS, muestra NOMBRE, CIUDAD y el SALARIO anual calculado, en ese orden.',
    frequentError:
      'Una consulta puede ser válida y aun así no responder el pedido; revisa columnas, orden, cálculo y alias.',
    sourceReference: 'F1, diapositivas 4, 7–9 y 26; F2, diapositivas 17 y 20, adaptadas.',
    activity: {
      kind: 'query',
      prompt:
        'Escribe una consulta que muestre NOMBRE, CIUDAD y SALARIO × 12 con alias SALARIO_ANUAL.',
    },
    steps: [
      {
        kind: 'source',
        title: 'Qué se necesita',
        caption: 'El pedido usa NOMBRE, CIUDAD y SALARIO de EMPLEADOS.',
        columns: ['NOMBRE', 'CIUDAD', 'SALARIO'],
      },
      {
        kind: 'result',
        title: 'La consulta completa',
        caption: 'Tres columnas en el orden pedido, con el cálculo y su alias.',
        sql: 'SELECT nombre, ciudad, salario * 12 AS salario_anual FROM empleados;',
      },
    ],
  },
];

function duplicateRowIndexes(analysis: LabAnalysis): readonly number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  analysis.preview?.rows.forEach((row, index) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) duplicates.push(index);
    else seen.add(key);
  });
  return duplicates;
}

function buildStep(seed: StepSeed): TransformationStep {
  if (seed.kind === 'source') return seed;
  const analysis = analyzeLabQuery(seed.sql);
  return {
    kind: 'result',
    title: seed.title,
    caption: seed.caption,
    sql: seed.sql,
    analysis,
    duplicateRows: seed.markDuplicates ? duplicateRowIndexes(analysis) : [],
  };
}

export const LESSONS: readonly StudyLesson[] = LESSON_OUTLINE.map((outline) => {
  const seed = seeds.find((item) => item.id === outline.id);
  if (!seed) throw new Error(`Falta el contenido de ${outline.id}.`);
  const { steps, visualExamples = [], ...content } = seed;
  return {
    ...outline,
    ...content,
    version: 1,
    analysis: analyzeLabQuery(seed.sql),
    steps: steps.map(buildStep),
    visualExamples: visualExamples.map((example) => ({
      ...example,
      analysis: analyzeLabQuery(example.sql),
    })),
  };
});

export const STUDY_DATASET = EMPLEADOS;

/** Versión vigente de cada lección, para detectar progreso de contenido anterior. */
export const LESSON_VERSIONS = Object.fromEntries(
  LESSONS.map(({ id, version }) => [id, version]),
) as Readonly<Record<LessonId, number>>;

export function getLesson(slug: string): StudyLesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

/** Enlace al laboratorio con la consulta y el camino de vuelta a la lección. */
export function lessonLabHref(sql: string, returnTo: string): string {
  return `/lab?${new URLSearchParams({ sql, returnTo }).toString()}`;
}

export interface QueryCheck {
  readonly correct: boolean;
  readonly message: string;
}

export function checkCompleteQuery(source: string): QueryCheck {
  const actual = analyzeLabQuery(source);
  if (actual.status === 'invalid' || !actual.preview) {
    return {
      correct: false,
      message: actual.diagnostics[0]?.message ?? 'La consulta no se pudo analizar.',
    };
  }
  const expected = getLesson('consulta-completa')?.analysis.preview;
  if (!expected) return { correct: false, message: 'No se pudo cargar el ejemplo de referencia.' };
  const headers = actual.preview.columns.map((column) => column.name);
  if (headers.join('|') !== 'NOMBRE|CIUDAD|SALARIO_ANUAL') {
    return {
      correct: false,
      message: 'Revisa el orden y el alias: NOMBRE, CIUDAD, SALARIO_ANUAL.',
    };
  }
  const comparison = compareResults(
    { columns: headers, rows: actual.preview.rows },
    { columns: expected.columns.map((column) => column.name), rows: expected.rows },
  );
  return comparison.equal
    ? {
        correct: true,
        message: 'Consulta resuelta: seis filas, tres columnas y salarios anuales correctos.',
      }
    : {
        correct: false,
        message: 'La estructura se acerca, pero los valores no corresponden a SALARIO × 12.',
      };
}
