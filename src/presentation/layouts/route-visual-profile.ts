/** Every route has a visual purpose and an explicit decoration budget (0–3). */
export const ROUTE_VISUAL_PROFILE = {
  home: { motion: 3, purpose: 'Descubrir la ruta académica' },
  section: { motion: 2, purpose: 'Elegir el siguiente paso de aprendizaje' },
  study: { motion: 1, purpose: 'Comprender una idea a la vez' },
  class: { motion: 1, purpose: 'Proyectar y explicar sin distracciones' },
  practice: { motion: 1, purpose: 'Probar y recibir feedback' },
  challenge: { motion: 2, purpose: 'Demostrar habilidades por bloques' },
  resources: { motion: 2, purpose: 'Consultar conceptos y fuentes' },
  exam: { motion: 0, purpose: 'Concentrarse en responder' },
  teacher: { motion: 0, purpose: 'Administrar, supervisar y revisar datos' },
  auth: { motion: 1, purpose: 'Acceder a la cuenta' },
  account: { motion: 1, purpose: 'Continuar y revisar el progreso personal' },
  lab: { motion: 1, purpose: 'Comparar consulta y resultado real' },
  live: { motion: 0, purpose: 'Participar en la clase en vivo' },
} as const;

export type RouteVisualKind = keyof typeof ROUTE_VISUAL_PROFILE;

export function visualKind(path: string): RouteVisualKind {
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/evaluations')) return 'exam';
  if (/^\/(?:login|register|forgot-password|reset-password|auth)(?:\/|$)/.test(path)) return 'auth';
  if (/^\/(?:dashboard|profile)(?:\/|$)/.test(path)) return 'account';
  if (/\/(?:presentation|class)(?:\/|$)/.test(path)) return 'class';
  if (/\/(?:learn|study)(?:\/|$)/.test(path)) return 'study';
  if (/\/challenge(?:\/|$)/.test(path)) return 'challenge';
  if (/\/resources(?:\/|$)/.test(path)) return 'resources';
  if (/\/practice(?:\/|$)/.test(path)) return 'practice';
  if (/^\/lab(?:\/|$)/.test(path)) return 'lab';
  if (/^\/(?:live|results)(?:\/|$)/.test(path)) return 'live';
  if (path.startsWith('/sections')) return 'section';
  return 'home';
}
