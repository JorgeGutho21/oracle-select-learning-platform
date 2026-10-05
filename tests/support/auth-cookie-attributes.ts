/** Solo conserva atributos de seguridad; el valor de sesión nunca sale del parser. */
export interface AuthCookieAttributes {
  readonly name: string;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite: string | undefined;
  readonly path: string | undefined;
  readonly removed: boolean;
}

export function parseAuthCookieAttributes(header: string): AuthCookieAttributes | undefined {
  const [pair, ...parts] = header.split(';');
  const name = pair?.slice(0, pair.indexOf('=')).trim() ?? '';
  if (!/^sb-.*-auth-token(?:\.\d+)?$/.test(name)) return undefined;
  const attributes = new Map(
    parts.map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? [part.trim().toLowerCase(), '']
        : [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()];
    }),
  );
  return {
    name,
    secure: attributes.has('secure'),
    httpOnly: attributes.has('httponly'),
    sameSite: attributes.get('samesite')?.toLowerCase(),
    path: attributes.get('path'),
    removed: attributes.has('max-age') && Number(attributes.get('max-age')) <= 0,
  };
}
