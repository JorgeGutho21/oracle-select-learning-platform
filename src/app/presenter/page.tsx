import type { Metadata } from 'next';
import { connection } from 'next/server';
import { classroomRuntime } from '@/composition/classroom/classroom-server';
import { PresenterCreateRoot } from '@/composition/classroom/presenter-root';

export const metadata: Metadata = {
  title: 'Crear sala en vivo',
  robots: { index: false, follow: false },
};

export default async function Page() {
  // La configuración se lee al servir la página, no al compilarla.
  await connection();
  const { availability } = classroomRuntime();
  return (
    <PresenterCreateRoot
      availability={{
        backend: availability.backend,
        presenterAccess: availability.presenterAccess,
      }}
    />
  );
}
