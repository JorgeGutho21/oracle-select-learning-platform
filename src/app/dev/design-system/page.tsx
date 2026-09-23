import type { Metadata } from 'next';
import { DesignSystemShowcase } from '@/presentation/design-system/showcase';

export const metadata: Metadata = {
  title: 'Sistema de diseño',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DesignSystemShowcase />;
}
