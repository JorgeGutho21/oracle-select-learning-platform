'use client';

import { useMemo } from 'react';
import { PresenterConsole } from '@/features/classroom/presentation/presenter-console';
import { PresenterCreate } from '@/features/classroom/presentation/presenter-create';
import { createRoomAction, presenterCommandAction, presenterViewAction } from './actions';
import { roomSubscriber, type RealtimeConfig } from './client-support';

export function PresenterCreateRoot({
  availability,
}: {
  readonly availability: {
    readonly backend: 'supabase' | 'memory' | 'unconfigured';
    readonly presenterAccess: boolean;
  };
}) {
  return <PresenterCreate availability={availability} createRoom={createRoomAction} />;
}

export function PresenterConsoleRoot({
  code,
  realtime,
}: {
  readonly code: string;
  readonly realtime: RealtimeConfig;
}) {
  const subscribe = useMemo(() => roomSubscriber(realtime), [realtime]);
  return (
    <PresenterConsole
      code={code}
      loadView={presenterViewAction}
      runCommand={presenterCommandAction}
      subscribe={subscribe}
    />
  );
}
