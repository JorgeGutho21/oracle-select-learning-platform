import Link from 'next/link';
import { platformRoutes } from '@/presentation/navigation/routes';

export function HomePage() {
  return (
    <div className="site-container home-page">
      <section className="home-hero" data-theme="dark" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <span className="eyebrow">Universidad Popular del Cesar · Bases de Datos</span>
          <h1 id="home-title">
            SQL SELECT LAB<span>Una nueva forma de explorar SQL.</span>
          </h1>
          <p>Un espacio para aprender, practicar y comprender SELECT en Oracle.</p>
          <div className="hero-actions">
            <Link href="/presentation" className="hero-action hero-action--primary">
              Iniciar exposición <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/learn" className="hero-action">
              Estudiar <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="hero-note">Base de interfaz · Contenido y actividades en preparación</p>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="graphic-top">
            <span>SQL / SELECT</span>
            <span>01</span>
          </div>
          <div className="graphic-word">
            SELECT<span>_</span>
          </div>
          <div className="graphic-grid">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="graphic-bottom">
            <span>OBSERVAR</span>
            <span>COMPRENDER</span>
          </div>
        </div>
      </section>
      <section className="home-directory" aria-labelledby="directory-title">
        <div>
          <span className="eyebrow">El espacio de aprendizaje</span>
          <h2 id="directory-title">Cada recorrido, en su lugar.</h2>
          <p className="muted">
            La estructura está lista. Los módulos se incorporarán en las siguientes fases.
          </p>
        </div>
        <div className="route-directory">
          {platformRoutes
            .filter(({ href }) => href !== '/learn' && href !== '/presentation')
            .map(({ href, label }, index) => (
              <Link href={href} key={href}>
                <span className="route-number">0{index + 1}</span>
                <span>{label}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
