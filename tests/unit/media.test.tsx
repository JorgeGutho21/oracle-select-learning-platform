import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getVideo, isSafeMediaUrl } from '@/features/resources/application/resources-api';
import { VIDEO_LIBRARY } from '@/features/resources/domain/videos';
import { VideoPlayer } from '@/presentation/components/media/video-player';

const base = {
  title: 'Video de prueba',
  description: 'Descripción del video.',
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

  it('cada video, portada, pista de subtítulos y transcripción existe en public/', () => {
    for (const video of Object.values(VIDEO_LIBRARY)) {
      const urls = [video.source?.url, video.poster, video.captions?.url, video.transcriptUrl];
      for (const url of urls.filter(Boolean)) {
        expect(url).toMatch(/^\/media\/[a-z0-9.-]+\.(mp4|jpg|vtt|txt)$/);
        expect(existsSync(join(process.cwd(), 'public', url!))).toBe(true);
      }
    }
  });

  it('el resumen lleva subtítulos WebVTT revisados y el introductorio los trae incrustados', () => {
    expect(VIDEO_LIBRARY.intro.captions).toBeNull();
    const captions = VIDEO_LIBRARY.summary.captions!;
    expect(captions.label).toBe('Español');
    const vtt = readFileSync(join(process.cwd(), 'public', captions.url), 'utf8');
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    const cues = vtt.split(/\r?\n\r?\n/).filter((block) => block.includes('-->'));
    expect(cues.length).toBeGreaterThan(80);
    // Términos del curso escritos como en las lecciones, sin restos del reconocimiento.
    const text = vtt.replace(/\s+/g, ' ');
    expect(text).toContain('el comando SELECT');
    expect(text).toContain('el comando FROM');
    expect(text).toContain('el comando DISTINCT');
    expect(text).toContain('«SALARIO*12»');
    expect(text).not.toMatch(/\b(select|from|distinct)\b|artécla|hasta el disco/);
    for (const cue of cues) {
      const [start, end] = cue.match(/\d{2}:\d{2}:\d{2}\.\d{3}/g)!;
      expect(end! > start!).toBe(true);
      const lines = cue.split(/\r?\n/).slice(2);
      expect(lines.every((line) => line.length <= 46)).toBe(true);
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
  it('sin fuente muestra «Video en preparación» y ningún reproductor ni iframe', () => {
    const { container } = render(<VideoPlayer {...base} source={null} />);
    expect(screen.getByText('Video en preparación')).toBeInTheDocument();
    expect(screen.queryByText(/Duración/)).toBeNull();
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
    // Sin descarga previa: la portada queda a la vista y no hay aviso de carga.
    expect(video).toHaveAttribute('preload', 'none');
    expect(container.querySelector('track[kind="captions"][srclang="es"]')).not.toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    // Al pedir reproducción y esperar datos aparece el aviso; desaparece al reproducir.
    fireEvent.waiting(video);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando video…');
    fireEvent.playing(video);
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Abrir el video en una pestaña nueva' }),
    ).toHaveAttribute('href', '/v.mp4');
  });

  it('un video vertical conserva 9:16 y no muestra rótulos de duración', () => {
    const { container } = render(
      <VideoPlayer
        {...base}
        orientation="portrait"
        source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }}
      />,
    );
    expect(container.querySelector('figure')).toHaveClass('video-player--portrait');
    expect(screen.queryByText(/Duración/)).toBeNull();
  });

  it('si la fuente falló antes de hidratar, muestra el error igualmente', () => {
    // jsdom no implementa MediaError: se simula el estado que deja el navegador.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'error');
    Object.defineProperty(HTMLMediaElement.prototype, 'error', {
      configurable: true,
      get: () => ({ code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED' }),
    });
    try {
      render(<VideoPlayer {...base} source={{ kind: 'file', url: '/v.mp4', type: 'video/mp4' }} />);
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el video');
    } finally {
      if (descriptor) Object.defineProperty(HTMLMediaElement.prototype, 'error', descriptor);
      else delete (HTMLMediaElement.prototype as { error?: unknown }).error;
    }
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
