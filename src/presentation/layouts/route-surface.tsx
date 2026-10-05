'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTE_VISUAL_PROFILE, visualKind } from './route-visual-profile';

export function RouteSurface({ children }: { readonly children: ReactNode }) {
  const kind = visualKind(usePathname());
  return (
    <main
      id="main-content"
      className="app-main"
      tabIndex={-1}
      data-visual-profile={kind}
      data-motion-budget={ROUTE_VISUAL_PROFILE[kind].motion}
    >
      {children}
    </main>
  );
}
