'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/presentation/components/ui';

function Submit({ label }: { readonly label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Confirmando…"
      className="auth-form__submit"
    >
      {label}
    </Button>
  );
}

/** El token del correo se canjea al pulsar, no al abrir el enlace. */
export function ConfirmLinkForm({
  action,
  tokenHash,
  type,
  label,
}: {
  readonly action: (formData: FormData) => Promise<void>;
  readonly tokenHash: string;
  readonly type: string;
  readonly label: string;
}) {
  return (
    <form className="auth-form" action={action}>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <Submit label={label} />
    </form>
  );
}
