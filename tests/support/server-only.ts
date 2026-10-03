// En Next, `server-only` hace fallar el build si un módulo de servidor llega al cliente.
// Vitest ejecuta en Node: el mismo import resuelve a este módulo vacío.
export {};
