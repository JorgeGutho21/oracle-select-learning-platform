import type {
  DatasetRef,
  OfficialReference,
  PlsqlExample,
  QueryExample,
  SourceView,
  TraceStep,
} from './types';

/**
 * Ayudas para escribir el currículo sin repetir estructura. Las referencias enlazan al índice
 * de cada libro oficial de Oracle Database 19c y nombran el capítulo: los enlaces profundos
 * no se pudieron comprobar desde el entorno de desarrollo (ORACLE_VALIDATION.md).
 */

export const SQL_REFERENCE_URL =
  'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/';
export const PLSQL_REFERENCE_URL =
  'https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/';

export function sqlRef(topic: string): OfficialReference {
  return { document: 'Oracle Database SQL Language Reference 19c', topic, url: SQL_REFERENCE_URL };
}

export function plsqlRef(topic: string): OfficialReference {
  return {
    document: 'Oracle Database PL/SQL Language Reference 19c',
    topic,
    url: PLSQL_REFERENCE_URL,
  };
}

export function source(table: string, columns: readonly string[], keys?: readonly number[]) {
  const view: SourceView = keys ? { table, columns, keys } : { table, columns };
  return view;
}

interface QueryOptions {
  readonly dataset?: DatasetRef;
  readonly expectError?: string;
  readonly unordered?: boolean;
}

export function query(
  id: string,
  sql: string,
  sources: readonly SourceView[],
  options: QueryOptions = {},
): QueryExample {
  return {
    id,
    kind: 'query',
    dataset: options.dataset ?? 'empresa-v1',
    sql,
    sources,
    ...(options.expectError ? { expectError: options.expectError } : {}),
    ...(options.unordered ? { unordered: true } : {}),
  };
}

interface BlockOptions {
  readonly setup?: readonly string[];
  readonly before?: readonly string[];
  readonly after?: readonly string[];
  readonly expectError?: string;
  readonly trace?: readonly TraceStep[];
}

export function plsql(id: string, code: string, options: BlockOptions = {}): PlsqlExample {
  return { id, kind: 'plsql', code, ...options };
}

/** Une líneas de código: evita cadenas con saltos escapados en el contenido. */
export function lines(...rows: readonly string[]): string {
  return rows.join('\n');
}
