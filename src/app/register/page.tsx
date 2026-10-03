import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signInWithMicrosoftAction, signUpAction } from '@/composition/accounts/auth-actions';
import { accessContext } from '@/composition/accounts/auth-server';
import { ACCOUNT_HOME } from '@/features/accounts/application/redirects';
import { AccessMethods } from '@/features/accounts/presentation/access-methods';
import { AuthLayout } from '@/features/accounts/presentation/auth-layout';
import { SignUpForm } from '@/features/accounts/presentation/auth-forms';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta de DB LAB con nombre, apellido y correo.',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const context = await accessContext();
  if (context.authenticated) redirect(ACCOUNT_HOME);
  return (
    <AuthLayout
      title="Crear cuenta"
      lead="Solo pedimos tu nombre, tu apellido y un correo. Tu progreso de invitado en este dispositivo se suma a la cuenta."
      footer={
        <p>
          ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
        </p>
      }
    >
      {(!context.available || !context.signUp) && (
        <Alert tone="warning" title="El registro no está disponible en este momento.">
          Puedes seguir estudiando como invitado: tu avance se guarda en este dispositivo.
        </Alert>
      )}
      <SignUpForm action={signUpAction} />
      <AccessMethods
        microsoftAction={signInWithMicrosoftAction}
        microsoftEnabled={context.microsoft}
        next={ACCOUNT_HOME}
        guestLabel="Explorar sin crear cuenta"
      />
    </AuthLayout>
  );
}
