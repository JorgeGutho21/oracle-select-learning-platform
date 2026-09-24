import type { Metadata } from 'next';
import { connection } from 'next/server';
import { classroomRuntime } from '@/composition/classroom/classroom-server';
import { JoinRoot } from '@/composition/classroom/join-root';
import { normalizeRoomCode } from '@/features/classroom/application/classroom-api';

export const metadata: Metadata = {
  title: 'Entrar a la sala',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const raw = decodeURIComponent((await params).code).slice(0, 32);
  // Un código mal escrito llega igual a la pantalla, que explica cómo corregirlo.
  const code = normalizeRoomCode(raw) ?? raw;
  return <JoinRoot code={code} realtime={classroomRuntime().availability.realtime} />;
}
