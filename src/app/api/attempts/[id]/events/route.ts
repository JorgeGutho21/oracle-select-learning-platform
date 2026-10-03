import { attemptEventsResponse } from '@/composition/assessments/attempt-api';

/** Eventos de supervisión agrupados y señal de conexión del examen. */
export async function POST(request: Request, ctx: RouteContext<'/api/attempts/[id]/events'>) {
  const { id } = await ctx.params;
  return attemptEventsResponse(request, id);
}
