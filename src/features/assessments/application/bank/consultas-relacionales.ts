import type { OfficialQuestion } from '../../domain/bank/bank-builders';
import {
  codeOf,
  errorOf,
  exhibitOf,
  finalize,
  orderOptions,
  queryOptions,
  resultOptions,
  reviewOf,
  rowCount,
  tableOf,
  textOptions,
  valueOf,
  type BankQuestion,
} from './verified-bank';

/**
 * Banco oficial de la Sección 2, Consultas relacionales y análisis (50 preguntas):
 * relaciones 5, JOIN 15, agregación 15, subconsultas 8, conjuntos e integración 7. Cada
 * resultado, recuento o error que cita sale de una consulta ejecutada en Oracle (lecciones
 * S2 o consultas propias del banco S2-B-*). Distribución cognitiva: 7 recordar, 20 aplicar,
 * 23 analizar (QUESTION_BANK_SPEC). Preguntas originales de DB LAB sobre su dataset; no
 * reproducen preguntas de certificación.
 */

const S2 = 'consultas-relacionales' as const;
const review = (lesson: string) => reviewOf(S2, lesson);

const REF = {
  constraints: 'Oracle Database SQL Language Reference 19c, «Constraints».',
  joins: 'Oracle Database SQL Language Reference 19c, «Joins» y «SELECT»: join_clause.',
  aggregate:
    'Oracle Database SQL Language Reference 19c, «Aggregate Functions» y «SELECT»: group_by_clause y HAVING.',
  subqueries: 'Oracle Database SQL Language Reference 19c, «Using Subqueries».',
  sets: 'Oracle Database SQL Language Reference 19c, «The UNION [ALL], INTERSECT, MINUS Operators».',
} as const;

const count = (id: string) => String(rowCount(id));

const relaciones: BankQuestion[] = [
  {
    key: 'S2-REL-01',
    level: 'recordar',
    topic: 'relaciones',
    subtopic: 'PRIMARY KEY',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué cumple siempre una columna declarada como PRIMARY KEY?',
    options: textOptions([
      {
        body: 'Sus valores no se repiten y nunca son NULL.',
        correct: true,
        feedback: 'Una clave primaria identifica cada fila: única y obligatoria.',
      },
      {
        body: 'Sus valores no se repiten, pero admite NULL.',
        feedback: 'Eso describe una restricción UNIQUE; la clave primaria no admite NULL.',
      },
      {
        body: 'Debe llamarse igual que la FK que la referencia.',
        feedback: 'ID_JEFE referencia a ID_EMPLEADO con otro nombre.',
      },
      {
        body: 'Solo puede existir una en toda la base de datos.',
        feedback: 'Hay una por tabla, no una por base de datos.',
      },
    ]),
    explanation:
      'PRIMARY KEY combina UNIQUE y NOT NULL: cada fila tiene un identificador propio y presente.',
    concept: 'Clave primaria',
    review: review('S2-L01'),
    reference: REF.constraints,
  },
  {
    key: 'S2-REL-02',
    level: 'aplicar',
    topic: 'relaciones',
    subtopic: 'Integridad referencial',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `Oracle rechaza este INSERT con ${errorOf('S2-E-FK-VIOLADA')}. ¿Por qué?`,
    code: codeOf('S2-E-FK-VIOLADA'),
    options: textOptions([
      {
        body: 'No existe el departamento 70: la FK no tiene fila padre.',
        correct: true,
        feedback: 'ID_DEPARTAMENTO debe existir en DEPARTAMENTOS.',
      },
      {
        body: 'El ID 21 ya está usado por otra persona.',
        feedback: 'Hay 20 personas; un ID repetido daría ORA-00001.',
      },
      {
        body: 'Falta el bono, que es una columna obligatoria.',
        feedback: 'BONO admite NULL.',
      },
      {
        body: 'Un ID_DEPARTAMENTO no puede pasar de 60.',
        feedback: 'No hay una regla así: lo que falla es la referencia.',
      },
    ]),
    explanation:
      'La clave foránea exige que el valor exista en la tabla padre. Primero se crea el departamento; después, quien lo referencia.',
    concept: 'Integridad referencial',
    review: review('S2-L01'),
    reference: REF.constraints,
  },
  {
    key: 'S2-REL-03',
    level: 'aplicar',
    topic: 'relaciones',
    subtopic: 'Claves foráneas del modelo',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 2,
    prompt: 'En el modelo de la empresa, ¿cuáles de estas columnas son claves foráneas?',
    options: textOptions([
      {
        body: 'ASIGNACIONES.ID_EMPLEADO',
        code: true,
        correct: true,
        feedback: 'Apunta a EMPLEADOS y además forma parte de la PK de ASIGNACIONES.',
      },
      {
        body: 'PROYECTOS.ID_DEPARTAMENTO',
        code: true,
        correct: true,
        feedback: 'Apunta al departamento responsable.',
      },
      {
        body: 'EMPLEADOS.ID_JEFE',
        code: true,
        correct: true,
        feedback: 'Apunta a la misma tabla EMPLEADOS.',
      },
      {
        body: 'EMPLEADOS.ID_EMPLEADO',
        code: true,
        feedback: 'Es la clave primaria de EMPLEADOS: otras tablas la referencian.',
      },
      {
        body: 'ASIGNACIONES.HORAS_SEMANALES',
        code: true,
        feedback: 'Es un dato de la asignación, con una restricción CHECK.',
      },
    ]),
    explanation:
      'Una FK guarda la clave de otra fila: ID_EMPLEADO e ID_PROYECTO en ASIGNACIONES, ID_DEPARTAMENTO en PROYECTOS y EMPLEADOS, e ID_JEFE en EMPLEADOS.',
    concept: 'Clave foránea',
    review: review('S2-L01'),
    reference: REF.constraints,
  },
  {
    key: 'S2-REL-04',
    level: 'aplicar',
    topic: 'relaciones',
    subtopic: 'Columna ambigua',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `La consulta falla con ${errorOf('S2-E-AMBIGUA')}. ¿Qué la corrige?`,
    code: codeOf('S2-E-AMBIGUA'),
    options: textOptions([
      {
        body: 'Calificar la columna: e.id_departamento.',
        correct: true,
        feedback: 'ID_DEPARTAMENTO existe en las dos tablas: hay que decir de cuál.',
      },
      {
        body: 'Cambiar JOIN por LEFT JOIN.',
        feedback: 'El tipo de JOIN no resuelve la ambigüedad.',
      },
      { body: 'Quitar los alias e y d.', feedback: 'Sin alias sigue siendo ambigua.' },
      {
        body: 'Agregar DISTINCT después de SELECT.',
        feedback: 'DISTINCT no dice de qué tabla es.',
      },
    ]),
    explanation:
      'Cuando una columna se llama igual en las dos tablas, se escribe con el alias de su tabla: e.id_departamento o d.id_departamento.',
    concept: 'Alias de tabla',
    review: review('S2-L05'),
    reference: REF.joins,
  },
  {
    key: 'S2-REL-05',
    level: 'analizar',
    topic: 'relaciones',
    subtopic: 'Relación muchos a muchos',
    type: 'short_case',
    response: 'single',
    difficulty: 3,
    prompt:
      'Carlos trabaja en los proyectos 101 y 102, y en el 102 también están personas de otros departamentos. ¿Por qué el modelo usa la tabla ASIGNACIONES en lugar de una columna ID_PROYECTO en EMPLEADOS?',
    options: textOptions([
      {
        body: 'Es N:M: una persona tiene varios proyectos y un proyecto, varias personas.',
        correct: true,
        feedback: 'Una sola columna solo guardaría un proyecto por persona.',
      },
      {
        body: 'Para que las consultas sean más rápidas al no unir tablas.',
        feedback: 'Al contrario: añade una tabla que unir.',
      },
      {
        body: 'Porque EMPLEADOS no puede tener una FK hacia PROYECTOS.',
        feedback: 'Podría tenerla; el problema es que solo admitiría un proyecto.',
      },
      {
        body: 'Para guardar en cada proyecto el departamento de la persona.',
        feedback: 'ASIGNACIONES guarda rol y horas, no departamentos.',
      },
    ]),
    explanation:
      'Una relación muchos a muchos se resuelve con una tabla intermedia cuya clave combina las dos claves foráneas.',
    concept: 'Relación N:M',
    review: review('S2-L01'),
    reference: REF.constraints,
  },
];

