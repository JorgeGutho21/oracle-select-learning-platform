import { Chip } from '@/presentation/components/ui/chip';
import type { OracleServiceStatus } from '../application/lab-api';

/** Comprobación real al abrir el laboratorio; cada consulta devuelve su resultado o su propio error. */
export function OracleConnectionStatus({ status }: { status: OracleServiceStatus | null }) {
  return (
    <div
      className="lab-oracle-status"
      data-oracle-status={
        status === null ? 'checking' : status.available ? 'available' : 'unavailable'
      }
    >
      <div className="lab-result__heading">
        <h3>Ejecución en Oracle</h3>
        <Chip
          tone={status?.available ? 'success' : 'neutral'}
          title="Comprobación al abrir el laboratorio"
        >
          {status === null ? 'Comprobando…' : status.available ? 'Conectado' : 'No conectado'}
        </Chip>
      </div>
      {status && !status.available && <p className="lab-muted">{status.message}</p>}
    </div>
  );
}
