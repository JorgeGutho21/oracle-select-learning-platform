import Link from 'next/link';
import type { ReactNode } from 'react';
import { PRODUCT_IDENTITY as product } from '@/application/academic-identity';
import { ShapeGrid } from '@/presentation/components/effects/shape-grid';

/**
 * Composición de las pantallas de acceso: a un lado la identidad de DB LAB (con la
 * cuadrícula de la portada, muy tenue) y al otro el formulario. En móvil queda una sola
 * columna con el formulario primero en importancia y una franja de identidad breve.
 */

const BENEFITS = [
  'Tu avance se sincroniza entre el computador de la sala y tu teléfono.',
  'Retomas cada sección donde la dejaste.',
  'Sin cuenta también puedes estudiar: el avance queda en este dispositivo.',
] as const;

export interface AuthLayoutProps {
  readonly title: string;
  readonly lead?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function AuthLayout({ title, lead, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <aside className="auth-visual" aria-label="DB LAB">
        <ShapeGrid className="auth-visual__grid" cellSize={56} speed={0.12} />
        <div className="auth-visual__copy">
          <Link href="/" className="auth-visual__brand">
            DB <span>LAB</span>
          </Link>
          <p className="auth-visual__subtitle">{product.subtitle}</p>
          <ul className="auth-visual__benefits">
            {BENEFITS.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel__inner">
          <h1 id="auth-title" className="auth-panel__title">
            {title}
          </h1>
          {lead && <p className="auth-panel__lead">{lead}</p>}
          {children}
          {footer && <div className="auth-panel__footer">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
