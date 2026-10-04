export type { BankCheck, OfficialQuestion } from './bank-builders';
export { FUNDAMENTOS_SQL_BANK } from './fundamentos-sql';

/**
 * Meta del banco por sección (docs/QUESTION_BANK_SPEC.md). El banco completo de las tres
 * secciones se arma en `application/official-bank.ts`: las secciones 2 y 3 necesitan los
 * resultados verificados en Oracle de la fuente curricular.
 */
export const BANK_TARGET_PER_SECTION = 50;
