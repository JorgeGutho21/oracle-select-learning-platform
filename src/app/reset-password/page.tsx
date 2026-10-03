import type { Metadata } from 'next';
import { updatePasswordAction } from '@/composition/accounts/auth-actions';
import { requireAccount } from '@/composition/accounts/auth-server';
import { AuthLayout } from '@/features/accounts/presentation/auth-layout';
import { NewPasswordForm } from '@/features/accounts/presentation/auth-forms';

export const metadata: Metadata = {
  title: 'Nueva contraseña',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const account = await requireAccount('/reset-password');
  return (
    <AuthLayout
      title="Elige una contraseña nueva"
      lead={`Cuenta: ${account.profile.email}. Al guardarla seguirás con la sesión iniciada.`}
    >
      <NewPasswordForm action={updatePasswordAction} />
    </AuthLayout>
  );
}
