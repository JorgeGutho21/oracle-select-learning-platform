import Link from 'next/link';
import type { Route } from 'next';
import { LESSONS, lessonLabHref } from '@/features/study/application/study-api';
import { CodeBlock } from '@/presentation/components/ui';

/** Recursos de la unidad vigente; los vídeos se incorporarán al recibir los activos. */
export function ResourcesPage() {
  return (
    <div className="site-container feature-page resources-page">
      <header className="feature-heading">
        <span className="eyebrow">Consultar y repasar</span>
        <h1>Recursos de SELECT</h1>
        <p className="readable muted">
          Una referencia breve para volver a los conceptos esenciales. Los ejemplos comparten la
          misma tabla EMPLEADOS que Estudio y el laboratorio.
        </p>
      </header>
      <nav className="resources-shortcuts" aria-label="Secciones de recursos">
        <a href="#chuleta">Chuleta de SELECT</a>
        <a href="#videos">Vídeos</a>
        <a href="#fuentes">Fuentes</a>
        <Link href="/#proximos-modulos">Próximos módulos</Link>
      </nav>
      <section id="chuleta" aria-labelledby="cheatsheet-title">
        <h2 id="cheatsheet-title">SELECT, a mano</h2>
        <p>La consulta elige una vista de los datos. El origen sigue intacto.</p>
        <div className="resources-grid">
          {LESSONS.filter((lesson) => lesson.id !== 'L00' && lesson.id !== 'L08').map((lesson) => (
            <article className="resource-card" id={`chuleta-${lesson.slug}`} key={lesson.id}>
              <h3>{lesson.shortTitle}</h3>
              <pre className="resource-syntax">
                <code>{lesson.syntax}</code>
              </pre>
              <p>{lesson.translation}</p>
              <CodeBlock
                code={lesson.sql}
                labHref={lessonLabHref(lesson.sql, `/learn/${lesson.slug}`) as Route}
              />
              <Link className="inline-action" href={`/learn/${lesson.slug}` as Route}>
                Repasar {lesson.shortTitle} →
              </Link>
            </article>
          ))}
        </div>
        <p className="resources-note">
          AS cambia el encabezado del resultado. DISTINCT compara toda la fila proyectada. Sin ORDER
          BY no hay un orden garantizado de filas.
        </p>
      </section>
      <section id="videos" className="resources-section" aria-labelledby="videos-title">
        <h2 id="videos-title">Vídeos de la unidad</h2>
        <p>
          Los vídeos están en preparación. Las lecciones permiten completar el recorrido sin ellos.
        </p>
        <div className="resources-grid">
          <article className="resource-card" id="video-introduccion">
            <span className="home-future-tag">En preparación</span>
            <h3>Introducción a SELECT</h3>
            <p>De una necesidad cotidiana a SELECT y FROM. Duración prevista: 90–120 segundos.</p>
            <Link className="inline-action" href="/learn/introduccion">
              Leer la introducción →
            </Link>
          </article>
          <article className="resource-card" id="video-resumen">
            <span className="home-future-tag">En preparación</span>
            <h3>Resumen de la unidad</h3>
            <p>Columnas, cálculos, alias y DISTINCT. Duración prevista: 3–4 minutos.</p>
            <Link className="inline-action" href="/learn/consulta-completa">
              Repasar una consulta completa →
            </Link>
          </article>
        </div>
        <p className="muted">
          Se incorporarán con controles de reproducción, subtítulos revisados y transcripción. No
          hay reproducción automática.
        </p>
      </section>
      <section id="fuentes" className="resources-section" aria-labelledby="sources-title">
        <h2 id="sources-title">Fuentes y alcance</h2>
        <p className="readable">
          Material académico adaptado de las presentaciones SELECT (F1) y SELECT complementaria
          (F2), identificadas en el mapa de contenido del proyecto. Cada lección indica las
          diapositivas de referencia.
        </p>
        <a
          className="inline-action"
          href="https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html"
          target="_blank"
          rel="noreferrer"
        >
          Referencia oficial de SELECT en Oracle 19c ↗
        </a>
        <p className="muted readable">
          Este curso trabaja con una sola tabla y un subconjunto de SELECT. Los ejemplos son
          representaciones educativas; la ejecución real en Oracle requiere la conexión del
          laboratorio.
        </p>
      </section>
    </div>
  );
}
