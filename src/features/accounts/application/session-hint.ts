/**
 * Marca de sesión sin datos (no httpOnly, sin tokens): deja al navegador saber si conviene
 * preguntar por la cuenta. Las cookies con los tokens son httpOnly y nunca se leen aquí.
 */
export const SESSION_HINT_COOKIE = 'dblab-session';

export function cookieHasSessionHint(cookieHeader: string): boolean {
  return cookieHeader.split(/;\s*/).includes(`${SESSION_HINT_COOKIE}=1`);
}
