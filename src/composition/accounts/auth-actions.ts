'use server';

import type { EmailOtpType } from '@supabase/supabase-js';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  authErrorMessage,
  GENERIC_AUTH_ERROR,
  RESET_SENT,
  SIGN_UP_SENT,
  validateEmailOnly,
  validateNewPassword,
  validateProfileNames,
  validateSignIn,
  validateSignUp,
  type AuthFormState,
  type FieldErrors,
} from '@/features/accounts/application/auth-forms';
import { ACCOUNT_HOME, safeNextPath } from '@/features/accounts/application/redirects';
import {
  authConfig,
  authErrorCode,
  authProviders,
} from '@/features/accounts/infrastructure/supabase-auth';
import { updateProfileNames } from '@/features/accounts/infrastructure/supabase-profile-repository';
import { allowAttempt } from './attempt-limiter';
import { authClient, currentAccount, requestOrigin, setSessionHint } from './auth-server';

/**
 * Server Functions de las cuentas. Son accesibles por POST directo: todo se valida aquí
 * con las mismas reglas que ve el formulario. Las contraseñas solo pasan hacia Supabase
 * Auth; no se guardan, no se registran y no vuelven al formulario.
 */

const UNAVAILABLE: AuthFormState = {
  status: 'error',
  message: 'Las cuentas no están disponibles en este momento. Puedes seguir como invitado.',
  fieldErrors: {},
  values: {},
};
const LIMITED = 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
const CHECK_FIELDS = 'Revisa los campos marcados.';

type Values = AuthFormState['values'];

function fields(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}

function failure(message: string, values: Values, fieldErrors: FieldErrors = {}): AuthFormState {
  return { status: 'error', message, fieldErrors, values };
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = fields(formData);
  const values = { email: raw.email?.slice(0, 254) ?? '' };
  const next = safeNextPath(raw.next);
  const parsed = validateSignIn(raw);
  if (!parsed.ok) return failure(CHECK_FIELDS, values, parsed.fieldErrors);
  if (!(await allowAttempt('sign-in', parsed.data.email))) return failure(LIMITED, values);
  const supabase = await authClient();
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const code = authErrorCode(error);
    const state = failure(authErrorMessage(code, 'sign-in'), values);
    return code === 'email_not_confirmed' ? { ...state, offer: 'resend-confirmation' } : state;
  }
  await setSessionHint(true);
  redirect(next as Route);
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = fields(formData);
  const values = {
    firstName: raw.firstName?.slice(0, 120) ?? '',
    lastName: raw.lastName?.slice(0, 120) ?? '',
    email: raw.email?.slice(0, 254) ?? '',
  };
  const parsed = validateSignUp(raw);
  if (!parsed.ok) return failure(CHECK_FIELDS, values, parsed.fieldErrors);
  if (!(await allowAttempt('sign-up', parsed.data.email))) return failure(LIMITED, values);
  const supabase = await authClient();
  if (!supabase) return UNAVAILABLE;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Solo datos visibles: el perfil los copia al crearse. El rol nunca viaja aquí.
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
      emailRedirectTo: `${await requestOrigin()}/auth/callback`,
    },
  });
  if (error) {
    const code = authErrorCode(error);
    // Un correo ya registrado recibe la misma respuesta: no se revela quién tiene cuenta.
    if (code === 'user_already_exists' || code === 'email_exists') {
      return { status: 'success', message: SIGN_UP_SENT, fieldErrors: {}, values: {} };
    }
    if (code === 'weak_password') {
      return failure(CHECK_FIELDS, values, { password: authErrorMessage(code, 'sign-up') });
    }
    return failure(authErrorMessage(code, 'sign-up'), values);
  }
  if (data.session) {
    // Proyecto sin confirmación de correo: la cuenta ya tiene sesión.
    await setSessionHint(true);
    redirect(`${ACCOUNT_HOME}?aviso=bienvenida`);
  }
  return { status: 'success', message: SIGN_UP_SENT, fieldErrors: {}, values: {} };
}

