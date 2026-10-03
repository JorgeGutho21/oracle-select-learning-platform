/**
 * Configuración central de los videos de la unidad (CONTENT_MAP, «Videos»). Mientras un
 * video no esté publicado, su fuente es `null` y la interfaz muestra «Video en preparación».
 * Para publicarlo basta con completar aquí `source` (y, si existen, subtítulos y
 * transcripción): ninguna página escribe URLs de video por su cuenta.
 *
 * Los archivos se sirven desde `public/media` (H.264 + AAC, `moov` al inicio para empezar a
 * reproducir sin descargarlos completos). La decisión de alojamiento está en
 * docs/PRODUCTION_SETUP.md.
 */

export type VideoId = 'intro' | 'summary';

export type VideoSource =
  /** Archivo de video servido directamente (MP4 o WebM). */
  | { readonly kind: 'file'; readonly url: string; readonly type: 'video/mp4' | 'video/webm' }
  /** Reproductor externo insertable (por ejemplo, la URL «embed» de una plataforma). */
  | { readonly kind: 'embed'; readonly url: string };

/** Proporción del video: horizontal 16:9 o vertical 9:16. */
export type VideoOrientation = 'landscape' | 'portrait';

export interface VideoResource {
  readonly id: VideoId;
  readonly code: 'V01' | 'V02';
  readonly title: string;
  readonly description: string;
  /** Duración medida del archivo publicado (m:ss); `null` mientras no haya video. */
  readonly duration: string | null;
  readonly orientation: VideoOrientation;
  readonly source: VideoSource | null;
  readonly poster: string | null;
  readonly captions: { readonly url: string; readonly label: string } | null;
  readonly transcriptUrl: string | null;
}

export const VIDEO_LIBRARY: Readonly<Record<VideoId, VideoResource>> = {
  intro: {
    id: 'intro',
    code: 'V01',
    title: 'Video introductorio: ¿cómo encontrar un dato?',
    description:
      'Por qué consultamos datos y cómo SELECT y FROM eligen qué columnas ver y de qué tabla salen, con un adelanto de *, cálculos, AS y DISTINCT. Lleva subtítulos incrustados; su tabla es un ejemplo, no la EMPLEADOS del laboratorio.',
    duration: '1:13',
    orientation: 'portrait',
    source: { kind: 'file', url: '/media/introduccion-select-oracle-sql.mp4', type: 'video/mp4' },
    poster: '/media/introduccion-select-oracle-sql.jpg',
    // Los subtítulos van incrustados en la imagen: una pista aparte los duplicaría.
    captions: null,
    transcriptUrl: null,
  },
  summary: {
    id: 'summary',
    code: 'V02',
    title: 'Video resumen: fundamentos de Oracle SQL',
    description:
      'Repaso de la unidad: SELECT elige las columnas y FROM la tabla, * frente a columnas concretas, cálculos que no cambian la tabla original, alias con AS y DISTINCT. Sus tablas de ejemplo no son la EMPLEADOS del laboratorio.',
    duration: '4:51',
    orientation: 'landscape',
    source: { kind: 'file', url: '/media/resumen-fundamentos-oracle-sql.mp4', type: 'video/mp4' },
    poster: '/media/resumen-fundamentos-oracle-sql.jpg',
    // Transcripción automática (Whisper) revisada: términos SQL y errores de reconocimiento.
    captions: { url: '/media/resumen-fundamentos-oracle-sql.es.vtt', label: 'Español' },
    transcriptUrl: '/media/resumen-fundamentos-oracle-sql.transcripcion.txt',
  },
};
