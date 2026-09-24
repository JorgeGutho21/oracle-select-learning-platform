import {
  isAvailableModule,
  MODULE_CATALOG,
  type AcademicModule,
  type ModuleStatus,
} from '../domain/catalog';

export type { AcademicModule, ModuleStatus } from '../domain/catalog';
export { isAvailableModule, MODULE_CATALOG } from '../domain/catalog';

export const MODULE_STATUS_LABEL: Readonly<Record<ModuleStatus, string>> = {
  AVAILABLE: 'Disponible',
  CURRENT: 'Unidad actual',
  COMING_SOON: 'Próximamente',
};

export function currentModule(): AcademicModule {
  const entry = MODULE_CATALOG.find(({ status }) => status === 'CURRENT');
  if (!entry) throw new Error('El catálogo necesita una unidad actual.');
  return entry;
}

export function upcomingModules(): readonly AcademicModule[] {
  return MODULE_CATALOG.filter((entry) => !isAvailableModule(entry));
}

export function moduleAnchor(entry: Pick<AcademicModule, 'id'>): string {
  return `modulo-${entry.id}`;
}
