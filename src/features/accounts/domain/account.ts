/**
 * Cuentas de DB LAB. La identidad la da Supabase Auth; el perfil guarda solo nombre,
 * apellido, el correo de Auth, el rol y el estado institucional calculado en la base.
 * El rol nunca se decide en el navegador: esta capa solo lo lee para mostrar opciones.
 */

export const USER_ROLES = ['student', 'teacher'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_METHODS = ['email', 'microsoft', 'other'] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export interface AccountProfile {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly authMethod: AuthMethod;
  /** Correo confirmado de un dominio institucional configurado (lo calcula la base). */
  readonly institutional: boolean;
}

export const AUTH_METHOD_LABEL: Readonly<Record<AuthMethod, string>> = {
  email: 'Correo y contraseña',
  microsoft: 'Microsoft',
  other: 'Proveedor externo',
};

export const ROLE_LABEL: Readonly<Record<UserRole, string>> = {
  student: 'Estudiante',
  teacher: 'Profesor',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isAuthMethod(value: unknown): value is AuthMethod {
  return typeof value === 'string' && (AUTH_METHODS as readonly string[]).includes(value);
}

export function displayName(profile: Pick<AccountProfile, 'firstName' | 'lastName' | 'email'>) {
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  return name || profile.email.split('@')[0] || 'Tu cuenta';
}

/** Dos letras para el avatar: inicial del nombre y del apellido, o del correo. */
export function initials(profile: Pick<AccountProfile, 'firstName' | 'lastName' | 'email'>) {
  const letters = [profile.firstName, profile.lastName]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join('');
  return (letters || profile.email.trim().charAt(0) || '?').toLocaleUpperCase('es');
}

export function canOpenTeacherArea(role: UserRole | null | undefined): boolean {
  return role === 'teacher';
}
