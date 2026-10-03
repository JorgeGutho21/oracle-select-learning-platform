import { ContinueLearningLink } from '@/composition/sections/learning-progress-root';
import { sectionProgress } from '@/composition/sections/progress-slots';
import { StudyProgressRoot } from '@/composition/study/study-progress-root';
import { HomePage } from '@/presentation/pages/home-page';

export default function Page() {
  return (
    <HomePage
      progress={<StudyProgressRoot />}
      continueAction={
        <ContinueLearningLink className="hero-action">
          Continuar aprendiendo <span aria-hidden="true">→</span>
        </ContinueLearningLink>
      }
      sectionProgress={sectionProgress}
    />
  );
}
