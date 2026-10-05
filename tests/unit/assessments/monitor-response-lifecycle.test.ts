import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyAssessmentMonitor } from '@/composition/assessments/monitor-server';

const transport = vi.hoisted(() => ({
  tasks: [] as (() => Promise<void>)[],
  write: vi.fn<(...args: unknown[]) => Promise<void>>(),
}));

vi.mock('next/server', () => ({
  after: (task: () => Promise<void>) => transport.tasks.push(task),
}));
vi.mock('@/features/assessments/infrastructure/monitor-notifier', () => ({
  notifyConfirmedMonitorWrite: transport.write,
}));

const url = 'https://monitor-unit.supabase.invalid';
const target = { kind: 'assessment' as const, id: '95bab0dc-2223-4e7c-9832-1e40ed9cf95d' };

beforeEach(() => {
  transport.tasks.length = 0;
  transport.write.mockReset();
  vi.stubEnv('SUPABASE_URL', url);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
  vi.stubEnv('SUPABASE_SECRET_KEY', 'monitor-unit-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('respuesta de una escritura confirmada y aviso del monitor', () => {
  it('permite responder aunque el transporte del aviso siga pendiente y lo ejecuta después', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    transport.write.mockReturnValue(pending);
    let returned = false;
    const scheduling = notifyAssessmentMonitor(target, 'updated').then(() => {
      returned = true;
    });
    try {
      await vi.waitFor(() => expect(returned).toBe(true), { timeout: 250, interval: 10 });
      expect(transport.write).not.toHaveBeenCalled();
      expect(transport.tasks).toHaveLength(1);
      const delivery = transport.tasks[0]!();
      expect(transport.write).toHaveBeenCalledWith(
        { url, secretKey: 'monitor-unit-key' },
        target,
        'updated',
      );
      release();
      await delivery;
    } finally {
      release();
      await scheduling;
    }
  });

  it.each(['missing-url', 'missing-key', 'different-project'] as const)(
    'no programa lecturas administrativas con %s',
    async (configuration) => {
      if (configuration === 'missing-url') vi.stubEnv('SUPABASE_URL', '');
      if (configuration === 'missing-key') vi.stubEnv('SUPABASE_SECRET_KEY', '');
      if (configuration === 'different-project')
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://other-unit.supabase.invalid');
      await notifyAssessmentMonitor(target, 'updated');
      expect(transport.tasks).toHaveLength(0);
      expect(transport.write).not.toHaveBeenCalled();
    },
  );
});
