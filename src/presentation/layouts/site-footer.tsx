import Link from 'next/link';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';

export function SiteFooter() {
  return (
    <footer className="site-footer academic-footer" data-theme="dark">
      <div className="site-container footer-inner">
        <div>
          <strong>SQL SELECT LAB</strong>
          <p>{identity.institution}</p>
          <p>
            {identity.program} · {identity.course}
          </p>
        </div>
        <div>
          <p>{identity.author}</p>
          <p>Docente: {identity.teacher}</p>
          <Link href="/dev/design-system">Sistema de diseño</Link>
        </div>
      </div>
    </footer>
  );
}
