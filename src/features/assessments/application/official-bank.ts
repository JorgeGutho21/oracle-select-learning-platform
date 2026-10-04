import type { SectionId } from '@/features/sections/domain/sections';
import type { OfficialQuestion } from '../domain/bank/bank-builders';
import { FUNDAMENTOS_SQL_BANK } from '../domain/bank/fundamentos-sql';
import { CONSULTAS_RELACIONALES_BANK } from './bank/consultas-relacionales';
import { PLSQL_BANK } from './bank/plsql';

export type { BankCheck, OfficialQuestion } from '../domain/bank/bank-builders';
export { BANK_TARGET_PER_SECTION } from '../domain/bank';

/**
 * Banco oficial de DB LAB por sección (QUESTION_BANK_SPEC). La Sección 1 se comprueba con el
 * motor educativo y con Oracle; las secciones 2 y 3 toman cada resultado de ejemplos
 * ejecutados en Oracle (fuente curricular). Solo lo usa el servidor: las respuestas correctas
 * nunca viajan al navegador durante un intento.
 */
export const OFFICIAL_BANK: Readonly<Record<SectionId, readonly OfficialQuestion[]>> = {
  'fundamentos-sql': FUNDAMENTOS_SQL_BANK,
  'consultas-relacionales': CONSULTAS_RELACIONALES_BANK,
  plsql: PLSQL_BANK,
};
