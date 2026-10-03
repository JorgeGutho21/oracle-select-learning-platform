import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  resendConfirmationAction,
  signInAction,
  signInWithMicrosoftAction,
} from '@/composition/accounts/auth-actions';
import { accessContext } from '@/composition/accounts/auth-server';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { loginNotice } from '@/features/accounts/application/auth-forms';
import { safeNextPath } from '@/features/accounts/application/redirects';
import { AccessMethods } from '@/features/accounts/presentation/access-methods';
import { AuthLayout } from '@/features/accounts/presentation/auth-layout';
import { SignInForm } from '@/features/accounts/presentation/auth-forms';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Entra a DB LAB para sincronizar tu avance entre dispositivos.',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));
  const notice = loginNotice(firstParam(params.aviso));
  const context = await accessContext();
  if (context.authenticated) redirect(next as Route);
  return (
    <AuthLayout
      title="Iniciar sesión"
      lead="Entra para guardar tu avance en tu cuenta y continuar desde cualquier dispositivo."
      footer={
        <p>
          ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
        </p>
      }
    >
      {notice && <Alert tone={notice.tone} title={notice.text} live />}
      {!context.available && !notice && (
        <Alert tone="warning" title="Las cuentas no están disponibles en este momento.">
          Puedes seguir estudiando como invitado: tu avance se guarda en este dispositivo.
        </Alert>
      )}
      <SignInForm action={signInAction} next={next} resendAction={resendConfirmationAction} />
      <AccessMethods
        microsoftAction={signInWithMicrosoftAction}
        microsoftEnabled={context.microsoft}
        next={next}
        guestLabel="Continuar como invitado"
      />
    </AuthLayout>
  );
}
