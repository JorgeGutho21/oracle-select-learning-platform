import { deleteProgress, readProgress, writeProgress } from '@/composition/accounts/account-api';

/** Progreso de la persona autenticada: leer, subir (fusión monótona) y reiniciar un modo. */
export async function GET() {
  return readProgress();
}

export async function POST(request: Request) {
  return writeProgress(request);
}

export async function DELETE(request: Request) {
  return deleteProgress(request);
}
