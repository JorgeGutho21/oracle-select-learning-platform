import type { SectionId } from '@/features/sections/domain/sections';

/**
 * Temas del banco por sección. La clave se guarda en `question_bank.topic`; el nombre es el
 * que ve el profesor. Los temas de las secciones 2 y 3 siguen su plan publicado
 * (features/sections) y quedan listos para recibir preguntas.
 */
export interface AssessmentTopic {
  readonly key: string;
  readonly label: string;
}

export const ASSESSMENT_TOPICS: Readonly<Record<SectionId, readonly AssessmentTopic[]>> = {
  'fundamentos-sql': [
    { key: 'fundamentos', label: 'Bases de datos, tablas y SQL' },
    { key: 'select-from', label: 'SELECT y FROM' },
    { key: 'expresiones', label: 'Expresiones y precedencia' },
    { key: 'alias-concatenacion', label: 'Alias y concatenación' },
    { key: 'distinct', label: 'DISTINCT' },
    { key: 'where', label: 'WHERE y comparaciones' },
    { key: 'logicos', label: 'AND, OR y NOT' },
    { key: 'between-in-like', label: 'BETWEEN, IN y LIKE' },
    { key: 'null', label: 'NULL' },
    { key: 'order-by', label: 'ORDER BY' },
    { key: 'consulta-completa', label: 'Consulta completa y errores frecuentes' },
  ],
  'consultas-relacionales': [
    { key: 'relaciones', label: 'Relaciones: PK y FK' },
    { key: 'join', label: 'JOIN' },
    { key: 'agregacion', label: 'Funciones de agregación' },
    { key: 'grupos', label: 'GROUP BY y HAVING' },
    { key: 'subconsultas', label: 'Subconsultas' },
    { key: 'conjuntos', label: 'Operadores de conjuntos' },
  ],
  plsql: [
    { key: 'bloques', label: 'Bloques PL/SQL' },
    { key: 'control', label: 'Control de flujo' },
    { key: 'cursores', label: 'Cursores' },
    { key: 'excepciones', label: 'Excepciones' },
    { key: 'subprogramas', label: 'Procedimientos y funciones' },
    { key: 'triggers', label: 'Triggers' },
  ],
};

export function topicLabel(section: SectionId, key: string): string {
  return ASSESSMENT_TOPICS[section].find((topic) => topic.key === key)?.label ?? key;
}

export function isTopicOf(section: SectionId, key: string): boolean {
  return ASSESSMENT_TOPICS[section].some((topic) => topic.key === key);
}
