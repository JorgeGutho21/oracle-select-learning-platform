import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { PRACTICE_RULES } from '@/features/challenge/application/challenge-api';
import { STAGE_LABEL, upcomingLevels } from '@/features/modules/application/modules-api';
import { getVideo } from '@/features/resources/application/resources-api';
import { analyzeLabQuery, EMPLEADOS } from '@/features/laboratory/application/lab-api';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  STUDY_BLOCKS,
} from '@/features/study/application/lesson-index';
import { CellValueView } from '@/presentation/components/data/cell-format';
import { highlightSql } from '@/presentation/components/data/sql-code';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { HomeDemonstration } from './home-demonstration';

/** Consulta de la portada; su resultado sale del motor educativo y del dataset único. */
const HERO_SQL = `SELECT nombre,
       salario * 12 AS salario_anual
FROM   empleados
WHERE  ciudad = 'Bogotá'
ORDER BY salario_anual DESC;`;

function HeroTerminal() {
  const preview = analyzeLabQuery(HERO_SQL).preview;
  return (
    <figure className="home-terminal" aria-label="Ejemplo de consulta y su resultado">
      <div className="home-terminal__bar" aria-hidden="true">
        <span className="home-terminal__dots">
          <i />
          <i />
          <i />
        </span>
        <span>{EMPLEADOS.id}</span>
      </div>
      <pre className="home-terminal__code">
        <code>{highlightSql(HERO_SQL)}</code>
      </pre>
      {preview && (
        <div
          className="home-terminal__result"
          role="region"
          aria-label={`Vista educativa · ${preview.rows.length} filas`}
          tabIndex={0}
        >
          <table>
            <caption>Vista educativa · {preview.rows.length} filas</caption>
            <thead>
              <tr>
                {preview.columns.map((column) => (
                  <th key={column.name} scope="col">
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((value, cell) => (
                    <td key={cell} className={typeof value === 'number' ? 'is-number' : undefined}>
                      <CellValueView value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

export function HomePage({ progress }: { readonly progress: ReactNode }) {
  const intro = getVideo('intro');
  return (
    <div className="home">
      <section className="home-band home-band--night home-hero" aria-labelledby="home-title">
        <div className="site-container home-hero__grid">
          <div className="home-hero__copy">
            <p className="home-eyebrow">Oracle Database · SQL Fundamentals</p>
            <h1 id="home-title" className="home-hero__title">
              <span className="home-hero__select">SELECT</span>{' '}
              <span className="home-hero__rest">
                en Oracle SQL<span aria-hidden="true">.</span>
              </span>
            </h1>
            <p className="home-hero__lead">
              Aprende a pedir datos a una tabla: elegir columnas, calcular, filtrar filas, tratar
              valores vacíos y ordenar el resultado. Sin experiencia previa.
            </p>
            <p className="home-hero__byline">
              <span>{identity.author}</span>
              <span>{identity.course}</span>
              <span>{identity.institution}</span>
            </p>
            <nav className="home-hero__actions" aria-label="Recorridos principales">
              <Link href="/presentation" className="hero-action hero-action--primary">
                Iniciar clase <span aria-hidden="true">→</span>
              </Link>
              <Link href="/learn" className="hero-action">
                Modo Estudio <span aria-hidden="true">→</span>
              </Link>
              <Link href="/lab" className="hero-action">
                Laboratorio SQL <span aria-hidden="true">→</span>
              </Link>
              <Link href="/challenge" className="hero-action">
                SQL Challenge <span aria-hidden="true">→</span>
              </Link>
            </nav>
          </div>
          <HeroTerminal />
        </div>
      </section>

      <section
        className="home-band home-band--light home-identity"
        aria-label="Identidad académica"
      >
        <div className="site-container home-identity__inner">
          <Image
            src={identity.logo}
            width={805}
            height={417}
            alt={identity.institution}
            className="home-identity__logo"
            priority
          />
          <dl className="home-identity__facts">
            <div>
              <dt>Universidad</dt>
              <dd>{identity.institution}</dd>
            </div>
            <div>
              <dt>Programa</dt>
              <dd>{identity.program}</dd>
            </div>
            <div>
              <dt>Asignatura</dt>
              <dd>{identity.course}</dd>
            </div>
            <div>
              <dt>Unidad</dt>
              <dd>{identity.unitTitle}</dd>
            </div>
            <div>
              <dt>Autor</dt>
              <dd>{identity.author}</dd>
            </div>
            <div>
              <dt>Profesor</dt>
              <dd>{identity.teacher}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="home-band home-band--soft" aria-labelledby="learn-title">
        <div className="site-container">
          <header className="home-heading">
            <p className="home-eyebrow">01 · Qué aprenderás</p>
            <h2 id="learn-title">
              {STUDY_BLOCKS.length} bloques, {LESSON_COUNT} lecciones. Una sola tabla.
            </h2>
            <p>
              Todo el recorrido usa EMPLEADOS: {EMPLEADOS.rows.length} personas y{' '}
              {EMPLEADOS.columns.length} columnas. Cada lección muestra la tabla, la consulta, lo
              que hace y el resultado.
            </p>
          </header>
          <ol className="home-path">
            {STUDY_BLOCKS.map((block) => {
              const lessons = LESSON_INDEX.filter((lesson) => lesson.block === block.id);
              const first = lessons[0]!;
              return (
                <li key={block.id}>
                  <Link href={`/learn/${first.slug}`} className="home-path__card">
                    <span className="home-path__number">{block.letter}</span>
                    <span className="home-path__copy">
                      <strong>{block.title}</strong>
                      <span>{block.summary}</span>
                    </span>
                    <code className="home-path__code">
                      {lessons.map((lesson) => lesson.badge).join(' · ')}
                    </code>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="home-band home-band--primary" aria-labelledby="demo-title">
        <div className="site-container home-demo-band">
          <header className="home-heading home-heading--inverse">
            <p className="home-eyebrow">02 · Pruébalo ahora</p>
            <h2 id="demo-title">Elige columnas. Mira el resultado.</h2>
            <p>
              Toca las columnas en el orden que quieras. La consulta se escribe sola y todas las
              filas se conservan: SELECT elige columnas, no filas.
            </p>
          </header>
          <HomeDemonstration />
        </div>
      </section>

      <section className="home-band home-band--tech" aria-labelledby="challenge-title">
        <div className="site-container home-challenge">
          <div className="home-challenge__copy">
            <p className="home-eyebrow">03 · SQL Oracle Challenge</p>
            <h2 id="challenge-title">Diez misiones para demostrar lo aprendido.</h2>
            <p>
              Ordena piezas, predice resultados, detecta errores y escribe la consulta final. Con
              ratón, toque o teclado.
            </p>
            <Link href="/challenge" className="hero-action hero-action--primary">
              SQL Challenge <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="home-challenge__console" aria-label="Reglas de la práctica">
            <p className="home-challenge__prompt">
              <span aria-hidden="true">$</span> reglas --practica-individual
            </p>
            <dl>
              <div>
                <dt>Misiones</dt>
                <dd>10</dd>
              </div>
              <div>
                <dt>Puntos máximos</dt>
                <dd>{PRACTICE_RULES.maxScorePerMission * 10}</dd>
              </div>
              <div>
                <dt>Intentos puntuados</dt>
                <dd>{PRACTICE_RULES.maxScoredAttempts} por misión</dd>
              </div>
              <div>
                <dt>Pista opcional</dt>
                <dd>−{PRACTICE_RULES.hintPenalty} puntos</dd>
              </div>
            </dl>
            <p className="home-challenge__note">
              El reto final se califica con Oracle; mientras el servicio no esté conectado, se
              revisa su estructura sin puntuar.
            </p>
          </div>
        </div>
      </section>

      <section className="home-band home-band--light" aria-labelledby="start-title">
        <div className="site-container home-start">
          <div className="home-video">
            <header className="home-heading home-heading--compact">
              <p className="home-eyebrow">Inicio del recorrido</p>
              <h2 id="start-title">Antes de empezar</h2>
            </header>
            <VideoPlayer
              title={intro.title}
              description={intro.description}
              orientation={intro.orientation}
              source={intro.source}
              poster={intro.poster}
              captions={intro.captions}
              transcriptUrl={intro.transcriptUrl}
            />
          </div>
          <div className="home-progress">
            {progress}
            <Link href="/learn/introduccion" className="inline-action">
              Empezar por «¿Qué es SQL?» <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="home-band home-band--light home-future"
        id="proximos-modulos"
        aria-labelledby="future-title"
      >
        <div className="site-container">
          <header className="home-heading">
            <p className="home-eyebrow">La ruta continúa</p>
            <h2 id="future-title">Después de SELECT.</h2>
            <p>
              Esta unidad es el nivel 1. Los siguientes ya tienen sus temas definidos y aparecen
              como «Próximamente».
            </p>
          </header>
          <ul className="home-future__grid">
            {upcomingLevels().map((level) => (
              <li key={level.id}>
                <span className="home-future__tag">
                  Nivel {level.number} · {STAGE_LABEL[level.stage]} · Próximamente
                </span>
                <strong>{level.title}</strong>
                <span>{level.topics.map((topic) => topic.title).join(' · ')}</span>
              </li>
            ))}
          </ul>
          <Link href="/modules" className="inline-action home-future__link">
            Ver la ruta de aprendizaje <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
