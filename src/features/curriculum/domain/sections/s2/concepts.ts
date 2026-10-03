import { lines, sqlRef } from '../../builders';
import type { CurriculumConcept } from '../../types';

/**
 * Fichas conceptuales de la Sección 2: la única definición de cada concepto. Estudiar las
 * muestra en cada lección, Recursos las resume y la clase las proyecta. Revisadas contra
 * Oracle Database SQL Language Reference 19c y el curso Database Programming with SQL de
 * Oracle Academy; los ejemplos son consultas verificadas en Oracle.
 */

export const S2_CONCEPTS: readonly CurriculumConcept[] = [
  {
    id: 'primary-key',
    term: 'PRIMARY KEY',
    category: 'Restricción',
    definition:
      'Columna (o columnas) cuyo valor identifica cada fila de una tabla: no se repite y no puede ser NULL.',
    purpose: 'Distinguir cada fila y servir de destino a las claves foráneas.',
    syntax: 'id_departamento NUMBER(4) PRIMARY KEY',
    example: 'S2-E-PK-DUPLICADA',
    mistake: {
      title: 'Repetir una clave primaria',
      why: 'Oracle rechaza el valor repetido con ORA-00001 (restricción única violada).',
    },
    keyIdea: 'Una PK por tabla: única y obligatoria.',
    reference: sqlRef('Constraints'),
  },
  {
    id: 'foreign-key',
    term: 'FOREIGN KEY',
    category: 'Restricción',
    definition:
      'Columna cuyos valores deben existir en la clave primaria (o única) de otra tabla; puede ser NULL si no se declara NOT NULL.',
    purpose: 'Conectar tablas: EMPLEADOS.ID_DEPARTAMENTO apunta a DEPARTAMENTOS.ID_DEPARTAMENTO.',
    syntax: lines('id_departamento NUMBER(4)', '  REFERENCES departamentos (id_departamento)'),
    example: 'S2-E-PK-FK',
    mistake: {
      title: 'Creer que la FK es obligatoria',
      why: 'Sin NOT NULL, la FK admite NULL: Esteban Torres aún no tiene departamento.',
    },
    keyIdea: 'La FK apunta a una PK; nunca a un valor que no existe.',
    reference: sqlRef('Constraints'),
  },
  {
    id: 'referential-integrity',
    term: 'Integridad referencial',
    category: 'Regla',
    definition:
      'Garantía de que cada clave foránea apunta a una fila que existe; Oracle rechaza los cambios que la romperían.',
    purpose: 'Evitar datos huérfanos, como un empleado de un departamento inexistente.',
    syntax: 'CONSTRAINT empleados_departamento_fk FOREIGN KEY (…) REFERENCES …',
    example: 'S2-E-FK-VIOLADA',
    mistake: {
      title: 'Insertar en la tabla hija antes que en la padre',
      why: 'Si el departamento todavía no existe, Oracle responde ORA-02291 (clave padre no encontrada).',
    },
    keyIdea: 'Primero existe el padre; después el hijo que lo referencia.',
    reference: sqlRef('Constraints'),
  },
  {
    id: 'table-alias',
    term: 'Alias de tabla',
    category: 'Alias',
    definition:
      'Nombre corto que se da a una tabla en FROM o JOIN para calificar sus columnas (e.nombre) en el resto de la consulta.',
    purpose: 'Escribir consultas de varias tablas legibles y sin columnas ambiguas.',
    syntax: 'FROM empleados e',
    example: 'S2-E-ALIAS-TABLA',
    mistake: {
      title: 'Escribir AS antes del alias de tabla',
      why: 'Oracle no acepta FROM empleados AS e; AS solo vale para alias de columna.',
      wrong: 'FROM empleados AS e',
      right: 'FROM empleados e',
    },
    keyIdea: 'Columna repetida en dos tablas = columna con alias.',
    reference: sqlRef('SELECT'),
  },
  {
    id: 'join',
    term: 'JOIN',
    category: 'Unión de tablas',
    definition:
      'Operación que combina filas de dos tablas en una sola fila de resultado según una condición.',
    purpose: 'Responder preguntas cuyos datos están repartidos en varias tablas relacionadas.',
    syntax: lines('FROM tabla_a a', 'JOIN tabla_b b', '  ON a.columna = b.columna'),
    example: 'S2-E-MODELO',
    mistake: {
      title: 'Pensar que un JOIN suma filas',
      why: 'El resultado son las parejas que cumplen la condición, no las filas de A más las de B.',
    },
    keyIdea: 'Tabla A + tabla B + condición = resultado.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'on',
    term: 'ON',
    category: 'Condición de unión',
    definition:
      'Cláusula que indica qué filas de las dos tablas forman pareja, normalmente comparando la clave foránea con la primaria.',
    purpose: 'Decir qué departamento corresponde a cada empleado.',
    syntax: 'ON e.id_departamento = d.id_departamento',
    example: 'S2-E-INNER',
    mistake: {
      title: 'Comparar columnas sin relación',
      why: 'ON e.id_empleado = d.id_departamento es válido pero empareja datos sin sentido; Oracle no avisa.',
      wrong: 'ON e.id_empleado = d.id_departamento',
      right: 'ON e.id_departamento = d.id_departamento',
    },
    keyIdea: 'ON decide las parejas; WHERE decide cuáles se quedan.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'inner-join',
    term: 'INNER JOIN',
    category: 'Tipo de JOIN',
    definition:
      'JOIN que devuelve solo las filas que encuentran pareja en las dos tablas; en Oracle, JOIN equivale a INNER JOIN.',
    purpose: 'Combinar datos relacionados cuando solo interesan las filas con correspondencia.',
    syntax: lines(
      'FROM empleados e',
      'JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
    ),
    example: 'S2-E-INNER',
    mistake: {
      title: 'Esperar las filas sin pareja',
      why: 'Esteban (sin departamento) e Investigación (sin empleados) no aparecen: para conservarlas se usa un OUTER JOIN.',
    },
    keyIdea: 'Solo parejas.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'junction-table',
    term: 'Tabla intermedia',
    category: 'Modelo de datos',
    definition:
      'Tabla con dos claves foráneas que resuelve una relación muchos a muchos: una fila por cada pareja relacionada.',
    purpose:
      'Registrar quién trabaja en qué proyecto (ASIGNACIONES), con datos propios como el rol.',
    syntax: lines(
      'FROM empleados e',
      'JOIN asignaciones a ON e.id_empleado = a.id_empleado',
      'JOIN proyectos p ON a.id_proyecto = p.id_proyecto',
    ),
    example: 'S2-E-TRES-TABLAS',
    mistake: {
      title: 'Saltarse la tabla intermedia',
      why: 'Unir EMPLEADOS y PROYECTOS directamente por ID_DEPARTAMENTO no dice quién trabaja en qué proyecto.',
    },
    keyIdea: 'Muchos a muchos = dos JOIN a través de la tabla intermedia.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'outer-join',
    term: 'OUTER JOIN',
    category: 'Tipo de JOIN',
    definition:
      'JOIN que, además de las parejas, conserva las filas sin pareja de una o de las dos tablas, completando con NULL.',
    purpose: 'No perder información cuando falta la relación.',
    syntax: 'LEFT | RIGHT | FULL [OUTER] JOIN',
    example: 'S2-E-LEFT',
    mistake: {
      title: 'Filtrar la tabla opcional en el WHERE',
      why: 'WHERE d.columna = … descarta los NULL y el OUTER JOIN se comporta como INNER.',
    },
    keyIdea: 'Parejas + filas sin pareja con NULL.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'left-join',
    term: 'LEFT OUTER JOIN',
    category: 'Tipo de JOIN',
    definition:
      'OUTER JOIN que conserva todas las filas de la tabla escrita a la izquierda; sin pareja, la derecha queda en NULL.',
    purpose:
      'Listar a todas las personas aunque no tengan departamento; encontrar áreas sin empleados.',
    syntax: lines(
      'FROM departamentos d',
      'LEFT JOIN empleados e',
      '  ON d.id_departamento = e.id_departamento',
    ),
    example: 'S2-E-LEFT-SIN-EMPLEADOS',
    mistake: {
      title: 'Poner a la izquierda la tabla equivocada',
      why: 'Se conserva la tabla escrita antes de LEFT JOIN: para no perder departamentos, DEPARTAMENTOS va primero.',
    },
    keyIdea: 'Todas las filas de la izquierda.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'right-join',
    term: 'RIGHT OUTER JOIN',
    category: 'Tipo de JOIN',
    definition:
      'OUTER JOIN que conserva todas las filas de la tabla escrita a la derecha; A RIGHT JOIN B equivale a B LEFT JOIN A.',
    purpose: 'Conservar la segunda tabla sin reordenar la consulta.',
    syntax: lines(
      'FROM empleados e',
      'RIGHT JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
    ),
    example: 'S2-E-RIGHT',
    mistake: {
      title: 'Mezclar LEFT y RIGHT en una consulta larga',
      why: 'Es válido pero difícil de leer; se suele escribir todo con LEFT JOIN.',
    },
    keyIdea: 'Todas las filas de la derecha.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'full-join',
    term: 'FULL OUTER JOIN',
    category: 'Tipo de JOIN',
    definition:
      'OUTER JOIN que conserva las parejas y las filas sin pareja de ambas tablas, cada una con NULL en el lado que falta.',
    purpose: 'Ver de una vez lo que sobra en cada tabla.',
    syntax: lines(
      'FROM empleados e',
      'FULL JOIN departamentos d',
      '  ON e.id_departamento = d.id_departamento',
    ),
    example: 'S2-E-FULL',
    mistake: {
      title: 'Confundirlo con CROSS JOIN',
      why: 'FULL JOIN usa la condición ON; CROSS JOIN no tiene condición y combina todo con todo.',
    },
    keyIdea: 'Parejas + sobrantes de los dos lados.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'self-join',
    term: 'SELF JOIN',
    category: 'Tipo de JOIN',
    definition:
      'JOIN de una tabla consigo misma usando dos alias, cuando una columna apunta a otra fila de la misma tabla.',
    purpose: 'Leer jerarquías: el nombre del jefe de cada empleado (ID_JEFE → ID_EMPLEADO).',
    syntax: lines('FROM empleados e', 'JOIN empleados j', '  ON e.id_jefe = j.id_empleado'),
    example: 'S2-E-SELF',
    mistake: {
      title: 'Invertir la condición',
      why: 'ON e.id_empleado = j.id_jefe devuelve los subordinados, no el jefe.',
    },
    keyIdea: 'Una tabla, dos alias, dos papeles.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'cross-join',
    term: 'CROSS JOIN',
    category: 'Tipo de JOIN',
    definition:
      'JOIN sin condición que combina cada fila de una tabla con cada fila de la otra (producto cartesiano).',
    purpose: 'Generar todas las combinaciones posibles, a propósito.',
    syntax: 'FROM departamentos CROSS JOIN proyectos',
    example: 'S2-E-CROSS',
    mistake: {
      title: 'Producto cartesiano accidental',
      why: 'FROM empleados, departamentos sin condición produce 20 × 6 = 120 filas.',
    },
    keyIdea: 'Filas de A × filas de B.',
    reference: sqlRef('Joins'),
  },
  {
    id: 'natural-join',
    term: 'NATURAL JOIN y USING',
    category: 'Tipo de JOIN',
    definition:
      'Formas de unir por columnas con el mismo nombre: NATURAL JOIN usa todas las coincidentes; USING, las indicadas.',
    purpose:
      'Abreviar la condición cuando los nombres coinciden; se recomienda la condición ON explícita.',
    syntax: lines(
      'FROM empleados NATURAL JOIN departamentos',
      'FROM empleados JOIN departamentos USING (id_departamento)',
    ),
    example: 'S2-E-NATURAL',
    mistake: {
      title: 'Unir por nombre y no por significado',
      why: 'EMPLEADOS NATURAL JOIN PROYECTOS une por ID_DEPARTAMENTO y empareja a cada persona con todos los proyectos de su área.',
    },
    keyIdea: 'Explícito (ON) es más seguro que implícito (NATURAL).',
    reference: sqlRef('Joins'),
  },
  {
    id: 'group-function',
    term: 'Función de grupo',
    category: 'Función',
    definition:
      'Función que recibe un conjunto de filas y devuelve un solo valor que las resume, a diferencia de las funciones de una fila.',
    purpose: 'Contar, sumar, promediar y encontrar extremos.',
    syntax: 'COUNT, SUM, AVG, MIN, MAX',
    example: 'S2-E-AGREGADOS',
    mistake: {
      title: 'Mezclar columnas sueltas y funciones de grupo sin GROUP BY',
      why: 'SELECT id_departamento, COUNT(*) FROM empleados da ORA-00937.',
    },
    keyIdea: 'Muchas filas → un valor.',
    reference: sqlRef('Aggregate Functions'),
  },
  {
    id: 'count',
    term: 'COUNT',
    category: 'Función de grupo',
    definition:
      'Cuenta filas (COUNT(*)) o valores no NULL de una expresión (COUNT(columna)); con DISTINCT, valores distintos.',
    purpose: 'Saber cuántos registros o cuántos datos hay.',
    syntax: 'COUNT(*) | COUNT(columna) | COUNT(DISTINCT columna)',
    example: 'S2-E-COUNT-NULL',
    mistake: {
      title: 'Usar COUNT(*) con un LEFT JOIN',
      why: 'Cuenta también la fila sin pareja: un departamento vacío aparece con 1.',
      wrong: 'COUNT(*)',
      right: 'COUNT(e.id_empleado)',
    },
    keyIdea: 'COUNT(*) cuenta filas; COUNT(col) ignora NULL.',
    reference: sqlRef('Aggregate Functions'),
  },
  {
    id: 'sum-avg',
    term: 'SUM y AVG',
    category: 'Función de grupo',
    definition:
      'SUM suma y AVG promedia los valores numéricos no NULL de un grupo; si todos son NULL, el resultado es NULL.',
    purpose: 'Calcular totales y promedios, como la nómina o el salario medio.',
    syntax: 'SUM(salario), AVG(salario)',
    example: 'S2-E-AVG-NVL',
    mistake: {
      title: 'Creer que AVG cuenta los NULL como 0',
      why: 'AVG(bono) promedia solo los 14 bonos registrados; para contar los NULL como 0 se usa NVL(bono, 0).',
    },
    keyIdea: 'Ignoran los NULL.',
    reference: sqlRef('Aggregate Functions'),
  },
  {
    id: 'min-max',
    term: 'MIN y MAX',
    category: 'Función de grupo',
    definition:
      'Devuelven el menor y el mayor valor no NULL del grupo; sirven para números, textos y fechas.',
    purpose:
      'Encontrar extremos: salario más bajo, ingreso más reciente, primer nombre alfabético.',
    syntax: 'MIN(columna), MAX(columna)',
    example: 'S2-E-MIN-MAX-TEXTO',
    mistake: {
      title: 'Esperar la fila completa del máximo',
      why: 'MAX(salario) devuelve el valor, no el nombre de quien lo gana; para eso se usa una subconsulta.',
    },
    keyIdea: 'Valores extremos de cualquier tipo ordenable.',
    reference: sqlRef('Aggregate Functions'),
  },
  {
    id: 'group-by',
    term: 'GROUP BY',
    category: 'Cláusula',
    definition:
      'Cláusula que reúne en un grupo las filas con los mismos valores en las columnas indicadas; cada grupo da una fila.',
    purpose: 'Resumir por categoría: empleados y promedio salarial por departamento.',
    syntax: lines('SELECT id_departamento, COUNT(*)', 'FROM empleados', 'GROUP BY id_departamento'),
    example: 'S2-E-GROUP',
    mistake: {
      title: 'GROUP BY incompleto',
      why: 'Una columna del SELECT que no está agrupada ni dentro de una función da ORA-00979.',
    },
    keyIdea: 'Una fila por grupo.',
    reference: sqlRef('SELECT'),
  },
  {
    id: 'having',
    term: 'HAVING',
    category: 'Cláusula',
    definition:
      'Cláusula que conserva solo los grupos que cumplen una condición, que puede usar funciones de grupo.',
    purpose: 'Filtrar resúmenes: departamentos con promedio superior a un valor.',
    syntax: lines('GROUP BY id_departamento', 'HAVING AVG(salario) > 4500000'),
    example: 'S2-E-HAVING',
    mistake: {
      title: 'Usar el alias del SELECT en HAVING',
      why: 'HAVING promedio > … falla: se repite la función, HAVING AVG(salario) > …',
    },
    keyIdea: 'HAVING filtra grupos.',
    reference: sqlRef('SELECT'),
  },
  {
    id: 'where-vs-having',
    term: 'WHERE frente a HAVING',
    category: 'Regla de evaluación',
    definition:
      'WHERE filtra filas antes de agrupar y no admite funciones de grupo; HAVING filtra grupos después de agruparlos.',
    purpose: 'Colocar cada condición en el momento correcto de la consulta.',
    syntax: lines("WHERE estado = 'ACTIVO'", 'GROUP BY id_departamento', 'HAVING COUNT(*) >= 3'),
    example: 'S2-E-PIPELINE',
    mistake: {
      title: 'Función de grupo en el WHERE',
      why: 'WHERE COUNT(*) > 3 da ORA-00934.',
      wrong: 'WHERE COUNT(*) > 3',
      right: 'HAVING COUNT(*) > 3',
    },
    keyIdea: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.',
    reference: sqlRef('SELECT'),
  },
  {
    id: 'subquery',
    term: 'Subconsulta',
    category: 'Consulta anidada',
    definition:
      'Consulta SELECT escrita entre paréntesis dentro de otra sentencia, cuyo resultado usa la consulta externa.',
    purpose: 'Usar un valor o una lista calculados en la misma consulta.',
    syntax: 'WHERE salario > (SELECT AVG(salario) FROM empleados)',
    example: 'S2-E-SUB-AVG',
    mistake: {
      title: 'Escribir a mano un valor que cambia',
      why: 'WHERE salario > 4580000 deja de ser correcta cuando cambian los datos; la subconsulta no.',
    },
    keyIdea: 'Primero la subconsulta, después la externa.',
    reference: sqlRef('Using Subqueries'),
  },
  {
    id: 'single-row-subquery',
    term: 'Subconsulta de una fila',
    category: 'Consulta anidada',
    definition: 'Subconsulta que devuelve un solo valor y se compara con =, <>, <, >, <= o >=.',
    purpose:
      'Comparar con un valor calculado: el promedio, el ID de un departamento por su nombre.',
    syntax:
      "WHERE id_departamento = (SELECT id_departamento FROM departamentos WHERE nombre_departamento = 'Ventas')",
    example: 'S2-E-SUB-VENTAS',
    mistake: {
      title: 'Devolver varias filas con =',
      why: 'Si la subconsulta devuelve más de un valor, Oracle responde ORA-01427.',
    },
    keyIdea: 'Un valor → operadores de comparación.',
    reference: sqlRef('Using Subqueries'),
  },
  {
    id: 'multi-row-subquery',
    term: 'Subconsulta de varias filas',
    category: 'Consulta anidada',
    definition:
      'Subconsulta que devuelve una lista de valores y se usa con IN o NOT IN (también con ANY o ALL).',
    purpose: 'Filtrar con una lista calculada: quién trabaja en un proyecto.',
    syntax: 'WHERE id_empleado IN (SELECT id_empleado FROM asignaciones)',
    example: 'S2-E-SUB-IN',
    mistake: {
      title: 'NOT IN con un NULL en la lista',
      why: 'Si la subconsulta devuelve algún NULL, NOT IN no devuelve filas.',
    },
    keyIdea: 'Lista → IN; cuidado con NULL en NOT IN.',
    reference: sqlRef('Using Subqueries'),
  },
  {
    id: 'correlated-subquery',
    term: 'Subconsulta correlacionada',
    category: 'Consulta anidada',
    definition:
      'Subconsulta que usa una columna de la consulta externa, por lo que se evalúa para cada fila de esta.',
    purpose: 'Comparar cada fila con su propio grupo, como el promedio de su departamento.',
    syntax:
      'WHERE e.salario > (SELECT AVG(i.salario) FROM empleados i WHERE i.id_departamento = e.id_departamento)',
    example: 'S2-E-CORRELACIONADA',
    mistake: {
      title: 'Olvidar la condición que la correlaciona',
      why: 'Sin i.id_departamento = e.id_departamento compara con el promedio de toda la empresa.',
    },
    keyIdea: 'Depende de la fila externa.',
    reference: sqlRef('Using Subqueries'),
  },
  {
    id: 'exists',
    term: 'EXISTS y NOT EXISTS',
    category: 'Condición',
    definition:
      'Condición verdadera si la subconsulta devuelve al menos una fila (EXISTS) o ninguna (NOT EXISTS).',
    purpose: 'Comprobar si algo existe, sin la trampa de NOT IN con NULL.',
    syntax: 'WHERE NOT EXISTS (SELECT 1 FROM asignaciones a WHERE a.id_proyecto = p.id_proyecto)',
    example: 'S2-E-NOT-EXISTS',
    mistake: {
      title: 'Olvidar correlacionar la subconsulta',
      why: 'Sin la condición que la une a la fila externa, EXISTS es igual para todas las filas.',
    },
    keyIdea: '¿Hay al menos una fila? EXISTS.',
    reference: sqlRef('Conditions'),
  },
  {
    id: 'set-operators',
    term: 'Operadores de conjuntos',
    category: 'Operador',
    definition:
      'UNION, UNION ALL, INTERSECT y MINUS combinan los resultados de dos consultas compatibles en uno solo.',
    purpose: 'Comparar o juntar listas que vienen de consultas distintas.',
    syntax: lines('SELECT … FROM …', 'UNION | UNION ALL | INTERSECT | MINUS', 'SELECT … FROM …'),
    example: 'S2-E-UNION',
    mistake: {
      title: 'Columnas incompatibles',
      why: 'Distinto número de columnas da ORA-01789; tipos distintos, ORA-01790.',
    },
    keyIdea: 'Mismas columnas, mismo orden, tipos compatibles.',
    reference: sqlRef('The UNION [ALL], INTERSECT, MINUS Operators'),
  },
  {
    id: 'union',
    term: 'UNION',
    category: 'Operador de conjuntos',
    definition: 'Devuelve las filas de las dos consultas, sin repetidos.',
    purpose: 'Juntar listas sin duplicados, como todas las ciudades con presencia de la empresa.',
    syntax: 'SELECT ciudad FROM empleados UNION SELECT sede FROM departamentos',
    example: 'S2-E-UNION',
    mistake: {
      title: 'Usar UNION para unir columnas',
      why: 'UNION apila filas; para poner datos en la misma fila se usa JOIN.',
    },
    keyIdea: 'Apila y quita repetidos.',
    reference: sqlRef('The UNION [ALL], INTERSECT, MINUS Operators'),
  },
  {
    id: 'union-all',
    term: 'UNION ALL',
    category: 'Operador de conjuntos',
    definition: 'Devuelve todas las filas de las dos consultas, incluidas las repetidas.',
    purpose:
      'Juntar listas cuando los repetidos importan (o se sabe que no los hay): es más rápido.',
    syntax: 'SELECT … UNION ALL SELECT …',
    example: 'S2-E-UNION-ALL',
    mistake: {
      title: 'Esperar que quite repetidos',
      why: 'UNION ALL conserva cada fila; si se quieren únicas, UNION.',
    },
    keyIdea: 'Apila todo.',
    reference: sqlRef('The UNION [ALL], INTERSECT, MINUS Operators'),
  },
  {
    id: 'intersect',
    term: 'INTERSECT',
    category: 'Operador de conjuntos',
    definition: 'Devuelve las filas que aparecen en los dos resultados, sin repetidos.',
    purpose: 'Encontrar lo común entre dos listas.',
    syntax: 'SELECT ciudad FROM empleados INTERSECT SELECT sede FROM departamentos',
    example: 'S2-E-INTERSECT',
    mistake: {
      title: 'Confundirlo con un JOIN',
      why: 'INTERSECT compara filas completas de dos resultados; no combina columnas.',
    },
    keyIdea: 'Lo que está en ambos.',
    reference: sqlRef('The UNION [ALL], INTERSECT, MINUS Operators'),
  },
  {
    id: 'minus',
    term: 'MINUS',
    category: 'Operador de conjuntos',
    definition:
      'Devuelve las filas del primer resultado que no aparecen en el segundo, sin repetidos (EXCEPT en el estándar SQL).',
    purpose: 'Encontrar lo que falta: personas sin proyecto, ciudades sin sede.',
    syntax: 'SELECT id_empleado FROM empleados MINUS SELECT id_empleado FROM asignaciones',
    example: 'S2-E-MINUS-PROYECTOS',
    mistake: {
      title: 'Invertir el orden',
      why: 'A MINUS B y B MINUS A responden preguntas distintas.',
    },
    keyIdea: 'Lo del primero que no está en el segundo.',
    reference: sqlRef('The UNION [ALL], INTERSECT, MINUS Operators'),
  },
];
