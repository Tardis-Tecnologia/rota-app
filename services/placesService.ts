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

export type AddressSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
};

type SearchAddressesOptions = {
  /** Centro [lon, lat] usado para priorizar resultados próximos. */
  proximity?: [number, number];
  /** Nome do município (do hostId) para retornar apenas resultados desta cidade. */
  cityName?: string;
  limit?: number;
  signal?: AbortSignal;
};

function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Busca estabelecimentos/locais pelo nome (ex.: "Hospital ...") usando o
 * Nominatim (OpenStreetMap), restringindo ao município da cidade do hostId.
 */
async function searchWithNominatim(
  query: string,
  options?: SearchAddressesOptions,
): Promise<AddressSearchResult[]> {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('format', 'jsonv2');
  params.set('addressdetails', '1');
  params.set('limit', String(options?.limit ?? 15));
  params.set('countrycodes', 'br');
  params.set('accept-language', 'pt-BR');

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    signal: options?.signal,
    headers: { Accept: 'application/json', 'User-Agent': 'RotaApp/1.0' },
  });
  if (!res.ok) {
    throw new Error(`nominatim search failed (${res.status})`);
  }

  const data = (await res.json()) as Array<{
    place_id?: number;
    osm_type?: string;
    osm_id?: number;
    name?: string;
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
    };
  }>;

  if (!Array.isArray(data)) return [];

  const targetCity = options?.cityName ? normalizeCityName(options.cityName) : '';

  const results: AddressSearchResult[] = [];
  data.forEach((item, index) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    if (targetCity) {
      const addr = item.address ?? {};
      const candidates = [addr.city, addr.town, addr.village, addr.municipality, addr.county]
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map(normalizeCityName);
      if (!candidates.includes(targetCity)) return;
    }

    const displayName = (item.display_name || '').trim();
    const name = (item.name || '').trim();
    const title = name || displayName.split(',')[0]?.trim() || 'Local encontrado';
    let subtitle = displayName;
    if (subtitle && subtitle.startsWith(title)) {
      subtitle = subtitle.slice(title.length).replace(/^[,\s]+/, '').trim();
    }

    results.push({
      id:
        item.place_id != null
          ? `nom-${item.place_id}`
          : `nom-${item.osm_type ?? 'x'}-${item.osm_id ?? index}`,
      title,
      subtitle: subtitle || undefined,
      latitude: lat,
      longitude: lon,
    });
  });

  return results;
}

/** Geocoding de endereços via MapTiler (fallback quando o Nominatim falha). */
async function searchWithMapTiler(
  query: string,
  options?: SearchAddressesOptions,
): Promise<AddressSearchResult[]> {
  const key = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();
  if (!key) return [];

  const params = new URLSearchParams();
  params.set('key', key);
  params.set('country', 'br');
  params.set('language', 'pt');
  params.set('limit', String(options?.limit ?? 8));
  if (options?.proximity) {
    const [lon, lat] = options.proximity;
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      params.set('proximity', `${lon},${lat}`);
    }
  }

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`;
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) {
    throw new Error(`geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as {
    features?: Array<{
      id?: string | number;
      text?: string;
      place_name?: string;
      place_name_pt?: string;
      geometry?: { coordinates?: [number, number] };
    }>;
  };

  const features = Array.isArray(data.features) ? data.features : [];
  const results: AddressSearchResult[] = [];

  features.forEach((feature, index) => {
    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lon, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const placeName = (feature.place_name_pt || feature.place_name || '').trim();
    const title = (feature.text || placeName || 'Local encontrado').trim();
    let subtitle = placeName;
    if (subtitle && title && subtitle.startsWith(title)) {
      subtitle = subtitle.slice(title.length).replace(/^[,\s]+/, '').trim();
    }

    results.push({
      id: feature.id != null ? String(feature.id) : `addr-${index}`,
      title,
      subtitle: subtitle || undefined,
      latitude: lat,
      longitude: lon,
    });
  });

  return results;
}

/**
 * Busca locais por nome de estabelecimento, rua ou endereço.
 * Prioriza o Nominatim (cobre POIs nomeados) e usa MapTiler como fallback.
 */
export async function searchAddresses(
  query: string,
  options?: SearchAddressesOptions,
): Promise<AddressSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const fromNominatim = await searchWithNominatim(q, options);
    // Quando há restrição de cidade (hostId), respeitamos o resultado do
    // Nominatim mesmo vazio, para nunca trazer locais de fora do município.
    if (options?.cityName || fromNominatim.length > 0) {
      return fromNominatim;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    // Segue para o fallback do MapTiler.
  }

  return searchWithMapTiler(q, options);
}

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
