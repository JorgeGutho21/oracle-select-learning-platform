import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { publicUrlFromEnvironment } from '@/application/public-url';
import { SiteHeader } from '@/presentation/layouts/site-header';
import { SiteFooter } from '@/presentation/layouts/site-footer';
import '@/styles/globals.scss';

const description = `Plataforma universitaria para aprender ${identity.unitTitle}. ${identity.course}, ${identity.program}, ${identity.institution}.`;
// Base de las URL absolutas de OpenGraph. Sin dirección configurada, Next usa la de Vercel.
const siteUrl = publicUrlFromEnvironment().url;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: `${identity.unitTitle} | SQL SELECT LAB`, template: '%s | SQL SELECT LAB' },
  description,
  applicationName: 'SQL SELECT LAB',
  authors: [{ name: identity.author }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SQL SELECT LAB',
    title: `${identity.unitTitle} | SQL SELECT LAB`,
    description,
  },
  twitter: { card: 'summary_large_image' },
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
