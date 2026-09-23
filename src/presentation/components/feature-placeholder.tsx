import Link from 'next/link';

export interface FeaturePlaceholderProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  section: string;
}

export function FeaturePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
  section,
}: FeaturePlaceholderProps) {
  return (
    <div className="site-container feature-page">
      <header className="feature-heading">
        <span className="eyebrow">{section}</span>
        <h1>{title}</h1>
        <p className="readable muted">{description}</p>
      </header>
      <section className="empty-state" aria-labelledby="empty-title">
        <span className="empty-mark" aria-hidden="true">
          [ ]
        </span>
        <span className="eyebrow">En preparación</span>
        <h2 id="empty-title">{emptyTitle}</h2>
        <p className="readable muted">{emptyDescription}</p>
        <Link href="/" className="inline-action">
          Volver al inicio <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </div>
  );
}
