import { Alert } from '@/presentation/components/ui';
import type { PublicMission } from '../../application/challenge-api';

/**
 * M10: requiere ejecución real en Oracle (LAB_SPEC). Sin el servicio, la misión queda
 * bloqueada y no se simula su corrección (AGENTS.md).
 */
export function LockedQueryInteraction({ mission }: { mission: PublicMission<'write-query'> }) {
  return (
    <Alert tone="warning" title="Misión pendiente del servicio Oracle">
      <p>{mission.publicData.requirement}</p>
      <p>
        El laboratorio todavía no está conectado a Oracle, así que esta misión no se puede corregir.
        No se muestran resultados simulados ni se consumen intentos.
      </p>
    </Alert>
  );
}
