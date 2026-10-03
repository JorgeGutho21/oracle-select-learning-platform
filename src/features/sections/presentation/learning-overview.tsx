import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Progress, StatusBadge } from '@/presentation/components/ui';
import type { SectionStatus } from '../application/sections-api';

/**
 * Componentes del futuro panel del estudiante. Hoy reciben solo datos reales: el progreso
 * del Modo Estudio guardado en este navegador. Lo que todavía no existe (evaluaciones,
 * historial) se muestra como estado neutro, nunca con cifras inventadas.
 */

export interface SectionProgressItem {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly status: SectionStatus;
  /** Lecciones completadas y totales; `null` si la sección aún no tiene contenido. */
  readonly done: number | null;
  readonly total: number | null;
}

export interface ContinueItem {
  readonly label: string;
  readonly href: string;
  readonly detail: string;
}

export function SectionProgressMeter({ item }: { readonly item: SectionProgressItem }) {
  if (item.done === null || item.total === null) {
    return (
      <div className="progress-meter progress-meter--empty">
        <span className="progress-meter__label">Tu avance</span>
        <StatusBadge tone="planned">Se mostrará al publicar la sección</StatusBadge>
      </div>
    );
  }
  return (
    <div className="progress-meter">
      <Progress
        label={`Tu avance: ${item.done} de ${item.total} lecciones`}
        value={item.done}
        max={item.total}
      />
    </div>
  );
}

export interface LearningOverviewProps {
  readonly items: readonly SectionProgressItem[];
  readonly next: ContinueItem;
  /** Dónde se guarda el avance (dispositivo o cuenta). */
  readonly storageNote?: ReactNode;
}

export function LearningOverview({
  items,
  next,
  storageNote = 'Se guarda en este dispositivo.',
}: LearningOverviewProps) {
  return (
    <section className="learning-overview" aria-labelledby="learning-overview-title">
      <header className="learning-overview__head">
        <p className="learning-overview__eyebrow">Mi aprendizaje</p>
        <h2 id="learning-overview-title">Tu avance</h2>
        <p>{storageNote}</p>
      </header>
      <div className="learning-overview__grid">
        <div className="overview-panel overview-panel--wide">
          <h3>Progreso general</h3>
          <ul className="overview-progress">
            {items.map((item) => (
              <li key={item.id}>
                <span className="overview-progress__name">
                  <span aria-hidden="true">{item.code}</span> {item.title}
                </span>
                <SectionProgressMeter item={item} />
              </li>
            ))}
          </ul>
        </div>
        <div className="overview-panel">
          <h3>Continuar aprendiendo</h3>
          <p>{next.detail}</p>
          <Link href={next.href as Route} className="ds-button ds-button--primary">
            {next.label}
          </Link>
        </div>
        <div className="overview-panel overview-panel--empty">
          <h3>Próximas evaluaciones</h3>
          <p>No hay evaluaciones publicadas. Aparecerán aquí cuando el docente las programe.</p>
        </div>
        <div className="overview-panel overview-panel--empty">
          <h3>Actividad reciente</h3>
          <p>
            Con una cuenta, tu actividad reciente aparece en{' '}
            <Link href="/dashboard">Mi progreso</Link>. Sin cuenta, DB LAB recuerda tu última
            lección en este dispositivo.
          </p>
        </div>
      </div>
    </section>
  );
}
