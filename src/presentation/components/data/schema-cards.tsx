/**
 * Esquema de una tabla como fichas agrupadas (IDENTIDAD, ORGANIZACIÓN, COMPENSACIÓN…):
 * nombre, tipo Oracle y si admite NULL. Sustituye a las tablas de diccionario que
 * necesitaban barra horizontal en móvil. Solo presenta: no conoce el dataset.
 */

export interface SchemaColumn {
  readonly name: string;
  readonly oracleType: string;
  readonly nullable: boolean;
  readonly description?: string;
}

export interface SchemaGroup {
  readonly id: string;
  readonly title: string;
  readonly columns: readonly string[];
}

export function SchemaCards({
  groups,
  columns,
  highlighted = [],
  describe = false,
  headingLevel: Heading = 'h3',
  label,
  baseTypes = false,
}: {
  readonly groups: readonly SchemaGroup[];
  readonly columns: readonly SchemaColumn[];
  /** Columnas que usa la consulta actual. */
  readonly highlighted?: readonly string[];
  /** Muestra la descripción de cada columna (diccionario de datos). */
  readonly describe?: boolean;
  readonly headingLevel?: 'h2' | 'h3' | 'h4' | 'p';
  readonly label?: string;
  /** Solo el tipo base (VARCHAR2 en lugar de VARCHAR2(40 CHAR)): para fichas compactas. */
  readonly baseTypes?: boolean;
}) {
  const byName = new Map(columns.map((column) => [column.name, column]));
  return (
    <div
      className={`schema-cards${describe ? ' schema-cards--described' : ''}`}
      {...(label ? { role: 'group', 'aria-label': label } : {})}
    >
      {groups.map((group) => (
        <section key={group.id} className={`schema-group group--${group.id}`}>
          <Heading className="schema-group__title">{group.title}</Heading>
          <ul className="schema-group__list">
            {group.columns.map((name) => {
              const column = byName.get(name);
              if (!column) return null;
              const used = highlighted.includes(name);
              return (
                <li key={name} className={used ? 'is-used' : undefined}>
                  <code className="schema-group__name">{name}</code>
                  <span className="schema-group__type">
                    {baseTypes ? column.oracleType.replace(/\(.*\)$/, '') : column.oracleType}
                  </span>
                  {column.nullable &&
                    (baseTypes ? (
                      <span className="schema-group__null">
                        <span className="visually-hidden">admite </span>NULL
                      </span>
                    ) : (
                      <span className="schema-group__null">admite NULL</span>
                    ))}
                  {used && <span className="visually-hidden"> (la usa la consulta)</span>}
                  {describe && column.description && (
                    <span className="schema-group__description">{column.description}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
