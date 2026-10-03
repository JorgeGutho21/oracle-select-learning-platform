import { beforeEach, describe, expect, it, vi } from 'vitest';

const address = { value: '200.1.1.1' };
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': address.value }),
}));

const { allowAttempt } = await import('@/composition/accounts/attempt-limiter');

describe('Límite de intentos de cuenta', () => {
  beforeEach(() => {
    address.value = `200.1.1.${Math.floor(Math.random() * 250)}`;
  });

  it('frena probar contraseñas contra una misma cuenta', async () => {
    const now = 1_000_000;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await allowAttempt('sign-in', 'ana@uni.edu', now)).toBe(true);
    }
    expect(await allowAttempt('sign-in', 'ana@uni.edu', now)).toBe(false);
    // Pasada la ventana, vuelve a permitir.
    expect(await allowAttempt('sign-in', 'ana@uni.edu', now + 11 * 60 * 1000)).toBe(true);
  });

  it('no bloquea a un salón completo detrás de la misma IP del campus', async () => {
    const now = 2_000_000;
    for (let student = 0; student < 80; student += 1) {
      expect(await allowAttempt('sign-in', `estudiante${student}@uni.edu`, now)).toBe(true);
    }
  });
});
