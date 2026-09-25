import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getVideo, isSafeMediaUrl } from '@/features/resources/application/resources-api';
import { VIDEO_LIBRARY } from '@/features/resources/domain/videos';
import { VideoPlayer } from '@/presentation/components/media/video-player';

const base = {
  title: 'Video de prueba',
  description: 'Descripción del video.',
  plannedDuration: '1:30–2:00',
};

describe('configuración central de videos', () => {
  it('publica los dos videos con su duración medida y su proporción', () => {
    expect(getVideo('intro')).toMatchObject({
      code: 'V01',
      duration: '1:13',
      orientation: 'portrait',
      source: { kind: 'file', type: 'video/mp4' },
    });
    expect(getVideo('summary')).toMatchObject({
      code: 'V02',
      duration: '4:51',
      orientation: 'landscape',
      source: { kind: 'file', type: 'video/mp4' },
    });
  });

  it('cada video y su portada existen en public/, sin rutas rotas', () => {
    for (const video of Object.values(VIDEO_LIBRARY)) {
      for (const url of [video.source?.url, video.poster]) {
        expect(url).toMatch(/^\/media\/[a-z0-9-]+\.(mp4|jpg)$/);
        expect(existsSync(join(process.cwd(), 'public', url!))).toBe(true);
      }
    }
  });

  it('solo acepta direcciones HTTPS o rutas propias', () => {
    expect(isSafeMediaUrl('https://example.org/video.mp4')).toBe(true);
    expect(isSafeMediaUrl('/videos/intro.mp4')).toBe(true);
    for (const url of ['http://example.org/v.mp4', 'javascript:alert(1)', '//example.org/v', 'x']) {
      expect(isSafeMediaUrl(url)).toBe(false);
    }
  });
});

describe('VideoPlayer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sin fuente muestra «Video en preparación» y ningún reproductor ni iframe', () => {
    const { container } = render(<VideoPlayer {...base} source={null} />);
    expect(screen.getByText('Video en preparación')).toBeInTheDocument();
    expect(screen.getByText('Duración prevista: 1:30–2:00')).toBeInTheDocument();
    expect(container.querySelector('video, iframe')).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Video de prueba' })).toBeInTheDocument();
  });

  it('con archivo usa controles nativos, sin reproducción automática, y subtítulos', () => {
    const { container } = render(
      <VideoPlayer
        {...base}
        source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }}
        captions={{ url: '/v.vtt', label: 'Español' }}
      />,
    );
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('controls');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(container.querySelector('track[kind="captions"][srclang="es"]')).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando video…');
    fireEvent.loadedMetadata(video);
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Abrir el video en una pestaña nueva' }),
    ).toHaveAttribute('href', '/v.mp4');
  });

  it('un video vertical conserva 9:16 y muestra la duración real', () => {
    const { container } = render(
      <VideoPlayer
        {...base}
        duration="1:13"
        orientation="portrait"
        source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }}
      />,
    );
    expect(container.querySelector('figure')).toHaveClass('video-player--portrait');
    expect(screen.getByText('Duración: 1:13')).toBeInTheDocument();
    expect(screen.queryByText(/Duración prevista/)).toBeNull();
  });

  it('si los metadatos llegaron antes de hidratar, no se queda «Cargando»', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(
      HTMLMediaElement.HAVE_METADATA,
    );
    render(<VideoPlayer {...base} source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('si el navegador no descarga por adelantado, muestra la portada sin «Cargando»', () => {
    const { container } = render(
      <VideoPlayer {...base} source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }} />,
    );
    fireEvent(container.querySelector('video')!, new Event('suspend'));
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('video')).not.toBeNull();
  });

  it('si el archivo falla muestra el error y conserva el enlace alternativo', () => {
    const { container } = render(
      <VideoPlayer {...base} source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }} />,
    );
    fireEvent.error(container.querySelector('video')!);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el video');
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByRole('link', { name: 'Abrir el video en una pestaña nueva' })).toBeVisible();
  });

  it('un reproductor externo usa un iframe titulado y de carga diferida', () => {
    const { container } = render(
      <VideoPlayer {...base} source={{ kind: 'embed', url: 'https://example.org/embed/1' }} />,
    );
    const frame = container.querySelector('iframe')!;
    expect(frame).toHaveAttribute('title', 'Video de prueba');
    expect(frame).toHaveAttribute('loading', 'lazy');
    fireEvent.load(frame);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
