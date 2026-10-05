import 'server-only';
import { after } from 'next/server';
import {
  notifyConfirmedMonitorWrite,
  type MonitorTarget,
} from '@/features/assessments/infrastructure/monitor-notifier';

/**
 * Se llama después de la RPC; el transporte rechaza estados de denegación y
 * entradas inválidas antes de leer con privilegios. Programa el aviso al terminar
 * la respuesta: el guardado no espera las dos peticiones REST opcionales.
 * Next mantiene viva la invocación; el transporte conserva sus plazos y guardas.
 */
export async function notifyAssessmentMonitor(
  target: MonitorTarget,
  status: unknown,
): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  // No mezclar la sesión de un proyecto de QA con las credenciales de otro entorno.
  if (url && secretKey && url === process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
    after(() => notifyConfirmedMonitorWrite({ url, secretKey }, target, status));
}
