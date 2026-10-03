export type MonitorChannelStatus = 'connected' | 'connecting' | 'disconnected';

export interface MonitorSubscription {
  close(): void;
}

/**
 * Avisos del monitor por Supabase Realtime («broadcast from database»). El aviso no trae
 * datos: el panel vuelve a pedir su vista autorizada al servidor. Solo el profesor conoce
 * el canal (lleva una clave aleatoria por evaluación). La biblioteca se descarga solo en
 * esta pantalla.
 */
export async function subscribeToMonitor(
  config: { readonly url: string; readonly anonKey: string },
  topic: string,
  onSignal: () => void,
  onStatus: (status: MonitorChannelStatus) => void,
): Promise<MonitorSubscription> {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  onStatus('connecting');
  const channel = client
    .channel(topic)
    .on('broadcast', { event: 'changed' }, () => onSignal())
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
