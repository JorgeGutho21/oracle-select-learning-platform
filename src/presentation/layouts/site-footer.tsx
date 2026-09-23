import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-inner">
        <div>
          <strong>SQL SELECT LAB</strong>
          <p>Universidad Popular del Cesar</p>
        </div>
        <div>
          <p>Jorge Gutiérrez Thomas</p>
          <Link href="/dev/design-system">Sistema de diseño</Link>
        </div>
      </div>
    </footer>
  );
}