const joins: BankQuestion[] = [
  {
    key: 'S2-JOIN-01',
    level: 'recordar',
    topic: 'join',
    subtopic: 'INNER JOIN',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué filas devuelve un INNER JOIN?',
    options: textOptions([
      {
        body: 'Solo las parejas de filas que cumplen la condición ON.',
        correct: true,
        feedback: 'Una fila sin pareja no aparece.',
      },
      {
        body: 'Todas las de la izquierda, con NULL si no hay pareja.',
        feedback: 'Eso hace LEFT OUTER JOIN.',
      },
      {
        body: 'Todas las combinaciones posibles entre las dos tablas.',
        feedback: 'Eso hace CROSS JOIN.',
      },
      {
        body: 'Las filas de las dos tablas, tengan o no pareja.',
        feedback: 'Eso hace FULL OUTER JOIN.',
      },
    ]),
    explanation:
      'INNER JOIN (o simplemente JOIN) conserva solo las parejas que cumplen la condición.',
    concept: 'INNER JOIN',
    review: review('S2-L04'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-02',
    level: 'aplicar',
    topic: 'join',
    subtopic: 'Filas sin pareja',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta? (Esteban no tiene departamento asignado.)',
    code: codeOf('S2-B-INNER-CUATRO'),
    exhibit: exhibitOf('S2-B-INNER-CUATRO'),
    options: resultOptions(
      {
        example: 'S2-B-INNER-CUATRO',
        body: 'Tres filas: Laura, Camila y Felipe.',
        feedback: 'Esteban no tiene pareja en DEPARTAMENTOS y el INNER JOIN lo descarta.',
      },
      1,
      [
        {
          example: 'S2-B-LEFT-CUATRO',
          body: 'Cuatro filas, Esteban con NULL.',
          feedback: 'Eso devolvería LEFT JOIN, que conserva las filas sin pareja.',
        },
        {
          body: 'Cuatro filas, Esteban en TI.',
          rows: [
            ['Laura', 'Recursos Humanos'],
            ['Camila', 'Finanzas'],
            ['Felipe', 'Operaciones'],
            ['Esteban', 'TI'],
          ],
          feedback: 'ID_DEPARTAMENTO de Esteban es NULL: no está en TI en este dataset.',
        },
        {
          body: 'Tres filas, Camila en TI.',
          rows: [
            ['Laura', 'Recursos Humanos'],
            ['Camila', 'TI'],
            ['Felipe', 'Operaciones'],
          ],
          feedback: 'Camila trabaja en un proyecto de TI, pero su departamento es Finanzas.',
        },
      ],
    ),
    explanation:
      'El JOIN busca para cada persona el departamento con su ID_DEPARTAMENTO. NULL no coincide con ningún valor, así que Esteban no aparece.',
    concept: 'INNER JOIN y NULL',
    review: review('S2-L03'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-03',
    level: 'aplicar',
    topic: 'join',
    subtopic: 'Recuento de un JOIN',
    type: 'single_choice',
    response: 'single',
    difficulty: 2,
    prompt:
      'EMPLEADOS tiene 20 filas (Esteban sin departamento) y DEPARTAMENTOS 6. ¿Cuántas filas devuelve esta consulta?',
    code: codeOf('S2-E-INNER'),
    options: textOptions([
      { body: '20', feedback: 'Esteban no tiene pareja: el INNER JOIN lo descarta.' },
      {
        body: count('S2-E-INNER'),
        correct: true,
        feedback: 'Una fila por persona con departamento.',
      },
      { body: '6', feedback: 'Eso sería una fila por departamento.' },
      { body: '120', feedback: 'Eso sería un CROSS JOIN (20 × 6).' },
    ]),
    explanation:
      'Cada persona con departamento forma una pareja; Investigación no tiene personas y Esteban no tiene departamento.',
    concept: 'INNER JOIN',
    review: review('S2-L04'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-04',
    level: 'analizar',
    topic: 'join',
    subtopic: 'Condición ON equivocada',
    type: 'find_error',
    response: 'single',
    difficulty: 3,
    prompt: `Debía mostrar el departamento de cada persona, pero devuelve ${count('S2-E-ON-EQUIVOCADO')} filas: Mario con Operaciones y Esteban con TI. ¿Cuál es el error?`,
    code: codeOf('S2-E-ON-EQUIVOCADO'),
    options: textOptions([
      {
        body: 'El ON compara ID_EMPLEADO con ID_DEPARTAMENTO.',
        correct: true,
        feedback: 'Une claves sin relación: solo coinciden los números 10 y 20.',
      },
      {
        body: 'Falta la palabra INNER antes de JOIN.',
        feedback: 'JOIN e INNER JOIN son lo mismo.',
      },
      {
        body: 'ORDER BY descarta las filas sobrantes.',
        feedback: 'ORDER BY ordena; no elimina filas.',
      },
      {
        body: 'La condición ON necesita paréntesis.',
        feedback: 'Los paréntesis son opcionales; el problema es qué se compara.',
      },
    ]),
    explanation:
      'La condición debe unir la FK con la PK que referencia: e.id_departamento = d.id_departamento. Mario (ID 10) y Esteban (ID 20) coinciden por casualidad con los departamentos 10 y 20.',
    concept: 'Condición ON',
    review: review('S2-L04'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-05',
    level: 'aplicar',
    topic: 'join',
    subtopic: 'Elegir el JOIN',
    type: 'choose_query',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué consulta muestra cada proyecto con el nombre de su departamento responsable?',
    options: queryOptions('S2-B-PROY-DEPTO', [
      {
        example: 'S2-B-PROY-ON-MAL',
        feedback: 'Compara ID_PROYECTO con ID_DEPARTAMENTO: no devuelve ninguna fila.',
      },
      {
        example: 'S2-B-PROY-DEPTO',
        feedback: 'Une la FK de PROYECTOS con la PK de DEPARTAMENTOS.',
      },
      {
        example: 'S2-B-PROY-LEFT',
        feedback: 'Añade a Investigación con proyecto NULL: lista departamentos, no proyectos.',
      },
      {
        example: 'S2-B-PROY-CROSS',
        feedback: 'CROSS JOIN combina cada proyecto con Finanzas sin que exista relación.',
      },
    ]),
    explanation:
      'Cada proyecto tiene un ID_DEPARTAMENTO: el JOIN lo empareja con la fila de DEPARTAMENTOS que tiene esa clave.',
    concept: 'INNER JOIN',
    review: review('S2-L05'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-06',
    level: 'analizar',
    topic: 'join',
    subtopic: 'Tabla intermedia',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Quiénes trabajan en el proyecto 105 y con qué rol?',
    code: codeOf('S2-B-TRES-105'),
    exhibit: exhibitOf('S2-B-TRES-105'),
    options: resultOptions(
      {
        example: 'S2-B-TRES-105',
        body: 'Carolina (Analista) y Laura (Líder).',
        feedback: 'Las dos filas de ASIGNACIONES del proyecto 105.',
      },
      0,
      [
        {
          body: 'Solo Laura (Líder).',
          rows: [['Laura', 'Líder']],
          feedback: 'Carolina también está asignada al 105.',
        },
        {
          body: 'Carolina, Laura y Julián.',
          rows: [
            ['Carolina', 'Analista'],
            ['Julián', 'Asistente'],
            ['Laura', 'Líder'],
          ],
          feedback: 'Julián es de Recursos Humanos, pero no tiene asignación en el 105.',
        },
        {
          body: 'Carolina (Líder) y Laura (Analista).',
          rows: [
            ['Carolina', 'Líder'],
            ['Laura', 'Analista'],
          ],
          feedback: 'Cada fila de ASIGNACIONES une a una persona con su propio rol.',
        },
      ],
    ),
    explanation:
      'ASIGNACIONES dice quién está en cada proyecto; el JOIN con EMPLEADOS solo añade el nombre. Ser del departamento del proyecto no implica estar asignado.',
    concept: 'JOIN con tabla intermedia',
    review: review('S2-L07'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-07',
    level: 'recordar',
    topic: 'otros-join',
    subtopic: 'LEFT OUTER JOIN',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: 'En empleados e LEFT JOIN departamentos d, ¿qué pasa con una persona sin departamento?',
    options: textOptions([
      {
        body: 'Aparece, con NULL en las columnas de DEPARTAMENTOS.',
        correct: true,
        feedback: 'LEFT JOIN conserva todas las filas de la izquierda.',
      },
      { body: 'Desaparece del resultado.', feedback: 'Eso pasa con INNER JOIN.' },
      {
        body: 'Aparece con el primer departamento de la tabla.',
        feedback: 'Oracle no inventa parejas: rellena con NULL.',
      },
      {
        body: 'Oracle devuelve un error por el NULL.',
        feedback: 'No es un error: es justamente el caso que resuelve LEFT JOIN.',
      },
    ]),
    explanation:
      'LEFT OUTER JOIN conserva todas las filas de la tabla izquierda; sin pareja, la derecha aporta NULL.',
    concept: 'LEFT OUTER JOIN',
    review: review('S2-L08'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-08',
    level: 'analizar',
    topic: 'otros-join',
    subtopic: 'Filtro en ON o en WHERE',
    type: 'compare_results',
    response: 'single',
    difficulty: 4,
    prompt: 'Compara las dos consultas. ¿Qué es cierto?',
    exhibit: {
      queries: [
        { label: 'A', sql: codeOf('S2-E-LEFT-FILTRO-ON') },
        { label: 'B', sql: codeOf('S2-E-LEFT-FILTRO-WHERE') },
      ],
    },
    options: textOptions([
      {
        body: `A devuelve ${count('S2-E-LEFT-FILTRO-ON')} filas y B ${count('S2-E-LEFT-FILTRO-WHERE')}.`,
        correct: true,
        feedback: 'En B, el WHERE descarta las filas con NULL que el LEFT JOIN había conservado.',
      },
      {
        body: 'Devuelven lo mismo: ON y WHERE filtran igual.',
        feedback: 'En un LEFT JOIN no: ON decide la pareja y WHERE elimina filas después.',
      },
      {
        body: 'B devuelve más filas: WHERE actúa antes del JOIN.',
        feedback: 'WHERE se aplica después del JOIN.',
      },
      {
        body: 'A falla: ON no admite dos condiciones.',
        feedback: 'ON admite condiciones unidas con AND.',
      },
    ]),
    explanation:
      'En A, el cargo es parte de la condición: los departamentos sin líder se conservan con NULL (Operaciones, Investigación). En B, WHERE e.cargo = … es desconocido para esos NULL y los descarta.',
    concept: 'LEFT JOIN y WHERE',
    review: review('S2-L08'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-09',
    level: 'analizar',
    topic: 'otros-join',
    subtopic: 'FULL OUTER JOIN',
    type: 'single_choice',
    response: 'single',
    difficulty: 4,
    prompt:
      'Hay 19 parejas persona-departamento, una persona sin departamento (Esteban) y un departamento sin personas (Investigación). ¿Cuántas filas cuenta esta consulta?',
    code: codeOf('S2-E-FULL-CONTEO'),
    options: textOptions([
      { body: '19', feedback: 'Eso cuenta solo las parejas (INNER JOIN).' },
      { body: '20', feedback: 'Eso sería LEFT JOIN: falta Investigación.' },
      {
        body: String(valueOf('S2-E-FULL-CONTEO')),
        correct: true,
        feedback: '19 parejas + Esteban + Investigación.',
      },
      { body: '26', feedback: 'No se suman las tablas completas: las parejas cuentan una vez.' },
    ]),
    explanation:
      'FULL OUTER JOIN conserva las parejas y, además, las filas sin pareja de las dos tablas.',
    concept: 'FULL OUTER JOIN',
    review: review('S2-L09'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-10',
    level: 'analizar',
    topic: 'otros-join',
    subtopic: 'Departamentos sin personas',
    type: 'short_case',
    response: 'multiple',
    difficulty: 4,
    prompt: '¿Qué consultas devuelven los departamentos que no tienen ninguna persona?',
    options: textOptions([
      {
        body: codeOf('S2-E-LEFT-SIN-EMPLEADOS'),
        code: true,
        correct: true,
        feedback:
          'El LEFT JOIN conserva a Investigación y el WHERE se queda con las filas sin pareja.',
      },
      {
        body: codeOf('S2-E-NOT-EXISTS-DEPTO'),
        code: true,
        correct: true,
        feedback: 'NOT EXISTS busca departamentos sin ninguna persona que los referencie.',
      },
      {
        body: codeOf('S2-E-NOT-IN-NULL'),
        code: true,
        feedback: `Devuelve ${count('S2-E-NOT-IN-NULL')} filas: la subconsulta incluye el NULL de Esteban.`,
      },
    ]),
    explanation:
      'Hay dos patrones seguros: LEFT JOIN + IS NULL y NOT EXISTS. NOT IN falla en silencio si la subconsulta devuelve algún NULL.',
    concept: 'Filas sin pareja',
    review: review('S2-L08'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-11',
    level: 'aplicar',
    topic: 'otros-join',
    subtopic: 'SELF JOIN',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta? (ID_JEFE apunta a la misma tabla.)',
    code: codeOf('S2-E-SELF'),
    exhibit: exhibitOf('S2-E-SELF'),
    options: resultOptions(
      {
        example: 'S2-E-SELF',
        body: 'Carlos con Ana; Andrés, Paula y Oscar con Carlos.',
        feedback: 'e es la persona y j, su jefe.',
      },
      2,
      [
        {
          body: 'Las columnas al revés: Ana con Carlos…',
          rows: [
            ['Ana', 'Carlos'],
            ['Carlos', 'Andrés'],
            ['Carlos', 'Paula'],
            ['Carlos', 'Oscar'],
          ],
          feedback: 'e.id_jefe = j.id_empleado: la primera columna es la persona, no el jefe.',
        },
        {
          body: 'Todos con Ana como jefa.',
          rows: [
            ['Carlos', 'Ana'],
            ['Andrés', 'Ana'],
            ['Paula', 'Ana'],
            ['Oscar', 'Ana'],
          ],
          feedback: 'Solo Carlos reporta a Ana; el resto de TI reporta a Carlos.',
        },
        {
          body: 'Sin Carlos: solo los analistas.',
          rows: [
            ['Andrés', 'Carlos'],
            ['Paula', 'Carlos'],
            ['Oscar', 'Carlos'],
          ],
          feedback: 'Carlos también es de TI y tiene jefa (Ana).',
        },
      ],
    ),
    explanation:
      'En un SELF JOIN la tabla aparece dos veces con alias distintos: e para la persona y j para su jefe.',
    concept: 'SELF JOIN',
    review: review('S2-L10'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-12',
    level: 'analizar',
    topic: 'otros-join',
    subtopic: 'SELF JOIN con LEFT',
    type: 'interpret_query',
    response: 'single',
    difficulty: 3,
    prompt: 'En el resultado de esta consulta, Ana aparece con jefe NULL. ¿Por qué?',
    code: codeOf('S2-E-SELF-LEFT'),
    options: textOptions([
      {
        body: 'Ana no tiene jefe y el LEFT JOIN la conserva sin pareja.',
        correct: true,
        feedback: 'Su ID_JEFE es NULL.',
      },
      {
        body: 'El JOIN falla para Ana por un error de datos.',
        feedback: 'No hay error: falta el dato.',
      },
      {
        body: 'Ana es su propia jefa y Oracle lo muestra como NULL.',
        feedback: 'ID_JEFE de Ana es NULL, no 1.',
      },
      {
        body: 'El WHERE e.id_jefe IS NULL borra el nombre del jefe.',
        feedback: 'WHERE filtra filas; no cambia valores.',
      },
    ]),
    explanation:
      'LEFT JOIN conserva a cada persona aunque no encuentre jefe; las columnas del jefe quedan en NULL.',
    concept: 'SELF JOIN y LEFT JOIN',
    review: review('S2-L10'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-13',
    level: 'aplicar',
    topic: 'otros-join',
    subtopic: 'CROSS JOIN',
    type: 'single_choice',
    response: 'single',
    difficulty: 2,
    prompt: 'DEPARTAMENTOS tiene 6 filas y PROYECTOS 7. ¿Qué número devuelve la consulta?',
    code: codeOf('S2-E-CROSS-CONTEO'),
    options: textOptions([
      { body: '6', feedback: 'Eso es solo DEPARTAMENTOS.' },
      { body: '13', feedback: 'CROSS JOIN multiplica, no suma.' },
      {
        body: String(valueOf('S2-E-CROSS-CONTEO')),
        correct: true,
        feedback: 'Cada departamento con cada proyecto: 6 × 7.',
      },
      { body: '7', feedback: 'Eso es solo PROYECTOS.' },
    ]),
    explanation: 'CROSS JOIN combina cada fila de una tabla con cada fila de la otra.',
    concept: 'CROSS JOIN',
    review: review('S2-L11'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-14',
    level: 'analizar',
    topic: 'join',
    subtopic: 'Producto cartesiano accidental',
    type: 'find_error',
    response: 'single',
    difficulty: 4,
    prompt: `Se quería contar las personas de departamentos con sede en Bogotá, pero la consulta devuelve ${String(valueOf('S2-E-SIN-CONDICION'))}. ¿Qué pasó?`,
    code: codeOf('S2-E-SIN-CONDICION'),
    options: textOptions([
      {
        body: 'Falta unir las tablas: cada persona va con 3 departamentos.',
        correct: true,
        feedback: '20 personas × 3 departamentos con sede en Bogotá.',
      },
      {
        body: 'COUNT(*) cuenta dos veces las filas que tienen algún NULL.',
        feedback: 'COUNT(*) cuenta cada fila una vez.',
      },
      {
        body: 'La coma entre las tablas equivale a un LEFT JOIN.',
        feedback: 'Sin condición, la coma produce un producto cartesiano.',
      },
      {
        body: 'WHERE se aplica después de contar, no antes.',
        feedback: 'WHERE filtra antes de COUNT(*).',
      },
    ]),
    explanation:
      'Con la sintaxis de coma, la condición de unión va en el WHERE. Sin ella, cada fila de EMPLEADOS se combina con cada departamento de Bogotá (10, 20 y 50).',
    concept: 'Producto cartesiano',
    review: review('S2-L11'),
    reference: REF.joins,
  },
  {
    key: 'S2-JOIN-15',
    level: 'analizar',
    topic: 'otros-join',
    subtopic: 'NATURAL JOIN',
    type: 'compare_results',
    response: 'single',
    difficulty: 5,
    prompt: '¿En qué proyectos trabaja Andrés? Compara las dos consultas. ¿Qué es cierto?',
    exhibit: {
      queries: [
        { label: 'A', sql: codeOf('S2-E-NATURAL') },
        { label: 'B', sql: codeOf('S2-E-PROYECTO-REAL') },
      ],
    },
    options: textOptions([
      {
        body: 'A une por ID_DEPARTAMENTO: da proyectos de TI, no asignaciones.',
        correct: true,
        feedback: `A devuelve ${count('S2-E-NATURAL')} proyectos; Andrés solo está asignado a ${count('S2-E-PROYECTO-REAL')}.`,
      },
      {
        body: 'A es la correcta y B olvida uno de los proyectos de Andrés.',
        feedback: 'B usa ASIGNACIONES, la tabla que dice quién trabaja en qué.',
      },
      {
        body: 'Dan lo mismo: NATURAL JOIN usa la clave foránea.',
        feedback: 'NATURAL JOIN usa todas las columnas con el mismo nombre, no las FK.',
      },
      {
        body: 'B falla porque no se pueden unir tres tablas seguidas.',
        feedback: 'Se pueden encadenar tantos JOIN como haga falta.',
      },
    ]),
    explanation:
      'NATURAL JOIN une por toda columna con el mismo nombre. EMPLEADOS y PROYECTOS comparten ID_DEPARTAMENTO, así que A responde «proyectos de su departamento», otra pregunta.',
    concept: 'NATURAL JOIN',
    review: review('S2-L11'),
    reference: REF.joins,
  },
];

const countNull = tableOf('S2-E-COUNT-NULL');
const conBono = String(countNull.rows[0]?.[countNull.columns.indexOf('CON_BONO')]);
const avgNvl = tableOf('S2-E-AVG-NVL').rows[0]!;

const agregacion: BankQuestion[] = [
  {
    key: 'S2-AGG-01',
    level: 'recordar',
    topic: 'agregacion',
    subtopic: 'COUNT y NULL',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué diferencia hay entre COUNT(*) y COUNT(bono)?',
    options: textOptions([
      {
        body: 'COUNT(*) cuenta filas; COUNT(bono), los bonos no NULL.',
        correct: true,
        feedback: 'Las funciones de grupo con columna ignoran los NULL.',
      },
      {
        body: 'Ninguna: las dos cuentan todas las filas.',
        feedback: 'COUNT(columna) ignora NULL.',
      },
      { body: 'COUNT(bono) suma los valores de los bonos.', feedback: 'Eso hace SUM(bono).' },
      {
        body: 'COUNT(*) ignora las filas que tienen algún NULL.',
        feedback: 'COUNT(*) cuenta todas las filas.',
      },
    ]),
    explanation: 'COUNT(*) cuenta filas; COUNT(columna) cuenta los valores no NULL de esa columna.',
    concept: 'COUNT',
    review: review('S2-L13'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-02',
    level: 'aplicar',
    topic: 'agregacion',
    subtopic: 'COUNT(columna)',
    type: 'single_choice',
    response: 'single',
    difficulty: 2,
    prompt:
      'Hay 20 personas: 6 no tienen bono (NULL) y Mario tiene bono 0. ¿Qué valor da COUNT(bono) en esta consulta?',
    code: codeOf('S2-E-COUNT-NULL'),
    options: textOptions([
      { body: '13', feedback: 'El 0 de Mario es un valor: sí se cuenta.' },
      { body: conBono, correct: true, feedback: '20 filas menos los 6 NULL.' },
      { body: '20', feedback: 'Eso da COUNT(*).' },
      { body: '6', feedback: 'Esos son los que no tienen bono.' },
    ]),
    explanation: 'COUNT(bono) cuenta los bonos registrados, incluido el 0; ignora solo los NULL.',
    concept: 'COUNT y NULL',
    review: review('S2-L13'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-03',
    level: 'analizar',
    topic: 'agregacion',
    subtopic: 'AVG y NULL',
    type: 'compare_results',
    response: 'single',
    difficulty: 4,
    prompt: `Esta consulta devuelve ${String(avgNvl[0])} y ${String(avgNvl[1])}. Los 14 bonos registrados suman 5.000.000. ¿Por qué los promedios difieren?`,
    code: codeOf('S2-E-AVG-NVL'),
    options: textOptions([
      {
        body: 'AVG ignora los NULL (÷14); con NVL valen 0 (÷20).',
        correct: true,
        feedback: '5.000.000 ÷ 14 frente a 5.000.000 ÷ 20.',
      },
      { body: 'NVL redondea los bonos hacia abajo.', feedback: 'NVL reemplaza NULL; no redondea.' },
      {
        body: 'AVG(bono) cuenta dos veces el bono 0 de Mario.',
        feedback: 'Cada fila cuenta una vez.',
      },
      {
        body: 'Es un error de redondeo de ROUND.',
        feedback: 'La diferencia supera los 100.000: no es redondeo.',
      },
    ]),
    explanation:
      'AVG(bono) divide la suma entre los valores no NULL; AVG(NVL(bono, 0)) cuenta a todas las personas, con 0 para quien no tiene bono. Elegir una u otra es una decisión de negocio.',
    concept: 'AVG y NVL',
    review: review('S2-L13'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-04',
    level: 'aplicar',
    topic: 'agregacion',
    subtopic: 'Columna sin agrupar',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `La consulta falla con ${errorOf('S2-E-SIN-GRUPO')}. ¿Qué la corrige?`,
    code: codeOf('S2-E-SIN-GRUPO'),
    options: textOptions([
      {
        body: 'Añadir GROUP BY id_departamento.',
        correct: true,
        feedback: 'Así hay un recuento por departamento.',
      },
      {
        body: 'Cambiar COUNT(*) por COUNT(id_departamento).',
        feedback: 'Sigue mezclando una columna por fila con un total.',
      },
      { body: 'Escribir SELECT DISTINCT id_departamento.', feedback: 'DISTINCT no forma grupos.' },
      {
        body: 'Poner COUNT(*) primero en la lista.',
        feedback: 'El orden de la lista no importa.',
      },
    ]),
    explanation:
      'Una función de grupo sin GROUP BY devuelve una sola fila; una columna normal al lado no tiene un único valor que mostrar.',
    concept: 'GROUP BY',
    review: review('S2-L14'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-05',
    level: 'aplicar',
    topic: 'grupos',
    subtopic: 'WHERE antes de agrupar',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta?',
    code: codeOf('S2-B-CIUDAD-ACTIVOS'),
    exhibit: exhibitOf('S2-B-CIUDAD-ACTIVOS'),
    options: resultOptions(
      {
        example: 'S2-B-CIUDAD-ACTIVOS',
        body: 'Cuatro ciudades con sus activos.',
        feedback: 'WHERE descarta a los inactivos antes de agrupar.',
      },
      3,
      [
        {
          example: 'S2-B-CIUDAD-TODOS',
          body: 'Cinco ciudades, con todas las personas.',
          feedback: 'Eso cuenta también a los inactivos.',
        },
        {
          example: 'S2-B-CIUDAD-BONO',
          body: 'Cuatro ciudades, con menos personas.',
          feedback: 'Eso contaría bonos no NULL: COUNT(bono).',
        },
        {
          body: 'Cinco ciudades, Valledupar con 0.',
          rows: [
            ['Barranquilla', 2],
            ['Bogotá', 6],
            ['Cali', 4],
            ['Medellín', 5],
            ['Valledupar', 0],
          ],
          feedback: 'Un grupo sin filas no aparece: Alicia está inactiva y el WHERE la descarta.',
        },
      ],
    ),
    explanation:
      'Primero WHERE deja a las personas activas; después GROUP BY forma un grupo por ciudad con las filas que quedan. Una ciudad sin filas no forma grupo.',
    concept: 'WHERE y GROUP BY',
    review: review('S2-L17'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-06',
    level: 'analizar',
    topic: 'grupos',
    subtopic: 'GROUP BY incompleto',
    type: 'find_error',
    response: 'single',
    difficulty: 3,
    prompt: `La consulta falla con ${errorOf('S2-E-GROUP-INCOMPLETO')}. ¿Por qué?`,
    code: codeOf('S2-E-GROUP-INCOMPLETO'),
    options: textOptions([
      {
        body: 'CARGO está en el SELECT, pero no en el GROUP BY.',
        correct: true,
        feedback: 'Un departamento tiene varios cargos: no hay un único valor por grupo.',
      },
      {
        body: 'COUNT(*) no puede ir con dos columnas.',
        feedback: 'Puede, si ambas están agrupadas.',
      },
      { body: 'GROUP BY solo admite columnas numéricas.', feedback: 'Admite cualquier tipo.' },
      { body: 'COUNT(*) necesita un alias.', feedback: 'El alias es opcional.' },
    ]),
    explanation:
      'Toda columna del SELECT que no esté dentro de una función de grupo debe aparecer en el GROUP BY.',
    concept: 'Regla del GROUP BY',
    review: review('S2-L15'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-07',
    level: 'aplicar',
    topic: 'grupos',
    subtopic: 'Grupos de dos columnas',
    type: 'single_choice',
    response: 'single',
    difficulty: 3,
    prompt:
      'Hay 5 departamentos con personas más Esteban sin departamento; en tres departamentos hay alguien inactivo. ¿Cuántas filas devuelve?',
    code: codeOf('S2-E-GROUP-DOS'),
    options: textOptions([
      { body: '6', feedback: 'Eso sería agrupar solo por departamento.' },
      {
        body: count('S2-E-GROUP-DOS'),
        correct: true,
        feedback: 'Una fila por combinación existente de departamento y estado.',
      },
      { body: '12', feedback: 'Solo existen las combinaciones que tienen filas.' },
      { body: '20', feedback: 'Eso sería una fila por persona.' },
    ]),
    explanation:
      'Con dos columnas en el GROUP BY, cada combinación presente forma un grupo: 6 grupos ACTIVO (incluido el de Esteban, NULL) y 3 INACTIVO.',
    concept: 'GROUP BY de varias columnas',
    review: review('S2-L15'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-08',
    level: 'recordar',
    topic: 'grupos',
    subtopic: 'WHERE frente a HAVING',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué diferencia hay entre WHERE y HAVING?',
    options: textOptions([
      {
        body: 'WHERE filtra filas antes de agrupar; HAVING, grupos.',
        correct: true,
        feedback: 'Por eso HAVING puede usar funciones de grupo.',
      },
      {
        body: 'Son sinónimos; HAVING es la forma moderna.',
        feedback: 'Actúan en momentos distintos.',
      },
      { body: 'HAVING filtra filas; WHERE filtra grupos.', feedback: 'Es al revés.' },
      { body: 'HAVING solo funciona sin GROUP BY.', feedback: 'HAVING suele ir con GROUP BY.' },
    ]),
    explanation: 'WHERE trabaja fila a fila; HAVING trabaja sobre los grupos ya formados.',
    concept: 'HAVING',
    review: review('S2-L17'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-09',
    level: 'aplicar',
    topic: 'grupos',
    subtopic: 'Función de grupo en WHERE',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `La consulta falla con ${errorOf('S2-E-WHERE-AGREGADO')}. ¿Qué la corrige?`,
    code: codeOf('S2-E-WHERE-AGREGADO'),
    options: textOptions([
      {
        body: 'Pasar la condición a HAVING COUNT(*) > 3.',
        correct: true,
        feedback: 'El recuento solo existe después de agrupar.',
      },
      { body: "Escribir 'COUNT(*)' entre comillas.", feedback: 'Sería un texto, no un recuento.' },
      {
        body: 'Poner el WHERE después del GROUP BY.',
        feedback: 'WHERE tiene un lugar fijo, antes de GROUP BY.',
      },
      {
        body: 'Cambiar COUNT(*) por COUNT(id_departamento).',
        feedback: 'Sigue siendo una función de grupo dentro de WHERE.',
      },
    ]),
    explanation:
      'WHERE se evalúa fila a fila, antes de que existan los grupos; las condiciones sobre funciones de grupo van en HAVING.',
    concept: 'HAVING',
    review: review('S2-L16'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-10',
    level: 'analizar',
    topic: 'grupos',
    subtopic: 'HAVING con recuento',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta?',
    code: codeOf('S2-E-HAVING-COUNT'),
    exhibit: exhibitOf('S2-E-HAVING-COUNT'),
    options: resultOptions(
      {
        example: 'S2-E-HAVING-COUNT',
        body: 'Los departamentos 20, 30 y 40.',
        feedback: 'Los grupos con 4 o más personas.',
      },
      2,
      [
        {
          body: 'Los cinco departamentos con personas.',
          rows: [
            [10, 3],
            [20, 4],
            [30, 5],
            [40, 4],
            [50, 3],
          ],
          feedback: 'Los grupos de 3 no cumplen COUNT(*) >= 4.',
        },
        {
          body: 'Solo el departamento 30.',
          rows: [[30, 5]],
          feedback: '>= 4 incluye los grupos de exactamente 4.',
        },
        {
          body: '20, 30, 40 y el grupo NULL.',
          rows: [
            [20, 4],
            [30, 5],
            [40, 4],
            [null, 1],
          ],
          feedback: 'El grupo NULL (Esteban) tiene 1 persona.',
        },
      ],
    ),
    explanation:
      'GROUP BY forma 6 grupos (incluido el de NULL) y HAVING conserva los que tienen al menos 4 filas.',
    concept: 'HAVING',
    review: review('S2-L16'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-11',
    level: 'analizar',
    topic: 'grupos',
    subtopic: 'Orden lógico de evaluación',
    type: 'order_fragments',
    response: 'order',
    difficulty: 4,
    prompt: 'Ordena las cláusulas según el orden lógico en que Oracle procesa la consulta.',
    options: orderOptions(['FROM … JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY']),
    explanation:
      'Primero se arman y filtran las filas (FROM, WHERE), después se agrupan y filtran los grupos (GROUP BY, HAVING), se calculan las columnas (SELECT) y al final se ordena. Por eso un alias del SELECT sirve en ORDER BY, pero no en WHERE.',
    concept: 'Orden de evaluación',
    review: review('S2-L17'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-12',
    level: 'analizar',
    topic: 'grupos',
    subtopic: 'COUNT con LEFT JOIN',
    type: 'compare_results',
    response: 'single',
    difficulty: 5,
    prompt: 'Las dos consultas cuentan personas por departamento. ¿Qué diferencia hay?',
    exhibit: {
      queries: [
        { label: 'A', sql: codeOf('S2-E-JOIN-COUNT') },
        { label: 'B', sql: codeOf('S2-E-JOIN-COUNT-STAR') },
      ],
    },
    options: textOptions([
      {
        body: 'Investigación da 0 en A y 1 en B.',
        correct: true,
        feedback: 'COUNT(*) cuenta la fila con NULL que añade el LEFT JOIN.',
      },
      { body: 'Ninguna: COUNT siempre cuenta filas.', feedback: 'COUNT(columna) ignora NULL.' },
      {
        body: 'B no muestra a Investigación.',
        feedback: 'El LEFT JOIN la conserva en las dos.',
      },
      { body: 'A falla porque cuenta una columna de la tabla derecha.', feedback: 'Es válido.' },
    ]),
    explanation:
      'El LEFT JOIN da a Investigación una fila con NULL en EMPLEADOS. COUNT(e.id_empleado) la ignora (0 personas); COUNT(*) la cuenta como una fila (1).',
    concept: 'COUNT y OUTER JOIN',
    review: review('S2-L18'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-13',
    level: 'aplicar',
    topic: 'grupos',
    subtopic: 'HAVING con SUM',
    type: 'choose_query',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué consulta lista los proyectos con más de 35 horas semanales en total?',
    options: queryOptions('S2-E-PROYECTOS-HORAS', [
      { example: 'S2-B-HORAS-COUNT', feedback: 'Filtra por número de personas, no por horas.' },
      {
        example: 'S2-E-PROYECTOS-HORAS',
        feedback: 'HAVING sobre la suma de horas de cada proyecto.',
      },
      { example: 'S2-B-HORAS-TODOS', feedback: 'Sin HAVING muestra todos los proyectos.' },
    ]),
    explanation:
      'La condición es sobre el total del grupo: HAVING SUM(a.horas_semanales) > 35. Cierre contable y Ruta logística tienen exactamente 35 y no cumplen.',
    concept: 'HAVING',
    review: review('S2-L19'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-14',
    level: 'analizar',
    topic: 'grupos',
    subtopic: 'Dos condiciones de grupo',
    type: 'choose_query',
    response: 'single',
    difficulty: 4,
    prompt:
      'Gerencia pide los departamentos con al menos 3 personas activas y un salario promedio de esas personas mayor que 4.000.000. ¿Qué consulta lo cumple?',
    options: queryOptions('S2-P-META', [
      {
        example: 'S2-P-META-OR',
        feedback: 'OR deja pasar grupos que cumplen solo una de las dos condiciones.',
      },
      {
        example: 'S2-P-META-GE',
        feedback: '>= incluye a Recursos Humanos, con promedio exactamente 4.000.000.',
      },
      { example: 'S2-P-META', feedback: 'Las dos condiciones a la vez y estrictamente mayor.' },
    ]),
    explanation:
      'Las dos condiciones son sobre grupos y deben cumplirse a la vez: HAVING COUNT(*) >= 3 AND AVG(e.salario) > 4000000.',
    concept: 'HAVING con varias condiciones',
    review: review('S2-L19'),
    reference: REF.aggregate,
  },
  {
    key: 'S2-AGG-15',
    level: 'aplicar',
    topic: 'agregacion',
    subtopic: 'MIN y MAX con texto y fechas',
    type: 'single_choice',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué devuelve MIN(nombre) en esta consulta?',
    code: codeOf('S2-E-MIN-MAX-TEXTO'),
    options: textOptions([
      {
        body: String(tableOf('S2-E-MIN-MAX-TEXTO').rows[0]?.[2]),
        correct: true,
        feedback: 'El primero en orden alfabético.',
      },
      { body: 'Ana', feedback: '«Al» va antes que «An».' },
      { body: 'Valentina', feedback: 'Ese sería MAX(nombre).' },
      {
        body: 'Un error: MIN solo admite números',
        feedback: 'MIN y MAX funcionan con textos y fechas.',
      },
    ]),
    explanation: 'MIN y MAX comparan textos en orden alfabético y fechas en orden cronológico.',
    concept: 'MIN y MAX',
    review: review('S2-L12'),
    reference: REF.aggregate,
  },
];

const subconsultas: BankQuestion[] = [
  {
    key: 'S2-SUB-01',
    level: 'recordar',
    topic: 'subconsultas',
    subtopic: 'Subconsulta de una fila',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: 'Una subconsulta escrita después de = ¿cuántas filas debe devolver?',
    options: textOptions([
      {
        body: 'Una sola; si devuelve varias, ORA-01427.',
        correct: true,
        feedback: '= compara con un único valor.',
      },
      { body: 'Cualquier número: = compara con todas.', feedback: 'Para varias filas se usa IN.' },
      { body: 'Al menos dos, en una sola columna.', feedback: 'Con = debe ser exactamente una.' },
      {
        body: 'Una por cada fila de la consulta externa.',
        feedback: 'Eso describe cuántas veces se evalúa una correlacionada.',
      },
    ]),
    explanation:
      'Los operadores =, <, > esperan un único valor; IN, ANY y ALL admiten varias filas.',
    concept: 'Subconsulta de una fila',
    review: review('S2-L20'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-02',
    level: 'aplicar',
    topic: 'subconsultas',
    subtopic: 'Comparar con el promedio',
    type: 'single_choice',
    response: 'single',
    difficulty: 3,
    prompt:
      'El salario promedio de la empresa es 4.580.000. Con la tabla de salarios, ¿cuántas filas devuelve la consulta?',
    code: codeOf('S2-E-SUB-AVG'),
    exhibit: exhibitOf('S2-E-SUB-AVG'),
    options: textOptions([
      {
        body: '7',
        feedback: 'Diego y Alicia están inactivos, pero la consulta no filtra por estado: cuentan.',
      },
      {
        body: count('S2-E-SUB-AVG'),
        correct: true,
        feedback: 'Las personas con salario > 4.580.000.',
      },
      { body: '9', feedback: 'Andrés y Paula ganan 4.200.000: están por debajo.' },
      { body: '20', feedback: 'La subconsulta filtra: no devuelve a todos.' },
    ]),
    explanation:
      'La subconsulta se calcula una vez (4.580.000) y la externa conserva a quienes ganan más: Ana, Carlos, Jorge, Daniela, María, Laura, Diego y Alicia.',
    concept: 'Subconsulta escalar',
    review: review('S2-L20'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-03',
    level: 'aplicar',
    topic: 'subconsultas',
    subtopic: 'Varias filas con =',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `La consulta falla con ${errorOf('S2-E-SUB-VARIAS')}. ¿Qué la corrige?`,
    code: codeOf('S2-E-SUB-VARIAS'),
    options: textOptions([
      {
        body: 'Cambiar = por IN: hay tres en Bogotá.',
        correct: true,
        feedback: 'IN compara con todos los valores de la subconsulta.',
      },
      {
        body: 'Añadir ORDER BY dentro de la subconsulta.',
        feedback: 'El orden no reduce las filas.',
      },
      {
        body: "Escribir 'Bogotá' en mayúsculas.",
        feedback: 'Cambiaría el texto y no encontraría nada.',
      },
      { body: 'Cambiar = por > en la condición.', feedback: '> también espera un único valor.' },
    ]),
    explanation:
      'Los departamentos 10, 20 y 50 tienen sede en Bogotá: la subconsulta devuelve tres filas y = solo admite una.',
    concept: 'Subconsulta de varias filas',
    review: review('S2-L21'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-04',
    level: 'analizar',
    topic: 'subconsultas',
    subtopic: 'NOT IN y NULL',
    type: 'interpret_query',
    response: 'single',
    difficulty: 5,
    prompt: `Investigación no tiene personas, pero esta consulta devuelve ${count('S2-E-NOT-IN-NULL')} filas. ¿Por qué?`,
    code: codeOf('S2-E-NOT-IN-NULL'),
    options: textOptions([
      {
        body: 'La subconsulta trae un NULL (Esteban).',
        correct: true,
        feedback: 'x NOT IN (…, NULL) nunca es verdadero.',
      },
      {
        body: 'NOT IN no admite subconsultas.',
        feedback: 'Funciona, salvo cuando hay NULL.',
      },
      {
        body: 'Investigación sí tiene personas.',
        feedback: 'No tiene: NOT EXISTS lo confirma.',
      },
      { body: 'Falta un ORDER BY al final.', feedback: 'El orden no cambia qué filas cumplen.' },
    ]),
    explanation:
      'NOT IN equivale a varias comparaciones <> unidas con AND; una de ellas es con NULL y da desconocido. Filtra los NULL en la subconsulta o usa NOT EXISTS.',
    concept: 'NOT IN y NULL',
    review: review('S2-L21'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-05',
    level: 'analizar',
    topic: 'subconsultas',
    subtopic: 'Formas equivalentes',
    type: 'short_case',
    response: 'multiple',
    difficulty: 4,
    prompt: '¿Qué consultas devuelven a las personas que no tienen ningún proyecto asignado?',
    options: queryOptions('S2-E-SIN-PROYECTO', [
      {
        example: 'S2-E-SIN-PROYECTO',
        feedback: 'Seguro aquí: ID_EMPLEADO de ASIGNACIONES nunca es NULL.',
      },
      {
        example: 'S2-B-CON-PROYECTO',
        feedback: 'IN devuelve justo lo contrario: quienes sí tienen.',
      },
      {
        example: 'S2-B-SIN-PROYECTO-LEFT',
        feedback: 'LEFT JOIN + IS NULL conserva a quienes no tienen pareja.',
      },
      {
        example: 'S2-B-SIN-PROYECTO-INNER',
        feedback: 'Con INNER JOIN nadie tiene proyecto NULL: no devuelve filas.',
      },
      {
        example: 'S2-B-SIN-PROYECTO-EXISTS',
        feedback: 'NOT EXISTS busca personas sin ninguna asignación.',
      },
    ]),
    explanation:
      'NOT IN (sin NULL en la subconsulta), LEFT JOIN + IS NULL y NOT EXISTS expresan «sin pareja». Un INNER JOIN nunca conserva filas sin pareja.',
    concept: 'Antijoin',
    review: review('S2-L21'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-06',
    level: 'analizar',
    topic: 'subconsultas',
    subtopic: 'Subconsulta correlacionada',
    type: 'interpret_query',
    response: 'single',
    difficulty: 4,
    prompt: '¿Con qué promedio se compara el salario de cada persona?',
    code: codeOf('S2-E-CORRELACIONADA'),
    options: textOptions([
      {
        body: 'Con el de su propio departamento.',
        correct: true,
        feedback: 'i.id_departamento = e.id_departamento la evalúa para cada fila de e.',
      },
      {
        body: 'Con el de toda la empresa.',
        feedback: 'Eso pasaría sin la condición que la relaciona.',
      },
      { body: 'Con el del primer departamento.', feedback: 'Se recalcula para cada persona.' },
      {
        body: 'Con el salario máximo de su área.',
        feedback: 'La subconsulta calcula AVG, no MAX.',
      },
    ]),
    explanation:
      'Una subconsulta correlacionada usa una columna de la consulta externa (e.id_departamento) y se evalúa para cada fila.',
    concept: 'Subconsulta correlacionada',
    review: review('S2-L22'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-07',
    level: 'aplicar',
    topic: 'subconsultas',
    subtopic: 'NOT EXISTS',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta?',
    code: codeOf('S2-E-NOT-EXISTS'),
    exhibit: exhibitOf('S2-E-NOT-EXISTS'),
    options: resultOptions(
      {
        example: 'S2-E-NOT-EXISTS',
        body: 'Solo Automatización de nómina.',
        feedback: 'El proyecto 106 no tiene filas en ASIGNACIONES.',
      },
      1,
      [
        {
          body: 'Bienestar laboral.',
          rows: [['Bienestar laboral']],
          feedback: 'Bienestar laboral tiene a Laura y Carolina.',
        },
        {
          body: 'Ningún proyecto.',
          rows: [],
          feedback: 'NOT EXISTS es verdadero cuando la subconsulta no encuentra filas.',
        },
        {
          body: 'Automatización de nómina y Ruta logística.',
          rows: [['Automatización de nómina'], ['Ruta logística']],
          feedback: 'Ruta logística tiene asignaciones de Ana y Felipe.',
        },
      ],
    ),
    explanation:
      'Para cada proyecto, la subconsulta busca asignaciones; NOT EXISTS conserva los proyectos sin ninguna.',
    concept: 'NOT EXISTS',
    review: review('S2-L22'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-SUB-08',
    level: 'analizar',
    topic: 'subconsultas',
    subtopic: 'IN frente a JOIN',
    type: 'compare_results',
    response: 'single',
    difficulty: 4,
    prompt: 'Las dos consultas buscan a quienes trabajan en proyectos de TI. ¿Qué es cierto?',
    exhibit: {
      queries: [
        { label: 'A', sql: codeOf('S2-B-IN-TI') },
        { label: 'B', sql: codeOf('S2-B-JOIN-TI') },
      ],
    },
    options: textOptions([
      {
        body: `A devuelve ${count('S2-B-IN-TI')} filas y B ${count('S2-B-JOIN-TI')}.`,
        correct: true,
        feedback: 'B repite a Carlos y Paula, que están en los dos proyectos de TI.',
      },
      { body: 'Devuelven lo mismo.', feedback: 'El JOIN produce una fila por asignación.' },
      { body: 'A repite personas; B no.', feedback: 'Es al revés: IN no multiplica filas.' },
      { body: 'B falla por tener dos JOIN.', feedback: 'Encadenar JOIN es válido.' },
    ]),
    explanation:
      'IN pregunta si la persona está en la lista; el JOIN crea una fila por cada asignación. Para «quién», IN (o DISTINCT) evita repetidos.',
    concept: 'IN frente a JOIN',
    review: review('S2-L21'),
    reference: REF.subqueries,
  },
];

const conjuntos: BankQuestion[] = [
  {
    key: 'S2-SET-01',
    level: 'recordar',
    topic: 'conjuntos',
    subtopic: 'UNION y UNION ALL',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué diferencia hay entre UNION y UNION ALL?',
    options: textOptions([
      {
        body: 'UNION quita repetidas; UNION ALL no.',
        correct: true,
        feedback: 'UNION ALL no compara filas.',
      },
      { body: 'UNION ALL quita repetidas; UNION, no.', feedback: 'Es al revés.' },
      {
        body: 'UNION ALL exige el mismo número de filas.',
        feedback: 'Exige las mismas columnas, no filas.',
      },
      {
        body: 'Ninguna: ALL es opcional y no cambia nada.',
        feedback: 'Cambia si se eliminan repetidas.',
      },
    ]),
    explanation:
      'UNION elimina duplicados del resultado combinado; UNION ALL devuelve todas las filas.',
    concept: 'UNION',
    review: review('S2-L23'),
    reference: REF.sets,
  },
  {
    key: 'S2-SET-02',
    level: 'aplicar',
    topic: 'conjuntos',
    subtopic: 'UNION ALL',
    type: 'single_choice',
    response: 'single',
    difficulty: 2,
    prompt: 'EMPLEADOS tiene 20 filas y DEPARTAMENTOS 6. ¿Cuántas filas devuelve esta consulta?',
    code: codeOf('S2-P-UNION-ALL-CIUDADES'),
    options: textOptions([
      { body: count('S2-E-UNION'), feedback: 'Eso devolvería UNION, que quita repetidas.' },
      { body: '20', feedback: 'Faltan las 6 sedes.' },
      {
        body: count('S2-P-UNION-ALL-CIUDADES'),
        correct: true,
        feedback: '20 + 6, sin quitar repetidas.',
      },
      { body: '6', feedback: 'Eso es solo DEPARTAMENTOS.' },
    ]),
    explanation: 'UNION ALL suma las filas de las dos consultas.',
    concept: 'UNION ALL',
    review: review('S2-L23'),
    reference: REF.sets,
  },
  {
    key: 'S2-SET-03',
    level: 'aplicar',
    topic: 'conjuntos',
    subtopic: 'Columnas compatibles',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: `La consulta falla con ${errorOf('S2-E-UNION-COLUMNAS')}. ¿Por qué?`,
    code: codeOf('S2-E-UNION-COLUMNAS'),
    options: textOptions([
      {
        body: 'Tienen distinto número de columnas.',
        correct: true,
        feedback: 'Deben tener el mismo número de columnas.',
      },
      {
        body: 'UNION no admite tablas distintas.',
        feedback: 'Es justamente para combinar consultas distintas.',
      },
      { body: 'Falta un ORDER BY al final.', feedback: 'ORDER BY es opcional.' },
      {
        body: 'Los nombres de columna deben coincidir.',
        feedback: 'El resultado usa los de la primera.',
      },
    ]),
    explanation:
      'Los operadores de conjuntos exigen el mismo número de columnas y tipos compatibles, posición por posición.',
    concept: 'Operadores de conjuntos',
    review: review('S2-L23'),
    reference: REF.sets,
  },
  {
    key: 'S2-SET-04',
    level: 'analizar',
    topic: 'conjuntos',
    subtopic: 'MINUS',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta?',
    code: codeOf('S2-E-MINUS'),
    exhibit: exhibitOf('S2-E-MINUS'),
    options: resultOptions(
      {
        example: 'S2-E-MINUS',
        body: 'Solo Valledupar.',
        feedback: 'Ciudad con personas y sin sede de departamento.',
      },
      0,
      [
        {
          body: 'Ninguna fila.',
          rows: [],
          feedback: `Eso da sedes MINUS ciudades (${count('S2-B-SEDE-MINUS')} filas): en MINUS el orden importa.`,
        },
        {
          example: 'S2-E-INTERSECT',
          body: 'Barranquilla, Bogotá, Cali y Medellín.',
          feedback: 'Eso es INTERSECT: lo que está en las dos.',
        },
        {
          body: 'Valledupar y Barranquilla.',
          rows: [['Barranquilla'], ['Valledupar']],
          feedback: 'Barranquilla es sede de Investigación: está en las dos consultas.',
        },
      ],
    ),
    explanation:
      'MINUS devuelve las filas de la primera consulta que no aparecen en la segunda. Alicia trabaja en Valledupar y ningún departamento tiene sede allí.',
    concept: 'MINUS',
    review: review('S2-L24'),
    reference: REF.sets,
  },
  {
    key: 'S2-SET-05',
    level: 'analizar',
    topic: 'conjuntos',
    subtopic: 'INTERSECT y equivalentes',
    type: 'short_case',
    response: 'multiple',
    difficulty: 4,
    prompt:
      '¿Qué consultas devuelven las ciudades donde trabaja alguien y que además son sede de un departamento?',
    options: queryOptions('S2-E-INTERSECT', [
      { example: 'S2-E-INTERSECT', feedback: 'INTERSECT deja lo común a las dos consultas.' },
      { example: 'S2-E-UNION', feedback: 'UNION junta las dos: incluye Valledupar.' },
      {
        example: 'S2-B-CIUDAD-IN-SEDE',
        feedback: 'IN con DISTINCT da lo mismo que INTERSECT.',
      },
      { example: 'S2-E-MINUS', feedback: 'MINUS da justo lo que no es común.' },
    ]),
    explanation:
      'INTERSECT devuelve lo común sin repetidos; una subconsulta con IN y DISTINCT expresa lo mismo.',
    concept: 'INTERSECT',
    review: review('S2-L24'),
    reference: REF.sets,
  },
  {
    key: 'S2-INT-01',
    level: 'analizar',
    topic: 'conjuntos',
    subtopic: 'Consulta integradora',
    type: 'order_fragments',
    response: 'order',
    difficulty: 4,
    prompt:
      'Ordena la consulta: departamentos cuyo salario promedio de personas activas supera el promedio de la empresa, del mayor al menor.',
    options: orderOptions([
      'SELECT d.nombre_departamento, ROUND(AVG(e.salario)) AS promedio',
      'FROM empleados e',
      'JOIN departamentos d ON e.id_departamento = d.id_departamento',
      "WHERE e.estado = 'ACTIVO'",
      'GROUP BY d.nombre_departamento',
      'HAVING AVG(e.salario) > (SELECT AVG(salario) FROM empleados)',
      'ORDER BY promedio DESC',
    ]),
    explanation:
      'JOIN para el nombre del departamento, WHERE para los activos, GROUP BY y HAVING con una subconsulta para el promedio general y ORDER BY con el alias.',
    concept: 'Consulta integradora',
    review: review('S2-L25'),
    reference: REF.subqueries,
  },
  {
    key: 'S2-INT-02',
    level: 'analizar',
    topic: 'conjuntos',
    subtopic: 'Consulta integradora',
    type: 'choose_query',
    response: 'single',
    difficulty: 5,
    prompt:
      'Departamentos cuyo salario promedio de personas activas supera el promedio de toda la empresa, del mayor al menor. ¿Qué consulta lo cumple?',
    options: queryOptions('S2-E-INT-FINAL', [
      { example: 'S2-P-INT-SIN-WHERE', feedback: 'Sin WHERE incluye a las personas inactivas.' },
      { example: 'S2-P-INT-ASC', feedback: 'Ordena del menor al mayor.' },
      {
        example: 'S2-E-INT-FINAL',
        feedback: 'Activos, comparación con el promedio general y orden descendente.',
      },
      { example: 'S2-E-INT-3', feedback: 'No compara con el promedio de la empresa.' },
    ]),
    explanation:
      'Cada requisito del pedido corresponde a una cláusula: WHERE (activos), HAVING con subconsulta (supera el promedio) y ORDER BY … DESC.',
    concept: 'Consulta integradora',
    review: review('S2-L25'),
    reference: REF.subqueries,
  },
];

export const CONSULTAS_RELACIONALES_BANK: readonly OfficialQuestion[] = [
  ...relaciones,
  ...joins,
  ...agregacion,
  ...subconsultas,
  ...conjuntos,
].map((question) => finalize(S2, question));
