import { exportResponse } from '@/composition/assessments/export-response';

/** Exportación de resultados en CSV (solo profesor). */
export async function GET(request: Request, ctx: RouteContext<'/teacher/assessments/[id]/export'>) {
  const { id } = await ctx.params;
  return exportResponse(id, new URL(request.url));
}
