'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { startAttempt } from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { currentAccount } from '../accounts/auth-server';
import { loginHref } from '@/features/accounts/application/redirects';

/**
 * Comenzar o retomar una evaluación. El tiempo empieza en la base al crear el intento; esta
 * acción solo lleva al examen (o de vuelta a la ficha con el motivo).
 */
export async function startAssessmentAction(formData: FormData): Promise<void> {
  const id = String(formData.get('assessment') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/evaluations' as Route);
  const account = await currentAccount();
  if (account.status !== 'authenticated') redirect(loginHref(`/evaluations/${id}`) as Route);
  const result = await startAttempt(account.client, id);
  if (result.status === 'started' || result.status === 'resumed') {
    redirect(`/evaluations/${id}/attempt` as Route);
  }
  redirect(`/evaluations/${id}?aviso=${result.status}` as Route);
}
