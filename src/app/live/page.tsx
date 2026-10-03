import type { Metadata } from 'next';
import { CodeEntry } from '@/features/classroom/presentation/code-entry';

export const metadata: Metadata = { title: 'Sala en vivo' };

export default function Page() {
  return <CodeEntry />;
}
