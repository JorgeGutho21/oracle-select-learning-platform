import 'server-only';
import {
  notifyConfirmedMonitorWrite,
  type MonitorTarget,
} from '@/features/assessments/infrastructure/monitor-notifier';

/** Solo se llama después de que la RPC con la sesión haya autorizado la escritura. */
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
    await notifyConfirmedMonitorWrite({ url, secretKey }, target, status);
}
