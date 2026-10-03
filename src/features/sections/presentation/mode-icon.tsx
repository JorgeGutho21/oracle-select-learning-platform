import type { SectionModeId } from '../application/sections-api';

/** Icono de trazo de cada modo. Siempre acompaña a un texto: es decorativo. */
const PATHS: Readonly<Record<SectionModeId, string>> = {
  // Pantalla con trípode: exposición en el aula.
  class: 'M3 4h18v11H3zM12 15v5M8 20h8',
  // Libro abierto: estudio.
  study: 'M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zm0 0v14',
  // Terminal: laboratorio.
  practice: 'M3 4h18v16H3zM7 9l3 3-3 3M12 15h5',
  // Bandera: misiones.
  challenge: 'M5 21V4M5 4h11l-2 4 2 4H5',
  // Carpeta: recursos.
  resources: 'M3 6h6l2 2h10v11H3z',
  // Lista con marcas: evaluación.
  evaluation: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
};

export function ModeIcon({ mode }: { readonly mode: SectionModeId }) {
  return (
    <svg
      className="mode-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[mode]} />
    </svg>
  );
}
