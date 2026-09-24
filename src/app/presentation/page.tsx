import type { Metadata } from 'next';
import { PresentationPage } from '@/features/presentation/presentation/presentation-page';

export const metadata: Metadata = { title: 'Modo Exposición' };

interface PageProps {
  readonly searchParams: Promise<{ readonly scene?: string | readonly string[] }>;
}

function parseScene(value: string | readonly string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 16 ? parsed : 1;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <PresentationPage initialScene={parseScene(params.scene)} />;
}
