import type { Metadata } from 'next';
import { ModuleProgressRoot } from '@/composition/modules/module-progress-root';
import { ModulesPage } from '@/features/modules/presentation/modules-page';

export const metadata: Metadata = { title: 'Ruta de aprendizaje' };

export default function Page() {
  return <ModulesPage currentProgress={<ModuleProgressRoot />} />;
}
