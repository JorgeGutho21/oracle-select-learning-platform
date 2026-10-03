import { SECTION_LIST } from '@/features/sections/application/sections-api';

/** Nombre visible de cada sección por su clave. */
export const SECTION_TITLES: Readonly<Record<string, string>> = Object.fromEntries(
  SECTION_LIST.map((section) => [section.id, `Sección ${section.number} · ${section.title}`]),
);
