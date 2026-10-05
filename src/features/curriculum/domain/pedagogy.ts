import type { CurriculumConcept, CurriculumLesson, CurriculumScene } from './types';

/** S1 contract: define before code, expose the data, explain the change, then check. */
export interface PedagogicalTopicContract {
  readonly lesson: string;
  readonly definitions: readonly CurriculumConcept[];
  readonly purpose: string;
  readonly prerequisite: string;
  readonly mentalModel: string;
  readonly syntax: string;
  readonly example: string;
  readonly simpleExample: string;
  readonly explanation: readonly string[];
  readonly changed: readonly string[];
  readonly keyTakeaway: string;
  readonly practice: string;
}

/** Authored mental models; none of these diagrams claims to be an Oracle execution. */
const MODELS: Readonly<Record<string, string>> = {
  'S2-L01': 'DEPARTAMENTOS (padre / PK) ← ID_DEPARTAMENTO → EMPLEADOS (FK)',
  'S2-L02':
    'EMPLEADOS → nombre corto e → e.nombre\nDEPARTAMENTOS → nombre corto d → d.nombre_departamento',
  'S2-L03': 'Persona → busca su ID_DEPARTAMENTO → encuentra el nombre del área',
  'S2-L04': 'Dos tablas → condición ON verdadera → una fila por pareja encontrada',
  'S2-L05': 'e.ciudad (persona) → comparar con d.sede (área) → mismo nombre, distinto origen',
  'S2-L06': 'Tablas → ON: formar parejas → WHERE: filtrar parejas → resultado',
  'S2-L07': 'EMPLEADOS ← ASIGNACIONES → PROYECTOS\nCada flecha necesita su propia condición ON.',
  'S2-L08': 'Cada fila izquierda → pareja encontrada o NULL en las columnas derechas',
  'S2-L09': 'RIGHT conserva la derecha; FULL conserva ambos lados, incluso sin pareja.',
  'S2-L10': 'EMPLEADOS como persona e → ID_JEFE → EMPLEADOS como jefe j',
  'S2-L11':
    '2 personas × 3 proyectos = 6 combinaciones\nCROSS no busca una clave común: combina todas las filas.',
  'S2-L12': 'Muchas filas → un cálculo: contar, sumar, promediar, mínimo o máximo',
  'S2-L13': 'COUNT(*) cuenta filas; COUNT(columna) cuenta valores no NULL.',
  'S2-L14': 'Filas → reunir por departamento → un resumen por cada grupo',
  'S2-L15': 'Departamento + ciudad → una clave de grupo → un resumen por combinación',
  'S2-L16': 'Grupos ya calculados → HAVING evalúa el resumen → conservar o descartar',
  'S2-L17': 'WHERE filtra filas → GROUP BY forma grupos → HAVING filtra grupos',
  'S2-L18': 'JOIN trae el nombre del área → GROUP BY reúne personas → COUNT/AVG resume',
  'S2-L19': 'JOIN → GROUP BY → calcular COUNT/AVG/SUM → HAVING compara con la meta',
  'S2-L20': 'Consulta interior → un valor → consulta exterior compara con ese valor',
  'S2-L21': 'Consulta interior → varios valores → IN comprueba pertenencia a la lista',
  'S2-L22': 'Cada fila exterior → consulta interior relacionada → EXISTS: ¿hay alguna fila?',
  'S2-L23': 'Resultado A + resultado B → UNION elimina duplicados; UNION ALL conserva todos',
  'S2-L24': 'INTERSECT: lo común; A MINUS B: lo que está en A y no está en B',
  'S2-L25': 'Relacionar → filtrar personas → resumir por área → comparar grupos → ordenar',
  'S3-L01': 'SQL describe qué datos obtener. PL/SQL organiza las acciones que hacemos con ellos.',
  'S3-L02':
    'DECLARE: preparar (opcional) → BEGIN: actuar → EXCEPTION: responder al error (opcional) → END',
  'S3-L03': 'Anónimo: ejecutar una vez. Almacenado: guardar con nombre y llamar después.',
  'S3-L04': 'Nombre + tipo + valor → variable\n:= cambia el valor; CONSTANT impide cambiarlo.',
  'S3-L05': 'Columna → %TYPE copia su tipo\nFila completa → %ROWTYPE define un registro',
  'S3-L06': 'Bloque exterior → bloque interior\nLo declarado dentro solo existe dentro.',
  'S3-L07': 'Tabla → SELECT (una fila) → INTO → variable que recibe el valor',
  'S3-L08': 'Sentencia DML → filas cambiadas → SQL%ROWCOUNT informa cuántas',
  'S3-L09': 'Condición TRUE → THEN; si no, probar ELSIF; si ninguna coincide, ELSE',
  'S3-L10': 'Valor o condiciones → primera rama WHEN que coincide → acción de esa rama',
  'S3-L11': 'Ejecutar → actualizar estado → EXIT WHEN: ¿terminar? → repetir si no',
  'S3-L12': 'WHILE pregunta antes de cada vuelta. FOR recorre un rango conocido.',
  'S3-L13': 'Oracle ejecuta SQL → cursor implícito → SQL% informa sobre esa sentencia',
  'S3-L14': 'Consulta → OPEN prepara → FETCH obtiene una fila → repetir → CLOSE libera',
  'S3-L15': 'FOR fila IN cursor → abrir, leer y cerrar automáticamente → cuerpo por cada fila',
  'S3-L16': 'Error de ejecución → abandonar el resto de BEGIN → manejador EXCEPTION',
  'S3-L17': 'Detectar regla incumplida → RAISE → manejar o comunicar el error',
  'S3-L18': 'Crear procedimiento con nombre → llamar → ejecutar su acción',
  'S3-L19': 'IN: entra un dato → subprograma → OUT: sale un dato; IN OUT hace ambos',
  'S3-L20': 'Entrada → función calcula → RETURN devuelve un valor al llamador',
  'S3-L21':
    'Acción que ejecutamos → procedimiento\nValor que necesitamos en una expresión → función',
  'S3-L22': 'Especificación: qué ofrece públicamente → cuerpo: cómo lo implementa',
  'S3-L23': 'Evento INSERT/UPDATE/DELETE → momento BEFORE/AFTER → trigger ejecuta una acción',
  'S3-L24': 'Evento → BEFORE o AFTER → una vez por sentencia o una vez por fila',
  'S3-L25': 'UPDATE cambia la fila → :OLD conserva el antes → :NEW contiene el después → auditoría',
  'S3-L26': 'BEFORE valida → regla aceptada: continúa; regla rechazada: la sentencia falla',
  'S3-L27':
    'Regla simple → constraint; proceso explícito → procedimiento; auditoría puntual → trigger',
  'S3-L28': 'Procedimiento valida y aumenta → trigger registra cambios → revisar datos y auditoría',
};

