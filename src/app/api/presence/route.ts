import { reportPresence } from '@/composition/accounts/account-api';

/** Señal lenta de «conectado» con la zona general de la plataforma. */
export async function POST(request: Request) {
  return reportPresence(request);
}
