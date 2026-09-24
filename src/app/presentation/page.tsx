import type { Metadata } from 'next';
import { PresentationRoot } from '@/composition/presentation/presentation-root';
import { parseSceneParam } from '@/features/presentation/application/presentation-api';

export const metadata: Metadata = { title: 'Modo Exposición' };

interface PageProps {
  readonly searchParams: Promise<{ readonly scene?: string | readonly string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <PresentationRoot requestedScene={parseSceneParam(params.scene)} />;
}
