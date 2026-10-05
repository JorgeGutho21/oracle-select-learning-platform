import type { SectionCurriculum } from '../../types';
import { pedagogicalScenes } from '../../pedagogy';
import { MICRO_EXAMPLES, withMicroExamples } from '../../micro-examples';
import { ACTIVITY_EXAMPLES, S2_MISSIONS, S2_PRACTICE } from './activities';
import { ANALYSIS_EXAMPLES, ANALYSIS_LESSONS } from './analysis';
import { S2_CONCEPTS } from './concepts';
import { JOIN_EXAMPLES, JOIN_LESSONS } from './joins';
import { S2_BLOCKS, S2_SCENES } from './scenes';

/** Sección 2 · Consultas relacionales y análisis (dataset empresa-relacional-v1). */
const lessons = withMicroExamples([...JOIN_LESSONS, ...ANALYSIS_LESSONS]);
export const S2_CURRICULUM: SectionCurriculum = {
  section: 'consultas-relacionales',
  dataset: 'empresa-v1',
  blocks: S2_BLOCKS,
  concepts: S2_CONCEPTS,
  lessons,
  examples: [
    ...JOIN_EXAMPLES,
    ...ANALYSIS_EXAMPLES,
    ...ACTIVITY_EXAMPLES,
    ...MICRO_EXAMPLES.filter(({ id }) => id.startsWith('S2')),
  ],
  practice: S2_PRACTICE,
  missions: S2_MISSIONS,
  scenes: pedagogicalScenes(S2_SCENES, lessons, S2_CONCEPTS),
};
