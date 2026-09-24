'use client';

import { useState } from 'react';
import { BrowserLabDraftRepository } from '@/features/laboratory/infrastructure/browser-lab-draft';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';
import { executeLabQuery, getLabOracleStatus } from './actions';

export function LabRoot({ incomingSql, returnTo }: { incomingSql: string | null; returnTo: string | null }) {
  const [repository] = useState(() => new BrowserLabDraftRepository());
  return <LaboratoryWorkspace execute={executeLabQuery} loadStatus={getLabOracleStatus} repository={repository} incomingSql={incomingSql} returnTo={returnTo} />;
}
