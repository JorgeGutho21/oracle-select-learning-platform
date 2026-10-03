import Link from 'next/link';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';

/**
 * Otras formas de entrar: Microsoft (si el proyecto lo tiene configurado) e invitado. Sin
 * configuración de Microsoft el botón no se ofrece como activo y se explica por qué.
 */

export interface AccessMethodsProps {
  readonly microsoftAction: (formData: FormData) => Promise<void>;
  readonly microsoftEnabled: boolean;
  readonly next: string;
  readonly guestLabel: string;
}

function MicrosoftLogo() {
  return (
    <svg className="access-method__logo" viewBox="0 0 21 21" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function AccessMethods({
  microsoftAction,
  microsoftEnabled,
  next,
  guestLabel,
}: AccessMethodsProps) {
  return (
    <div className="access-methods">
      <p className="access-methods__divider">
        <span>o</span>
      </p>
      <SpotlightCard className="access-method">
        {microsoftEnabled ? (
          <form action={microsoftAction}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="access-method__button">
              <MicrosoftLogo />
              <span>Continuar con Microsoft</span>
            </button>
          </form>
        ) : (
          <div className="access-method__unavailable">
            <button
              type="button"
              className="access-method__button"
              disabled
              aria-describedby="microsoft-status"
            >
              <MicrosoftLogo />
              <span>Continuar con Microsoft</span>
            </button>
            <p id="microsoft-status" className="access-method__note">
              Todavía no está configurado en este entorno. Usa tu correo o sigue como invitado.
            </p>
          </div>
        )}
      </SpotlightCard>
      <SpotlightCard className="access-method">
        <Link href="/sections" className="access-method__button access-method__button--guest">
          <svg
            className="access-method__logo"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
          <span>{guestLabel}</span>
        </Link>
        <p className="access-method__note">Tu progreso se guarda en este dispositivo.</p>
      </SpotlightCard>
    </div>
  );
}
