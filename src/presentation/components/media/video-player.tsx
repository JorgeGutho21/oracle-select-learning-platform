'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type VideoPlayerSource =
  | { readonly kind: 'file'; readonly url: string; readonly type: string }
  | { readonly kind: 'embed'; readonly url: string };

export interface VideoPlayerProps {
  readonly title: string;
  readonly description: string;
  /** Duración prevista, por ejemplo «1:30–2:00». */
  readonly plannedDuration: string;
  /** Duración real del video publicado, por ejemplo «1:13». */
  readonly duration?: string | null;
  /** Sin fuente, el reproductor muestra «Video en preparación» y nunca un marco vacío. */
  readonly source: VideoPlayerSource | null;
  /** Un video vertical (9:16) conserva su proporción en lugar de encogerse dentro de 16:9. */
  readonly orientation?: 'landscape' | 'portrait';
  readonly poster?: string | null;
  readonly captions?: { readonly url: string; readonly label: string } | null;
  readonly transcriptUrl?: string | null;
  /** Ancla del video, por ejemplo `video-introduccion`. */
  readonly id?: string;
  readonly titleAs?: 'h2' | 'h3' | 'p';
  /** Versión reducida para espacios estrechos, como una escena de la Exposición. */
  readonly compact?: boolean;
}

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Video accesible, 16:9 o vertical: controles nativos, sin reproducción automática,
 * subtítulos y transcripción cuando existan, y alternativa si el video no carga.
 */
export function VideoPlayer({
  title,
  description,
  plannedDuration,
  duration = null,
  source,
  orientation = 'landscape',
  poster = null,
  captions = null,
  transcriptUrl = null,
  id,
  titleAs: Title = 'h3',
  compact = false,
}: VideoPlayerProps) {
  const [state, setState] = useState<LoadState>('loading');
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const className = [
    'video-player',
    orientation === 'portrait' ? 'video-player--portrait' : '',
    compact ? 'video-player--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // El navegador empieza a cargar el video del HTML antes de la hidratación: si los
  // metadatos o el error llegaron antes que React, sus eventos ya no se repetirán.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.error) setState('error');
    else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) setState('ready');
  }, []);

  let frame;
  if (!source) {
    frame = (
      <div className="video-player__placeholder">
        <span className="video-player__icon" aria-hidden="true">
          ▶
        </span>
        <strong>Video en preparación</strong>
        <span>Duración prevista: {plannedDuration}</span>
      </div>
    );
  } else if (state === 'error') {
    frame = (
      <div className="video-player__placeholder video-player__placeholder--error" role="alert">
        <strong>No se pudo cargar el video</strong>
        <span>Ábrelo en una pestaña nueva o continúa con el contenido de la página.</span>
      </div>
    );
  } else {
    frame = (
      <>
        {source.kind === 'file' ? (
          <video
            ref={videoRef}
            className="video-player__media"
            controls
            preload="metadata"
            playsInline
            src={source.url}
            poster={poster ?? undefined}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onLoadedMetadata={() => setState('ready')}
            // Si el navegador decide no descargar más (ahorro de datos, iOS), no hay nada
            // que esperar: se muestra la portada con los controles.
            onSuspend={() => setState((current) => (current === 'error' ? current : 'ready'))}
            onError={() => setState('error')}
          >
            {captions && (
              <track
                kind="captions"
                srcLang="es"
                label={captions.label}
                src={captions.url}
                default
              />
            )}
          </video>
        ) : (
          <iframe
            className="video-player__media"
            src={source.url}
            title={title}
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setState('ready')}
          />
        )}
        {state === 'loading' && (
          <div className="video-player__loading" role="status">
            <span className="video-player__spinner" aria-hidden="true" />
            Cargando video…
          </div>
        )}
      </>
    );
  }

  return (
    <figure className={className} id={id} aria-labelledby={titleId}>
      <div className="video-player__frame">{frame}</div>
      <figcaption className="video-player__caption">
        <Title id={titleId} className="video-player__title">
          {title}
        </Title>
        <p id={descriptionId} className="video-player__description">
          {description}
        </p>
        {source ? (
          <>
            {duration && <p className="video-player__meta">Duración: {duration}</p>}
            <p className="video-player__links">
              <a href={source.url} target="_blank" rel="noreferrer">
                Abrir el video en una pestaña nueva
              </a>
              {transcriptUrl && (
                <a href={transcriptUrl} target="_blank" rel="noreferrer">
                  Leer la transcripción
                </a>
              )}
            </p>
          </>
        ) : (
          <p className="video-player__meta">
            Se publicará con subtítulos revisados y transcripción. Mientras tanto, el contenido está
            completo en las lecciones.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
