export const platformRoutes = [
  { href: '/learn', label: 'Estudio' },
  { href: '/presentation', label: 'Exposición' },
  { href: '/lab', label: 'Laboratorio' },
  { href: '/challenge', label: 'Challenge' },
  { href: '/live', label: 'Sala en vivo' },
  { href: '/results', label: 'Resultados' },
  { href: '/resources', label: 'Recursos' },
] as const;

export type PlatformPath = (typeof platformRoutes)[number]['href'];
