import type { Metadata } from 'next';
import { ChallengePage } from '@/features/challenge/presentation/challenge-page';

export const metadata: Metadata = { title: 'SQL Oracle Challenge' };

export default function Page() {
  return <ChallengePage />;
}
