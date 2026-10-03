import { sessionResponse } from '@/composition/accounts/account-api';

/** Cuenta de la sesión actual para el menú de usuario (sin tokens ni datos ajenos). */
export async function GET() {
  return sessionResponse();
}
