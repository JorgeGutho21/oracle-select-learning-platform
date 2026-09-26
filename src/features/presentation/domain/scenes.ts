/**
 * Guion del Modo Exposición (CONTENT_MAP, «Exposición»): veintinueve escenas para proyector,
 * una idea por escena, agrupadas en cinco bloques. El número es el identificador público de
 * `?scene=N`; `id` es estable aunque cambie el orden. `lessons` enlaza cada escena con las
 * lecciones del Modo Estudio que desarrollan el mismo tema en profundidad.
 *
 * Las notas del expositor nunca se proyectan: se ven en el panel de notas (tecla N) o en la
 * vista del presentador, no en la escena ni en pantalla completa.
 */

export type SceneBlockId = 'fundamentos' | 'consulta' | 'filtrado' | 'integracion' | 'cierre';

export interface SceneBlock {
  readonly id: SceneBlockId;
  readonly title: string;
}

export const SCENE_BLOCKS: readonly SceneBlock[] = [
  { id: 'fundamentos', title: 'Fundamentos' },
  { id: 'consulta', title: 'Consulta' },
  { id: 'filtrado', title: 'Filtrado' },
  { id: 'integracion', title: 'Orden e integración' },
  { id: 'cierre', title: 'Práctica y cierre' },
];

export interface SceneNotes {
  /** Qué explicar, en una o dos frases. */
  readonly explain: string;
  /** Error frecuente que conviene anticipar. */
  readonly mistake?: string;
  /** Pregunta para la clase, con su respuesta entre paréntesis. */
  readonly question?: string;
  /** Frase de transición a la escena siguiente. */
  readonly transition?: string;
}

export interface SceneOutline {
  readonly number: number;
  readonly id: string;
  readonly title: string;
  /** Título corto para el navegador y la barra inferior. */
  readonly shortTitle: string;
  readonly block: SceneBlockId;
  /** Rutas de las lecciones del Modo Estudio que amplían la escena. */
  readonly lessons: readonly string[];
  /** Pasos del modo «Paso a paso»; 1 si la escena se muestra entera. */
  readonly steps: number;
  readonly notes: SceneNotes;
}

type SceneInput = Omit<SceneOutline, 'number' | 'steps'> & { readonly steps?: number };

