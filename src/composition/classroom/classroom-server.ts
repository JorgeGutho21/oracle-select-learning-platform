import 'server-only';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { ClassroomService } from '@/features/classroom/application/classroom-service';
import type { ClassroomRepository, RoomNotifier } from '@/features/classroom/application/ports';
import {
  classroomBackend,
  publicRealtimeConfig,
  type ClassroomBackend,
} from '@/features/classroom/infrastructure/classroom-config';
import { MemoryClassroomRepository } from '@/features/classroom/infrastructure/memory-classroom-repository';
import { EnvPresenterGate, nodeSecrets } from '@/features/classroom/infrastructure/node-secrets';
import {
  pollingOnlyNotifier,
  SupabaseBroadcastNotifier,
} from '@/features/classroom/infrastructure/notifiers';
import { SupabaseClassroomRepository } from '@/features/classroom/infrastructure/supabase-classroom-repository';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import { oracleExecutor } from '../oracle/oracle-server';

/**
 * Raíz de composición de la sala en vivo (solo servidor). La clave de servicio de Supabase
 * se lee aquí y nunca se envía al navegador.
 */

export type ClassroomAvailability = {
  readonly backend: ClassroomBackend['kind'];
  readonly presenterAccess: boolean;
  readonly realtime: { readonly url: string; readonly anonKey: string } | null;
};

interface ClassroomRuntime {
  readonly service: ClassroomService | null;
  readonly availability: ClassroomAvailability;
}

// La memoria se conserva entre recargas del módulo en desarrollo.
const store = globalThis as typeof globalThis & {
  __sqlSelectLabMemoryRoom?: MemoryClassroomRepository;
};

function memoryRepository(): MemoryClassroomRepository {
  store.__sqlSelectLabMemoryRoom ??= new MemoryClassroomRepository(randomUUID);
  return store.__sqlSelectLabMemoryRoom;
}

let runtime: ClassroomRuntime | null = null;

export function classroomRuntime(): ClassroomRuntime {
  if (runtime) return runtime;
  const backend = classroomBackend(process.env);
  const gate = new EnvPresenterGate(process.env.PRESENTER_ACCESS_CODE);
  let repository: ClassroomRepository | null = null;
  let notifier: RoomNotifier = pollingOnlyNotifier;
  if (backend.kind === 'memory') {
    repository = memoryRepository();
  } else if (backend.kind === 'supabase') {
    const client = createClient(backend.url, backend.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    repository = new SupabaseClassroomRepository({
      rpc: (fn, params) => client.rpc(fn, params),
    });
    notifier = new SupabaseBroadcastNotifier(backend.url, backend.serviceRoleKey);
  }
  const realtime = backend.kind === 'supabase' ? publicRealtimeConfig(process.env) : null;
  runtime = {
    service: repository
      ? new ClassroomService({
          repository,
          // El mismo evaluador del Challenge individual: una sola definición de corrección.
          evaluator: new InProcessMissionEvaluator(oracleExecutor()),
          notifier,
          presenterGate: gate,
          secrets: nodeSecrets,
          clock: { now: () => Date.now() },
        })
      : null,
    availability: { backend: backend.kind, presenterAccess: gate.configured, realtime },
  };
  return runtime;
}
