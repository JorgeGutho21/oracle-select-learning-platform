import type { Metadata } from 'next';
import { PresenterViewRoot } from '@/composition/presentation/presenter-view-root';
import { parseSceneParam } from '@/features/presentation/application/presentation-api';

export const metadata: Metadata = {
  title: 'Vista del presentador',
  robots: { index: false, follow: false },
};

interface PageProps {
  readonly searchParams: Promise<{ readonly scene?: string | readonly string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <PresenterViewRoot requestedScene={parseSceneParam(params.scene)} />;
}
