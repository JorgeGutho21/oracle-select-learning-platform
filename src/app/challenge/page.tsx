import type { Metadata } from 'next';
import { ChallengeRoot } from '@/composition/challenge/challenge-root';

export const metadata: Metadata = { title: 'SQL Oracle Challenge' };

export default function Page() {
  return <ChallengeRoot />;
}
