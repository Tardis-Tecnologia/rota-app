import { getApiBaseUrl } from '@/services/authApi';

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
};

export const NEARBY_PLACES_RADIUS_METERS = 7000;

export async function getNearbyPlaces(params: {
  lat: number;
  lon: number;
  category?: NearbyCategory;
  radius?: number;
  limit?: number;
}): Promise<NearbyPlace[]> {
  const url = new URL('/api/v1/places/nearby', getApiBaseUrl());
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
    throw new Error(text || `places/nearby failed (${res.status})`);
  }
  return (await res.json()) as NearbyPlace[];
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
