import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import {
  ACADEMIC_IDENTITY as identity,
  PRODUCT_IDENTITY as product,
} from '@/application/academic-identity';
import { publicUrlFromEnvironment } from '@/application/public-url';
import { AccountRoot } from '@/composition/accounts/account-root';
import { AppShell } from '@/presentation/layouts/app-shell';
import '@/styles/globals.scss';

// Inter (OFL), autoalojada: mismas medidas en Windows, Linux, macOS y en el proyector. Con
// la fuente del sistema, una misma escena cabía en Segoe UI y no en DejaVu Sans.
const inter = localFont({
  src: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

const description = `${product.subtitle}. ${product.pitch} ${identity.course}, ${identity.program}, ${identity.institution}.`;
const defaultTitle = `${product.name} · ${product.subtitle}`;
// Base de las URL absolutas de OpenGraph. Sin dirección configurada, Next usa la de Vercel.
const siteUrl = publicUrlFromEnvironment().url;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: defaultTitle, template: `%s | ${product.name}` },
  description,
  applicationName: product.name,
  authors: [{ name: identity.author }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: product.name,
    title: defaultTitle,
    description,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <AppShell account={<AccountRoot />}>{children}</AppShell>
      </body>
    </html>
  );
}
