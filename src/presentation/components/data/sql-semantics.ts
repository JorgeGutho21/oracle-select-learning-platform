/**
 * Papel semántico de una palabra de SQL. Es la base del color semántico común a toda la
 * plataforma: proyección (SELECT) cian, fuente (FROM) azul, filtro (WHERE y condiciones)
 * violeta, operadores ámbar y orden (ORDER BY) magenta. El color siempre acompaña al
 * texto: nunca es la única pista.
 */
export type SqlRole = 'select' | 'from' | 'filter' | 'order' | 'operator';

const ROLES: Readonly<Record<string, SqlRole>> = {
  SELECT: 'select',
  DISTINCT: 'select',
  AS: 'select',
  FROM: 'from',
  WHERE: 'filter',
  AND: 'filter',
  OR: 'filter',
  NOT: 'filter',
  BETWEEN: 'filter',
  IN: 'filter',
  LIKE: 'filter',
  IS: 'filter',
  NULL: 'filter',
  ORDER: 'order',
  BY: 'order',
  'ORDER BY': 'order',
  ASC: 'order',
  DESC: 'order',
  NULLS: 'order',
  FIRST: 'order',
  LAST: 'order',
};

/** Papel de una palabra clave u operador; `null` si no tiene uno propio. */
export function sqlRole(word: string): SqlRole | null {
  const upper = word.trim().toUpperCase();
  if (/^(?:<>|!=|>=|<=|[=<>+/*-]|\|\|)$/.test(upper)) return 'operator';
  if (upper.startsWith('AS ')) return 'select';
  return ROLES[upper] ?? null;
}
