import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ACADEMIC_IDENTITY as identity,
  PRODUCT_IDENTITY as product,
} from '@/application/academic-identity';
import { analyzeLabQuery, EMPLEADOS } from '@/features/laboratory/application/lab-api';
import { getVideo } from '@/features/resources/application/resources-api';
import { SECTION_LIST, type SectionDto } from '@/features/sections/application/sections-api';
import { SectionCard } from '@/features/sections/presentation/section-card';
import { CellValueView } from '@/presentation/components/data/cell-format';
import { QueryTransformation } from '@/presentation/components/data/query-transformation';
import { highlightSql } from '@/presentation/components/data/sql-code';
import { ShapeGrid } from '@/presentation/components/effects/shape-grid';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { HomeDemonstration } from './home-demonstration';
import { AcademicPathVisual } from './academic-path-visual';

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

/** Ejemplo del patrón tabla original → consulta → resultado, calculado por el motor. */
const PATTERN_SQL = `SELECT nombre, salario
FROM   empleados
WHERE  ciudad = 'Cali';`;

const EXPERIENCE = [
  { title: 'Conceptos', text: 'Qué hace cada cláusula y para qué sirve, en una frase.' },
  { title: 'Ejemplos', text: 'La tabla original, la consulta, el resultado y qué cambió.' },
  { title: 'Práctica', text: 'Laboratorio, mini comprobaciones y misiones del Challenge.' },
  { title: 'Ejecución', text: 'La misma consulta, ejecutada en Oracle Database.' },
  {
    title: 'Retroalimentación',
    text: 'Diagnóstico con el fragmento, la causa y una corrección posible.',
  },
] as const;

const ORACLE_FLOW = [
  { title: 'Escribes la consulta', text: 'En el editor SQL del laboratorio.' },
  {
    title: 'Análisis educativo',
    text: 'En tu navegador: sintaxis, alcance de la sección y vista educativa.',
  },
  {
    title: 'Servidor de DB LAB',
    text: 'Envía solo la sentencia validada. Las credenciales nunca salen del servidor.',
  },
  {
    title: 'Oracle Database',
    text: 'Una cuenta de solo lectura ejecuta la consulta sobre la tabla del curso.',
  },
  { title: 'Resultado real', text: 'Hasta 100 filas, rotuladas como resultado de Oracle.' },
] as const;

export interface HomePageProps {
  /** Progreso del Modo Estudio (cliente). */
  readonly progress: ReactNode;
  /** «Continuar aprendiendo», resuelto en el cliente con la última lección abierta. */
  readonly continueAction: ReactNode;
  /** Avance de cada sección en su tarjeta (cliente o estado neutro). */
  readonly sectionProgress: (section: SectionDto) => ReactNode;
}

