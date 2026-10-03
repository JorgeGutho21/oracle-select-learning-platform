import type { SectionId } from '@/features/sections/domain/sections';
import type { OfficialQuestion } from './bank-builders';
import { FUNDAMENTOS_SQL_BANK } from './fundamentos-sql';

export type { BankCheck, OfficialQuestion } from './bank-builders';

/**
 * Banco oficial de DB LAB por sección. Las secciones 2 y 3 todavía no tienen contenido
 * académico publicado (su plan está en features/sections); el profesor puede crear
 * preguntas propias para ellas desde el panel.
 */
export const OFFICIAL_BANK: Readonly<Record<SectionId, readonly OfficialQuestion[]>> = {
  'fundamentos-sql': FUNDAMENTOS_SQL_BANK,
  'consultas-relacionales': [],
  plsql: [],
};

/** Meta del banco por sección (docs/QUESTION_BANK_SPEC.md). */
export const BANK_TARGET_PER_SECTION = 50;
