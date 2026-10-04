import 'server-only';
import {
  detailRows,
  exportDate,
  exportFileName,
  summaryRows,
  toCsv,
  type CsvFormat,
} from '@/features/assessments/application/csv-export';
import { SECTION_LIST } from '@/features/sections/application/sections-api';
import { loadResults } from './teacher-pages';

/**
 * Descarga de resultados (solo profesor: `loadResults` exige el rol). CSV estándar o para
 * Excel en español; resumen por estudiante o detalle por pregunta. Sin identificadores
 * internos ni eventos de supervisión.
 */
export async function exportResponse(id: string, url: URL): Promise<Response> {
  const data = await loadResults(id);
  if (data.status !== 'ready') {
    return new Response('No pudimos leer los resultados.', { status: 503 });
  }
  const format: CsvFormat = url.searchParams.get('formato') === 'excel' ? 'excel' : 'csv';
  const detail = url.searchParams.get('detalle') === '1';
  const section =
    SECTION_LIST.find((entry) => entry.id === data.record.sectionKey)?.title ??
    data.record.sectionKey;
  const context = {
    title: data.record.title,
    section,
    date: exportDate(data.record.opensAt ?? data.record.publishedAt),
  };
  const rows = detail
    ? detailRows(data.rows, data.frozen, data.answers)
    : summaryRows(context, data.rows, format);
  return new Response(toCsv(rows, format), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportFileName(data.record.title, detail, format)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
