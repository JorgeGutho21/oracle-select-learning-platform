import type { CellValue, ColumnType } from '@/domain/dataset/empleados';
import type { CurriculumExample } from '../domain/types';
import verified from './oracle-results.json';

/**
 * Resultados que Oracle devolvió para cada ejemplo del currículo. Los escribe la prueba de
 * integración con Oracle real (`CURRICULUM_UPDATE=1`) y se versionan con el contenido: la
 * interfaz los muestra como «verificado en Oracle», nunca como una ejecución en vivo. Cada
 * resultado lleva la huella del código que lo produjo; si el código cambia sin volver a
 * ejecutarlo en Oracle, las pruebas fallan.
 */

export interface VerifiedColumn {
  readonly name: string;
  readonly type: ColumnType;
}

export interface VerifiedTable {
  readonly columns: readonly VerifiedColumn[];
  readonly rows: readonly (readonly CellValue[])[];
}

export interface OracleErrorText {
  /** Código más específico: PLS-xxxxx si lo hay; si no, ORA-xxxxx. */
  readonly code: string;
  /** Mensaje de Oracle tal como lo devolvió (hasta cuatro líneas). */
  readonly message: string;
}

export type VerifiedResult =
  | { readonly kind: 'query'; readonly hash: string; readonly table: VerifiedTable }
  | ({ readonly kind: 'query-error'; readonly hash: string } & OracleErrorText)
  | {
      readonly kind: 'plsql';
      readonly hash: string;
      readonly output: readonly string[];
      readonly before: readonly VerifiedTable[];
      readonly after: readonly VerifiedTable[];
      readonly error: OracleErrorText | null;
    };

export interface VerifiedResults {
  /** Motor que produjo los resultados, por ejemplo «Oracle Database 23.x». */
  readonly engine: string;
  /** Fecha de la última verificación (AAAA-MM-DD). */
  readonly verifiedAt: string;
  readonly results: Readonly<Record<string, VerifiedResult>>;
}

export const VERIFIED: VerifiedResults = verified as VerifiedResults;

/** Huella FNV-1a de 32 bits de la parte ejecutable de un ejemplo. */
export function exampleHash(example: CurriculumExample): string {
  const executable =
    example.kind === 'query'
      ? [example.dataset, example.sql.trim()]
      : [
          (example.setup ?? []).map((statement) => statement.trim()),
          example.code.trim(),
          example.before ?? [],
          example.after ?? [],
        ];
  const canonical = JSON.stringify(executable);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function verifiedResult(id: string): VerifiedResult | undefined {
  return VERIFIED.results[id];
}

/** Resultado tabular de una consulta verificada; falla si no existe (contenido roto). */
export function verifiedTable(id: string): VerifiedTable {
  const result = VERIFIED.results[id];
  if (result?.kind !== 'query') throw new Error(`Sin resultado verificado para ${id}`);
  return result.table;
}
