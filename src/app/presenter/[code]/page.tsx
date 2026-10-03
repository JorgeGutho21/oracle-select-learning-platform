import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { classroomRuntime } from '@/composition/classroom/classroom-server';
import { PresenterConsoleRoot } from '@/composition/classroom/presenter-root';
import { normalizeRoomCode } from '@/features/classroom/application/classroom-api';

export const metadata: Metadata = {
  title: 'Sala en vivo · Profesor',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const code = normalizeRoomCode(decodeURIComponent((await params).code));
  if (!code) notFound();
  return <PresenterConsoleRoot code={code} realtime={classroomRuntime().availability.realtime} />;
}
