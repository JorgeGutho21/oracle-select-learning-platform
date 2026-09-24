import type { Clock, IdGenerator } from '../application/ports';

export const systemClock: Clock = { now: () => Date.now() };

export const randomIdGenerator: IdGenerator = {
  next: () =>
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `practice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
};
