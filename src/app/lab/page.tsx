import type { Metadata } from 'next';
import { LaboratoryPage } from '@/features/laboratory/presentation/lab-page';

export const metadata: Metadata = { title: 'Laboratorio SQL' };

export default function Page() {
  return <LaboratoryPage />;
}
