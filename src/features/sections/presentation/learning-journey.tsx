import type { Route } from 'next';
import Link from 'next/link';
import type { SectionDto } from '../application/sections-api';

const STEPS = [
  { mode: 'study', verb: 'Aprender', purpose: 'Comprende conceptos y ejemplos.' },
  { mode: 'class', verb: 'Observar', purpose: 'Sigue las escenas de clase.' },
  { mode: 'practice', verb: 'Practicar', purpose: 'Ensaya con feedback y pistas.' },
  { mode: 'challenge', verb: 'Resolver', purpose: 'Demuestra una habilidad completa.' },
  { mode: 'evaluation', verb: 'Evaluar', purpose: 'Presenta lo que publique tu docente.' },
] as const;

export function LearningJourney({ section }: { readonly section: SectionDto }) {
  return (
    <nav className="db-learning-journey" aria-label={`Camino de aprendizaje: ${section.title}`}>
      <ol>
        {STEPS.map((step, index) => {
          const mode = section.modes.find((item) => item.id === step.mode);
          return (
            <li key={step.mode}>
              <span className="db-learning-journey__number" aria-hidden="true">
                {index + 1}
              </span>
              {mode?.href ? (
                <Link href={mode.href as Route} prefetch={false}>
                  {step.verb}
                </Link>
              ) : (
                <strong>{step.verb}</strong>
              )}
              <p>{step.purpose}</p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
