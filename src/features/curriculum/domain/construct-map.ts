/**
 * Mapa de construcciones SQL y PL/SQL con la lección que las enseña. Sirve para comprobar
 * la regla de la ruta: un ejemplo solo usa lo ya enseñado o lo que su lección marca y
 * explica como avance (`TopicPlan.previews`). Lo que viene de la Sección 1 (SELECT, WHERE,
 * comparaciones, IN, LIKE, NULL, ORDER BY y funciones de una fila) no aparece aquí.
 *
 * Detecta palabras clave en el código sin cadenas ni comentarios. No ejecuta nada.
 */

export interface Construct {
  readonly id: string;
  readonly term: string;
  readonly pattern: RegExp;
  /** Lección que la enseña; `null` si ninguna lección de la ruta la enseña (solo avance). */
  readonly lesson: string | null;
}

const S2: readonly Construct[] = [
  { id: 'insert', term: 'INSERT', pattern: /\bINSERT\s+INTO\b/i, lesson: null },
  { id: 'create-table', term: 'CREATE TABLE', pattern: /\bCREATE\s+TABLE\b/i, lesson: null },
  {
    id: 'table-alias',
    term: 'Alias de tabla',
    pattern: /\b[a-z]{1,2}\.[a-z_]+\b/,
    lesson: 'S2-L02',
  },
  { id: 'join', term: 'JOIN … ON', pattern: /\bJOIN\b/i, lesson: 'S2-L03' },
  { id: 'inner-join', term: 'INNER JOIN', pattern: /\bINNER\s+JOIN\b/i, lesson: 'S2-L04' },
  {
    id: 'left-join',
    term: 'LEFT JOIN',
    pattern: /\bLEFT\s+(?:OUTER\s+)?JOIN\b/i,
    lesson: 'S2-L08',
  },
  {
    id: 'right-full-join',
    term: 'RIGHT y FULL JOIN',
    pattern: /\b(?:RIGHT|FULL)\s+(?:OUTER\s+)?JOIN\b/i,
    lesson: 'S2-L09',
  },
  {
    id: 'self-join',
    term: 'SELF JOIN',
    pattern: /\bempleados\s+[a-z]{1,2}\s+(?:LEFT\s+)?JOIN\s+empleados\b/i,
    lesson: 'S2-L10',
  },
  {
    id: 'cross-natural',
    term: 'CROSS, NATURAL y USING',
    pattern: /\b(?:CROSS\s+JOIN|NATURAL\s+JOIN|USING\s*\()/i,
    lesson: 'S2-L11',
  },
  {
    id: 'group-function',
    term: 'Funciones de grupo',
    pattern: /\b(?:COUNT|SUM|AVG|MIN|MAX)\s*\(/i,
    lesson: 'S2-L12',
  },
  {
    id: 'count-distinct',
    term: 'COUNT(DISTINCT …)',
    pattern: /\bCOUNT\s*\(\s*DISTINCT\b/i,
    lesson: 'S2-L13',
  },
  { id: 'group-by', term: 'GROUP BY', pattern: /\bGROUP\s+BY\b/i, lesson: 'S2-L14' },
  { id: 'having', term: 'HAVING', pattern: /\bHAVING\b/i, lesson: 'S2-L16' },
  { id: 'subquery', term: 'Subconsulta', pattern: /\(\s*SELECT\b/i, lesson: 'S2-L20' },
  {
    id: 'in-subquery',
    term: 'IN con subconsulta',
    pattern: /\bIN\s*\(\s*SELECT\b/i,
    lesson: 'S2-L21',
  },
  { id: 'exists', term: 'EXISTS', pattern: /\bEXISTS\b/i, lesson: 'S2-L22' },
  { id: 'union', term: 'UNION', pattern: /\bUNION\b/i, lesson: 'S2-L23' },
  {
    id: 'intersect-minus',
    term: 'INTERSECT y MINUS',
    pattern: /\b(?:INTERSECT|MINUS|EXCEPT)\b/i,
    lesson: 'S2-L24',
  },
];

const S3: readonly Construct[] = [
  { id: 'block', term: 'BEGIN … END', pattern: /\bBEGIN\b/i, lesson: 'S3-L02' },
  {
    id: 'dbms-output',
    term: 'DBMS_OUTPUT.PUT_LINE',
    pattern: /\bDBMS_OUTPUT\b/i,
    lesson: 'S3-L02',
  },
  { id: 'declare', term: 'DECLARE', pattern: /\bDECLARE\b/i, lesson: 'S3-L02' },
  {
    id: 'exception-section',
    term: 'Sección EXCEPTION',
    pattern: /\bEXCEPTION\s+WHEN\b/i,
    lesson: 'S3-L02',
  },
  { id: 'assignment', term: ':= (asignar)', pattern: /:=/, lesson: 'S3-L04' },
  { id: 'constant', term: 'CONSTANT', pattern: /\bCONSTANT\b/i, lesson: 'S3-L04' },
  { id: 'type', term: '%TYPE', pattern: /%TYPE\b/i, lesson: 'S3-L05' },
  {
    id: 'select-into',
    term: 'SELECT INTO',
    pattern: /\bSELECT\b(?:(?!\bINSERT\b)[^;])*?\bINTO\b/i,
    lesson: 'S3-L07',
  },
  { id: 'rowtype', term: '%ROWTYPE', pattern: /%ROWTYPE\b/i, lesson: 'S3-L29' },
  {
    id: 'nested-block',
    term: 'Bloque anidado',
    pattern: /\bBEGIN\b[\s\S]*\bDECLARE\b/i,
    lesson: 'S3-L06',
  },
  { id: 'if', term: 'IF … THEN', pattern: /\bIF\b(?!\s+(?:NOT\s+)?EXISTS)/i, lesson: 'S3-L09' },
  { id: 'case', term: 'CASE', pattern: /\bCASE\b/i, lesson: 'S3-L10' },
  {
    id: 'for-range',
    term: 'FOR i IN a..b LOOP',
    pattern: /\bFOR\s+\w+\s+IN\s+(?:REVERSE\s+)?\d+\s*\.\./i,
    lesson: 'S3-L12',
  },
  {
    id: 'loop',
    term: 'LOOP y EXIT WHEN',
    pattern: /\bEXIT\s+WHEN\b|(?:^|;|\bBEGIN|\bTHEN)\s*LOOP\b/i,
    lesson: 'S3-L11',
  },
  { id: 'while', term: 'WHILE', pattern: /\bWHILE\b/i, lesson: 'S3-L11' },
  {
    id: 'sql-attributes',
    term: 'SQL%ROWCOUNT y SQL%FOUND',
    pattern: /\bSQL%(?:ROWCOUNT|FOUND|NOTFOUND)\b/i,
    lesson: 'S3-L13',
  },
  {
    id: 'dml',
    term: 'UPDATE, INSERT y DELETE',
    pattern: /\b(?:UPDATE\s+\w+\s+SET|INSERT\s+INTO|DELETE\s+FROM)\b/i,
    lesson: 'S3-L08',
  },
  {
    id: 'transaction',
    term: 'COMMIT y ROLLBACK',
    pattern: /\b(?:COMMIT|ROLLBACK)\b/i,
    lesson: 'S3-L08',
  },
  {
    id: 'explicit-cursor',
    term: 'CURSOR, OPEN, FETCH y CLOSE',
    pattern: /\b(?:CURSOR\s+\w+|OPEN\s+\w+;|FETCH\b|CLOSE\s+\w+;)/i,
    lesson: 'S3-L14',
  },
  {
    id: 'cursor-for',
    term: 'Cursor FOR',
    pattern: /\bFOR\s+\w+\s+IN\s+(?:\(\s*SELECT\b|c\w*\s*(?:\(|LOOP))/i,
    lesson: 'S3-L15',
  },
  {
    id: 'predefined-exception',
    term: 'Excepciones con nombre',
    pattern: /\b(?:NO_DATA_FOUND|TOO_MANY_ROWS|OTHERS|SQLERRM|SQLCODE|VALUE_ERROR)\b/i,
    lesson: 'S3-L16',
  },
  {
    id: 'raise',
    term: 'RAISE y RAISE_APPLICATION_ERROR',
    pattern: /\bRAISE(?:_APPLICATION_ERROR)?\b|\b\w+\s+EXCEPTION\s*;/i,
    lesson: 'S3-L17',
  },
  { id: 'function', term: 'Función y RETURN', pattern: /\bFUNCTION\b/i, lesson: 'S3-L20' },
  { id: 'procedure', term: 'Procedimiento', pattern: /\bPROCEDURE\b/i, lesson: 'S3-L18' },
  { id: 'out-parameter', term: 'Parámetros OUT e IN OUT', pattern: /\bOUT\b/i, lesson: 'S3-L19' },
  { id: 'package', term: 'Paquete', pattern: /\bPACKAGE\b/i, lesson: 'S3-L22' },
  { id: 'trigger', term: 'Trigger', pattern: /\bTRIGGER\b/i, lesson: 'S3-L23' },
  { id: 'row-level', term: 'FOR EACH ROW', pattern: /\bFOR\s+EACH\s+ROW\b/i, lesson: 'S3-L23' },
  { id: 'old-new', term: ':OLD y :NEW', pattern: /:(?:OLD|NEW)\b/i, lesson: 'S3-L25' },
  {
    id: 'dml-predicates',
    term: 'INSERTING, UPDATING y DELETING',
    pattern: /\b(?:INSERTING|UPDATING|DELETING)\b/i,
    lesson: 'S3-L25',
  },
  {
    id: 'audit-table',
    term: 'AUDITORIA_SALARIOS',
    pattern: /\bauditoria_salarios\b/i,
    lesson: 'S3-L25',
  },
];

/** Construcciones que se vigilan en cada sección; las de S2 son conocimiento previo de S3. */
export const CONSTRUCTS: Readonly<Record<'S2' | 'S3', readonly Construct[]>> = { S2, S3 };

/** Código sin literales de texto ni comentarios: lo que Oracle interpreta como instrucción. */
export function codeOnly(code: string): string {
  return code
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''");
}

export function constructsIn(section: 'S2' | 'S3', code: string): readonly Construct[] {
  const plain = codeOnly(code);
  return CONSTRUCTS[section].filter((construct) => construct.pattern.test(plain));
}
