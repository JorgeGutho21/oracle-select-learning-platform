import 'server-only';
import { safeNextPath } from '@/features/accounts/application/redirects';
import { authClient, setSessionHint } from './auth-server';

/** Devuelve la ruta interna a la que continuar después de canjear el código. */
export async function completeAuthCallback(params: URLSearchParams): Promise<string> {
  const providerError = params.get('error');
  if (providerError) {
    const description = params.get('error_code') ?? '';
    if (providerError === 'access_denied' && !/otp|expired/i.test(description)) {
      return '/login?aviso=microsoft-cancelado';
    }
    return /otp|expired/i.test(description)
      ? '/login?aviso=enlace-caducado'
      : '/login?aviso=microsoft-error';
  }
  const code = params.get('code');
  if (!code || code.length > 512) return '/login?aviso=enlace-caducado';
  const supabase = await authClient();
  if (!supabase) return '/login?aviso=no-disponible';
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return '/login?aviso=enlace-caducado';
  await setSessionHint(true);
  return safeNextPath(params.get('next'));
}
