/**
 * Validación y mensajes de los formularios de cuenta. La misma validación corre en el
 * navegador (ayuda inmediata) y en las Server Functions (la que cuenta): una petición
 * fabricada recibe las mismas reglas. Los mensajes no revelan si un correo está
 * registrado (enumeración de usuarios).
 */

export type AuthField = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';
export type FieldErrors = Partial<Record<AuthField, string>>;

export interface AuthFormState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message: string;
  readonly fieldErrors: FieldErrors;
  /** Datos no sensibles que se conservan tras un error recuperable (nunca contraseñas). */
  readonly values: Partial<Record<'firstName' | 'lastName' | 'email', string>>;
  /** Acción complementaria que la interfaz puede ofrecer (reenviar la confirmación). */
  readonly offer?: 'resend-confirmation';
}

export const INITIAL_FORM_STATE: AuthFormState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
  values: {},
};

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const NAME_MAX = 60;
const EMAIL_MAX = 254;

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
// Formato práctico de correo: Auth hace la comprobación definitiva al enviar el enlace.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function nameError(value: string, label: 'nombre' | 'apellido'): string | undefined {
  const name = normalizeName(value);
  if (!name) return `Escribe tu ${label}.`;
  if (name.length > NAME_MAX) return `El ${label} admite hasta ${NAME_MAX} caracteres.`;
  if (!NAME_PATTERN.test(name)) {
    return `El ${label} solo admite letras, espacios, apóstrofos, puntos y guiones.`;
  }
  return undefined;
}

export function emailError(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return 'Escribe tu correo.';
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  }
  return undefined;
}

export function passwordError(value: string): string | undefined {
  if (!value) return 'Escribe una contraseña.';
  if (value.length < PASSWORD_MIN) return `Usa al menos ${PASSWORD_MIN} caracteres.`;
  if (value.length > PASSWORD_MAX) return `Usa como máximo ${PASSWORD_MAX} caracteres.`;
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return 'Combina letras y números.';
  return undefined;
}

export function confirmationError(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Repite la contraseña.';
  return confirm === password ? undefined : 'Las contraseñas no coinciden.';
}

type Validated<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly fieldErrors: FieldErrors };

function result<T>(data: T, errors: Partial<Record<AuthField, string | undefined>>): Validated<T> {
  const fieldErrors = Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors;
  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, data };
}

function text(value: unknown, max = 512): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export interface SignUpInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
}

export function validateSignUp(raw: Readonly<Record<string, unknown>>): Validated<SignUpInput> {
  const password = text(raw.password, PASSWORD_MAX + 1);
  const confirm = text(raw.confirmPassword, PASSWORD_MAX + 1);
  return result(
    {
      firstName: normalizeName(text(raw.firstName)),
      lastName: normalizeName(text(raw.lastName)),
      email: normalizeEmail(text(raw.email)),
      password,
    },
    {
      firstName: nameError(text(raw.firstName), 'nombre'),
      lastName: nameError(text(raw.lastName), 'apellido'),
      email: emailError(text(raw.email)),
      password: passwordError(password),
      confirmPassword: confirmationError(password, confirm),
    },
  );
}

export function validateSignIn(
  raw: Readonly<Record<string, unknown>>,
): Validated<{ readonly email: string; readonly password: string }> {
  const password = text(raw.password, PASSWORD_MAX + 1);
  return result(
    { email: normalizeEmail(text(raw.email)), password },
    {
      email: emailError(text(raw.email)),
      // Al entrar no se aplican las reglas de creación: solo que haya contraseña.
      password: password ? undefined : 'Escribe tu contraseña.',
    },
  );
}

export function validateEmailOnly(
  raw: Readonly<Record<string, unknown>>,
): Validated<{ readonly email: string }> {
  return result({ email: normalizeEmail(text(raw.email)) }, { email: emailError(text(raw.email)) });
}

export function validateNewPassword(
  raw: Readonly<Record<string, unknown>>,
): Validated<{ readonly password: string }> {
  const password = text(raw.password, PASSWORD_MAX + 1);
  const confirm = text(raw.confirmPassword, PASSWORD_MAX + 1);
  return result(
    { password },
    { password: passwordError(password), confirmPassword: confirmationError(password, confirm) },
  );
}

export function validateProfileNames(
  raw: Readonly<Record<string, unknown>>,
): Validated<{ readonly firstName: string; readonly lastName: string }> {
  return result(
    { firstName: normalizeName(text(raw.firstName)), lastName: normalizeName(text(raw.lastName)) },
    {
      firstName: nameError(text(raw.firstName), 'nombre'),
      lastName: nameError(text(raw.lastName), 'apellido'),
    },
  );
}

