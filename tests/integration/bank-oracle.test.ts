// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { BankCheck } from '@/features/assessments/domain/bank/bank-builders';
import { FUNDAMENTOS_SQL_BANK } from '@/features/assessments/domain/bank/fundamentos-sql';
import type { QueryExample } from '@/features/curriculum/domain/types';
import type { VerifiedResult } from '@/features/curriculum/application/verified-results';
import { ORACLE_CURRICULUM_CONFIGURED, OracleCurriculumRunner } from '../support/oracle-curriculum';

/**
 * Banco oficial en Oracle real (QUESTION_BANK_SPEC, ORACLE_VALIDATION). Las comprobaciones
 * (`checks`) de cada pregunta de la Sección 1 se escribieron contra el motor educativo; aquí
 * se ejecutan en Oracle sobre empleados-select-v2 con la cuenta lectora y deben dar lo mismo.
 * Sin Oracle configurado se omite (NOT TESTED), nunca se da por superada.
 */

let runner: OracleCurriculumRunner;

function asExample(sql: string, ids?: readonly number[]): QueryExample {
  // Con `ids`, la consulta se evalúa sobre ese subconjunto de filas (como en el banco).
  const restricted = ids
    ? sql.replace(
        /\bFROM\s+EMPLEADOS\b/i,
        `FROM (SELECT * FROM EMPLEADOS WHERE ID_EMPLEADO IN (${ids.join(', ')})) EMPLEADOS`,
      )
    : sql;
  return { id: 'bank-check', kind: 'query', dataset: 'empleados-v2', sql: restricted, sources: [] };
}

async function run(sql: string, ids?: readonly number[]): Promise<VerifiedResult> {
  return runner.runQuery(asExample(sql, ids));
}

function rowsOf(result: VerifiedResult): string {
  return result.kind === 'query' ? JSON.stringify(result.table.rows) : 'ERROR';
}

const S1_CHECKS = FUNDAMENTOS_SQL_BANK.flatMap((question) =>
  (question.checks ?? []).map((check, index) => [`${question.key} #${index + 1}`, check] as const),
);

describe.skipIf(!ORACLE_CURRICULUM_CONFIGURED)('Oracle real · banco oficial', () => {
  beforeAll(async () => {
    // Solo la cuenta lectora: no toca el esquema que recrea curriculum-oracle.test.ts.
    runner = await OracleCurriculumRunner.open({ resetDataset: false });
  }, 120_000);

  afterAll(async () => {
    await runner?.close();
  });

  it('la Sección 1 tiene comprobaciones que ejecutar', () => {
    expect(S1_CHECKS.length).toBeGreaterThanOrEqual(40);
  });

  it.each(S1_CHECKS)('%s: comprobado en Oracle', async (_label, check: BankCheck) => {
    switch (check.kind) {
      case 'rows': {
        const result = await run(check.sql, check.ids);
        expect(result.kind, `${check.sql}: ${JSON.stringify(result)}`).toBe('query');
        if (result.kind === 'query') expect(result.table.rows.length, check.sql).toBe(check.rows);
        break;
      }
      case 'error':
        expect((await run(check.sql)).kind, check.sql).toBe('query-error');
        break;
      case 'valid':
        expect((await run(check.sql)).kind, check.sql).toBe('query');
        break;
      case 'columns': {
        const result = await run(check.sql);
        expect(result.kind, check.sql).toBe('query');
        if (result.kind === 'query') {
          expect(
            result.table.columns.map(({ name }) => name),
            check.sql,
          ).toEqual(check.columns);
        }
        break;
      }
      case 'same': {
        const target = await run(check.target);
        expect(target.kind, check.target).toBe('query');
        const result = await run(check.sql);
        const same = result.kind === 'query' && rowsOf(result) === rowsOf(target);
        expect(same, check.sql).toBe(check.expected);
        break;
      }
    }
  });
});
