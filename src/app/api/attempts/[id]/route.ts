import { attemptViewResponse } from '@/composition/assessments/attempt-api';

/** Intento de la persona: preguntas sin clave (abierto) o resultado liberado (entregado). */
export async function GET(_request: Request, ctx: RouteContext<'/api/attempts/[id]'>) {
  const { id } = await ctx.params;
  return attemptViewResponse(id);
}