/** Mensajes de error de Auth, por código. Nunca se muestra el texto técnico original. */
export type AuthErrorContext = 'sign-in' | 'sign-up' | 'reset' | 'update' | 'oauth';

export const GENERIC_AUTH_ERROR =
  'No pudimos completar la operación. Inténtalo de nuevo en unos minutos.';
export const NETWORK_AUTH_ERROR =
  'No hay conexión con el servicio de cuentas. Revisa tu conexión e inténtalo de nuevo.';
export const SIGN_UP_SENT =
  'Revisa tu correo: si la dirección puede registrarse, te enviamos un enlace para activar la cuenta. Puede tardar unos minutos y llegar a la carpeta de spam.';
export const RESET_SENT =
  'Si existe una cuenta con ese correo, te enviamos un enlace para elegir una contraseña nueva. Caduca en una hora.';

export function authErrorMessage(code: string | undefined, context: AuthErrorContext): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Tu correo todavía no está confirmado. Abre el enlace que te enviamos o pide uno nuevo.';
    case 'weak_password':
      return `La contraseña es demasiado débil: usa al menos ${PASSWORD_MIN} caracteres con letras y números.`;
    case 'same_password':
      return 'La contraseña nueva debe ser distinta de la anterior.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'El registro con correo está cerrado por ahora.';
    case 'provider_disabled':
      return 'El acceso con Microsoft todavía no está disponible.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'El enlace caducó o ya se usó. Pide uno nuevo.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Tu sesión terminó. Vuelve a iniciar sesión.';
    case 'network':
      return NETWORK_AUTH_ERROR;
    default:
      return context === 'oauth'
        ? 'No pudimos iniciar sesión con Microsoft. Inténtalo de nuevo.'
        : GENERIC_AUTH_ERROR;
  }
}

/**
 * Avisos que llegan a la pantalla de acceso por la URL (`?aviso=`). Solo se muestran los
 * códigos conocidos: el texto nunca sale de la URL.
 */
export const LOGIN_NOTICES = {
  'enlace-caducado': { tone: 'warning', text: 'El enlace caducó o ya se usó. Pide uno nuevo.' },
  'microsoft-cancelado': {
    tone: 'info',
    text: 'Cancelaste el acceso con Microsoft. Puedes intentarlo de nuevo o usar tu correo.',
  },
  'microsoft-no-disponible': {
    tone: 'info',
    text: 'El acceso con Microsoft todavía no está configurado. Entra con tu correo o sigue como invitado.',
  },
  'microsoft-error': {
    tone: 'warning',
    text: 'No pudimos iniciar sesión con Microsoft. Inténtalo de nuevo o usa tu correo.',
  },
  'sesion-requerida': { tone: 'info', text: 'Inicia sesión para ver esa página.' },
  'correo-confirmado': {
    tone: 'success',
    text: 'Correo confirmado. Ya puedes iniciar sesión.',
  },
  'contrasena-actualizada': {
    tone: 'success',
    text: 'Contraseña actualizada. Inicia sesión con la nueva.',
  },
  'no-disponible': {
    tone: 'warning',
    text: 'Las cuentas no están disponibles en este momento. Puedes seguir como invitado.',
  },
} as const;

export type LoginNoticeCode = keyof typeof LOGIN_NOTICES;

export function loginNotice(code: unknown) {
  return typeof code === 'string' && Object.hasOwn(LOGIN_NOTICES, code)
    ? LOGIN_NOTICES[code as LoginNoticeCode]
    : null;
}

/** Avisos de las páginas de la cuenta tras un flujo de Auth (`?aviso=`). */
export const ACCOUNT_NOTICES = {
  bienvenida: { tone: 'success', text: 'Cuenta creada. Tu progreso ya se guarda en tu cuenta.' },
  'correo-confirmado': {
    tone: 'success',
    text: 'Correo confirmado. Tu progreso de este dispositivo se suma a tu cuenta.',
  },
  'contrasena-actualizada': { tone: 'success', text: 'Contraseña actualizada.' },
  'correo-actualizado': { tone: 'success', text: 'Correo actualizado.' },
} as const;

export function accountNotice(code: unknown) {
  return typeof code === 'string' && Object.hasOwn(ACCOUNT_NOTICES, code)
    ? ACCOUNT_NOTICES[code as keyof typeof ACCOUNT_NOTICES]
    : null;
}
