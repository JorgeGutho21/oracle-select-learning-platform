/**
 * Alias del participante (DATABASE_SCHEMA): 2–24 caracteres tras recortar espacios, tratado
 * siempre como texto. No es identidad legal y no admite datos de contacto.
 */

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;

export type NicknameCheck =
  | { readonly ok: true; readonly nickname: string; readonly key: string }
  | { readonly ok: false; readonly message: string };

// Letras (con tildes), números, espacio y . _ -
const ALLOWED = /^[\p{L}\p{M}\p{N} ._-]+$/u;
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;

export function sanitizeNickname(input: string): NicknameCheck {
  const nickname = input.normalize('NFC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
  const length = [...nickname].length;
  if (length < NICKNAME_MIN || length > NICKNAME_MAX) {
    return {
      ok: false,
      message: `El alias debe tener entre ${NICKNAME_MIN} y ${NICKNAME_MAX} caracteres.`,
    };
  }
  if (!ALLOWED.test(nickname)) {
    return {
      ok: false,
      message: 'Usa solo letras, números, espacios, punto, guion o guion bajo.',
    };
  }
  if (/@|\d{7,}/.test(nickname)) {
    return { ok: false, message: 'No escribas correos ni teléfonos: usa un alias.' };
  }
  return { ok: true, nickname, key: nickname.toLocaleLowerCase('es') };
}
