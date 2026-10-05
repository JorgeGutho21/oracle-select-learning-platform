/** Human explanation for deliberately failing examples; technical Oracle text stays available. */
export interface PedagogicalOracleError {
  readonly title: string;
  readonly explanation: string;
  readonly correction: string;
}

const ERRORS: Readonly<Record<string, readonly [string, string, string]>> = {
  'ORA-00001': [
    'La clave ya existe',
    'Una clave primaria o única no puede repetirse.',
    'Usa una clave nueva; revisa primero qué fila ocupa la clave actual.',
  ],
  'ORA-00904': [
    'El nombre no identifica una columna válida',
    'Oracle no reconoce el identificador en ese contexto.',
    'Revisa nombres, alias y si estás llamando a un procedimiento desde SELECT.',
  ],
  'ORA-00918': [
    'Hay una columna ambigua',
    'ID_DEPARTAMENTO existe en EMPLEADOS y DEPARTAMENTOS. Indica de cuál quieres leerlo.',
    'Escribe e.id_departamento o d.id_departamento, según el origen que necesites.',
  ],
  'ORA-00934': [
    'El resumen está en el lugar equivocado',
    'WHERE filtra filas antes de calcular las funciones de grupo.',
    'Usa HAVING para una condición que compara COUNT, SUM o AVG de un grupo.',
  ],
  'ORA-00937': [
    'Falta indicar cómo agrupar',
    'La consulta mezcla una columna individual y un cálculo sobre varias filas.',
    'Añade GROUP BY para la columna o retírala de SELECT si quieres un único resumen.',
  ],
  'ORA-00979': [
    'El grupo no explica todas las columnas',
    'Una columna de SELECT no está agrupada ni dentro de una función de grupo.',
    'Incluye esa columna en GROUP BY o utiliza una agregación adecuada.',
  ],
  'ORA-01001': [
    'El cursor no está abierto',
    'No puedes leer un cursor después de cerrarlo.',
    'Haz OPEN antes de FETCH y CLOSE solo al terminar el recorrido.',
  ],
  'ORA-01403': [
    'No se encontró la fila esperada',
    'SELECT INTO esperaba una fila y no encontró ninguna.',
    'Revisa WHERE o maneja NO_DATA_FOUND en la sección EXCEPTION.',
  ],
  'ORA-01422': [
    'Se encontraron demasiadas filas',
    'SELECT INTO intenta guardar varias filas en variables preparadas para una sola.',
    'Filtra por una clave única o recorre las filas con un cursor.',
  ],
  'ORA-01427': [
    'La subconsulta devuelve más de un valor',
    'Una comparación que espera un valor recibió varias filas.',
    'Usa IN si necesitas varios valores o limita la subconsulta con una condición válida.',
  ],
  'ORA-01476': [
    'No se puede dividir entre cero',
    'El denominador de una división vale cero.',
    'Revisa el denominador; filtra ese caso o usa NULLIF(denominador, 0) cuando NULL sea el resultado que necesitas.',
  ],
  'ORA-01789': [
    'Las consultas tienen distinto número de columnas',
    'Los operadores de conjuntos comparan las columnas por posición.',
    'Selecciona la misma cantidad de columnas a ambos lados.',
  ],
  'ORA-01790': [
    'Los tipos de las columnas no son compatibles',
    'Una posición del resultado combina tipos que Oracle no puede comparar.',
    'Alinea los tipos por posición; convierte explícitamente cuando corresponda.',
  ],
  'ORA-02000': [
    'Falta una parte de la sintaxis',
    'La sentencia está incompleta; en el ejemplo de JOIN falta la condición ON.',
    'Completa JOIN ... ON con las columnas que relacionan las tablas.',
  ],
  'ORA-02291': [
    'La fila relacionada todavía no existe',
    'La clave foránea apunta a una clave padre que no está en la tabla referenciada.',
    'Crea primero la fila padre o elige una clave que ya exista.',
  ],
  'ORA-04082': [
    'No hay una fila actual para :OLD y :NEW',
    'Un trigger de sentencia no tiene los valores de una fila concreta.',
    'Usa FOR EACH ROW si la acción necesita :OLD o :NEW.',
  ],
  'ORA-04091': [
    'El trigger consulta una tabla que está cambiando',
    'La tabla está en estado mutante durante el trigger de fila.',
    'Replantea la regla fuera del trigger de fila; usa una restricción o un proceso explícito cuando sea posible.',
  ],
  'ORA-04092': [
    'El trigger no puede confirmar la transacción',
    'El trigger forma parte de la sentencia que lo dispara.',
    'Deja COMMIT o ROLLBACK al proceso que inició la operación.',
  ],
  'ORA-06502': [
    'El valor no cabe o no coincide con su tipo',
    'La variable recibió un valor incompatible con su capacidad o tipo.',
    'Revisa el tipo, la longitud y las conversiones de la variable.',
  ],
  'ORA-06503': [
    'La función terminó sin devolver un valor',
    'El recorrido llegó al final sin ejecutar RETURN.',
    'Asegura un RETURN válido en todos los caminos de ejecución.',
  ],
  'ORA-06510': [
    'La excepción propia no tiene respuesta',
    'Se lanzó una excepción que ningún manejador atendió.',
    'Añade el manejador adecuado o propaga el error de forma explícita.',
  ],
  'ORA-06592': [
    'Ninguna rama CASE coincide',
    'Una sentencia CASE terminó sin coincidencia y no tiene ELSE.',
    'Añade ELSE o maneja CASE_NOT_FOUND.',
  ],
  'ORA-20001': [
    'La regla del ejemplo rechazó la operación',
    'RAISE_APPLICATION_ERROR comunicó una condición de negocio incumplida.',
    'Revisa la condición y los valores de entrada del ejemplo.',
  ],
  'ORA-20002': [
    'La regla del ejemplo rechazó la operación',
    'El programa comunica un error propio dentro del rango permitido.',
    'Identifica la condición que provoca RAISE_APPLICATION_ERROR y corrige los datos de entrada.',
  ],
  'ORA-20003': [
    'La regla del ejemplo rechazó la operación',
    'El programa validó los datos y decidió no continuar.',
    'Sigue la condición del ejemplo y utiliza una entrada que la cumpla.',
  ],
  'ORA-20010': [
    'El aumento incumple la regla del trigger',
    'El trigger de validación rechaza el cambio y la sentencia no se aplica.',
    'Usa un aumento permitido y comprueba que el salario anterior se conserva al rechazarlo.',
  ],
  'ORA-20020': [
    'El proceso rechaza el porcentaje solicitado',
    'La validación del procedimiento impide aplicar un aumento no permitido.',
    'Revisa el porcentaje y vuelve a probar con un valor permitido por la regla.',
  ],
  'PLS-00103': [
    'La estructura del código está incompleta',
    'Oracle encontró un símbolo donde esperaba otra parte del programa.',
    'Revisa los puntos y coma, BEGIN, END y el cierre de cada estructura.',
  ],
  'PLS-00201': [
    'El identificador no está declarado',
    'El nombre usado no existe en el alcance actual del bloque.',
    'Declara la variable o utiliza el nombre del objeto visible en ese alcance.',
  ],
  'PLS-00302': [
    'El componente no está disponible',
    'El elemento usado no está declarado en el registro o en la especificación pública del paquete.',
    'Revisa el nombre y qué elementos publica la especificación.',
  ],
  'PLS-00363': [
    'Ese destino no puede recibir un valor',
    'Se intentó escribir en una constante, índice de FOR o argumento que no admite asignación.',
    'Utiliza una variable modificable; para OUT, pasa una variable y no un literal.',
  ],
};

export function explainOracleError(code: string): PedagogicalOracleError | null {
  const entry = ERRORS[code];
  return entry ? { title: entry[0], explanation: entry[1], correction: entry[2] } : null;
}
