import type { Route } from 'next';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { completeAuthCallback } from '@/composition/accounts/auth-callback';

/**
 * Vuelta de Microsoft (OAuth con PKCE) y de los enlaces de correo con el formato por
 * defecto de Supabase: canjea el código por una sesión en cookies httpOnly.
 */
export async function GET(request: NextRequest) {
  redirect((await completeAuthCallback(request.nextUrl.searchParams)) as Route);
}
