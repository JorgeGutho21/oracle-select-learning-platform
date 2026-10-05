import Link from 'next/link';

/** Three real study destinations; the fragments describe syntax, not executed results. */
export function AcademicPathVisual() {
  return (
    <nav className="db-academic-path" aria-label="De consultar a automatizar">
      <Link href="/sections/fundamentos-sql/study">
        <span className="db-academic-path__number">01</span>
        <strong>Consultar</strong>
        <code>SELECT · FROM · WHERE</code>
      </Link>
      <Link href="/sections/consultas-relacionales/study">
        <span className="db-academic-path__number">02</span>
        <strong>Relacionar</strong>
        <code>Tabla A → ON ← Tabla B</code>
      </Link>
      <Link href="/sections/plsql/study">
        <span className="db-academic-path__number">03</span>
        <strong>Automatizar</strong>
        <code>BEGIN → acciones → END;</code>
      </Link>
    </nav>
  );
}
