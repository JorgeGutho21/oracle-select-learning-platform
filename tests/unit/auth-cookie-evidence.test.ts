import { describe, expect, it } from 'vitest';
import { parseAuthCookieAttributes } from '../support/auth-cookie-attributes';

describe('evidencia de cookies sin valores de sesión', () => {
  it('conserva atributos y nunca expone el token, incluidos cookies partidos', () => {
    const attributes = parseAuthCookieAttributes(
      'sb-project-auth-token.0=PRIVATE_TOKEN; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=34560000',
    );
    expect(attributes).toEqual({
      name: 'sb-project-auth-token.0',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      removed: false,
    });
    expect(JSON.stringify(attributes)).not.toContain('PRIVATE_TOKEN');
  });
  it('no transforma una política insegura o ausente en Lax', () => {
    expect(parseAuthCookieAttributes('sb-project-auth-token=secret; SameSite=None')?.sameSite).toBe(
      'none',
    );
    expect(parseAuthCookieAttributes('sb-project-auth-token=secret')?.sameSite).toBeUndefined();
    expect(parseAuthCookieAttributes('sb-project-auth-token=secret')?.secure).toBe(false);
  });
  it('distingue una cookie borrada de una sesión actual', () => {
    expect(
      parseAuthCookieAttributes(
        'sb-project-auth-token=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax',
      )?.removed,
    ).toBe(true);
  });
  it('descarta cookies ajenas a Auth sin devolver sus valores', () => {
    expect(parseAuthCookieAttributes('vercel-cookie=secret; Secure')).toBeUndefined();
  });
});