export function HomePage({ progress, continueAction, sectionProgress }: HomePageProps) {
  const intro = getVideo('intro');
  const pattern = analyzeLabQuery(PATTERN_SQL).preview;
  return (
    <div className="home">
      <section className="home-band home-band--night home-hero" aria-labelledby="home-title">
        <ShapeGrid className="home-hero__grid-bg" />
        <div className="site-container home-hero__grid">
          <div className="home-hero__copy">
            <p className="home-eyebrow">Plataforma académica · Oracle Database</p>
            <h1 id="home-title" className="home-hero__title">
              DB <span>LAB</span>
            </h1>
            <p className="home-hero__subtitle">{product.subtitle}</p>
            <p className="home-hero__lead">{product.pitch}</p>
            <p className="home-hero__byline">
              <span>{identity.author}</span>
              <span>{identity.course}</span>
              <span>{identity.institution}</span>
            </p>
            <nav className="home-hero__actions" aria-label="Accesos principales">
              <Link href="/sections" className="hero-action hero-action--primary">
                Explorar plataforma <span aria-hidden="true">→</span>
              </Link>
              {continueAction}
            </nav>
          </div>
          <div className="home-hero__visual">
            <HeroTerminal />
            <AcademicPathVisual />
          </div>
        </div>
      </section>

      <section
        className="home-band home-band--light home-identity"
        aria-label="Identidad académica"
      >
        <div className="site-container home-identity__inner">
          <dl className="home-identity__facts">
            <div>
              <dt>Proyecto académico</dt>
              <dd>{product.name}</dd>
            </div>
            <div>
              <dt>Desarrollado por</dt>
              <dd>{identity.author}</dd>
            </div>
            <div>
              <dt>Docente</dt>
              <dd>{identity.teacher}</dd>
            </div>
            <div>
              <dt>Contexto</dt>
              <dd>{identity.course}</dd>
            </div>
            <div>
              <dt>Programa</dt>
              <dd>{identity.program}</dd>
            </div>
            <div>
              <dt>Universidad</dt>
              <dd>{identity.institution}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="home-band home-band--soft" aria-labelledby="route-title">
        <div className="site-container">
          <header className="home-heading">
            <p className="home-eyebrow">01 · La ruta</p>
            <h2 id="route-title">Tres secciones, una misma forma de aprender.</h2>
            <p>
              Empieza por los fundamentos y avanza hacia consultas con varias tablas y la
              programación en la base de datos. Cada sección indica qué aprenderás, cómo practicarás
              y en qué estado está.
            </p>
          </header>
          <ol className="section-grid">
            {SECTION_LIST.map((section) => (
              <li key={section.id}>
                <SectionCard section={section} progress={sectionProgress(section)} />
              </li>
            ))}
          </ol>
          <Link href="/sections" className="inline-action home-route__link">
            Ver las secciones y tu avance <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="home-band home-band--primary" aria-labelledby="experience-title">
        <div className="site-container">
          <header className="home-heading home-heading--inverse">
            <p className="home-eyebrow">02 · Cómo se aprende</p>
            <h2 id="experience-title">Del concepto a la ejecución, con retroalimentación.</h2>
            <p>
              Cada tema sigue el mismo recorrido. La consulta nunca aparece sola: siempre se ve la
              tabla de la que parte y el resultado que produce.
            </p>
          </header>
          <ol className="experience-steps">
            {EXPERIENCE.map((step, index) => (
              <li key={step.title}>
                <span className="experience-steps__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          {pattern && (
            <div className="home-pattern">
              <h3 className="home-pattern__title">El patrón de cada ejemplo</h3>
              <QueryTransformation
                tone="dark"
                sources={[
                  {
                    name: EMPLEADOS.table,
                    rows: EMPLEADOS.rows.length,
                    columns: EMPLEADOS.columns.length,
                  },
                ]}
                sql={PATTERN_SQL}
                explanation="WHERE conserva solo las filas de Cali y SELECT muestra dos columnas: nombre y salario."
                result={{ rows: pattern.rows.length, columns: pattern.columns.length }}
                resultLabel="Vista educativa"
              />
            </div>
          )}
          <div className="home-demo-band">
            <h3 className="home-pattern__title">
              Pruébalo ahora: elige columnas y mira el resultado
            </h3>
            <HomeDemonstration />
          </div>
        </div>
      </section>

      <section className="home-band home-band--tech" aria-labelledby="oracle-title">
        <div className="site-container home-oracle">
          <header className="home-heading home-heading--inverse">
            <p className="home-eyebrow">03 · Oracle real</p>
            <h2 id="oracle-title">Tus consultas, en Oracle Database.</h2>
            <p>
              El laboratorio no se queda en una simulación: cuando el servicio está conectado, la
              consulta validada se ejecuta en Oracle y el resultado se rotula como tal.
            </p>
          </header>
          <ol className="oracle-flow" aria-label="Recorrido de una consulta">
            {ORACLE_FLOW.map((step, index) => (
              <li key={step.title}>
                <span className="oracle-flow__number" aria-hidden="true">
                  {index + 1}
                </span>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <div className="home-oracle__footer">
            <p className="home-oracle__note">
              Si Oracle no está disponible, el laboratorio lo dice y muestra solo la vista
              educativa: nunca presenta una simulación como ejecución real.
            </p>
            <Link href="/lab" className="hero-action hero-action--primary">
              Probar en el laboratorio <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-band home-band--light" aria-labelledby="start-title">
        <div className="site-container home-start">
          <div className="home-video">
            <header className="home-heading home-heading--compact">
              <p className="home-eyebrow">Empieza aquí · Sección 1</p>
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
            <Link href="/sections/fundamentos-sql" className="inline-action">
              Continuar con Fundamentos SQL <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
