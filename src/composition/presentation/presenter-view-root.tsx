'use client';

import { PresenterView } from '@/features/presentation/presentation/presenter-view';

export function PresenterViewRoot({ requestedScene }: { readonly requestedScene: number | null }) {
  return <PresenterView requestedScene={requestedScene} />;
}
