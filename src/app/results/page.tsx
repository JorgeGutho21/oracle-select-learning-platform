import type { Metadata } from 'next';
import { ResultsRoot } from '@/composition/classroom/results-root';
import { normalizeRoomCode } from '@/features/classroom/application/classroom-api';

export const metadata: Metadata = { title: 'Resultados' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sala = (await searchParams).sala;
  const roomCode = typeof sala === 'string' ? normalizeRoomCode(sala.slice(0, 32)) : null;
  return <ResultsRoot roomCode={roomCode} />;
}
