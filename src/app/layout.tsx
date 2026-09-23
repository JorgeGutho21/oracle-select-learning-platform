import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/presentation/layouts/site-header';
import { SiteFooter } from '@/presentation/layouts/site-footer';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: { default: 'SQL SELECT LAB', template: '%s | SQL SELECT LAB' },
  description:
    'Plataforma universitaria para aprender SELECT en Oracle SQL. Universidad Popular del Cesar.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
