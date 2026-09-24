import type { Metadata } from 'next';
import { executeLabQuery, getLabOracleStatus } from '@/composition/lab/actions';
import { LaboratoryWorkspace } from '@/features/laboratory/presentation/lab-workspace';

export const metadata: Metadata = { title: 'Laboratorio SQL' };

export default function Page() {
  return <LaboratoryWorkspace execute={executeLabQuery} loadStatus={getLabOracleStatus} />;
}
