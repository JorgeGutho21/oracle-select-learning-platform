/**
 * Código de ingreso a la sala (REALTIME_SPEC): seis caracteres sin letras ni dígitos que
 * se confunden al proyectarlos (I, L, O, 0 y 1). Se compara siempre en mayúsculas.
 */

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;

const VALID = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

/** Normaliza lo que escribe una persona («ab3 k9x» → «AB3K9X»); `null` si no es válido. */
export function normalizeRoomCode(input: string): string | null {
  const code = input.normalize('NFKC').toUpperCase().replace(/[\s-]/g, '');
  return VALID.test(code) ? code : null;
}

/** Genera un código a partir de bytes aleatorios; el sesgo por módulo es despreciable. */
export function roomCodeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < ROOM_CODE_LENGTH) throw new RangeError('Faltan bytes para el código.');
  let code = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_ALPHABET[bytes[index]! % ROOM_CODE_ALPHABET.length];
  }
  return code;
}
