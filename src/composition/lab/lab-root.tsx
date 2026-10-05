'use client';

import { useState } from 'react';
import { BrowserLabDraftRepository } from '@/features/laboratory/infrastructure/browser-lab-draft';
import { loadOracleStatus } from '@/features/laboratory/infrastructure/http-oracle-status';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';
import { executeLabQuery } from './actions';

export function LabRoot({
  incomingSql,
  returnTo,
}: {
  incomingSql: string | null;
  returnTo: string | null;
}) {
  const [repository] = useState(() => new BrowserLabDraftRepository());
  return (
    <LaboratoryWorkspace
      execute={executeLabQuery}
      loadStatus={loadOracleStatus}
      repository={repository}
      incomingSql={incomingSql}
      returnTo={returnTo}
    />
  );
}
