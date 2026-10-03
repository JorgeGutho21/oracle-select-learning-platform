import { submitAttemptResponse } from '@/composition/assessments/attempt-api';

/** Entrega (idempotente): la base califica y un segundo envío no cambia nada. */
export async function POST(request: Request, ctx: RouteContext<'/api/attempts/[id]/submit'>) {
  const { id } = await ctx.params;
  return submitAttemptResponse(request, id);
}
