/**
 * Coalesces URL writes while scene rendering and progress stay immediate. Next's App
 * Router also writes history after a native replaceState; fast deck navigation can
 * otherwise exceed WebKit's History API frequency limit.
 */
export function createSceneUrlSync(write: (url: string) => void, intervalMs = 750) {
  let lastWrite: number | null = null;
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  const flush = () => {
    const latest = pending;
    cancel();
    if (latest !== null) {
      lastWrite = Date.now();
      write(latest);
    }
  };

  const schedule = (url: string) => {
    const now = Date.now();
    if (lastWrite === null || now - lastWrite >= intervalMs) {
      cancel();
      lastWrite = now;
      write(url);
      return;
    }

    pending = url;
    if (timer !== null) return;
    timer = setTimeout(flush, intervalMs - (now - lastWrite));
  };

  return { schedule, cancel, flush };
}
