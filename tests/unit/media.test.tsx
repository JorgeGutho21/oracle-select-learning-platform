import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getVideo, isSafeMediaUrl } from '@/features/resources/application/resources-api';
import { VIDEO_LIBRARY } from '@/features/resources/domain/videos';
import { VideoPlayer } from '@/presentation/components/media/video-player';

const base = {
  title: 'Video de prueba',
  description: 'Descripción del video.',
  plannedDuration: '1:30–2:00',
};

describe('configuración central de videos', () => {
  it('define los dos videos con su duración prevista y sin URL inventada', () => {
    expect(getVideo('intro')).toMatchObject({ code: 'V01', plannedDuration: '1:30–2:00' });
    expect(getVideo('summary')).toMatchObject({ code: 'V02', plannedDuration: '3:00–4:00' });
    expect(Object.values(VIDEO_LIBRARY).every(({ source }) => source === null)).toBe(true);
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