const OUTLINE: readonly SceneInput[] = [
  {
    id: 'portada',
    title: 'Portada',
    shortTitle: 'Portada',
    block: 'fundamentos',
    lessons: [],
    notes: {
      explain:
        'Presenta la unidad y su meta: al terminar, leer y escribir una consulta SELECT completa.',
      question: '¿Quién ha buscado alguna vez un dato en una hoja de cálculo?',
      transition: 'Primero, el mapa de la clase.',
    },
  },
  {
    id: 'ruta',
    title: 'Ruta de aprendizaje',
    shortTitle: 'Ruta',
    block: 'fundamentos',
    lessons: [],
    notes: {
      explain: 'Ocho bloques; cada uno añade una pieza a la misma consulta.',
      question: '¿Qué bloque creen que será el más difícil?',
      transition: 'Empezamos por qué es SQL.',
    },
  },
  {
    id: 'que-es-sql',
    title: 'Qué es SQL',
    shortTitle: 'SQL',
    block: 'fundamentos',
    lessons: ['introduccion'],
    notes: {
      explain: 'SQL es el idioma para hablar con la base de datos. Hoy solo consultamos.',
      mistake: 'Creer que SELECT cambia los datos: solo los lee.',
      question: '¿Qué le preguntarían a la tabla de empleados de una empresa?',
      transition: 'Conozcamos la tabla con la que trabajaremos.',
    },
  },
  {
    id: 'empleados',
    title: 'Conoce EMPLEADOS',
    shortTitle: 'EMPLEADOS',
    block: 'fundamentos',
    lessons: ['empleados'],
    notes: {
      explain:
        'Señala una fila (un empleado) y una columna (un dato de todos). Tres tipos: NUMBER, VARCHAR2 y DATE.',
      mistake: 'Confundir fila y columna.',
      question: '¿Cuántas celdas tiene la tabla? (20 × 12 = 240)',
      transition: '¿Cómo le pedimos solo algunas columnas?',
    },
  },
  {
    id: 'select-from',
    title: 'SELECT y FROM',
    shortTitle: 'SELECT/FROM',
    block: 'consulta',
    lessons: ['select', 'from'],
    steps: 4,
    notes: {
      explain:
        'SELECT es el qué; FROM, el de dónde. Lee la consulta en voz alta antes del resultado.',
      mistake: 'Escribir la tabla después de SELECT.',
      question: '¿Cuántas filas devuelve? (20: SELECT no quita filas)',
      transition: '¿Y si quiero todas las columnas?',
    },
  },
  {
    id: 'asterisco',
    title: 'SELECT *',
    shortTitle: 'SELECT *',
    block: 'consulta',
    lessons: ['asterisco'],
    notes: {
      explain: 'El asterisco se expande a las 12 columnas, en su orden.',
      mistake: 'Dejar * en una consulta final: trae datos que no necesitas.',
      question: '¿Cuántas columnas devuelve SELECT * FROM empleados? (12)',
      transition: 'Elegir columnas también es elegir su orden.',
    },
  },
  {
    id: 'columnas',
    title: 'Columnas específicas',
    shortTitle: 'Columnas',
    block: 'consulta',
    lessons: ['columnas'],
    notes: {
      explain: 'El orden de la lista es el orden del resultado. Los datos son los mismos.',
      mistake: 'Olvidar la coma: Oracle toma la segunda palabra como alias.',
      question: '¿Qué cambia entre las dos consultas? (solo el orden de las columnas)',
      transition: 'SELECT también puede calcular.',
    },
  },
  {
    id: 'expresiones',
    title: 'Expresiones y precedencia',
    shortTitle: 'Expresiones',
    block: 'consulta',
    lessons: ['expresiones', 'precedencia'],
    notes: {
      explain: 'Una expresión se calcula en cada fila. * y / van antes que + y -.',
      mistake: 'Escribir salario + bono * 12 queriendo sumar primero.',
      question: '¿Cuánto da (salario + bono) * 12 para Ana? (118.800.000)',
      transition: 'El encabezado SALARIO*12 se lee mal: le pondremos nombre.',
    },
  },
  {
    id: 'alias',
    title: 'Alias con AS',
    shortTitle: 'Alias',
    block: 'consulta',
    lessons: ['alias', 'concatenacion'],
    notes: {
      explain:
        'Pregunta primero qué encabezado aparecerá con salario * 12. Después muestra AS salario_anual.',
      mistake: 'Usar el alias en WHERE: todavía no existe.',
      question: '¿Cambió la columna SALARIO de la tabla? (no)',
      transition: '¿Qué pasa con los valores repetidos?',
    },
  },
  {
    id: 'distinct',
    title: 'DISTINCT',
    shortTitle: 'DISTINCT',
    block: 'consulta',
    lessons: ['distinct'],
    steps: 3,
    notes: {
      explain: 'DISTINCT compara las filas completas del resultado y deja una de cada.',
      mistake: 'Creer que DISTINCT ordena o borra filas de la tabla.',
      question: '¿Cuántas ciudades distintas hay? (5)',
      transition: 'Hasta ahora elegimos columnas; ahora elegimos filas.',
    },
  },
  {
    id: 'where',
    title: 'WHERE',
    shortTitle: 'WHERE',
    block: 'filtrado',
    lessons: ['where'],
    steps: 4,
    notes: {
      explain: 'WHERE revisa fila por fila; solo pasan las que dan verdadero.',
      mistake: 'Olvidar las comillas: ciudad = Cali busca una columna.',
      question: '¿Cuántos empleados son de Cali? (5)',
      transition: '¿Qué más puedo comparar además de igual?',
    },
  },
  {
    id: 'comparaciones',
    title: 'Comparaciones',
    shortTitle: 'Comparaciones',
    block: 'filtrado',
    lessons: ['comparaciones'],
    notes: {
      explain: 'Seis operadores ordenados de menor a mayor; cada uno con cuántas filas deja.',
      mistake: 'Comillas dobles para textos: "Cali" es el nombre de una columna.',
      question: '¿Por qué >= deja más filas que >? (incluye el valor exacto)',
      transition: '¿Y si necesito dos condiciones a la vez?',
    },
  },
  {
    id: 'and-or',
    title: 'AND y OR',
    shortTitle: 'AND/OR',
    block: 'filtrado',
    lessons: ['and-or'],
    notes: {
      explain: 'AND exige las dos condiciones; OR se conforma con una.',
      mistake: "ciudad = 'Cali' AND ciudad = 'Barranquilla' devuelve 0 filas.",
      question: '¿Puede una fila ser de Cali y de Barranquilla a la vez? (no)',
      transition: 'Mezclar AND y OR tiene una trampa.',
    },
  },
  {
    id: 'parentesis',
    title: 'Paréntesis y precedencia lógica',
    shortTitle: 'Paréntesis',
    block: 'filtrado',
    lessons: ['parentesis'],
    notes: {
      explain: 'AND se evalúa antes que OR. Compara las filas de ambas consultas.',
      question: '¿Qué empleados aparecen solo sin paréntesis?',
      transition: 'Hay atajos para condiciones frecuentes: los rangos.',
    },
  },
  {
    id: 'between',
    title: 'BETWEEN',
    shortTitle: 'BETWEEN',
    block: 'filtrado',
    lessons: ['between'],
    notes: {
      explain: 'Rango con los dos límites incluidos; el menor va primero.',
      mistake: 'Invertir los límites: el resultado queda vacío.',
      question: '¿Entra Sofía, que gana 3.000.000? (sí: el límite cuenta)',
      transition: 'Otro atajo: las listas.',
    },
  },
  {
    id: 'in',
    title: 'IN',
    shortTitle: 'IN',
    block: 'filtrado',
    lessons: ['in'],
    notes: {
      explain: 'IN comprueba si el valor está en la lista; sustituye varios OR con =.',
      mistake: 'Olvidar los paréntesis de la lista.',
      question: '¿Qué ciudad falta en la lista? (Barranquilla y Valledupar)',
      transition: '¿Y si solo sé una parte del texto?',
    },
  },
  {
    id: 'like',
    title: 'LIKE',
    shortTitle: 'LIKE',
    block: 'filtrado',
    lessons: ['like'],
    notes: {
      explain: '% son cero o más caracteres; _ es exactamente uno.',
      mistake: "Esperar que 'a%' encuentre «Ana»: LIKE distingue mayúsculas.",
      question: "¿«Ana» cumple 'A%'? (sí: % puede ser cero caracteres)",
      transition: '¿Y cuando el dato no existe?',
    },
  },
  {
    id: 'null',
    title: 'NULL e IS NULL',
    shortTitle: 'NULL',
    block: 'filtrado',
    lessons: ['null'],
    notes: {
      explain: 'NULL es ausencia de valor. Se pregunta con IS NULL.',
      mistake: 'bono = NULL devuelve 0 filas.',
      question: '¿Mario tiene bono NULL o 0? (0: sí tiene valor)',
      transition: 'Ya filtramos; ahora ordenamos.',
    },
  },
  {
    id: 'order-by',
    title: 'ORDER BY',
    shortTitle: 'ORDER BY',
    block: 'integracion',
    lessons: ['order-by'],
    steps: 2,
    notes: {
      explain:
        'Muestra primero el orden original y después el ordenado. ASC es el valor por defecto.',
      mistake: 'Suponer un orden sin ORDER BY.',
      question: '¿Quién gana más? (Ana)',
      transition: 'Juntamos todas las piezas.',
    },
  },
  {
    id: 'anatomia',
    title: 'Anatomía de una consulta',
    shortTitle: 'Anatomía',
    block: 'integracion',
    lessons: ['consulta-completa'],
    notes: {
      explain:
        'Selecciona cada cláusula y lee su papel. Se escribe SELECT primero, pero se entiende desde FROM.',
      question: '¿Qué cláusula se evalúa primero? (FROM)',
      transition: 'Construyamos una consulta desde una pregunta.',
    },
  },
  {
    id: 'paso-a-paso',
    title: 'Construimos una consulta',
    shortTitle: 'Construcción',
    block: 'integracion',
    lessons: ['consulta-completa'],
    notes: {
      explain: 'Avanza paso a paso y cuenta las filas que quedan en cada paso.',
      question: '¿Cuántas filas quedan después de filtrar por Bogotá?',
      transition: 'Antes de practicar, los errores más comunes.',
    },
  },
  {
    id: 'errores',
    title: 'Errores frecuentes',
    shortTitle: 'Errores',
    block: 'integracion',
    lessons: ['errores-frecuentes'],
    notes: {
      explain: 'Pide a la clase que encuentre el error antes de leer la causa.',
      transition: 'Ahora, a practicar.',
    },
  },
  {
    id: 'laboratorio',
    title: 'Laboratorio',
    shortTitle: 'Lab',
    block: 'cierre',
    lessons: [],
    notes: {
      explain: 'Abre el laboratorio y ejecuta la consulta de ejemplo en Oracle real.',
      transition: 'También hay un juego.',
    },
  },
  {
    id: 'challenge',
    title: 'SQL Challenge',
    shortTitle: 'Challenge',
    block: 'cierre',
    lessons: [],
    notes: {
      explain: 'Diez misiones con puntos y pistas; la última se califica con Oracle.',
      transition: 'Repasemos lo aprendido.',
    },
  },
  {
    id: 'aprendimos',
    title: 'Qué aprendimos',
    shortTitle: 'Resumen',
    block: 'cierre',
    lessons: [],
    notes: {
      explain: 'Recorre la ruta completa: los ocho bloques están hechos.',
      question: '¿Qué pieza les resultó más útil?',
    },
  },
  {
    id: 'video',
    title: 'Video resumen',
    shortTitle: 'Video',
    block: 'cierre',
    lessons: [],
    notes: { explain: 'El video repasa la primera parte de la unidad; puede verse después.' },
  },
  {
    id: 'reto',
    title: 'Reto en vivo',
    shortTitle: 'Reto',
    block: 'cierre',
    lessons: [],
    notes: {
      explain:
        'Para jugar juntos, crea la sala en /presenter y proyecta su código; el QR abre la práctica individual.',
      question: 'Pide que respondan cuántas filas devuelve antes de revelar.',
    },
  },
  {
    id: 'proximos',
    title: 'Próximos temas',
    shortTitle: 'Próximamente',
    block: 'cierre',
    lessons: [],
    notes: { explain: 'Lo que viene: funciones, agrupación, JOIN, subconsultas y más.' },
  },
  {
    id: 'cierre',
    title: 'Cierre',
    shortTitle: 'Cierre',
    block: 'cierre',
    lessons: [],
    notes: {
      explain: 'Lee la consulta integrada en voz alta: ya entienden cada pieza.',
      question: '¿Preguntas?',
    },
  },
];

export const SCENES: readonly SceneOutline[] = OUTLINE.map((scene, index) => ({
  ...scene,
  number: index + 1,
  steps: scene.steps ?? 1,
}));

export const SCENE_TOTAL = SCENES.length;

export function sceneNumber(id: string): number {
  const scene = SCENES.find((entry) => entry.id === id);
  if (!scene) throw new Error(`Escena desconocida: ${id}`);
  return scene.number;
}

export function sceneBlock(scene: Pick<SceneOutline, 'block'>): SceneBlock {
  return SCENE_BLOCKS.find((block) => block.id === scene.block)!;
}

/** Escenas de un bloque, en orden. */
export function scenesOfBlock(block: SceneBlockId): readonly SceneOutline[] {
  return SCENES.filter((scene) => scene.block === block);
}

export function isSceneNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= SCENE_TOTAL;
}

/** Convierte el parámetro de la URL en una escena válida, o `null` si no la indica. */
export function parseSceneParam(value: string | readonly string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return isSceneNumber(parsed) ? parsed : null;
}

export function clampScene(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(SCENE_TOTAL, Math.max(1, Math.round(value)));
}
