import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useServerClock } from '@/presentation/hooks/use-server-clock';

afterEach(() => vi.useRealTimers());

it('preserves server elapsed time when the device wall clock moves backwards or forwards', () => {
  vi.useFakeTimers({ toFake: ['Date', 'performance', 'setInterval', 'clearInterval'] });
  const reference = Date.parse('2026-10-04T12:00:00Z');
  const { result, unmount } = renderHook(() => useServerClock(new Date(reference).toISOString()));
  act(() => vi.advanceTimersByTime(2000));
  expect(result.current).toBe(reference + 2000);
  act(() => {
    vi.setSystemTime(Date.now() - 6 * 60 * 60 * 1000);
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(reference + 3000);
  act(() => {
    vi.setSystemTime(Date.now() + 12 * 60 * 60 * 1000);
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(reference + 4000);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('resynchronizes to a fresh server reference after a heartbeat or resume', () => {
  vi.useFakeTimers({ toFake: ['Date', 'performance', 'setInterval', 'clearInterval'] });
  const reference = Date.parse('2026-10-04T12:00:00Z');
  const { result, rerender, unmount } = renderHook(({ now }) => useServerClock(now), {
    initialProps: { now: new Date(reference).toISOString() },
  });
  act(() => vi.advanceTimersByTime(2000));
  rerender({ now: new Date(reference + 60_000).toISOString() });
  expect(result.current).toBe(reference + 60_000);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current).toBe(reference + 61_000);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
