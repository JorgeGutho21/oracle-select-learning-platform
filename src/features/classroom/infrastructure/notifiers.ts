import type { RoomNotifier } from '../application/ports';

/** Sin tiempo real: los clientes consultan la sala periódicamente. */
export const pollingOnlyNotifier: RoomNotifier = {
  notify: async () => undefined,
};

export function roomChannel(roomId: string): string {
  return `classroom:${roomId}`;
}

/**
 * Aviso por Supabase Realtime Broadcast desde el servidor. El mensaje solo contiene la
 * revisión: cada cliente pide después su propia vista autorizada. Si el aviso falla, la
 * consulta periódica mantiene la sala al día.
 */
export class SupabaseBroadcastNotifier implements RoomNotifier {
  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async notify(roomId: string, revision: number): Promise<void> {
    await this.fetcher(`${this.url.replace(/\/$/, '')}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ topic: roomChannel(roomId), event: 'revision', payload: { revision } }],
      }),
      signal: AbortSignal.timeout(2000),
    });
  }
}
