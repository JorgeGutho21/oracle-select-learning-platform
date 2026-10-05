'use client';

import { useState, type ReactNode } from 'react';
import { BrowserLabDraftRepository } from '@/features/laboratory/infrastructure/browser-lab-draft';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';
import { executeLabQuery } from './actions';

export function LabRoot({
  incomingSql,
  returnTo,
  oracleStatus,
}: {
  incomingSql: string | null;
  returnTo: string | null;
  oracleStatus: ReactNode;
}) {
  const [repository] = useState(() => new BrowserLabDraftRepository());
  return (
    <LaboratoryWorkspace
      execute={executeLabQuery}
      oracleStatus={oracleStatus}
      repository={repository}
      incomingSql={incomingSql}
      returnTo={returnTo}
    />
  );
}
