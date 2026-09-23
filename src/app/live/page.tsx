import type { Metadata } from 'next';
import { RoomsPage } from '@/features/rooms/presentation/live-page';

export const metadata: Metadata = { title: 'Sala en vivo' };

export default function Page() {
  return <RoomsPage />;
}
