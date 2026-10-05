import { expect, type Page, type Response } from '@playwright/test';
import {
  parseAuthCookieAttributes,
  type AuthCookieAttributes,
} from '../../support/auth-cookie-attributes';

/** Se inicia antes del login para verificar el Set-Cookie del navegador real. */
export function watchAuthCookieAttributes(page: Page) {
  const received = new Map<string, AuthCookieAttributes>();
  const pending: Promise<void>[] = [];
  const inspect = (response: Response) => {
    if (new URL(response.url()).origin !== new URL(page.url()).origin) return;
    pending.push(
      response.headersArray().then((headers) => {
        for (const header of headers) {
          if (header.name.toLowerCase() !== 'set-cookie') continue;
          for (const line of header.value.split('\n')) {
            const attributes = parseAuthCookieAttributes(line);
            if (attributes) received.set(attributes.name, attributes);
          }
        }
      }),
    );
  };
  page.on('response', inspect);
  return async (browserName: string) => {
    page.off('response', inspect);
    await Promise.all(pending);
    const cookies = (await page.context().cookies())
      .filter(({ name }) => /^sb-.*-auth-token(?:\.\d+)?$/.test(name))
      .map(({ name, secure, httpOnly, sameSite, path }) => ({
        name,
        secure,
        httpOnly,
        sameSite,
        path,
      }));
    expect(cookies.length).toBeGreaterThan(0);
    return cookies.map((cookie) => {
      expect(cookie.secure, cookie.name).toBe(true);
      expect(cookie.httpOnly, cookie.name).toBe(true);
      expect(cookie.path, cookie.name).toBe('/');
      const wire = received.get(cookie.name);
      expect(wire, `Set-Cookie observado para ${cookie.name}`).toBeDefined();
      expect(wire?.removed, cookie.name).toBe(false);
      expect(wire?.secure, cookie.name).toBe(true);
      expect(wire?.httpOnly, cookie.name).toBe(true);
      expect(wire?.sameSite, cookie.name).toBe('lax');
      expect(wire?.path, cookie.name).toBe('/');
      // Probe controlado en Windows: este WebKit informa None para Lax y Strict.
      // Se comprueba Lax en el HTTP real; no se afirma enforcement cross-site de Safari.
      const metadataUnavailable =
        browserName === 'webkit' && process.platform === 'win32' && cookie.sameSite === 'None';
      if (!metadataUnavailable) expect(cookie.sameSite, cookie.name).toBe('Lax');
      return {
        ...cookie,
        emittedSameSite: wire!.sameSite,
        sameSiteApiUnavailable: metadataUnavailable,
      };
    });
  };
}
