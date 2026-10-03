// @vitest-environment node
import { writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  exampleHash,
  VERIFIED,
  type VerifiedResult,
} from '@/features/curriculum/application/verified-results';
import { ALL_EXAMPLES } from '@/features/curriculum/domain/registry';
import { ORACLE_CURRICULUM_CONFIGURED, OracleCurriculumRunner } from '../support/oracle-curriculum';

/**
 * Oracle real para el currículo (ORACLE_VALIDATION.md). Ejecuta cada ejemplo de las tres
 * secciones —consultas, bloques PL/SQL, procedimientos, funciones, paquetes y triggers— y
 * compara lo que Oracle devuelve con `application/oracle-results.json`, que es lo que muestra la
 * interfaz. Con CURRICULUM_UPDATE=1 reescribe ese archivo con la respuesta de Oracle.
 *
 * Sin el esquema de verificación (npm run oracle:setup) se omite: ORACLE REAL = NOT TESTED.
 */

const UPDATE = process.env.CURRICULUM_UPDATE === '1';
const FILE = 'src/features/curriculum/application/oracle-results.json';

/** Números decimales: misma cifra con tolerancia relativa mínima (Oracle da 38 dígitos). */
function normalize(result: VerifiedResult): unknown {
  return JSON.parse(
    JSON.stringify(result, (_key, value: unknown) =>
      typeof value === 'number' && !Number.isInteger(value) ? Number(value.toPrecision(12)) : value,
    ),
  );
}

describe.skipIf(!ORACLE_CURRICULUM_CONFIGURED)('Oracle real · currículo de DB LAB', () => {
  let runner: OracleCurriculumRunner;
  const produced: Record<string, VerifiedResult> = {};

  beforeAll(async () => {
    runner = await OracleCurriculumRunner.open();
  }, 60_000);

  afterAll(async () => {
    if (UPDATE && runner) {
      const ordered = Object.fromEntries(
        ALL_EXAMPLES.map((example) => [example.id, produced[example.id]]).filter(
          ([, result]) => result !== undefined,
        ),
      );
      // Una línea por ejemplo: diferencias legibles en Git sin un archivo enorme.
      const lines = Object.entries(ordered).map(
        ([id, result]) => `  ${JSON.stringify(id)}: ${JSON.stringify(result)}`,
      );
      writeFileSync(
        FILE,
        `{\n "engine": ${JSON.stringify(runner.engine)},\n "verifiedAt": ${JSON.stringify(
          new Date().toISOString().slice(0, 10),
        )},\n "results": {\n${lines.join(',\n')}\n }\n}\n`,
      );
    }
    await runner?.close();
  }, 60_000);

  it.each(ALL_EXAMPLES.map((example) => [example.id, example] as const))(
    '%s',
    async (_id, example) => {
      const result = await runner.run(example);
      produced[example.id] = result;
      if (example.expectError) {
        const code = result.kind === 'plsql' ? result.error?.code : undefined;
        const queryCode = result.kind === 'query-error' ? result.code : undefined;
        expect(code ?? queryCode, `${example.id} debe fallar en Oracle`).toBe(example.expectError);
      } else {
        expect(result.kind, `${example.id} no debe fallar en Oracle`).not.toBe('query-error');
        if (result.kind === 'plsql') expect(result.error, example.id).toBeNull();
      }
      if (example.kind === 'plsql' && example.trace && result.kind === 'plsql') {
        const traced = example.trace.flatMap((step) => (step.output ? [step.output] : []));
        expect(traced, `${example.id}: el recorrido debe imprimir lo mismo que Oracle`).toEqual(
          result.output,
        );
      }
      if (!UPDATE) {
        const stored = VERIFIED.results[example.id];
        expect(stored?.hash, `${example.id}: falta verificar en Oracle`).toBe(exampleHash(example));
        expect(normalize(result)).toEqual(normalize(stored!));
      }
    },
    30_000,
  );
});
