import type { Metadata } from 'next';
import { LearningOverviewRoot } from '@/composition/sections/learning-progress-root';
import { SECTION_LIST } from '@/features/sections/application/sections-api';
import { SectionsHub } from '@/features/sections/presentation/sections-hub';
import { sectionProgress, sectionSummary } from '@/composition/sections/progress-slots';

export const metadata: Metadata = {
  title: 'Secciones',
  description:
    'Ruta académica de DB LAB: Fundamentos SQL, Consultas relacionales y análisis, y PL/SQL y automatización.',
};

export default function Page() {
  return (
    <SectionsHub
      sections={SECTION_LIST}
      overview={<LearningOverviewRoot sections={SECTION_LIST.map(sectionSummary)} />}
      progressFor={sectionProgress}
    />
  );
}
