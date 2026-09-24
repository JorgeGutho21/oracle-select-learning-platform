import { VIDEO_LIBRARY, type VideoId, type VideoResource } from '../domain/videos';

export type { VideoId, VideoResource, VideoSource } from '../domain/videos';

/** Solo se insertan direcciones HTTPS o rutas propias del sitio. */
function isSafeUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Devuelve el video listo para mostrar. Una URL que no sea HTTPS o propia se descarta: la
 * interfaz muestra «Video en preparación» en lugar de un reproductor roto o inseguro.
 */
export function getVideo(id: VideoId): VideoResource {
  const video = VIDEO_LIBRARY[id];
  const source = video.source && isSafeUrl(video.source.url) ? video.source : null;
  return {
    ...video,
    source,
    poster: video.poster && isSafeUrl(video.poster) ? video.poster : null,
    captions: video.captions && isSafeUrl(video.captions.url) ? video.captions : null,
    transcriptUrl:
      video.transcriptUrl && isSafeUrl(video.transcriptUrl) ? video.transcriptUrl : null,
  };
}

export { isSafeUrl as isSafeMediaUrl };
