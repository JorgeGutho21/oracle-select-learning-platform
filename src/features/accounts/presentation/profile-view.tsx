import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Progress, StatusBadge } from '@/presentation/components/ui';
import {
  AUTH_METHOD_LABEL,
  displayName,
  initials,
  ROLE_LABEL,
  type AccountProfile,
} from '../application/account-api';

/**
 * Perfil: quién soy en DB LAB, cómo entro y cuánto llevo. Solo nombre y apellido se
 * editan aquí; el rol y el estado institucional los decide el servidor.
 */
export function ProfileView({
  profile,
  overall,
  form,
  signOut,
  notice,
}: {
  readonly profile: AccountProfile;
  readonly overall: {
    readonly done: number;
    readonly total: number;
    readonly percent: number;
  } | null;
  readonly form: ReactNode;
  readonly signOut: ReactNode;
  readonly notice?: ReactNode;
}) {
  return (
    <div className="profile-page">
      <header className="ds-page-header ds-page-header--light">
        <div className="site-container ds-page-header__inner profile-page__header">
          <span className="profile-avatar" aria-hidden="true">
            {initials(profile)}
          </span>
          <div>
            <p className="ds-page-header__eyebrow">Mi perfil</p>
            <h1>{displayName(profile)}</h1>
            <p className="ds-page-header__lead">{profile.email}</p>
          </div>
        </div>
      </header>
      <div className="site-container profile-page__content">
        {notice}
        <div className="profile-grid">
          <section className="profile-card" aria-labelledby="profile-data-title">
            <h2 id="profile-data-title">Tus datos</h2>
            {form}
            <p className="profile-card__note">
              El correo de la cuenta no se cambia desde aquí. DB LAB solo guarda tu nombre, tu
              apellido, tu correo y tu progreso.
            </p>
          </section>
          <section className="profile-card" aria-labelledby="profile-account-title">
            <h2 id="profile-account-title">Tu cuenta</h2>
            <dl className="profile-facts">
              <div>
                <dt>Método de acceso</dt>
                <dd>{AUTH_METHOD_LABEL[profile.authMethod]}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>{ROLE_LABEL[profile.role]}</dd>
              </div>
              <div>
                <dt>Correo institucional</dt>
                <dd>
                  {profile.institutional ? (
                    <StatusBadge tone="available">Verificado</StatusBadge>
                  ) : (
                    <StatusBadge tone="info">No reconocido</StatusBadge>
                  )}
                </dd>
              </div>
            </dl>
            {overall && (
              <div className="profile-progress">
                <Progress
                  label={`Progreso general: ${overall.done} de ${overall.total} lecciones`}
                  value={overall.done}
                  max={Math.max(overall.total, 1)}
                />
                <Link href={'/dashboard' as Route} className="inline-action">
                  Ver mi progreso <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
            <div className="profile-card__signout">{signOut}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
