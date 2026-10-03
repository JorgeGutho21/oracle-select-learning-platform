// Ejecuta un comando con la cuenta lectora de Oracle Cloud (.env.oracle.local, variables
// ORACLE_CLOUD_* que escribe `node scripts/oracle-cloud.mjs setup`) en lugar de la local.
// Las variables del proceso tienen prioridad sobre .env.local en Next y en las pruebas.
//   node scripts/with-oracle-cloud.mjs npx vitest run tests/integration/oracle-real.test.ts
// No imprime ningún valor.

import { spawn } from 'node:child_process';
import { readEnv } from './oracle-common.mjs';

const cloud = readEnv('.env.oracle.local');
const mapping = {
  ORACLE_USER: 'ORACLE_CLOUD_USER',
  ORACLE_PASSWORD: 'ORACLE_CLOUD_PASSWORD',
  ORACLE_CONNECT_STRING: 'ORACLE_CLOUD_CONNECT_STRING',
  ORACLE_SCHEMA: 'ORACLE_CLOUD_SCHEMA',
  ORACLE_WALLET_PEM_BASE64: 'ORACLE_CLOUD_WALLET_PEM_BASE64',
  ORACLE_WALLET_PASSWORD: 'ORACLE_CLOUD_WALLET_PASSWORD',
};
const env = { ...process.env };
for (const [target, source] of Object.entries(mapping)) {
  const value = cloud.get(source);
  if (!value) {
    console.error(
      `Falta ${source} en .env.oracle.local: ejecuta node scripts/oracle-cloud.mjs setup.`,
    );
    process.exit(1);
  }
  env[target] = value;
}
const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Uso: node scripts/with-oracle-cloud.mjs <comando> [argumentos]');
  process.exit(1);
}
const child = spawn(command, args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 1));
