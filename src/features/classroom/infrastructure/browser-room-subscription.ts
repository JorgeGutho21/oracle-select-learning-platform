import { roomChannel } from './notifiers';

export type RoomSubscriptionStatus = 'connected' | 'connecting' | 'disconnected';

export interface RoomSubscription {
  close(): void;
}

/**
 * Escucha avisos de revisión por Supabase Realtime Broadcast. La biblioteca se descarga
 * solo en las pantallas de sala; sin configuración pública, el cliente consulta por tiempo.
 */
export async function subscribeToRoom(
  config: { readonly url: string; readonly anonKey: string },
  roomId: string,
  onRevision: (revision: number) => void,
  onStatus: (status: RoomSubscriptionStatus) => void,
): Promise<RoomSubscription> {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  onStatus('connecting');
  const channel = client
    .channel(roomChannel(roomId))
    .on('broadcast', { event: 'revision' }, ({ payload }) => {
      const revision = Number((payload as { revision?: unknown } | undefined)?.revision);
      if (Number.isInteger(revision)) onRevision(revision);
    })
    .subscribe((status) => {
      onStatus(
        status === 'SUBSCRIBED'
          ? 'connected'
          : status === 'CLOSED'
            ? 'disconnected'
            : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'
              ? 'disconnected'
              : 'connecting',
      );
    });
  return {
    close: () => {
      void client.removeChannel(channel);
    },
  };
}
