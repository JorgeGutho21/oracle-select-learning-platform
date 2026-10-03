import type { SectionId } from '@/features/sections/domain/sections';

/**
 * Temas del banco por sección. La clave se guarda en `question_bank.topic`; el nombre es el
 * que ve el profesor. Coinciden con el tema (`topic`) de las lecciones de cada sección
 * (features/curriculum): una pregunta remite a las lecciones de su tema.
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
    { key: 'funciones', label: 'Funciones de una fila' },
  ],
  'consultas-relacionales': [
    { key: 'relaciones', label: 'Relaciones: PK, FK y alias' },
    { key: 'join', label: 'INNER JOIN y joins múltiples' },
    { key: 'otros-join', label: 'OUTER, SELF y CROSS JOIN' },
    { key: 'agregacion', label: 'Funciones de grupo' },
    { key: 'grupos', label: 'GROUP BY, HAVING y WHERE frente a HAVING' },
    { key: 'subconsultas', label: 'Subconsultas' },
    { key: 'conjuntos', label: 'Operadores de conjuntos e integración' },
  ],
  plsql: [
    { key: 'bloques', label: 'Fundamentos y estructura de bloques' },
    { key: 'variables', label: 'Variables, tipos y SELECT INTO' },
    { key: 'control', label: 'IF, CASE y control de flujo' },
    { key: 'cursores', label: 'Bucles y cursores' },
    { key: 'excepciones', label: 'Excepciones' },
    { key: 'subprogramas', label: 'Procedimientos, funciones y parámetros' },
    { key: 'paquetes', label: 'Paquetes' },
    { key: 'triggers', label: 'Triggers' },
  ],
};

export function topicLabel(section: SectionId, key: string): string {
  return ASSESSMENT_TOPICS[section].find((topic) => topic.key === key)?.label ?? key;
}

export function isTopicOf(section: SectionId, key: string): boolean {
  return ASSESSMENT_TOPICS[section].some((topic) => topic.key === key);
}
