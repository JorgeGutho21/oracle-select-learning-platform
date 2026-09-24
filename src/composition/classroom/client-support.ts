import type { RoomSubscriber } from '@/features/classroom/presentation/use-room-sync';

/** Configuración pública del aviso en tiempo real; `null` usa solo consultas periódicas. */
export type RealtimeConfig = { readonly url: string; readonly anonKey: string } | null;

/** Crea el suscriptor de avisos; la biblioteca de Supabase se descarga solo si hace falta. */
export function roomSubscriber(config: RealtimeConfig): RoomSubscriber | undefined {
  if (!config) return undefined;
  return async (roomId, onRevision, onStatus) => {
    const { subscribeToRoom } =
      await import('@/features/classroom/infrastructure/browser-room-subscription');
    return subscribeToRoom(config, roomId, onRevision, onStatus);
  };
}

/**
 * UUID v4 con `getRandomValues`: `crypto.randomUUID` solo existe en contextos seguros y la
 * sala local puede abrirse por http en la red del aula.
 */
export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
