import {
  publicCatalog,
  searchGroups,
  type PublicCatalogEntry,
  type SearchGroup,
} from '../domain/public-catalog';

export interface SearchResultDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly group: SearchGroup;
  readonly href: string | null;
  readonly status: 'Disponible' | 'Próximamente';
}

export interface NavigationItemDto {
  readonly href: string;
  readonly label: string;
  /** Rutas, además de `href`, en las que la entrada se marca como actual. */
  readonly alsoActiveOn: readonly string[];
}

/** Indica si una entrada de navegación corresponde a la ruta actual. */
export function isNavigationItemActive(item: NavigationItemDto, pathname: string): boolean {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...item.alsoActiveOn].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

export const searchResultGroups: readonly SearchGroup[] = searchGroups;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value: string): readonly string[] {
  return normalize(value).match(/[\p{L}\p{N}_*]+/gu) ?? [];
}

function includesTerm(entryWords: readonly string[], term: string): boolean {
  if (term.length <= 2 || term === '*') return entryWords.includes(term);
  // «expresión» encuentra «expresiones»; una palabra corta («e», «de») no absorbe términos.
  return entryWords.some(
    (word) => word.startsWith(term) || (word.length >= 4 && term.startsWith(word)),
  );
}

function rank(entry: PublicCatalogEntry, query: string): number | null {
  const normalizedQuery = normalize(query);
  const queryWords = words(query);
  if (!normalizedQuery || queryWords.length === 0) return null;

  const normalizedTitle = normalize(entry.title);
  const normalizedAliases = entry.aliases.map(normalize);
  const entryWords = words([entry.title, entry.description, ...entry.aliases].join(' '));

  if (!queryWords.every((term) => includesTerm(entryWords, term))) return null;

  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedAliases.includes(normalizedQuery)) return 1;
  if (normalizedTitle.startsWith(normalizedQuery)) return 2;
  if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) return 3;
  if (normalizedTitle.includes(normalizedQuery)) return 4;
  return 5;
}

function toDto(entry: PublicCatalogEntry): SearchResultDto {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    group: entry.group,
    href: entry.href,
    status: entry.available ? 'Disponible' : 'Próximamente',
  };
}

export function searchPublicCatalog(query: string): readonly SearchResultDto[] {
  return publicCatalog
    .map((entry, index) => ({ entry, index, rank: rank(entry, query) }))
    .filter(
      (candidate): candidate is typeof candidate & { rank: number } => candidate.rank !== null,
    )
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ entry }) => toDto(entry));
}

export function getPlatformNavigation(): readonly NavigationItemDto[] {
  return publicCatalog
    .filter(
      (
        entry,
      ): entry is PublicCatalogEntry & {
        href: string;
        navigation: NonNullable<PublicCatalogEntry['navigation']>;
      } => entry.href !== null && entry.navigation !== undefined,
    )
    .sort((left, right) => left.navigation.order - right.navigation.order)
    .map((entry) => ({
      href: entry.href,
      label: entry.navigation.label,
      alsoActiveOn: entry.navigation.alsoActiveOn ?? [],
    }));
}
