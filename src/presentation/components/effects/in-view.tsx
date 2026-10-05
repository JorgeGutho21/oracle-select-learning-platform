'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { prefersStaticEffects } from './motion';

/**
 * Motion Primitives InView adaptation (MIT, © 2024 ibelick).
 * Native IntersectionObserver and a once-only 250ms CSS transition replace Motion.
 * Content remains visible before hydration, without JavaScript and with reduced motion.
 */
export function InView({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersStaticEffects() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.inView = 'true';
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`db-in-view ${className}`} data-ui-source="motion-primitives">
      {children}
    </div>
  );
}
