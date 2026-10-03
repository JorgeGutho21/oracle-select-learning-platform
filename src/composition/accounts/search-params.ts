/** Primer valor de un parámetro de búsqueda de Next (puede llegar repetido). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
