import { EMPRESA_TABLES } from '@/domain/dataset/empresa';
import { lines, plsql, query, source } from './builders';
import type { CurriculumExample, CurriculumLesson, LessonExample } from './types';

interface Micro {
  readonly lesson: string;
  readonly code: string;
  readonly reading: string;
  readonly setup?: readonly string[];
}

const q = (lesson: string, code: string, reading: string): Micro => ({ lesson, code, reading });
const b = (lesson: string, body: string, reading: string, declarations?: string): Micro =>
  q(
    lesson,
    lines(...(declarations ? ['DECLARE', declarations] : []), 'BEGIN', body, 'END;'),
    reading,
  );

/** Small executable examples. Their outputs must be obtained from Oracle, never authored. */
const MICROS: readonly Micro[] = [
  q(
    'S2-L01',
    'SELECT id_departamento, nombre_departamento\nFROM departamentos\nWHERE id_departamento = 20;',
    'SELECT elige la clave y el nombre; FROM indica la tabla de áreas; WHERE busca la clave 20. El valor 20 identifica TI y puede ser referenciado desde EMPLEADOS.',
  ),
  q(
    'S2-L02',
    'SELECT e.nombre\nFROM empleados e\nWHERE e.id_empleado = 2;',
    'FROM empleados e da un nombre corto a la tabla. e.nombre pertenece a esa tabla. WHERE busca la persona 2. El alias no modifica los datos.',
  ),
  q(
    'S2-L03',
    'SELECT e.nombre, d.nombre_departamento\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.id_empleado = 2;',
    'FROM parte de las personas. JOIN incorpora las áreas. ON empareja claves iguales. WHERE conserva a Carlos. SELECT muestra Carlos y el nombre de su área: TI.',
  ),
  q(
    'S2-L04',
    'SELECT e.nombre, d.nombre_departamento\nFROM empleados e\nINNER JOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.id_empleado IN (2, 20);',
    'INNER JOIN exige una pareja que cumpla ON. Buscamos a Carlos y Esteban: Carlos tiene área 20; Esteban no tiene área. Por eso solo Carlos aparece, sin borrar a Esteban de EMPLEADOS.',
  ),
  q(
    'S2-L05',
    'SELECT e.id_departamento, d.nombre_departamento\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.id_empleado = 2;',
    'Las dos tablas tienen ID_DEPARTAMENTO. e.id_departamento identifica la columna de la persona; d.id_departamento, la clave del área. SELECT usa un origen explícito y evita ORA-00918.',
  ),
  q(
    'S2-L06',
    'SELECT e.nombre, d.nombre_departamento\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.id_empleado = 2 AND e.salario > 4000000;',
    'ON une a cada persona con su área. Después WHERE filtra a Carlos y exige un salario mayor que 4.000.000. La primera condición conecta tablas; la segunda limita las parejas que mostramos.',
  ),
  q(
    'S2-L07',
    'SELECT e.nombre, p.nombre_proyecto\nFROM empleados e\nJOIN asignaciones a ON a.id_empleado = e.id_empleado\nJOIN proyectos p ON p.id_proyecto = a.id_proyecto\nWHERE e.id_empleado = 2\nORDER BY p.id_proyecto;',
    'ASIGNACIONES es el puente: el primer ON busca las asignaciones de Carlos; el segundo ON busca el proyecto de cada asignación. SELECT obtiene persona y proyecto; ORDER BY hace reproducible el orden.',
  ),
  q(
    'S2-L08',
    'SELECT e.nombre, d.nombre_departamento\nFROM empleados e\nLEFT JOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.id_empleado IN (2, 20)\nORDER BY e.id_empleado;',
    'LEFT conserva todas las personas seleccionadas a la izquierda. Carlos encuentra TI. Esteban permanece con NULL en el nombre del área. NULL aquí significa que no se encontró pareja, no que se creó un área vacía.',
  ),
  q(
    'S2-L09',
    'SELECT e.nombre, d.nombre_departamento\nFROM empleados e\nRIGHT JOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE d.id_departamento = 60;',
    'RIGHT conserva DEPARTAMENTOS, la tabla derecha. Investigación tiene clave 60 y ninguna persona. Aparece una fila con nombre de persona NULL. FULL conserva también las personas sin área; el ejemplo siguiente compara ambos.',
  ),
  q(
    'S2-L10',
    'SELECT e.nombre, j.nombre AS jefe\nFROM empleados e\nLEFT JOIN empleados j ON e.id_jefe = j.id_empleado\nWHERE e.id_empleado = 6;',
    'La misma tabla se lee con dos papeles: e es la persona; j, su jefe. ON compara el ID_JEFE de Andrés con la clave de otra persona. LEFT permite conservarlo incluso si no tuviera jefe.',
  ),
  q(
    'S2-L11',
    'SELECT e.nombre, p.nombre_proyecto\nFROM empleados e\nCROSS JOIN proyectos p\nWHERE e.id_empleado IN (2, 6) AND p.id_proyecto IN (101, 102, 103)\nORDER BY e.id_empleado, p.id_proyecto;',
    'WHERE limita los conjuntos a 2 personas y 3 proyectos. CROSS produce cada combinación: 2 × 3 = 6 filas. Son posibilidades, no asignaciones reales. No existe ON porque aquí queremos el producto cartesiano.',
  ),
  q(
    'S2-L12',
    'SELECT COUNT(*) AS personas, SUM(salario) AS suma, AVG(salario) AS promedio,\n       MIN(salario) AS menor, MAX(salario) AS mayor\nFROM empleados\nWHERE id_empleado IN (2, 6);',
    'WHERE selecciona dos salarios. COUNT cuenta filas; SUM suma; AVG divide la suma entre los valores no NULL; MIN y MAX muestran los extremos. SELECT devuelve un resumen de una fila, no las dos personas originales.',
  ),
  q(
    'S2-L13',
    'SELECT COUNT(*) AS filas, COUNT(bono) AS bonos_conocidos\nFROM empleados\nWHERE id_empleado IN (6, 7);',
    'WHERE selecciona Andrés y Paula. COUNT(*) cuenta ambas filas. COUNT(bono) solo cuenta bonos no NULL; un bono NULL no equivale al número cero. El resultado permite observar la diferencia sin sumar ni agrupar todavía.',
  ),
  q(
    'S2-L14',
    'SELECT id_departamento, COUNT(*) AS personas\nFROM empleados\nWHERE id_departamento IN (20, 30)\nGROUP BY id_departamento\nORDER BY id_departamento;',
    'WHERE selecciona dos áreas. GROUP BY reúne las filas con la misma clave de área. COUNT calcula el tamaño de cada grupo. Cada fila del resultado representa un departamento, no una persona.',
  ),
  q(
    'S2-L15',
    'SELECT id_departamento, ciudad, COUNT(*) AS personas\nFROM empleados\nWHERE id_departamento = 20\nGROUP BY id_departamento, ciudad\nORDER BY ciudad;',
    'Dentro de TI, GROUP BY reúne por la pareja departamento y ciudad. Personas de ciudades diferentes quedan en grupos diferentes. SELECT debe incluir en GROUP BY ambas columnas que no son agregados.',
  ),
  q(
    'S2-L16',
    'SELECT id_departamento, COUNT(*) AS personas\nFROM empleados\nGROUP BY id_departamento\nHAVING COUNT(*) >= 4\nORDER BY id_departamento;',
    'GROUP BY forma todos los grupos de departamento. COUNT mide sus tamaños. HAVING conserva los grupos de cuatro o más personas. WHERE no puede evaluar COUNT(*) porque todavía no existen grupos en esa etapa.',
  ),
  q(
    'S2-L17',
    "SELECT id_departamento, COUNT(*) AS personas\nFROM empleados\nWHERE estado = 'ACTIVO'\nGROUP BY id_departamento\nHAVING COUNT(*) >= 4\nORDER BY id_departamento;",
    'WHERE descarta personas no activas antes de agrupar. GROUP BY reúne las activas por área. HAVING evalúa la cantidad de activas de cada grupo. Cambiar WHERE por HAVING alteraría la etapa y la pregunta.',
  ),
  q(
    'S2-L18',
    'SELECT d.nombre_departamento, COUNT(*) AS personas\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE d.id_departamento = 20\nGROUP BY d.nombre_departamento;',
    'JOIN añade el nombre del área a cada persona. WHERE conserva TI. GROUP BY reúne esas parejas por el nombre del área. COUNT cuenta parejas encontradas; por eso este INNER JOIN no cuenta personas sin departamento.',
  ),
  q(
    'S2-L19',
    'SELECT d.nombre_departamento, COUNT(*) AS personas\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nGROUP BY d.nombre_departamento\nHAVING COUNT(*) >= 4\nORDER BY d.nombre_departamento;',
    'JOIN primero aporta el nombre. GROUP BY forma un grupo por área. COUNT calcula su tamaño. HAVING conserva áreas con al menos cuatro personas; ORDER BY ordena esos resúmenes y no las filas originales.',
  ),
  q(
    'S2-L20',
    'SELECT nombre, salario\nFROM empleados\nWHERE id_empleado = 2 AND salario > (SELECT AVG(salario) FROM empleados);',
    'La consulta entre paréntesis devuelve un único promedio. La consulta exterior compara el salario de Carlos con ese número. La subconsulta es escalar: más de una fila produciría ORA-01427.',
  ),
  q(
    'S2-L21',
    "SELECT nombre\nFROM empleados\nWHERE id_departamento IN (SELECT id_departamento FROM departamentos WHERE sede = 'Bogotá')\nORDER BY id_empleado;",
    'La subconsulta devuelve claves de áreas con sede Bogotá. IN acepta varios valores y comprueba si el área de cada persona está en esa lista. No se usa = porque la lista puede tener varias filas.',
  ),
  q(
    'S2-L22',
    'SELECT e.nombre\nFROM empleados e\nWHERE e.id_empleado = 2 AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.id_empleado = e.id_empleado);',
    'La subconsulta referencia e.id_empleado: está correlacionada con la fila exterior. EXISTS solo pregunta si hay al menos una asignación de Carlos. SELECT 1 no devuelve su nombre ni cuenta proyectos; expresa que importa la existencia de una fila.',
  ),
  q(
    'S2-L23',
    'SELECT id_empleado FROM empleados WHERE id_empleado IN (2, 6)\nUNION\nSELECT id_empleado FROM empleados WHERE id_empleado IN (6, 9)\nORDER BY id_empleado;',
    'La primera consulta produce 2 y 6; la segunda, 6 y 9. UNION combina ambos resultados y elimina el 6 duplicado. UNION ALL lo conservaría dos veces. Las dos consultas deben producir columnas compatibles.',
  ),
  q(
    'S2-L24',
    'SELECT id_empleado FROM empleados WHERE id_empleado IN (2, 6)\nMINUS\nSELECT id_empleado FROM empleados WHERE id_empleado = 6;',
    'MINUS conserva lo que está en el resultado izquierdo pero no en el derecho: queda la clave 2. INTERSECT conservaría lo común, la clave 6. Cambiar el orden de MINUS puede cambiar el resultado.',
  ),
  q(
    'S2-L25',
    "SELECT d.nombre_departamento, COUNT(*) AS activos\nFROM empleados e\nJOIN departamentos d ON e.id_departamento = d.id_departamento\nWHERE e.estado = 'ACTIVO'\nGROUP BY d.nombre_departamento\nHAVING COUNT(*) >= 3\nORDER BY activos DESC, d.nombre_departamento;",
    'JOIN relaciona personas y áreas; WHERE conserva activas; GROUP BY reúne por área; COUNT resume; HAVING selecciona grupos de al menos tres; ORDER BY muestra primero los mayores. Esta consulta integra el recorrido, sin introducir una cláusula nueva.',
  ),
  b(
    'S3-L03',
    "  DBMS_OUTPUT.PUT_LINE('Una acción, una ejecución');",
    'BEGIN inicia el bloque sin nombre; PUT_LINE añade una línea al búfer; END; lo cierra. No queda un objeto con nombre en Oracle. El siguiente ejemplo contrasta este bloque con un procedimiento almacenado.',
  ),
  b(
    'S3-L04',
    '  v_total := v_total + c_incremento;\n  DBMS_OUTPUT.PUT_LINE(v_total);',
    'DECLARE crea v_total NUMBER con valor 2 y c_incremento CONSTANT NUMBER con valor 1. BEGIN inicia las acciones; := cambia v_total a 3; PUT_LINE permite observarlo. La constante no se puede reasignar; END; cierra el bloque.',
    '  v_total NUMBER := 2;\n  c_incremento CONSTANT NUMBER := 1;',
  ),
  b(
    'S3-L05',
    '  DBMS_OUTPUT.PUT_LINE(v_salario);',
    '%TYPE toma el tipo de EMPLEADOS.SALARIO, no su valor. La declaración inicializa v_salario en cero; PUT_LINE escribe ese cero. %ROWTYPE, desarrollado en el ejemplo siguiente, prepara un registro con un campo por columna de la tabla.',
    '  v_salario empleados.salario%TYPE := 0;',
  ),
  b(
    'S3-L06',
    "  DECLARE\n    v_mensaje VARCHAR2(20) := 'interno';\n  BEGIN\n    DBMS_OUTPUT.PUT_LINE(v_mensaje);\n  END;\n  DBMS_OUTPUT.PUT_LINE(v_mensaje);",
    'El DECLARE exterior define «externo». El bloque interior define otra variable con el mismo nombre: dentro se lee «interno». Su END; termina ese alcance. Al volver al bloque exterior se lee «externo», sin que la variable exterior haya cambiado.',
    "  v_mensaje VARCHAR2(20) := 'externo';",
  ),
  b(
    'S3-L07',
    '  SELECT nombre INTO v_nombre FROM empleados WHERE id_empleado = 2;\n  DBMS_OUTPUT.PUT_LINE(v_nombre);',
    'DECLARE prepara una variable con el tipo de NOMBRE. SELECT busca exactamente a Carlos; INTO guarda la celda en v_nombre. PUT_LINE escribe el valor recibido. Cero filas causa NO_DATA_FOUND; varias, TOO_MANY_ROWS.',
    '  v_nombre empleados.nombre%TYPE;',
  ),
  b(
    'S3-L08',
    '  UPDATE empleados SET bono = bono WHERE id_empleado = 2;\n  DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT);\n  ROLLBACK;',
    'UPDATE procesa la fila con clave 2, aunque deja el bono igual. SQL%ROWCOUNT informa una fila afectada. PUT_LINE escribe ese número; ROLLBACK deshace la transacción de este ejemplo aislado. Consultar el atributo antes de otra sentencia SQL evita reemplazar su estado.',
  ),
  b(
    'S3-L09',
    "  IF v_total > 2 THEN\n    DBMS_OUTPUT.PUT_LINE('Mayor que dos');\n  ELSE\n    DBMS_OUTPUT.PUT_LINE('Dos o menos');\n  END IF;",
    'DECLARE inicia v_total en 3. IF compara 3 > 2; TRUE elige THEN. PUT_LINE escribe «Mayor que dos»; ELSE no se ejecuta. END IF; cierra la decisión, mientras END; cierra todo el bloque.',
    '  v_total NUMBER := 3;',
  ),
  b(
    'S3-L10',
    "  CASE v_area\n    WHEN 'TI' THEN DBMS_OUTPUT.PUT_LINE('Tecnología');\n    ELSE DBMS_OUTPUT.PUT_LINE('Otra área');\n  END CASE;",
    'DECLARE guarda el texto TI. CASE simple compara ese valor con cada WHEN. La primera coincidencia ejecuta PUT_LINE; ELSE queda como alternativa. END CASE; cierra la sentencia. Después estudiaremos CASE de búsqueda con condiciones completas.',
    "  v_area VARCHAR2(20) := 'TI';",
  ),
  b(
    'S3-L11',
    '  LOOP\n    v_paso := v_paso + 1;\n    DBMS_OUTPUT.PUT_LINE(v_paso);\n    EXIT WHEN v_paso = 2;\n  END LOOP;',
    'v_paso empieza en cero. LOOP ejecuta el cuerpo; cada vuelta suma uno y lo imprime. EXIT WHEN termina cuando v_paso llega a dos. Por eso se observan 1 y 2, y el estado cambiante asegura que el bucle termina.',
    '  v_paso NUMBER := 0;',
  ),
  b(
    'S3-L12',
    '  FOR i IN 1..2 LOOP\n    DBMS_OUTPUT.PUT_LINE(i);\n  END LOOP;',
    'FOR crea automáticamente el índice i y recorre el rango entero 1..2. PUT_LINE se ejecuta una vez para cada valor. END LOOP; cierra la repetición. No hace falta declarar ni incrementar i; WHILE, en el ejemplo siguiente, usa una condición en lugar de un rango.',
  ),
  b(
    'S3-L13',
    '  SELECT COUNT(*) INTO v_total FROM empleados;\n  DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT);',
    'Oracle crea un cursor implícito para SELECT. COUNT(*) devuelve una fila que contiene el total de personas; INTO recibe ese total. SQL%ROWCOUNT vale 1 porque cuenta las filas devueltas por la sentencia, no el total contenido en la celda.',
    '  v_total NUMBER;',
  ),
  b(
    'S3-L14',
    '  OPEN c;\n  FETCH c INTO v_nombre;\n  DBMS_OUTPUT.PUT_LINE(v_nombre);\n  CLOSE c;',
    'DECLARE nombra un cursor con una consulta de Carlos y prepara v_nombre. OPEN inicia la consulta; FETCH copia la primera fila a la variable; PUT_LINE muestra Carlos; CLOSE libera el cursor. Este ejemplo lee una sola fila antes de introducir un bucle de lectura.',
    '  CURSOR c IS SELECT nombre FROM empleados WHERE id_empleado = 2;\n  v_nombre empleados.nombre%TYPE;',
  ),
  b(
    'S3-L15',
    '  FOR persona IN (SELECT nombre FROM empleados WHERE id_empleado IN (2, 6) ORDER BY id_empleado) LOOP\n    DBMS_OUTPUT.PUT_LINE(persona.nombre);\n  END LOOP;',
    'FOR ejecuta la consulta y crea el registro persona para cada fila. El cuerpo lee su campo nombre y lo escribe. La consulta produce Carlos y Andrés en ese orden. Oracle abre, obtiene filas y cierra automáticamente; no añadimos OPEN/FETCH/CLOSE manuales.',
  ),
  b(
    'S3-L16',
    "  SELECT nombre INTO v_nombre FROM empleados WHERE id_empleado = 99;\nEXCEPTION\n  WHEN NO_DATA_FOUND THEN\n    DBMS_OUTPUT.PUT_LINE('No se encontró la persona');",
    'DECLARE prepara v_nombre. SELECT no encuentra la clave 99 y lanza NO_DATA_FOUND. El control salta a EXCEPTION; WHEN selecciona el manejador, que escribe un mensaje. Una consulta de varias filas requeriría manejar TOO_MANY_ROWS, no este mismo caso.',
    '  v_nombre empleados.nombre%TYPE;',
  ),
  b(
    'S3-L17',
    "  RAISE e_regla;\nEXCEPTION\n  WHEN e_regla THEN DBMS_OUTPUT.PUT_LINE('Regla detectada y manejada');",
    'DECLARE crea una excepción propia. RAISE la lanza deliberadamente y abandona el resto del cuerpo normal. EXCEPTION busca su manejador; WHEN e_regla imprime el mensaje. Este flujo sirve para distinguir una regla del negocio de un fallo imprevisto.',
    '  e_regla EXCEPTION;',
  ),
  {
    ...b(
      'S3-L18',
      '  saludar_micro;',
      'CREATE PROCEDURE guarda una acción llamada saludar_micro. Su BEGIN escribe un saludo y END termina la acción. El bloque anónimo de abajo llama a ese nombre: no devuelve un valor a una expresión.',
    ),
    setup: [
      "CREATE OR REPLACE PROCEDURE saludar_micro IS\nBEGIN\n  DBMS_OUTPUT.PUT_LINE('Hola, equipo');\nEND;",
    ],
  },
  {
    ...b(
      'S3-L19',
      '  duplicar_micro(3, v_resultado);\n  DBMS_OUTPUT.PUT_LINE(v_resultado);',
      'El procedimiento recibe p_entrada IN y escribe p_salida OUT. La llamada pasa 3 como entrada y v_resultado como destino de salida. Tras la llamada la variable vale 6. IN OUT, explicado en el ejemplo siguiente, recibe un valor y devuelve el nuevo valor en el mismo parámetro.',
      '  v_resultado NUMBER;',
    ),
    setup: [
      'CREATE OR REPLACE PROCEDURE duplicar_micro(p_entrada IN NUMBER, p_salida OUT NUMBER) IS\nBEGIN\n  p_salida := p_entrada * 2;\nEND;',
    ],
  },
  {
    ...b(
      'S3-L20',
      '  DBMS_OUTPUT.PUT_LINE(doble_micro(3));',
      'La función doble_micro recibe 3. RETURN devuelve 3 * 2, es decir 6, a la expresión que la llamó. PUT_LINE observa ese valor. RETURN NUMBER declara el tipo del resultado; una función debe ejecutar RETURN con un valor.',
    ),
    setup: [
      'CREATE OR REPLACE FUNCTION doble_micro(p_numero NUMBER) RETURN NUMBER IS\nBEGIN\n  RETURN p_numero * 2;\nEND;',
    ],
  },
  {
    ...b(
      'S3-L21',
      '  saludar_micro;\n  DBMS_OUTPUT.PUT_LINE(doble_micro(3));',
      'La primera llamada usa el procedimiento para ejecutar una acción. La segunda usa la función dentro de una expresión que imprime su valor. Ambos pueden recibir parámetros; la diferencia esencial es la obligación de la función de devolver un valor.',
    ),
    setup: [
      "CREATE OR REPLACE PROCEDURE saludar_micro IS\nBEGIN\n  DBMS_OUTPUT.PUT_LINE('Hola, equipo');\nEND;",
      'CREATE OR REPLACE FUNCTION doble_micro(p_numero NUMBER) RETURN NUMBER IS\nBEGIN\n  RETURN p_numero * 2;\nEND;',
    ],
  },
  {
    ...b(
      'S3-L22',
      '  DBMS_OUTPUT.PUT_LINE(calculos_micro.doble(3));',
      'La especificación del paquete publica la firma de doble. El cuerpo contiene su implementación y RETURN. La llamada usa paquete.función para obtener 6. La especificación explica qué se puede llamar; el cuerpo, cómo se calcula.',
    ),
    setup: [
      'CREATE OR REPLACE PACKAGE calculos_micro IS\n  FUNCTION doble(p_numero NUMBER) RETURN NUMBER;\nEND;',
      'CREATE OR REPLACE PACKAGE BODY calculos_micro IS\n  FUNCTION doble(p_numero NUMBER) RETURN NUMBER IS\n  BEGIN\n    RETURN p_numero * 2;\n  END;\nEND;',
    ],
  },
  {
    ...b(
      'S3-L23',
      '  UPDATE empleados SET salario = salario WHERE id_empleado = 2;',
      'CREATE TRIGGER guarda una reacción automática. AFTER UPDATE es el momento y el evento; ON EMPLEADOS indica la tabla. El UPDATE del bloque provoca una ejecución por sentencia, aunque el salario no cambie. No se llama al trigger por nombre.',
    ),
    setup: [
      "CREATE OR REPLACE TRIGGER aviso_micro AFTER UPDATE ON empleados\nBEGIN\n  DBMS_OUTPUT.PUT_LINE('UPDATE ejecutado');\nEND;",
    ],
  },
  {
    ...b(
      'S3-L24',
      '  UPDATE empleados SET salario = salario WHERE id_empleado IN (2, 6);',
      'FOR EACH ROW cambia la unidad de ejecución: ahora el trigger corre una vez por persona afectada, por eso aparecen dos mensajes. BEFORE significa antes de cambiar la fila; AFTER, después. Sin FOR EACH ROW se ejecutaría una sola vez para toda la sentencia.',
    ),
    setup: [
      "CREATE OR REPLACE TRIGGER fila_micro AFTER UPDATE ON empleados FOR EACH ROW\nBEGIN\n  DBMS_OUTPUT.PUT_LINE('Una fila procesada');\nEND;",
    ],
  },
  {
    ...b(
      'S3-L25',
      '  UPDATE empleados SET salario = salario + 100 WHERE id_empleado = 2;',
      ':OLD.salario es el valor anterior de Carlos; :NEW.salario es el nuevo valor propuesto. FOR EACH ROW permite usar ambos pseudorregistros. El trigger AFTER UPDATE escribe el antes y el después; la auditoría persistente se desarrolla en el ejemplo siguiente.',
    ),
    setup: [
      "CREATE OR REPLACE TRIGGER cambio_micro AFTER UPDATE OF salario ON empleados FOR EACH ROW\nBEGIN\n  DBMS_OUTPUT.PUT_LINE(:OLD.salario || ' -> ' || :NEW.salario);\nEND;",
    ],
  },
  {
    ...b(
      'S3-L26',
      '  UPDATE empleados SET salario = salario + 100 WHERE id_empleado = 2;',
      'BEFORE UPDATE permite validar la fila propuesta antes de aplicarla. IF compara :NEW.salario con :OLD.salario. RAISE_APPLICATION_ERROR rechazaría una disminución con un código propio; este aumento pasa la regla sin error.',
    ),
    setup: [
      "CREATE OR REPLACE TRIGGER validar_micro BEFORE UPDATE OF salario ON empleados FOR EACH ROW\nBEGIN\n  IF :NEW.salario < :OLD.salario THEN\n    RAISE_APPLICATION_ERROR(-20001, 'No disminuir el salario');\n  END IF;\nEND;",
    ],
  },
  b(
    'S3-L27',
    '  SELECT COUNT(*) INTO v_total FROM empleados WHERE id_empleado = 2;\n  DBMS_OUTPUT.PUT_LINE(v_total);',
    'La necesidad es comprobar si una persona existe. SELECT COUNT resuelve esa consulta y el bloque observa el resultado: no hace falta un trigger. Elegimos consulta para leer, constraint para una restricción declarativa, procedimiento para una acción explícita y trigger para reaccionar automáticamente a un evento.',
    '  v_total NUMBER;',
  ),
  {
    ...b(
      'S3-L28',
      '  aumentar_micro(2);',
      'El procedimiento aumenta el salario de Carlos. Ese UPDATE dispara automáticamente el trigger AFTER UPDATE FOR EACH ROW. El trigger lee :OLD y :NEW y escribe el cambio. Este pequeño flujo integra llamada explícita y reacción automática; el integrador completo registra la auditoría en una tabla.',
    ),
    setup: [
      'CREATE OR REPLACE PROCEDURE aumentar_micro(p_id NUMBER) IS\nBEGIN\n  UPDATE empleados SET salario = salario + 100 WHERE id_empleado = p_id;\nEND;',
      "CREATE OR REPLACE TRIGGER auditar_micro AFTER UPDATE OF salario ON empleados FOR EACH ROW\nBEGIN\n  DBMS_OUTPUT.PUT_LINE(:OLD.salario || ' -> ' || :NEW.salario);\nEND;",
    ],
  },
];

