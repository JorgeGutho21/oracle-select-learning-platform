import type { Metadata } from 'next';
import { ResultsPage } from '@/features/results/presentation/results-page';

export const metadata: Metadata = { title: 'Resultados' };

export default function Page() {
  return <ResultsPage />;
}
