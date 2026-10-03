import type { Route } from 'next';
import Link from 'next/link';
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
}

export function LearningOverview({ items, next }: LearningOverviewProps) {
  return (
    <section className="learning-overview" aria-labelledby="learning-overview-title">
      <header className="learning-overview__head">
        <p className="learning-overview__eyebrow">Mi aprendizaje</p>
        <h2 id="learning-overview-title">Tu avance</h2>
        <p>
          Se guarda solo en este navegador. Con las cuentas de estudiante llegarán el historial y
          las evaluaciones.
        </p>
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
            El historial llegará con las cuentas de estudiante. Hoy DB LAB recuerda tu última
            lección en este navegador.
          </p>
        </div>
      </div>
    </section>
  );
}
