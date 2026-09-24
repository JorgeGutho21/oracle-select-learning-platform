/** Puerto del borrador local; el SQL nunca sale del navegador por guardar. */
export interface LabDraftRepository {
  load(): Promise<string | null>;
  save(sql: string): Promise<void>;
}

/** Solo rutas públicas de retorno conocidas; no admite redirecciones externas. */
export function safeLabReturn(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (/^\/presentation(?:\?scene=(?:[1-9]|1[0-6]))?$/.test(value)) return value;
  if (/^\/learn\/(?:introduccion|select|from|asterisco|columnas|expresiones|alias|distinct|consulta-completa)$/.test(value)) return value;
  return null;
}

export function incomingLabSql(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 4000 ? value : null;
}
