import type { Metadata } from 'next';
import { StudyPage } from '@/features/study/presentation/learn-page';

export const metadata: Metadata = { title: 'Modo Estudio' };

export default function Page() {
  return <StudyPage />;
}
