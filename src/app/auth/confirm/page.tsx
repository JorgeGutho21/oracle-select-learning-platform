import type { Metadata } from 'next';
import Link from 'next/link';
import { confirmEmailLinkAction } from '@/composition/accounts/auth-actions';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { AuthLayout } from '@/features/accounts/presentation/auth-layout';
import { ConfirmLinkForm } from '@/features/accounts/presentation/confirm-link-form';

export const metadata: Metadata = {
  title: 'Confirmar enlace',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const TITLES: Readonly<Record<string, { title: string; action: string }>> = {
  recovery: { title: 'Restablecer tu contraseña', action: 'Continuar y elegir contraseña' },
  email_change: { title: 'Confirmar tu nuevo correo', action: 'Confirmar el cambio de correo' },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tokenHash = firstParam(params.token_hash) ?? '';
  const type = firstParam(params.type) ?? 'email';
  const copy = TITLES[type] ?? { title: 'Confirmar tu correo', action: 'Confirmar mi correo' };
  return (
    <AuthLayout
      title={copy.title}
      lead="Pulsa el botón para terminar. El enlace sirve una sola vez."
      footer={
        <p>
          ¿El enlace caducó? <Link href="/login">Vuelve a la pantalla de acceso</Link> y pide uno
          nuevo.
        </p>
      }
    >
      <ConfirmLinkForm
        action={confirmEmailLinkAction}
        tokenHash={tokenHash}
        type={type}
        label={copy.action}
      />
    </AuthLayout>
  );
}
