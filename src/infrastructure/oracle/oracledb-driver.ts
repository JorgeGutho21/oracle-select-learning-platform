import type { OracleDriver } from './oracledb-query-executor';

/**
 * Carga diferida del driver oficial node-oracledb (modo Thin, sin Oracle Client). Solo se
 * importa en el servidor y la primera vez que se usa Oracle.
 */
export async function loadOracledb(): Promise<OracleDriver> {
  const loaded = (await import('oracledb')) as { default?: unknown };
  return (loaded.default ?? loaded) as OracleDriver;
}
