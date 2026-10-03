import type { Metadata } from 'next';
import Link from 'next/link';
import { requestPasswordResetAction } from '@/composition/accounts/auth-actions';
import { AuthLayout } from '@/features/accounts/presentation/auth-layout';
import { ForgotPasswordForm } from '@/features/accounts/presentation/auth-forms';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthLayout
      title="Recuperar contraseña"
      lead="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva."
      footer={
        <p>
          ¿La recordaste? <Link href="/login">Iniciar sesión</Link>
        </p>
      }
    >
      <ForgotPasswordForm action={requestPasswordResetAction} />
    </AuthLayout>
  );
}
