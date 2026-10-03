import Image from 'next/image';
import Link from 'next/link';
import {
  ACADEMIC_IDENTITY as identity,
  PLATFORM_TECHNOLOGIES,
  PRODUCT_IDENTITY as product,
} from '@/application/academic-identity';

const footerLinks = [
  { href: '/sections', label: 'Secciones' },
  { href: '/sections/fundamentos-sql', label: 'Fundamentos SQL' },
  { href: '/learn', label: 'Modo Estudio' },
  { href: '/presentation', label: 'Modo Exposición' },
  { href: '/lab', label: 'Laboratorio SQL' },
  { href: '/challenge', label: 'SQL Challenge' },
  { href: '/resources', label: 'Recursos y chuleta' },
  { href: '/modules', label: 'Ruta de aprendizaje' },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer academic-footer" data-theme="dark">
      <div className="site-container footer-inner">
        <div className="footer-brand">
          <p className="footer-brand__eyebrow">Proyecto académico</p>
          <strong className="footer-brand__name">{product.name}</strong>
          <p>{product.subtitle}</p>
          {/* Lugar de la identidad institucional: el emblema registrado en public/identity. */}
          <span className="footer-logo">
            <Image src={identity.logo} width={805} height={417} alt={identity.institution} />
          </span>
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
          <strong>Avisos académicos.</strong> {product.disclaimer}
        </p>
        <p>
          Las vistas previas sobre EMPLEADOS son demostraciones educativas; la ejecución real
          requiere el servicio Oracle conectado.
        </p>
      </div>
    </footer>
  );
}
