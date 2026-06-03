import { getApiBaseUrl } from '@/services/authApi';

const PLACES_FALLBACK_API_BASE_URL =
  process.env.EXPO_PUBLIC_PLACES_API_BASE_URL?.replace(/\/$/, '') ||
  'https://rota-back-production.up.railway.app';

export type NearbyCategory =
  | 'restaurant'
  | 'fast_food'
  | 'bakery'
  | 'bar'
  | 'cafe'
  | 'pharmacy'
  | 'atm'
  | 'shopping_center'
  | 'market'
  | 'supermarket'
  | 'gym'
  | 'park'
  | 'school'
  | 'hotel'
  | 'hospital'
  | 'bank'
  | 'gas_station'
  | 'shopping';

export type NearbyPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  photoUrl?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  telefone?: string;
};

function pickString(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

function pickBoolean(raw: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}

function normalizeNearbyPlace(raw: Record<string, unknown>): NearbyPlace | null {
  const id = raw.id != null ? String(raw.id).trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const category = typeof raw.category === 'string' ? raw.category : '';

  if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const photoUrl =
    pickString(raw, 'photoUrl', 'photo_url', 'image', 'imageUrl', 'image_url', 'thumbnail', 'picture') ??
    undefined;

  return {
    id,
    name,
    latitude,
    longitude,
    category,
    photoUrl,
    formattedAddress: pickString(raw, 'formattedAddress', 'formatted_address', 'address'),
    rating: pickNumber(raw, 'rating'),
    userRatingsTotal: pickNumber(raw, 'userRatingsTotal', 'user_ratings_total'),
    openNow: pickBoolean(raw, 'openNow', 'open_now'),
    telefone: pickString(raw, 'telefone', 'phone', 'phoneNumber', 'phone_number'),
  };
}

export const NEARBY_PLACES_RADIUS_METERS = 7000;

type NearbyPlacesParams = {
  lat: number;
  lon: number;
  category?: NearbyCategory;
  radius?: number;
  limit?: number;
};

function shouldFallbackToPlacesApi(error: unknown, baseUrl: string): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const isLocalBase =
    baseUrl.includes('192.168.') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  return (
    isLocalBase &&
    (message.includes('overpass') ||
      message.includes('502') ||
      message.includes('bad gateway') ||
      message.includes('network request failed') ||
      message.includes('failed to fetch'))
  );
}

async function requestNearbyPlaces(
  baseUrl: string,
  params: NearbyPlacesParams,
): Promise<NearbyPlace[]> {
  const url = new URL('/api/v1/places/nearby', baseUrl);
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lon));
  if (params.category) url.searchParams.set('category', params.category);
  if (params.radius != null) url.searchParams.set('radius', String(params.radius));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) throw new Error(j.message);
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
    throw new Error(text || `places/nearby failed (${res.status})`);
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      item && typeof item === 'object' ? normalizeNearbyPlace(item as Record<string, unknown>) : null,
    )
    .filter((p): p is NearbyPlace => p != null);
}

export async function getNearbyPlaces(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  const primaryBaseUrl = getApiBaseUrl();
  try {
    return await requestNearbyPlaces(primaryBaseUrl, params);
  } catch (error) {
    if (
      PLACES_FALLBACK_API_BASE_URL !== primaryBaseUrl &&
      shouldFallbackToPlacesApi(error, primaryBaseUrl)
    ) {
      return requestNearbyPlaces(PLACES_FALLBACK_API_BASE_URL, params);
    }
    throw error;
  }
}

export async function searchNearbyPlacesWithRetry(
  type: string,
  position: [number, number],
  options?: { radius?: number; limit?: number; retries?: number },
): Promise<NearbyPlace[]> {
  const retries = options?.retries ?? 2;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await searchNearbyPlaces(type, position, options?.radius, options?.limit ?? 20);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error('Erro ao buscar locais');
}

export const searchNearbyPlaces = async (
  type: string,
  position: [number, number],
  radius?: number,
  limit: number = 20,
): Promise<NearbyPlace[]> => {
  const supported: Set<string> = new Set([
    'restaurant',
    'fast_food',
    'bakery',
    'bar',
    'cafe',
    'pharmacy',
    'atm',
    'shopping_center',
    'market',
    'supermarket',
    'gym',
    'park',
    'school',
    'hotel',
    'hospital',
    'bank',
    'gas_station',
    'shopping',
  ]);
  if (!supported.has(type)) {
    throw new Error('UNSUPPORTED_CATEGORY');
  }

  const [lon, lat] = position;
  return await getNearbyPlaces({
    lat,
    lon,
    category: type as NearbyCategory,
    radius,
    limit,
  });
};

export const distanceMeters = (a: [number, number], b: [number, number]): number => {
  const R = 6371000;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};
