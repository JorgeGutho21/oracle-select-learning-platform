/**
 * Papel semántico de una palabra de SQL. Es la base del color semántico común a toda la
 * plataforma: proyección (SELECT) cian, fuente (FROM) azul, relación (JOIN y ON) verde,
 * filtro (WHERE y condiciones) violeta, agrupación (GROUP BY y HAVING) naranja, operadores
 * ámbar y orden (ORDER BY) magenta. En PL/SQL, la estructura del bloque y de los
 * subprogramas (DECLARE, BEGIN, END, PROCEDURE…) va en un tono neutro y fuerte, y el control
 * de flujo (IF, LOOP, CASE, RAISE…) en un único color propio. El color siempre acompaña al
 * texto: nunca es la única pista.
 */
export type SqlRole =
  'select' | 'from' | 'join' | 'filter' | 'group' | 'order' | 'operator' | 'block' | 'control';

const ROLES: Readonly<Record<string, SqlRole>> = {
  SELECT: 'select',
  DISTINCT: 'select',
  AS: 'select',
  FROM: 'from',
  JOIN: 'join',
  INNER: 'join',
  LEFT: 'join',
  RIGHT: 'join',
  FULL: 'join',
  OUTER: 'join',
  CROSS: 'join',
  ON: 'join',
  USING: 'join',
  WHERE: 'filter',
  AND: 'filter',
  OR: 'filter',
  NOT: 'filter',
  BETWEEN: 'filter',
  IN: 'filter',
  LIKE: 'filter',
  NULL: 'filter',
  GROUP: 'group',
  'GROUP BY': 'group',
  HAVING: 'group',
  ORDER: 'order',
  BY: 'order',
  'ORDER BY': 'order',
  ASC: 'order',
  DESC: 'order',
  NULLS: 'order',
  FIRST: 'order',
  LAST: 'order',
  DECLARE: 'block',
  BEGIN: 'block',
  END: 'block',
  EXCEPTION: 'block',
  CREATE: 'block',
  REPLACE: 'block',
  PROCEDURE: 'block',
  FUNCTION: 'block',
  PACKAGE: 'block',
  BODY: 'block',
  TRIGGER: 'block',
  CURSOR: 'block',
  RETURN: 'block',
  IS: 'block',
  IF: 'control',
  THEN: 'control',
  ELSIF: 'control',
  ELSE: 'control',
  CASE: 'control',
  WHEN: 'control',
  LOOP: 'control',
  WHILE: 'control',
  FOR: 'control',
  EXIT: 'control',
  CONTINUE: 'control',
  RAISE: 'control',
  OPEN: 'control',
  FETCH: 'control',
  CLOSE: 'control',
};

/**
 * Papel de una palabra clave u operador; `null` si no tiene uno propio. `previous` es la
 * palabra anterior: BY pertenece a GROUP BY o a ORDER BY según lo que la precede. `next` es
 * la siguiente: distingue IS NULL (filtro) de IS (PL/SQL) y OR REPLACE de OR.
 */
export function sqlRole(word: string, previous = '', next = ''): SqlRole | null {
  const upper = word.trim().toUpperCase();
  if (/^(?:<>|!=|>=|<=|[=<>+/*-]|\|\|)$/.test(upper)) return 'operator';
  if (upper.startsWith('AS ')) return 'select';
  if (upper === 'BY' && previous.trim().toUpperCase() === 'GROUP') return 'group';
  // IS NULL e IS NOT NULL son condiciones; IS en CREATE … IS abre un subprograma.
  if (upper === 'IS' && /^(?:NULL|NOT)$/.test(next.trim().toUpperCase())) return 'filter';
  // CASE … WHEN … THEN … ELSE … END también puede ser una expresión SQL: mismo color.
  // OR REPLACE pertenece a CREATE; OR suelto es un operador lógico.
  if (upper === 'OR' && next.trim().toUpperCase() === 'REPLACE') return 'block';
  return ROLES[upper] ?? null;
}
