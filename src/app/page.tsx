import {
  ContinueLearningLink,
  HomeProgressRoot,
} from '@/composition/sections/learning-progress-root';
import { sectionProgress, sectionSummary } from '@/composition/sections/progress-slots';
import { SECTION_LIST } from '@/features/sections/application/sections-api';
import { HomePage } from '@/presentation/pages/home-page';

export default function Page() {
  return (
    <HomePage
      progress={<HomeProgressRoot sections={SECTION_LIST.map(sectionSummary)} />}
      continueAction={
        <ContinueLearningLink className="hero-action">
          Continuar aprendiendo <span aria-hidden="true">→</span>
        </ContinueLearningLink>
      }
      sectionProgress={sectionProgress}
    />
  );
}
