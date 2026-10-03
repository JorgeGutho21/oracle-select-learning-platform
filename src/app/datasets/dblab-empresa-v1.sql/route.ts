import { datasetScript } from '@/features/curriculum/application/curriculum-api';

/**
 * Script Oracle del dataset de las secciones 2 y 3, generado desde su fuente única. Sirve
 * para ejecutar los ejemplos en un esquema propio de Oracle (FreeSQL, Live SQL, local).
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(datasetScript(), {
    headers: {
      'content-type': 'application/sql; charset=utf-8',
      'content-disposition': 'attachment; filename="dblab-empresa-v1.sql"',
    },
  });
}