export const MICRO_EXAMPLES: readonly CurriculumExample[] = MICROS.map((micro) => {
  const id = `${micro.lesson}-MICRO`;
  if (micro.lesson.startsWith('S3'))
    return plsql(id, micro.code, micro.setup ? { setup: micro.setup } : {});
  const tables = EMPRESA_TABLES.filter((table) =>
    new RegExp(`\\b${table.name}\\b`, 'i').test(micro.code),
  );
  return query(
    id,
    micro.code,
    tables.map((table) =>
      source(
        table.name,
        table.columns.map(({ name }) => name),
      ),
    ),
  );
});

export function microFor(lesson: string): LessonExample {
  const micro = MICROS.find((entry) => entry.lesson === lesson);
  if (!micro && !['S3-L01', 'S3-L02'].includes(lesson))
    throw new Error(`Missing microexample: ${lesson}`);
  return {
    question: 'Primero, un ejemplo pequeño',
    example: micro ? `${lesson}-MICRO` : 'S3-E-SOLO-BEGIN',
    reading:
      micro?.reading ??
      'BEGIN inicia la parte ejecutable; DBMS_OUTPUT.PUT_LINE añade el saludo al búfer; END; cierra el bloque. No se lee ni cambia ninguna tabla.',
  };
}

export function withMicroExamples(
  lessons: readonly CurriculumLesson[],
): readonly CurriculumLesson[] {
  return lessons.map((lesson) => ({ ...lesson, micro: microFor(lesson.id) }));
}