export async function resendConfirmationAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = fields(formData);
  const values = { email: raw.email?.slice(0, 254) ?? '' };
  const parsed = validateEmailOnly(raw);
  if (!parsed.ok) return failure(CHECK_FIELDS, values, parsed.fieldErrors);
  if (!(await allowAttempt('resend', parsed.data.email))) return failure(LIMITED, values);
  const supabase = await authClient();
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${await requestOrigin()}/auth/callback` },
  });
  if (authErrorCode(error) === 'network')
    return failure(authErrorMessage('network', 'sign-up'), values);
  return {
    status: 'success',
    message: 'Si la cuenta está pendiente de confirmar, te enviamos un enlace nuevo.',
    fieldErrors: {},
    values,
  };
}

export async function requestPasswordResetAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = fields(formData);
  const values = { email: raw.email?.slice(0, 254) ?? '' };
  const parsed = validateEmailOnly(raw);
  if (!parsed.ok) return failure(CHECK_FIELDS, values, parsed.fieldErrors);
  if (!(await allowAttempt('reset', parsed.data.email))) return failure(LIMITED, values);
  const supabase = await authClient();
  if (!supabase) return UNAVAILABLE;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await requestOrigin()}/auth/callback?next=/reset-password`,
  });
  const code = authErrorCode(error);
  if (
    code === 'network' ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return failure(authErrorMessage(code, 'reset'), values);
  }
  // Exista o no la cuenta, la respuesta es la misma.
  return { status: 'success', message: RESET_SENT, fieldErrors: {}, values: {} };
}

export async function updatePasswordAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = validateNewPassword(fields(formData));
  if (!parsed.ok) return failure(CHECK_FIELDS, {}, parsed.fieldErrors);
  const supabase = await authClient();
  if (!supabase) return UNAVAILABLE;
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return failure('Tu enlace caducó. Pide uno nuevo desde «¿Olvidaste tu contraseña?».', {});
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const code = authErrorCode(error);
    return code === 'weak_password' || code === 'same_password'
      ? failure(CHECK_FIELDS, {}, { password: authErrorMessage(code, 'update') })
      : failure(authErrorMessage(code, 'update'), {});
  }
  await setSessionHint(true);
  redirect(`${ACCOUNT_HOME}?aviso=contrasena-actualizada`);
}

export async function updateProfileAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = fields(formData);
  const values = {
    firstName: raw.firstName?.slice(0, 120) ?? '',
    lastName: raw.lastName?.slice(0, 120) ?? '',
  };
  const parsed = validateProfileNames(raw);
  if (!parsed.ok) return failure(CHECK_FIELDS, values, parsed.fieldErrors);
  const account = await currentAccount();
  if (account.status !== 'authenticated') {
    return failure('Tu sesión terminó. Vuelve a iniciar sesión para guardar los cambios.', values);
  }
  if (!(await updateProfileNames(account.client, account.user.id, parsed.data))) {
    return failure(GENERIC_AUTH_ERROR, values);
  }
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { status: 'success', message: 'Datos guardados.', fieldErrors: {}, values: parsed.data };
}

export async function signInWithMicrosoftAction(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get('next'));
  const config = authConfig(process.env);
  const providers = config ? await authProviders(config) : null;
  if (!providers?.microsoft) redirect('/login?aviso=microsoft-no-disponible');
  if (!(await allowAttempt('oauth'))) redirect('/login?aviso=microsoft-error');
  const supabase = await authClient();
  if (!supabase) redirect('/login?aviso=no-disponible');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      // «email» hace que Microsoft entregue el correo; el resto lo añade Supabase.
      scopes: 'email',
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) redirect('/login?aviso=microsoft-error');
  redirect(data.url as Route);
}

export async function signOutAction(): Promise<void> {
  const supabase = await authClient();
  // Cierra la sesión de este dispositivo; las de otros dispositivos siguen abiertas.
  await supabase?.auth.signOut({ scope: 'local' });
  await setSessionHint(false);
  redirect('/');
}

const OTP_TYPES: readonly EmailOtpType[] = [
  'email',
  'signup',
  'recovery',
  'email_change',
  'invite',
  'magiclink',
];

/**
 * Confirma el enlace del correo con un botón (POST), no al abrirlo: los filtros de correo
 * institucionales abren los enlaces para revisarlos y gastarían el token de un solo uso.
 */
export async function confirmEmailLinkAction(formData: FormData): Promise<void> {
  const tokenHash = formData.get('token_hash');
  const type = formData.get('type');
  if (
    typeof tokenHash !== 'string' ||
    !/^[A-Za-z0-9_-]{8,256}$/.test(tokenHash) ||
    typeof type !== 'string' ||
    !(OTP_TYPES as readonly string[]).includes(type)
  ) {
    redirect('/login?aviso=enlace-caducado');
  }
  const supabase = await authClient();
  if (!supabase) redirect('/login?aviso=no-disponible');
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });
  if (error) redirect('/login?aviso=enlace-caducado');
  await setSessionHint(true);
  if (type === 'recovery') redirect('/reset-password');
  if (type === 'email_change') redirect('/profile?aviso=correo-actualizado');
  redirect(`${ACCOUNT_HOME}?aviso=correo-confirmado`);
}