export function pedagogicalTopic(
  lesson: CurriculumLesson,
  lessons: readonly CurriculumLesson[],
  concepts: readonly CurriculumConcept[],
): PedagogicalTopicContract {
  const previous = lessons[lessons.indexOf(lesson) - 1];
  const mentalModel = MODELS[lesson.id];
  if (!mentalModel) throw new Error(`Missing authored mental model: ${lesson.id}`);
  return {
    lesson: lesson.id,
    definitions: lesson.concepts.map((id) => {
      const concept = concepts.find((item) => item.id === id);
      if (!concept) throw new Error(`Missing definition: ${lesson.id}/${id}`);
      return concept;
    }),
    purpose: lesson.purpose,
    prerequisite: previous
      ? `Antes de empezar, repasa «${previous.shortTitle}».`
      : lesson.id.startsWith('S2')
        ? 'Saber leer SELECT, FROM, WHERE y una tabla de filas y columnas.'
        : 'Saber consultar datos con SQL. No necesitas saber programación procedural.',
    mentalModel,
    syntax: lesson.syntax,
    example: lesson.example.example,
    simpleExample: lesson.micro?.example ?? lesson.example.example,
    explanation: lesson.explanation,
    changed: lesson.changed,
    keyTakeaway: lesson.keyIdea,
    practice: lesson.check.id,
  };
}

