import { existsSync } from 'node:fs';

/**
 * ¿El servidor de pruebas tiene Oracle? Mismo criterio que el servidor: `next start` carga
 * `.env.local` sin pisar variables ya definidas. Para probar sin Oracle aunque exista
 * `.env.local`: `ORACLE_USER= ORACLE_PASSWORD= ORACLE_CONNECT_STRING= npm run test:e2e`.
 */
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export const ORACLE_CONFIGURED = Boolean(
  process.env.ORACLE_USER && process.env.ORACLE_PASSWORD && process.env.ORACLE_CONNECT_STRING,
);
