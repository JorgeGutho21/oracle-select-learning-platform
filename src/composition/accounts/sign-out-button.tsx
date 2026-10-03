'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/presentation/components/ui';
import { signOutAction } from './auth-actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" pending={pending} pendingLabel="Cerrando sesión…">
      Cerrar sesión
    </Button>
  );
}

/** Cierra sesión después de subir el avance pendiente y limpiar este dispositivo. */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        const { progressSync } = await import('../progress/progress-sync-client');
        await progressSync().signOut();
        await signOutAction();
      }}
    >
      <Submit />
    </form>
  );
}
