import { GUIA_EMPRESA_PLACE_CATEGORIES, GUIA_PLACE_TYPE_LABELS } from '@/constants/guiaEmpresaPlaces';
import type { GuiaListItem } from '@/services/guiaCatalog';
import { sortGuiaByDistance } from '@/services/guiaCatalog';
import { getApiBaseUrl } from '@/services/authApi';
import {
  NEARBY_PLACES_RADIUS_METERS,
  searchNearbyPlacesWithRetry,
} from '@/services/placesService';
import { nearbyPlaceToGuiaCompany } from '@/utils/placeToGuiaCompany';
import { GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';

export const PLACES_PER_CATEGORY = 20;

let placesCache = new Map<string, GuiaListItem>();

export function getGuiaPlaceById(id: string): GuiaListItem | null {
  return placesCache.get(id) ?? null;
}

export function mergeGuiaPlacesCache(items: GuiaListItem[]): void {
  for (const item of items) placesCache.set(item.id, item);
}

export function clearGuiaPlacesCache(): void {
  placesCache = new Map();
}

export function totalGuiaEmpresaCategories(): number {
  return GUIA_EMPRESA_PLACE_CATEGORIES.length;
}

export function getGuiaEmpresaCategoryLabel(index: number): string | null {
  const key = GUIA_EMPRESA_PLACE_CATEGORIES[index];
  return key ? (GUIA_PLACE_TYPE_LABELS[key] ?? key) : null;
}

export function formatGuiaPlacesError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('overpass') || lower.includes('502') || lower.includes('bad gateway')) {
    const base = getApiBaseUrl();
    if (base.includes('192.168.') || base.includes('localhost') || base.includes('127.0.0.1')) {
      return 'O servidor local não conseguiu consultar o mapa (Overpass). Confira o back ou use a API de produção no .env.';
    }
    return 'Mapa temporariamente indisponível. Tente novamente em instantes.';
  }
  return message;
}

export async function fetchGuiaEmpresaCategory(
  coords: { latitude: number; longitude: number },
  categoryIndex: number,
): Promise<{
  items: GuiaListItem[];
  nextCategoryIndex: number;
  error: string | null;
}> {
  const category = GUIA_EMPRESA_PLACE_CATEGORIES[categoryIndex];
  if (!category) {
    return { items: [], nextCategoryIndex: categoryIndex, error: null };
  }

  const position: [number, number] = [coords.longitude, coords.latitude];

  try {
    const places = await searchNearbyPlacesWithRetry(category, position, {
      radius: NEARBY_PLACES_RADIUS_METERS,
      limit: PLACES_PER_CATEGORY,
      retries: 2,
    });
    const items = places.map((p) => nearbyPlaceToGuiaCompany(p, category));
    mergeGuiaPlacesCache(items);
    return {
      items,
      nextCategoryIndex: categoryIndex + 1,
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao buscar locais';
    return {
      items: [],
      nextCategoryIndex: categoryIndex + 1,
      error: formatGuiaPlacesError(msg),
    };
  }
}

export function mergeGuiaCompanyItems(
  existing: GuiaListItem[],
  incoming: GuiaListItem[],
  sortOrigin?: { latitude: number; longitude: number } | null,
): GuiaListItem[] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return sortGuiaByDistance([...byId.values()], sortOrigin);
}

export function sortGuiaCompaniesByProximity(
  items: GuiaListItem[],
  coords?: { latitude: number; longitude: number } | null,
): GuiaListItem[] {
  return sortGuiaByDistance(items, coords);
}

export function defaultGuiaPlacesCoords() {
  return { latitude: GUIA_DEFAULT_CENTER.latitude, longitude: GUIA_DEFAULT_CENTER.longitude };
}

const MARICA_RADIUS = 45_000;

export function resolveGuiaPlacesFetchCoords(
  coords?: { latitude: number; longitude: number } | null,
) {
  return coords ?? defaultGuiaPlacesCoords();
}
