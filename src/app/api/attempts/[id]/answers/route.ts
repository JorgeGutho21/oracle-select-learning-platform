import { saveAnswersResponse } from '@/composition/assessments/attempt-api';

/** Autoguardado por lotes con revisión por pregunta. */
export async function POST(request: Request, ctx: RouteContext<'/api/attempts/[id]/answers'>) {
  const { id } = await ctx.params;
  return saveAnswersResponse(request, id);
}
