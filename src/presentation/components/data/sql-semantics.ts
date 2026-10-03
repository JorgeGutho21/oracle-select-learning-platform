/**
 * Papel semántico de una palabra de SQL. Es la base del color semántico común a toda la
 * plataforma: proyección (SELECT) cian, fuente (FROM) azul, relación (JOIN y ON) verde,
 * filtro (WHERE y condiciones) violeta, agrupación (GROUP BY y HAVING) naranja, operadores
 * ámbar y orden (ORDER BY) magenta. El color siempre acompaña al texto: nunca es la única
 * pista.
 */
export type SqlRole = 'select' | 'from' | 'join' | 'filter' | 'group' | 'order' | 'operator';

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
  IS: 'filter',
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
};

/**
 * Papel de una palabra clave u operador; `null` si no tiene uno propio. `previous` es la
 * palabra anterior: BY pertenece a GROUP BY o a ORDER BY según lo que la precede.
 */
export function sqlRole(word: string, previous = ''): SqlRole | null {
  const upper = word.trim().toUpperCase();
  if (/^(?:<>|!=|>=|<=|[=<>+/*-]|\|\|)$/.test(upper)) return 'operator';
  if (upper.startsWith('AS ')) return 'select';
  if (upper === 'BY' && previous.trim().toUpperCase() === 'GROUP') return 'group';
  return ROLES[upper] ?? null;
}
