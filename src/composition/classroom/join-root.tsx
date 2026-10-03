'use client';

import { useMemo } from 'react';
import { JoinFlow } from '@/features/classroom/presentation/join-flow';
import {
  checkRoomCodeAction,
  joinRoomAction,
  leaveRoomAction,
  participantViewAction,
} from './actions';
import { roomSubscriber, type RealtimeConfig } from './client-support';
import { LiveChallengeRoot } from './live-challenge-root';

export function JoinRoot({
  code,
  realtime,
}: {
  readonly code: string;
  readonly realtime: RealtimeConfig;
}) {
  const subscribe = useMemo(() => roomSubscriber(realtime), [realtime]);
  return (
    <JoinFlow
      code={code}
      checkCode={checkRoomCodeAction}
      join={joinRoomAction}
      loadView={participantViewAction}
      leave={leaveRoomAction}
      subscribe={subscribe}
      renderChallenge={(room) => (
        <LiveChallengeRoot key={room.id} code={room.code} roomId={room.id} />
      )}
    />
  );
}
