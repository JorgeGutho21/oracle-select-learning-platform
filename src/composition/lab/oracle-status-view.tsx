import 'server-only';
import { Suspense } from 'react';
import { OracleConnectionStatus } from '@/features/laboratory/presentation/oracle-connection-status';
import { publicOracleStatus } from './oracle-status-api';

async function ResolvedOracleStatus() {
  const { status } = await publicOracleStatus();
  return <OracleConnectionStatus status={status} />;
}

/** El servidor entrega el estado sin una petición automática del navegador al endpoint de salud. */
export function OracleStatusView() {
  return (
    <Suspense fallback={<OracleConnectionStatus status={null} />}>
      <ResolvedOracleStatus />
    </Suspense>
  );
}
