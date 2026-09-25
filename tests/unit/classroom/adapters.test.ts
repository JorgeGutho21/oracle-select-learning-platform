// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { publicUrlFromEnvironment, resolvePublicBaseUrl } from '@/application/public-url';
import { uuidV4 } from '@/composition/classroom/client-support';
import {
  classroomBackend,
  publicRealtimeConfig,
} from '@/features/classroom/infrastructure/classroom-config';
import { EnvPresenterGate, nodeSecrets } from '@/features/classroom/infrastructure/node-secrets';
import {
  roomChannel,
  SupabaseBroadcastNotifier,
} from '@/features/classroom/infrastructure/notifiers';
import { SupabaseClassroomRepository } from '@/features/classroom/infrastructure/supabase-classroom-repository';

describe('URL pública para el QR', () => {
  it('prefiere la dirección configurada, después la vista previa y por último el origen', () => {
    expect(
      resolvePublicBaseUrl({
        configured: 'https://sql.ejemplo.edu/ruta/',
        preview: 'app-git.vercel.app',
        currentOrigin: 'http://localhost:3000',
      }),
    ).toEqual({ url: 'https://sql.ejemplo.edu', source: 'configured', isLocal: false });
    expect(
      resolvePublicBaseUrl({
        preview: 'app-git.vercel.app',
        currentOrigin: 'http://localhost:3000',
      }),
    ).toEqual({ url: 'https://app-git.vercel.app', source: 'preview', isLocal: false });
    expect(resolvePublicBaseUrl({ currentOrigin: 'http://192.168.1.20:3000' })).toEqual({
      url: 'http://192.168.1.20:3000',
      source: 'current-origin',
      isLocal: false,
    });
  });

  it('en producción usa el dominio de producción antes que la URL protegida del despliegue', () => {
    expect(
      resolvePublicBaseUrl({
        production: 'sql-select-lab.vercel.app',
        preview: 'sql-select-abc123-equipo.vercel.app',
      }),
    ).toEqual({ url: 'https://sql-select-lab.vercel.app', source: 'production', isLocal: false });
    expect(
      resolvePublicBaseUrl({
        configured: 'https://sql.ejemplo.edu',
        production: 'sql-select-lab.vercel.app',
      }).source,
    ).toBe('configured');
  });

  it('solo toma el dominio de producción de Vercel en despliegues de producción', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', 'sql-select-lab.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'sql-select-abc123-equipo.vercel.app');
    try {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
      expect(publicUrlFromEnvironment().url).toBe('https://sql-select-lab.vercel.app');
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
      expect(publicUrlFromEnvironment().url).toBe('https://sql-select-abc123-equipo.vercel.app');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('marca como local 127.0.0.1 y localhost, e ignora valores mal formados', () => {
    expect(resolvePublicBaseUrl({ currentOrigin: 'http://127.0.0.1:3200' }).isLocal).toBe(true);
    expect(resolvePublicBaseUrl({ configured: 'http://localhost:3000' })).toMatchObject({
      source: 'configured',
      isLocal: true,
    });
    expect(resolvePublicBaseUrl({ configured: 'sin-esquema', currentOrigin: '' })).toEqual({
      url: null,
      source: 'none',
      isLocal: false,
    });
  });
});

describe('configuración del servidor', () => {
  it('elige Supabase solo con URL y clave de servicio; memoria solo si se pide', () => {
    expect(classroomBackend({})).toEqual({ kind: 'unconfigured' });
    expect(classroomBackend({ SUPABASE_URL: 'https://x.supabase.co' })).toEqual({
      kind: 'unconfigured',
    });
    expect(
      classroomBackend({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' }),
    ).toEqual({ kind: 'supabase', url: 'https://x.supabase.co', serviceRoleKey: 'k' });
    expect(
      classroomBackend({
        CLASSROOM_BACKEND: 'memory',
        SUPABASE_URL: 'https://x.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'k',
      }),
    ).toEqual({ kind: 'memory' });
    expect(
      classroomBackend({
        CLASSROOM_BACKEND: 'otro',
        SUPABASE_URL: 'u',
        SUPABASE_SERVICE_ROLE_KEY: 'k',
      }),
    ).toEqual({
      kind: 'unconfigured',
    });
  });

  it('el navegador solo recibe la URL y la clave anónima pública', () => {
    expect(publicRealtimeConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(
      publicRealtimeConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'secreta',
      }),
    ).toEqual({ url: 'https://x.supabase.co', anonKey: 'anon' });
  });
});

describe('secretos y clave del profesor', () => {
  it('genera tokens de 256 bits y huellas SHA-256', () => {
    const token = nodeSecrets.randomToken();
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(nodeSecrets.randomToken()).not.toBe(token);
    expect(nodeSecrets.hash('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('sin clave configurada no se crean salas; con clave, compara exactamente', () => {
    expect(new EnvPresenterGate(undefined).configured).toBe(false);
    expect(new EnvPresenterGate('   ').configured).toBe(false);
    expect(new EnvPresenterGate(undefined).verify('')).toBe(false);
    const gate = new EnvPresenterGate('clave');
    expect(gate.verify('clave')).toBe(true);
    expect(gate.verify(' clave ')).toBe(true);
    expect(gate.verify('Clave')).toBe(false);
    expect(gate.verify('')).toBe(false);
  });
});

describe('aviso en tiempo real', () => {
  it('el servidor publica solo la revisión en el canal de la sala', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 202 }));
    await new SupabaseBroadcastNotifier('https://x.supabase.co/', 'servicio', fetcher).notify(
      'sala-1',
      7,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/realtime/v1/api/broadcast');
    expect(JSON.parse(String(init.body))).toEqual({
      messages: [{ topic: roomChannel('sala-1'), event: 'revision', payload: { revision: 7 } }],
    });
  });
});

describe('repositorio Supabase', () => {
  it('no reenvía el mensaje de la base y valida lo que devuelve', async () => {
    const failing = new SupabaseClassroomRepository({
      rpc: async () => ({ data: null, error: { message: 'relation "rooms" secret detail' } }),
    });
    await expect(failing.findRoomByCode('AB3K9X')).rejects.toThrow(
      'La base de la sala no respondió (classroom_find_room_by_code).',
    );
    const malformed = new SupabaseClassroomRepository({
      rpc: async () => ({ data: { id: 1 }, error: null }),
    });
    await expect(malformed.findRoomByCode('AB3K9X')).rejects.toThrow();
  });

  it('envía instantes ISO y los estados de origen como lista', async () => {
    const rpc = vi.fn(async () => ({ data: { status: 'empty' }, error: null }));
    await new SupabaseClassroomRepository({ rpc }).transitionRoom({
      roomId: 'sala',
      from: ['lobby', 'running'],
      to: 'cancelled',
      requireParticipants: false,
      now: Date.UTC(2026, 8, 24, 13),
    });
    expect(rpc).toHaveBeenCalledWith('classroom_transition', {
      p_room_id: 'sala',
      p_from: ['lobby', 'running'],
      p_to: 'cancelled',
      p_require_participants: false,
      p_now: '2026-09-24T13:00:00.000Z',
    });
  });
});

describe('identificador de envío', () => {
  it('genera UUID v4 válidos sin depender de un contexto seguro', () => {
    const ids = new Set(Array.from({ length: 50 }, uuidV4));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
});
