import type { ReactNode } from 'react';
import { ModuleLayout } from '@/presentation/layouts/module-layout';

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <ModuleLayout mode="standard">{children}</ModuleLayout>;
}
