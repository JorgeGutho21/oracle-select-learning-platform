import type { Metadata } from 'next';
import { ResourcesPage } from '@/features/resources/presentation/resources-page';

export const metadata: Metadata = { title: 'Recursos' };

export default function Page() {
  return <ResourcesPage />;
}
