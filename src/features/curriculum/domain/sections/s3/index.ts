import type { SectionCurriculum } from '../../types';
import { ACTIVITY_EXAMPLES, S3_MISSIONS, S3_PRACTICE } from './activities';
import { BASICS_EXAMPLES, BASICS_LESSONS } from './basics';
import { S3_CONCEPTS } from './concepts';
import { PROGRAMS_EXAMPLES, PROGRAMS_LESSONS } from './programs';
import { S3_BLOCKS, S3_SCENES } from './scenes';
import { TRIGGER_EXAMPLES, TRIGGER_LESSONS } from './triggers';

/** Sección 3 · PL/SQL y automatización (dataset empresa-relacional-v1). */
export const S3_CURRICULUM: SectionCurriculum = {
  section: 'plsql',
  dataset: 'empresa-v1',
  blocks: S3_BLOCKS,
  concepts: S3_CONCEPTS,
  lessons: [...BASICS_LESSONS, ...PROGRAMS_LESSONS, ...TRIGGER_LESSONS],
  examples: [...BASICS_EXAMPLES, ...PROGRAMS_EXAMPLES, ...TRIGGER_EXAMPLES, ...ACTIVITY_EXAMPLES],
  practice: S3_PRACTICE,
  missions: S3_MISSIONS,
  scenes: S3_SCENES,
};
