import Link from 'next/link';
import {
  ACADEMIC_IDENTITY as identity,
  PLATFORM_TECHNOLOGIES,
  PRODUCT_IDENTITY as product,
} from '@/application/academic-identity';

const footerGroups = [
  {
    title: 'Secciones',
    links: [
      { href: '/sections', label: 'Secciones' },
      { href: '/sections/fundamentos-sql', label: 'Fundamentos SQL' },
      { href: '/sections/consultas-relacionales', label: 'Consultas relacionales' },
      { href: '/sections/plsql', label: 'PL/SQL y automatización' },
      { href: '/modules', label: 'Ruta de aprendizaje' },
    ],
  },
  {
    title: 'Herramientas',
    links: [
      { href: '/learn', label: 'Modo Estudio' },
      { href: '/presentation', label: 'Modo Exposición' },
      { href: '/lab', label: 'Laboratorio SQL' },
      { href: '/challenge', label: 'SQL Challenge' },
      { href: '/resources', label: 'Recursos y chuleta' },
    ],
  },
] as const;

/**
 * Pie académico. Es el único lugar donde aparecen los créditos completos del proyecto: la
 * portada ya no repite una franja de identidad.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer academic-footer" data-theme="dark">
      <div className="site-container footer-inner">
        <section className="footer-about" aria-label="Identidad académica">
          <div className="footer-brand">
            <p className="footer-brand__eyebrow">Proyecto académico</p>
            <strong className="footer-brand__name">{product.name}</strong>
            <p>{product.subtitle}</p>
          </div>
          <dl className="footer-identity" aria-label="Créditos académicos">
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
            <div>
              <dt>Tecnologías</dt>
              <dd>{PLATFORM_TECHNOLOGIES.join(' · ')}</dd>
            </div>
          </dl>
        </section>
        <nav className="footer-links" aria-label="Enlaces del pie">
          {footerGroups.map((group) => (
            <div key={group.title} className="footer-links__group">
              <p className="footer-links__title">{group.title}</p>
              <ul>
                {group.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="site-container footer-note">
        <p>
          <strong>Avisos académicos.</strong> {product.disclaimer}
        </p>
        <p>
          Las vistas previas sobre EMPLEADOS son demostraciones educativas; la ejecución real
          requiere el servicio Oracle conectado.{' '}
          <Link href="/dev/design-system" className="footer-note__link">
            Sistema de diseño
          </Link>
        </p>
      </div>
    </footer>
  );
}
