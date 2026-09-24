import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  isAvailableModule,
  MODULE_CATALOG,
  MODULE_STATUS_LABEL,
  moduleAnchor,
  type AcademicModule,
} from '../application/modules-api';
import { SCENE_TOTAL } from '@/features/presentation/application/presentation-api';
import { LESSONS } from '@/features/study/application/study-api';
import { Chip } from '@/presentation/components/ui';

function ModuleCard({
  entry,
  progress,
}: {
  readonly entry: AcademicModule;
  readonly progress: ReactNode;
}) {
  const available = isAvailableModule(entry);
  const titleId = `${moduleAnchor(entry)}-title`;
  return (
    <li
      id={moduleAnchor(entry)}
      className={`module-card ${available ? 'module-card--current' : 'module-card--upcoming'}`}
    >
      <article aria-labelledby={titleId}>
        <header className="module-card__header">
          <span className="module-card__number" aria-hidden="true">
            {String(entry.number).padStart(2, '0')}
          </span>
          <Chip tone={available ? 'cyan' : 'warning'}>{MODULE_STATUS_LABEL[entry.status]}</Chip>
        </header>
        <code className="module-card__keyword">{entry.keyword}</code>
        <h2 id={titleId} className="module-card__title">
          <span className="visually-hidden">Módulo {entry.number}: </span>
          {entry.title}
        </h2>
        <p className="module-card__description">{entry.description}</p>
        {available ? (
          <>
            <p className="module-card__meta">
              {LESSONS.length} lecciones · {SCENE_TOTAL} escenas de exposición · laboratorio y SQL
              Challenge
            </p>
            {progress}
            <Link className="inline-action" href="/presentation">
              Iniciar clase en Modo Exposición <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <div className="module-card__requires">
            <strong>Requiere</strong>
            <ul>
              {entry.prerequisites.map((prerequisite) => (
                <li key={prerequisite}>{prerequisite}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </li>
  );
}

export function ModulesPage({ currentProgress }: { readonly currentProgress: ReactNode }) {
  return (
    <div className="modules-page">
      <header className="modules-hero">
        <div className="site-container">
          <p className="study-eyebrow">Catálogo académico</p>
          <h1>Módulos de SQL</h1>
          <p className="modules-hero__lead">
            Hoy está disponible la unidad SELECT. Los demás módulos llegarán después: aparecen como
            «Próximamente» y no cuentan en tu progreso.
          </p>
        </div>
      </header>
      <div className="site-container modules-body">
        <ol className="modules-grid" aria-label="Módulos del curso">
          {MODULE_CATALOG.map((entry) => (
            <ModuleCard
              key={entry.id}
              entry={entry}
              progress={entry.status === 'COMING_SOON' ? null : currentProgress}
            />
          ))}
        </ol>
        <p className="modules-note">
          ¿Buscas un tema? Consulta la{' '}
          <Link href={'/resources#chuleta' as Route}>chuleta de SELECT</Link> o usa el buscador.
        </p>
      </div>
    </div>
  );
}
