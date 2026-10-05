'use client';

import { useEffect, useRef } from 'react';
import { prefersStaticEffects } from './motion';

/**
 * Fondo de celdas, como una tabla que se desplaza muy despacio. Es el único efecto
 * protagonista de la portada y queda detrás del contenido.
 *
 * Adaptado de «Shape Grid» (antes «Squares») de React Bits
 * (https://github.com/DavidHDev/react-bits), © 2026 David Haz, licencia MIT + Commons
 * Clause (THIRD_PARTY_NOTICES.md). Cambios: solo cuadrados, líneas trazadas de una vez por
 * columna y fila (no un rectángulo por celda), nitidez en pantallas de alta densidad, el
 * ratón se sigue en la banda que lo contiene, viñeta con máscara CSS en lugar de un
 * degradado pintado, y dibujo estático con movimiento reducido, en pantallas táctiles o con
 * ahorro de datos. Las entradas e interacciones duran como máximo 300 ms; se detiene
 * fuera de la vista, con la pestaña oculta y cuando termina esa respuesta visual.
 */

export interface ShapeGridProps {
  readonly className?: string;
  /** Lado de cada celda, en píxeles CSS. */
  readonly cellSize?: number;
  /** Desplazamiento por fotograma, en píxeles CSS. */
  readonly speed?: number;
  readonly lineColor?: string;
  readonly hoverColor?: string;
}

export function ShapeGrid({
  className = '',
  cellSize = 48,
  speed = 0.2,
  lineColor = 'rgb(32 204 229 / 12%)',
  hoverColor = 'rgb(32 204 229 / 14%)',
}: ShapeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const band = canvas?.parentElement;
    if (!canvas || !context || !band) return;

    const still = prefersStaticEffects();
    const offset = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let hovered: { col: number; row: number } | null = null;
    const opacities = new Map<string, number>();
    let frame: number | null = null;
    let deadline = 0;
    let inView = false;
    let pageVisible = !document.hidden;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const shiftX = ((offset.x % cellSize) + cellSize) % cellSize;
      const shiftY = ((offset.y % cellSize) + cellSize) % cellSize;

      for (const [key, alpha] of opacities) {
        const [col, row] = key.split(',').map(Number) as [number, number];
        context.globalAlpha = alpha;
        context.fillStyle = hoverColor;
        context.fillRect(col * cellSize + shiftX, row * cellSize + shiftY, cellSize, cellSize);
      }
      context.globalAlpha = 1;

      context.beginPath();
      for (let x = shiftX - cellSize; x <= width + cellSize; x += cellSize) {
        context.moveTo(Math.round(x) + 0.5, 0);
        context.lineTo(Math.round(x) + 0.5, height);
      }
      for (let y = shiftY - cellSize; y <= height + cellSize; y += cellSize) {
        context.moveTo(0, Math.round(y) + 0.5);
        context.lineTo(width, Math.round(y) + 0.5);
      }
      context.strokeStyle = lineColor;
      context.lineWidth = 1;
      context.stroke();
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };

    const fade = () => {
      const target = hovered ? `${hovered.col},${hovered.row}` : null;
      if (target && !opacities.has(target)) opacities.set(target, 0);
      for (const [key, alpha] of opacities) {
        const next = alpha + ((key === target ? 1 : 0) - alpha) * 0.15;
        if (next < 0.01) opacities.delete(key);
        else opacities.set(key, next);
      }
    };

    const tick = (timestamp: number) => {
      if (timestamp >= deadline) {
        frame = null;
        canvas.dataset.effectActive = 'false';
        return;
      }
      offset.x -= speed;
      offset.y -= speed;
      fade();
      draw();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!still && inView && pageVisible && frame === null) {
        deadline = performance.now() + 300;
        canvas.dataset.effectActive = 'true';
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      canvas.dataset.effectActive = 'false';
    };

    const follow = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const shiftX = ((offset.x % cellSize) + cellSize) % cellSize;
      const shiftY = ((offset.y % cellSize) + cellSize) % cellSize;
      hovered = {
        col: Math.floor((event.clientX - rect.left - shiftX) / cellSize),
        row: Math.floor((event.clientY - rect.top - shiftY) / cellSize),
      };
      start();
    };
    const leave = () => {
      hovered = null;
      start();
    };
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      if (inView) start();
      else stop();
    });
    viewObserver.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    if (!still) {
      band.addEventListener('pointermove', follow);
      band.addEventListener('pointerleave', leave);
    }
    resize();
    canvas.dataset.effectActive = 'false';
    canvas.dataset.ready = 'true';

    return () => {
      stop();
      resizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      band.removeEventListener('pointermove', follow);
      band.removeEventListener('pointerleave', leave);
    };
  }, [cellSize, hoverColor, lineColor, speed]);

  return (
    <canvas ref={canvasRef} className={`fx-shape-grid ${className}`.trim()} aria-hidden="true" />
  );
}
