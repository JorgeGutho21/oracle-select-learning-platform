'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { mergeRecords, type ProgressRecord } from '@/features/progress/domain/progress';
import { learnerProgress } from '@/features/progress/application/summary';
import type { SyncSnapshot } from '@/features/progress/application/progress-sync';
import { LearnerDashboard } from '@/features/progress/presentation/learner-dashboard';
import type { SectionDto } from '@/features/sections/application/sections-api';

/**
 * Une el progreso leído en el servidor (la nube) con el del dispositivo, que puede ir por
 * delante si hubo avance sin conexión. Lo que se ve es siempre la fusión de ambos.
 */
export function LearnerDashboardRoot({
  userId,
  firstName,
  initialRecords,
  sections,
  now,
  notice,
}: {
  readonly userId: string;
  readonly firstName: string;
  readonly initialRecords: readonly ProgressRecord[];
  readonly sections: readonly SectionDto[];
  readonly now: number;
  readonly notice?: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<SyncSnapshot | null>(null);
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void import('./progress-sync-client').then(({ progressSync }) => {
      if (!active) return;
      const sync = progressSync();
      unsubscribe = sync.subscribe(setSnapshot);
      setSnapshot(sync.snapshot);
      void sync.start(userId);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);
  const records = snapshot ? mergeRecords(initialRecords, snapshot.records) : initialRecords;
  return (
    <LearnerDashboard
      firstName={firstName}
      progress={learnerProgress(records)}
      sections={sections}
      syncStatus={snapshot?.status ?? 'idle'}
      now={now}
      notice={notice}
    />
  );
}
