import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ClassroomSecrets, PresenterGate } from '../application/ports';

/** Tokens y huellas del servidor: el navegador solo guarda el token en una cookie httpOnly. */
export const nodeSecrets: ClassroomSecrets = {
  randomToken: () => randomBytes(32).toString('base64url'),
  hash: (value) => createHash('sha256').update(value, 'utf8').digest('hex'),
  randomBytes: (size) => new Uint8Array(randomBytes(size)),
};

/**
 * Acceso del profesor por clave del servidor (`PRESENTER_ACCESS_CODE`). Se compara la
 * huella en tiempo constante; sin clave configurada no se pueden crear salas.
 */
export class EnvPresenterGate implements PresenterGate {
  private readonly expected: Buffer | null;

  constructor(accessCode: string | undefined) {
    const code = accessCode?.trim();
    this.expected = code ? createHash('sha256').update(code, 'utf8').digest() : null;
  }

  get configured(): boolean {
    return this.expected !== null;
  }

  verify(accessCode: string): boolean {
    if (!this.expected) return false;
    const given = createHash('sha256').update(accessCode.trim(), 'utf8').digest();
    return timingSafeEqual(given, this.expected);
  }
}
