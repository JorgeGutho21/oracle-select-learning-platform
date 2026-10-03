import type { AnswerFor, InteractionType, PublicMission } from '../../application/challenge-api';

export interface InteractionProps<T extends InteractionType> {
  mission: PublicMission<T>;
  answer: AnswerFor<T>;
  onChange: (answer: AnswerFor<T>) => void;
  disabled: boolean;
  /** Misión cerrada: puede mostrarse por qué cada fila cumple o no (nunca antes). */
  reveal?: boolean;
  /** Misión resuelta: la respuesta del estudiante es la correcta. */
  solved?: boolean;
}
