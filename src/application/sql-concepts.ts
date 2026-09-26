/**
 * Acceso de la interfaz a la fuente conceptual única. La presentación no importa el dominio
 * directamente (ARCHITECTURE.md): usa esta fachada.
 */
export {
  CONCEPT_CATEGORY_LABEL,
  CONCEPT_IDS,
  SQL_CONCEPTS,
  concept,
  conceptCategoryLabel,
  conceptsOfLesson,
  type ConceptCategory,
  type ConceptId,
  type ConceptMistake,
  type SqlConcept,
} from '@/domain/concepts/sql-concepts';
