'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { prefersStaticEffects } from './motion';

/**
 * Tarjeta cuyos píxeles se encienden desde el centro al pasar el ratón o al enfocar uno de
 * sus enlaces. Se usa en lo que todavía está «en construcción» (secciones próximas).
 *
 * Adaptado de «Pixel Card» de React Bits (https://github.com/DavidHDev/react-bits),
 * © 2026 David Haz, licencia MIT + Commons Clause (THIRD_PARTY_NOTICES.md). Cambios: la
 * tarjeta no añade una parada de tabulación propia (reacciona al foco de sus enlaces), el
 * lienzo es decorativo y queda detrás del contenido, los píxeles se crean al primer uso y
 * no al montar, sin `@ts-ignore`, y no se anima con movimiento reducido, en pantallas
 * táctiles ni con ahorro de datos.
 */

const DEFAULT_COLORS = ['#dcecff', '#a9d4ff', '#7fe3f2'] as const;

class Pixel {
  private size = 0;
  private counter = 0;
  private reverse = false;
  private shimmering = false;
  idle = false;
  private readonly sizeStep = Math.random() * 0.4;
  private readonly minSize = 0.5;
  private readonly maxSize = Math.random() * 1.5 + 0.5;
  private readonly counterStep: number;
  private readonly speed: number;

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly x: number,
    private readonly y: number,
    private readonly color: string,
    speed: number,
    private readonly delay: number,
    span: number,
  ) {
    this.speed = (Math.random() * 0.8 + 0.1) * speed;
    this.counterStep = Math.random() * 4 + span * 0.01;
  }

  private draw() {
    const offset = 1 - this.size * 0.5;
    this.context.fillStyle = this.color;
    this.context.fillRect(this.x + offset, this.y + offset, this.size, this.size);
  }

  appear() {
    this.idle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) this.shimmering = true;
    if (this.shimmering) {
      if (this.size >= this.maxSize) this.reverse = true;
      else if (this.size <= this.minSize) this.reverse = false;
      this.size += this.reverse ? -this.speed : this.speed;
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.shimmering = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.idle = true;
      return;
    }
    this.size -= 0.1;
    this.draw();
  }
}

export interface PixelCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Distancia entre píxeles, en píxeles CSS. */
  readonly gap?: number;
  /** Velocidad del parpadeo, de 0 a 100. */
  readonly speed?: number;
  readonly colors?: readonly string[];
}

export function PixelCard({
  children,
  className = '',
  gap = 8,
  speed = 30,
  colors = DEFAULT_COLORS,
}: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const sizeRef = useRef('');
  const frameRef = useRef<number | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = !prefersStaticEffects();
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const preparePixels = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!container || !canvas || !context) return null;
    const width = Math.floor(container.clientWidth);
    const height = Math.floor(container.clientHeight);
    const key = `${width}x${height}`;
    if (sizeRef.current === key) return context;
    sizeRef.current = key;
    canvas.width = width;
    canvas.height = height;
    const effectiveSpeed = Math.min(Math.max(speed, 0), 100) * 0.001;
    const pixels: Pixel[] = [];
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)] ?? DEFAULT_COLORS[0];
        const distance = Math.hypot(x - width / 2, y - height / 2);
        pixels.push(new Pixel(context, x, y, color, effectiveSpeed, distance, width + height));
      }
    }
    pixelsRef.current = pixels;
    return context;
  }, [colors, gap, speed]);

  const run = useCallback(
    (phase: 'appear' | 'disappear') => {
      if (!enabledRef.current) return;
      const context = preparePixels();
      const canvas = canvasRef.current;
      if (!context || !canvas) return;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      let previous = performance.now();
      const step = (now: number) => {
        frameRef.current = requestAnimationFrame(step);
        // A unos 60 fotogramas por segundo, también en pantallas de 120 Hz.
        if (now - previous < 1000 / 60) return;
        previous = now;
        context.clearRect(0, 0, canvas.width, canvas.height);
        let idle = true;
        for (const pixel of pixelsRef.current) {
          if (phase === 'appear') pixel.appear();
          else pixel.disappear();
          if (!pixel.idle) idle = false;
        }
        if (idle && frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(step);
    },
    [preparePixels],
  );

  return (
    <div
      ref={containerRef}
      className={`fx-pixel-card ${className}`.trim()}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') run('appear');
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') run('disappear');
      }}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) run('appear');
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) run('disappear');
      }}
    >
      <canvas ref={canvasRef} className="fx-pixel-card__canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
