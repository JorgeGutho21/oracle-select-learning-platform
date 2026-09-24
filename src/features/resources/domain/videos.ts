/**
 * Configuración central de los videos de la unidad (CONTENT_MAP, «Videos»). Mientras un
 * video no esté publicado, su fuente es `null` y la interfaz muestra «Video en preparación».
 * Para publicarlo basta con completar aquí `source` (y, si existen, subtítulos y
 * transcripción): ninguna página escribe URLs de video por su cuenta.
 */

export type VideoId = 'intro' | 'summary';

export type VideoSource =
  /** Archivo de video servido directamente (MP4 o WebM). */
  | { readonly kind: 'file'; readonly url: string; readonly type: 'video/mp4' | 'video/webm' }
  /** Reproductor externo insertable (por ejemplo, la URL «embed» de una plataforma). */
  | { readonly kind: 'embed'; readonly url: string };

export interface VideoResource {
  readonly id: VideoId;
  readonly code: 'V01' | 'V02';
  readonly title: string;
  readonly description: string;
  /** Duración prevista en la planificación, no medida. */
  readonly plannedDuration: string;
  readonly source: VideoSource | null;
  readonly poster: string | null;
  readonly captions: { readonly url: string; readonly label: string } | null;
  readonly transcriptUrl: string | null;
}

export const VIDEO_LIBRARY: Readonly<Record<VideoId, VideoResource>> = {
  intro: {
    id: 'intro',
    code: 'V01',
    title: 'Video introductorio: una primera mirada a SQL',
    description:
      'Una tabla de empleados, la necesidad de consultarla y cómo SELECT y FROM responden qué mostrar y de dónde.',
    plannedDuration: '1:30–2:00',
    source: null,
    poster: null,
    captions: null,
    transcriptUrl: null,
  },
  summary: {
    id: 'summary',
    code: 'V02',
    title: 'Video resumen de la unidad',
    description:
      'Repaso en orden: SELECT y FROM, * frente a columnas, cálculos, alias, DISTINCT y la lectura de una consulta completa.',
    plannedDuration: '3:00–4:00',
    source: null,
    poster: null,
    captions: null,
    transcriptUrl: null,
  },
};
