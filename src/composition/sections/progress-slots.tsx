import { SectionProgressRoot, type SectionSummary } from './learning-progress-root';
import type { SectionDto } from '@/features/sections/application/sections-api';
import { SectionProgressMeter } from '@/features/sections/presentation/learning-overview';

export function sectionSummary(section: SectionDto): SectionSummary {
  return { id: section.id, code: section.code, title: section.title, status: section.status };
}

/** Avance real (cliente) en la sección disponible; estado neutro en las demás. */
export function sectionProgress(section: SectionDto) {
  if (section.status === 'available') {
    return <SectionProgressRoot section={sectionSummary(section)} />;
  }
  return <SectionProgressMeter item={{ ...sectionSummary(section), done: null, total: null }} />;
}
