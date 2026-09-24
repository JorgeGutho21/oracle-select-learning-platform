import type { Metadata } from 'next';
import { StudyRoot } from '@/composition/study/study-root';

export const metadata: Metadata = { title: 'Modo Estudio' };

export default function Page() {
  return <StudyRoot />;
}
