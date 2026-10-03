import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  ACADEMIC_IDENTITY as identity,
  PRODUCT_IDENTITY as product,
} from '@/application/academic-identity';
import { publicUrlFromEnvironment } from '@/application/public-url';
import { AccountRoot } from '@/composition/accounts/account-root';
import { AppShell } from '@/presentation/layouts/app-shell';
import '@/styles/globals.scss';

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
    <html lang="es">
      <body>
        <AppShell account={<AccountRoot />}>{children}</AppShell>
      </body>
    </html>
  );
}
