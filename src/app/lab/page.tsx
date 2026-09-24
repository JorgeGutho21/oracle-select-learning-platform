import type { Metadata } from 'next';
import { LabRoot } from '@/composition/lab/lab-root';
import { incomingLabSql, safeLabReturn } from '@/features/laboratory/application/lab-draft';

export const metadata: Metadata = { title: 'Laboratorio SQL' };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <LabRoot incomingSql={incomingLabSql(params.sql)} returnTo={safeLabReturn(params.returnTo)} />;
}
