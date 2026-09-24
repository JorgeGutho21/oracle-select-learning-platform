import { getPlatformNavigation } from '@/features/search/application/search-index';

export const platformRoutes = getPlatformNavigation();

export type PlatformPath = (typeof platformRoutes)[number]['href'];
