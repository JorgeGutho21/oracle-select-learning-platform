'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/presentation/components/ui';

/** Botón de envío de un formulario de acción de servidor: evita el doble envío. */
export function SubmitButton({
  label,
  pendingLabel,
  variant = 'primary',
  className,
}: {
  readonly label: string;
  readonly pendingLabel: string;
  readonly variant?: 'primary' | 'secondary' | 'text';
  readonly className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      pending={pending}
      pendingLabel={pendingLabel}
      className={className}
    >
      {label}
    </Button>
  );
}