/** Keeps existing example/scene IDs while making every lesson teach before projecting code. */
export function pedagogicalScenes(
  original: readonly CurriculumScene[],
  lessons: readonly CurriculumLesson[],
  concepts: readonly CurriculumConcept[],
): readonly CurriculumScene[] {
  const scenes: CurriculumScene[] = original.filter((scene) =>
    ['cover', 'agenda'].includes(scene.kind),
  );
  const introduced = new Set<string>();
  const first = lessons[0]!;
  if (first.id.startsWith('S2')) {
    scenes.push({
      id: 'dataset-relacional',
      block: first.block,
      kind: 'dataset',
      title: 'Antes del JOIN: conocer la empresa',
      shortTitle: 'Dataset y relaciones',
      keyIdea: 'Los datos están separados para registrar cada hecho una sola vez.',
      notes: {
        explain:
          'Identifica primero tablas, propósito, filas, PK y FK. Las flechas indican qué tabla referencia a cuál.',
      },
    });
  }
  for (const lesson of lessons) {
    const topic = pedagogicalTopic(lesson, lessons, concepts);
    const base = { block: lesson.block, lesson: lesson.id };
    for (const concept of topic.definitions) {
      if (introduced.has(concept.id)) continue;
      introduced.add(concept.id);
      scenes.push({
        ...base,
        id: `define-${concept.id}`,
        kind: 'idea',
        intent: 'definition',
        title: `¿Qué es ${concept.term}?`,
        shortTitle: concept.term,
        points: [concept.definition, `Para qué sirve: ${concept.purpose}`],
        keyIdea: concept.keyIdea,
        notes: { explain: concept.definition, mistake: concept.mistake.why },
      });
    }
    scenes.push(
      {
        ...base,
        id: `model-${lesson.id}`,
        kind: 'idea',
        intent: 'model',
        title: lesson.shortTitle,
        shortTitle: 'Modelo mental',
        points: [topic.prerequisite, lesson.purpose],
        code: topic.mentalModel,
        notes: {
          explain: lesson.explanation[0]!,
          transition: 'Ahora podemos leer la forma general.',
        },
      },
      {
        ...base,
        id: `syntax-${lesson.id}`,
        kind: 'idea',
        intent: 'syntax',
        title: `Cómo se escribe: ${lesson.shortTitle}`,
        shortTitle: 'Sintaxis',
        points: [lesson.explanation[0]!],
        code: lesson.syntax,
        notes: {
          explain: lesson.purpose,
          transition: 'Probemos la idea con los datos de la empresa.',
        },
      },
    );
    const existing = original.filter(
      (scene) => scene.lesson === lesson.id && scene.kind === 'lesson',
    );
    if (lesson.micro && lesson.micro.example !== lesson.example.example)
      scenes.push({
        ...base,
        id: `micro-${lesson.id}`,
        kind: 'lesson',
        example: lesson.micro.example,
        title: `${lesson.shortTitle}: empezar con poco`,
        shortTitle: 'Microejemplo',
        notes: { explain: lesson.micro.reading },
      });
    const mainIsShown = existing.some(
      (scene) => !scene.example || scene.example === lesson.example.example,
    );
    if (!mainIsShown)
      scenes.push({
        ...base,
        id: `example-${lesson.id}`,
        kind: 'lesson' as const,
        title: lesson.shortTitle,
        shortTitle: 'Ejemplo con datos',
        notes: { explain: lesson.example.reading },
      });
    scenes.push(...existing);
    scenes.push(
      {
        ...base,
        id: `explain-${lesson.id}`,
        kind: 'idea',
        intent: 'explanation',
        title: `Qué cambió: ${lesson.shortTitle}`,
        shortTitle: 'Qué cambió',
        points: [
          lesson.changed[0]!,
          `Error frecuente: ${lesson.mistakes[0]!.title}. ${lesson.mistakes[0]!.why}`,
        ],
        keyIdea: lesson.keyIdea,
        notes: { explain: lesson.example.reading },
      },
      {
        ...base,
        id: `check-${lesson.id}`,
        kind: 'check',
        title: `Comprueba: ${lesson.shortTitle}`,
        shortTitle: 'Comprobación',
        activity: { ...lesson.check, id: `${lesson.check.id}-class` },
        notes: { explain: lesson.check.explanation },
      },
    );
  }
  scenes.push(...original.filter((scene) => scene.kind === 'closing'));
  return scenes;
}
