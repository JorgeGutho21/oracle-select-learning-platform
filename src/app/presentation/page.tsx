import type { Metadata } from 'next';
import { PresentationPage } from '@/features/presentation/presentation/presentation-page';

export const metadata: Metadata = { title: 'Modo Exposición' };

export default function Page() {
  return <PresentationPage />;
}
