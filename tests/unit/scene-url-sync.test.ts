import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSceneUrlSync } from '@/features/presentation/application/scene-url-sync';

afterEach(() => vi.useRealTimers());

describe('Sincronización de URL de la exposición', () => {
  it('agrupa 100 cambios rápidos y escribe la última escena al terminar el intervalo', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const sync = createSceneUrlSync(write);
    for (let scene = 1; scene <= 100; scene++) {
      sync.schedule(`/presentation?scene=${scene}`);
    }
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenLastCalledWith('/presentation?scene=1');
    vi.advanceTimersByTime(749);
    expect(write).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('/presentation?scene=100');
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('limita navegación sostenida sin perder la posición final', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const sync = createSceneUrlSync(write);
    for (let scene = 1; scene <= 100; scene++) {
      sync.schedule(`/sections/plsql/class?scene=${scene}`);
      vi.advanceTimersByTime(10);
    }
    expect(write).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(500);
    expect(write).toHaveBeenCalledTimes(3);
    expect(write).toHaveBeenLastCalledWith('/sections/plsql/class?scene=100');
  });

  it('cancela la escritura pendiente al salir de la exposición', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const sync = createSceneUrlSync(write);
    sync.schedule('/presentation?scene=1');
    sync.schedule('/presentation?scene=2');
    sync.cancel();
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenLastCalledWith('/presentation?scene=1');
  });

  it('guarda la URL pendiente al ocultar la página sin dejar un temporizador duplicado', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const sync = createSceneUrlSync(write);
    sync.schedule('/presentation?scene=1');
    sync.schedule('/presentation?scene=9');
    sync.flush();
    expect(write).toHaveBeenLastCalledWith('/presentation?scene=9');
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(2);
  });
});
