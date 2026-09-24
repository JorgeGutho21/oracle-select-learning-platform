import Image from 'next/image';
import Link from 'next/link';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';

const footerLinks = [
  { href: '/learn', label: 'Modo Estudio' },
  { href: '/presentation', label: 'Modo Exposición' },
  { href: '/lab', label: 'Laboratorio SQL' },
  { href: '/challenge', label: 'SQL Challenge' },
  { href: '/resources', label: 'Recursos y chuleta' },
  { href: '/modules', label: 'Catálogo de módulos' },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer academic-footer" data-theme="dark">
      <div className="site-container footer-inner">
        <div className="footer-brand">
          <strong className="footer-brand__name">SQL SELECT LAB</strong>
          <p>{identity.unitTitle}</p>
          <span className="footer-logo">
            <Image src={identity.logo} width={805} height={417} alt={identity.institution} />
          </span>
        </div>
        <dl className="footer-identity" aria-label="Identidad académica">
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
            <dt>Autor</dt>
            <dd>{identity.author}</dd>
          </div>
          <div>
            <dt>Profesor</dt>
            <dd>{identity.teacher}</dd>
          </div>
        </dl>
        <nav className="footer-links" aria-label="Enlaces del pie">
          {footerLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/dev/design-system" className="footer-links__minor">
            Sistema de diseño
          </Link>
        </nav>
      </div>
      <div className="site-container footer-note">
        <p>
          Plataforma educativa. Las vistas previas sobre EMPLEADOS son demostraciones; la ejecución
          real requiere el servicio Oracle conectado.
        </p>
      </div>
    </footer>
  );
}
