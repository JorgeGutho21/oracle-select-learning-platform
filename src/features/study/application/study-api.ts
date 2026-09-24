import {
  analyzeLabQuery,
  EMPLEADOS,
  type LabAnalysis,
} from '@/features/laboratory/application/lab-api';
import { compareResults } from '@/domain/results/result-table';

export const STUDY_RELEASE_ID = 'select-study-v1';

export type LessonId = 'L00' | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06' | 'L07' | 'L08';

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

export interface StudyLesson {
  readonly id: LessonId;
  readonly version: number;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly objective: string;
  readonly explanation: string;
  readonly sql: string;
  readonly translation: string;
  readonly frequentError: string;
  readonly sourceReference: string;
  readonly activity: StudyActivity;
  readonly analysis: LabAnalysis;
  readonly visualExamples: readonly StudyVisualExample[];
}

export interface StudyVisualExample {
  readonly label: string;
  readonly sql: string;
  readonly analysis: LabAnalysis;
}

type LessonSeed = Omit<StudyLesson, 'version' | 'analysis' | 'visualExamples'> & {
  readonly visualExamples?: readonly Omit<StudyVisualExample, 'analysis'>[];
};

const seeds: readonly LessonSeed[] = [
  {
    id: 'L00',
    slug: 'introduccion',
    title: 'Tabla, fila y columna',
    shortTitle: 'Introducción',
    objective: 'Distinguir una tabla, una fila, una columna y su encabezado antes de escribir SQL.',
    explanation:
      'Una tabla se parece a una lista organizada: cada fila describe a un empleado y cada columna guarda el mismo tipo de dato para todos. SQL también permite modificar datos, pero en esta unidad usamos consultas SELECT de lectura.',
    sql: 'SELECT nombre FROM empleados;',
    translation: 'Muestra la columna NOMBRE de cada fila de EMPLEADOS.',
    frequentError:
      'SQL no significa “solo lectura”. Aquí trabajamos con el subconjunto seguro de consultas SELECT.',
    sourceReference: 'F1, diapositivas 3–4; F2, diapositivas 2–3.',
    activity: { kind: 'table-parts' },
  },
  {
    id: 'L01',
    slug: 'select',
    title: 'SELECT: qué quieres ver',
    shortTitle: 'SELECT',
    objective: 'Elegir las columnas que aparecerán en el resultado sin cambiar la tabla fuente.',
    explanation:
      'SELECT funciona como pedir solo los campos útiles de una lista. Los seis empleados siguen allí; cambia la vista, no los datos guardados.',
    sql: 'SELECT nombre, salario FROM empleados;',
    translation: 'De EMPLEADOS, muestra NOMBRE y SALARIO para las seis filas.',
    frequentError:
      'Seleccionar columnas no borra las demás de EMPLEADOS; solo decide qué muestra este resultado.',
    sourceReference: 'F1, diapositiva 4; F2, diapositivas 4 y 6.',
    activity: { kind: 'select-columns' },
  },
  {
    id: 'L02',
    slug: 'from',
    title: 'FROM: de dónde vienen los datos',
    shortTitle: 'FROM',
    objective: 'Reconocer FROM y ubicar la tabla después de la lista de columnas.',
    explanation:
      'Si SELECT responde “qué”, FROM responde “de dónde”. EMPLEADOS es la tabla; NOMBRE es una columna dentro de ella.',
    sql: 'SELECT nombre FROM empleados;',
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
  },
  {
    id: 'L03',
    slug: 'asterisco',
    title: 'Asterisco: todas las columnas',
    shortTitle: 'Asterisco',
    objective: 'Usar * para mostrar las seis columnas visibles de EMPLEADOS.',
    explanation:
      'En la posición que sigue a SELECT, el asterisco es un atajo para todas las columnas de la tabla. El resultado conserva las seis filas.',
    sql: 'SELECT * FROM empleados;',
    translation: 'Muestra todas las columnas y todas las filas de EMPLEADOS.',
    frequentError:
      'Aquí * significa “todas las columnas”; dentro de una expresión numérica significa multiplicación.',
    sourceReference: 'F1, diapositiva 6; F2, diapositiva 5.',
    activity: { kind: 'expand-star' },
  },
  {
    id: 'L04',
    slug: 'columnas',
    title: 'Columnas específicas y orden',
    shortTitle: 'Columnas',
    objective: 'Separar columnas con coma y conservar en el resultado el orden escrito.',
    explanation:
      'Una consulta puede pedir una vista más pequeña y ordenarla para la pregunta actual. CIUDAD aparece antes de NOMBRE porque así se escribió.',
    sql: 'SELECT ciudad, nombre FROM empleados;',
    translation: 'Muestra primero CIUDAD y después NOMBRE para los seis empleados.',
    frequentError: 'Proyectar una columna no elimina valores repetidos automáticamente.',
    sourceReference: 'F1, diapositiva 7; F2, diapositiva 6.',
    activity: { kind: 'order-columns' },
  },
  {
    id: 'L05',
    slug: 'expresiones',
    title: 'Expresiones y precedencia',
    shortTitle: 'Expresiones',
    objective: 'Calcular valores y usar paréntesis para expresar el orden deseado.',
    explanation:
      'Las expresiones crean resultados sin modificar SALARIO. Como en aritmética, multiplicación y división se resuelven antes que suma y resta; los paréntesis cambian ese orden.',
    sql: 'SELECT nombre, salario * 12 FROM empleados;',
    translation: 'Muestra cada nombre y calcula doce salarios mensuales.',
    frequentError:
      'salario + 100000 * 12 no suma primero: para Ana da 4.200.000; (salario + 100000) * 12 da 37.200.000.',
    sourceReference: 'F1, diapositiva 8; F2, diapositiva 8.',
    activity: { kind: 'precedence' },
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
    slug: 'alias',
    title: 'AS: un encabezado claro',
    shortTitle: 'Alias',
    objective: 'Asignar una etiqueta a un cálculo sin renombrar la columna almacenada.',
    explanation:
      'Un alias es el rótulo del resultado, como una etiqueta temporal en un informe. AS hace explícita esa intención.',
    sql: 'SELECT nombre, salario * 12 AS salario_anual FROM empleados;',
    translation: 'Calcula doce salarios y llama SALARIO_ANUAL a esa columna del resultado.',
    frequentError: 'AS no cambia SALARIO en la tabla; solo cambia el encabezado de esta consulta.',
    sourceReference: 'F1, diapositiva 9; F2, diapositiva 8.',
    activity: { kind: 'assign-alias' },
  },
  {
    id: 'L07',
    slug: 'distinct',
    title: 'DISTINCT: combinaciones sin repetir',
    shortTitle: 'DISTINCT',
    objective: 'Eliminar duplicados de toda la fila proyectada.',
    explanation:
      'DISTINCT conserva una sola copia de cada combinación seleccionada. Una columna produce tres ciudades; al añadir DEPTO se comparan pares completos y aparecen cinco.',
    sql: 'SELECT DISTINCT ciudad, depto FROM empleados;',
    translation: 'Muestra cada combinación diferente de CIUDAD y DEPTO.',
    frequentError:
      'Con dos columnas, DISTINCT no mira solo CIUDAD: compara el par CIUDAD–DEPTO completo.',
    sourceReference: 'F1, diapositiva 10; F2, diapositiva 7.',
    activity: { kind: 'distinct-counts' },
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
    slug: 'consulta-completa',
    title: 'Construye una consulta completa',
    shortTitle: 'Consulta completa',
    objective: 'Traducir un pedido cotidiano a una consulta SELECT completa.',
    explanation:
      'Primero identifica qué debe verse, luego el origen y finalmente los cálculos o etiquetas necesarios. El orden de las columnas también forma parte del pedido.',
    sql: 'SELECT nombre, ciudad, salario * 12 AS salario_anual FROM empleados;',
    translation: 'De EMPLEADOS, muestra NOMBRE, CIUDAD y el SALARIO anual calculado, en ese orden.',
    frequentError:
      'Una consulta puede ser válida y aun así no responder el pedido; revisa columnas, orden, cálculo y alias.',
    sourceReference: 'F1, diapositivas 4, 7–9 y 26; F2, diapositivas 17 y 20, adaptadas.',
    activity: {
      kind: 'query',
      prompt:
        'Escribe una consulta que muestre NOMBRE, CIUDAD y SALARIO × 12 con alias SALARIO_ANUAL.',
    },
  },
] as const;

export const LESSONS: readonly StudyLesson[] = seeds.map((lesson) => ({
  ...lesson,
  version: 1,
  analysis: analyzeLabQuery(lesson.sql),
  visualExamples: (lesson.visualExamples ?? []).map((example) => ({
    ...example,
    analysis: analyzeLabQuery(example.sql),
  })),
}));
export const STUDY_DATASET = EMPLEADOS;

export function getLesson(slug: string): StudyLesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
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
