/** Vocabulary a learner must see before reading a composite example. Not an execution. */
const PARTS = [
  [
    'JOIN',
    /\b(?:JOIN|ON)\b/i,
    'JOIN combina filas de tablas. ON dice qué parejas coinciden; WHERE filtra las filas resultantes. Usa alias.columna para identificar cada origen.',
  ],
  [
    'GROUP BY y funciones de grupo',
    /\b(?:GROUP BY|HAVING)\b|\b(?:COUNT|SUM|AVG|MIN|MAX)\s*\(/i,
    'COUNT cuenta, SUM suma y AVG promedia los valores no NULL. GROUP BY reúne filas para resumir por grupo; HAVING filtra esos resúmenes.',
  ],
  [
    'DECLARE y tipos',
    /\bDECLARE\b/i,
    'DECLARE prepara nombres antes de BEGIN. NUMBER guarda números, VARCHAR2 texto y DATE fecha/hora. := asigna un valor; CONSTANT impide reasignarlo.',
  ],
  [
    '%TYPE y %ROWTYPE',
    /%(?:ROW)?TYPE\b/i,
    '%TYPE copia el tipo de una columna, no su valor. %ROWTYPE define un registro con un campo por columna. registro.campo permite acceder a cada dato.',
  ],
  [
    'SELECT INTO',
    /\bSELECT\b[\s\S]*?\bINTO\b/i,
    'SELECT INTO guarda una fila en variables o un registro. Debe encontrar exactamente una fila; cero causa NO_DATA_FOUND y varias, TOO_MANY_ROWS.',
  ],
  [
    'DBMS_OUTPUT',
    /\bDBMS_OUTPUT\b/i,
    'PUT_LINE escribe una línea en un búfer que el cliente recoge al terminar. || concatena textos y valores. Es salida de depuración, no una tabla devuelta por SELECT.',
  ],
  [
    'IF, ELSIF y ELSE',
    /\bIF\b/i,
    'IF prueba una condición. THEN actúa cuando es TRUE; ELSIF prueba otra si la anterior no fue TRUE; ELSE es la alternativa. END IF; termina la decisión.',
  ],
  [
    'CASE',
    /\bCASE\b/i,
    'CASE simple compara un valor con WHEN; CASE de búsqueda prueba condiciones. La primera coincidencia se ejecuta. Una sentencia termina con END CASE; una expresión produce un valor y termina con END.',
  ],
  [
    'Repetición',
    /\bLOOP\b/i,
    'LOOP repite acciones hasta una salida. EXIT WHEN termina cuando su condición es TRUE. WHILE prueba antes de cada vuelta; FOR recorre un rango o filas de un cursor.',
  ],
  [
    'Cursor',
    /\b(?:CURSOR|FETCH|OPEN|CLOSE)\b/i,
    'Un cursor permite procesar el resultado de una consulta fila a fila. OPEN prepara ese resultado; FETCH copia la siguiente fila; CLOSE libera recursos. %NOTFOUND indica que la última lectura no encontró otra fila.',
  ],
  [
    'Excepciones',
    /\b(?:EXCEPTION|RAISE|RAISE_APPLICATION_ERROR)\b/i,
    'Una excepción interrumpe el cuerpo normal y busca un manejador WHEN en EXCEPTION. RAISE lanza una excepción; RAISE_APPLICATION_ERROR comunica una regla propia. OTHERS debe ir al final y no ocultar fallos.',
  ],
  [
    'Procedimiento y parámetros',
    /\bPROCEDURE\b/i,
    'CREATE PROCEDURE guarda una acción con nombre. IN recibe un dato; OUT entrega un dato; IN OUT recibe y actualiza el mismo dato. Llamar al procedimiento ejecuta sus acciones.',
  ],
  [
    'Función y RETURN',
    /\bFUNCTION\b/i,
    'CREATE FUNCTION guarda un cálculo con nombre. RETURN tipo declara el tipo de salida; RETURN expresión entrega su valor. Toda ruta válida de la función debe devolver un valor.',
  ],
  [
    'Paquete',
    /\bPACKAGE\b/i,
    'La especificación PACKAGE publica qué se puede llamar. PACKAGE BODY implementa esas operaciones. paquete.operación identifica el miembro que usamos.',
  ],
  [
    'Trigger: evento, momento y nivel',
    /\bTRIGGER\b/i,
    'Un trigger reacciona automáticamente a INSERT, UPDATE o DELETE en su tabla. BEFORE actúa antes; AFTER después. Sin FOR EACH ROW actúa una vez por sentencia; con esa cláusula, una vez por fila.',
  ],
  [
    ':OLD y :NEW',
    /:(?:OLD|NEW)\b/i,
    ':OLD contiene la fila anterior; :NEW la fila propuesta o nueva. Se usan en triggers de fila. En INSERT no hay fila anterior; en DELETE no hay fila nueva.',
  ],
] as const;

export function codePrerequisites(
  code: string,
): readonly { readonly term: string; readonly definition: string }[] {
  return PARTS.filter(([, pattern]) => pattern.test(code)).map(([term, , definition]) => ({
    term,
    definition,
  }));
}
