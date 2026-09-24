import type { AnswerFor, InteractionType, PublicMission } from '../../application/challenge-api';

export interface InteractionProps<T extends InteractionType> {
  mission: PublicMission<T>;
  answer: AnswerFor<T>;
  onChange: (answer: AnswerFor<T>) => void;
  disabled: boolean;
}
