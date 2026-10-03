import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb, PageHeader } from '@/presentation/components/ui';
import type { SectionDto, SectionModeId } from '../application/sections-api';
import { ModeIcon } from './mode-icon';
import { SectionCard } from './section-card';

export interface SectionsHubProps {
  readonly sections: readonly SectionDto[];
  /** Panel «Mi aprendizaje» (cliente) con el avance guardado en este navegador. */
  readonly overview: ReactNode;
  readonly progressFor: (section: SectionDto) => ReactNode;
}

const MODE_GUIDE: readonly { id: SectionModeId; label: string; text: string }[] = [
  { id: 'class', label: 'Iniciar clase', text: 'Exposición por escenas para el aula.' },
  { id: 'study', label: 'Estudiar', text: 'Lecciones a tu ritmo, con mini comprobación.' },
  { id: 'practice', label: 'Practicar', text: 'Laboratorio con diagnóstico y Oracle.' },
  { id: 'challenge', label: 'Challenge', text: 'Misiones con puntos, solo o en vivo.' },
  { id: 'resources', label: 'Recursos', text: 'Chuleta, referencia y fuentes.' },
  {
    id: 'evaluation',
    label: 'Evaluación',
    text: 'Llegará con el banco de preguntas del profesor.',
  },
];

export function SectionsHub({ sections, overview, progressFor }: SectionsHubProps) {
  return (
    <div className="sections-hub">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Secciones' }]} />}
        eyebrow="Ruta académica"
        title="Secciones de DB LAB"
        lead="De la primera consulta a la programación en la base de datos. Cada sección reúne los mismos modos de trabajo para que siempre sepas dónde estás y qué sigue."
      />
      <div className="site-container sections-hub__body">
        <section className="section-block" aria-labelledby="route-title">
          <div className="section-block__head">
            <h2 id="route-title">La ruta</h2>
            <p>Empieza por Fundamentos SQL. Las secciones 2 y 3 ya tienen su plan publicado.</p>
          </div>
          <ol className="section-grid">
            {sections.map((section) => (
              <li key={section.id}>
                <SectionCard section={section} progress={progressFor(section)} />
              </li>
            ))}
          </ol>
        </section>
        {overview}
        <section className="section-block" aria-labelledby="modes-guide-title">
          <div className="section-block__head">
            <h2 id="modes-guide-title">Cómo se trabaja en cada sección</h2>
            <p>
              Los modos se repiten en todas las secciones: cambia el tema, no la forma de trabajar.
            </p>
          </div>
          <ul className="mode-guide">
            {MODE_GUIDE.map((mode) => (
              <li key={mode.id}>
                <span className="mode-card__icon">
                  <ModeIcon mode={mode.id} />
                </span>
                <span>
                  <strong>{mode.label}</strong>
                  {mode.text}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/modules" className="inline-action">
            Ver el mapa completo de temas <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
