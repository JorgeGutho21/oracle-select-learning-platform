import { HomePage } from '@/presentation/pages/home-page';
import { StudyProgressRoot } from '@/composition/study/study-progress-root';

export default function Page() {
  return <HomePage progress={<StudyProgressRoot />} />;
}
