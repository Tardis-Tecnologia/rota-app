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
  | 'shopping'
  | 'company';

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
  const name =
    pickString(raw, 'name', 'title', 'displayName', 'display_name') ?? '';
  const latitude = Number(
    raw.latitude ?? raw.lat ?? (raw.location as { lat?: unknown } | undefined)?.lat,
  );
  const longitude = Number(
    raw.longitude ??
      raw.lon ??
      raw.lng ??
      (raw.location as { lon?: unknown; lng?: unknown } | undefined)?.lon ??
      (raw.location as { lon?: unknown; lng?: unknown } | undefined)?.lng,
  );
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

/** Mapeamento categoria app → filtros OSM (Overpass). */
const CATEGORY_OSM_FILTERS: Record<NearbyCategory, string[]> = {
  restaurant: ['["amenity"="restaurant"]'],
  fast_food: ['["amenity"="fast_food"]'],
  bakery: ['["shop"="bakery"]'],
  bar: ['["amenity"="bar"]'],
  cafe: ['["amenity"="cafe"]'],
  pharmacy: ['["amenity"="pharmacy"]'],
  atm: ['["amenity"="atm"]'],
  shopping_center: ['["shop"="mall"]', '["amenity"="marketplace"]'],
  market: ['["amenity"="marketplace"]', '["shop"="convenience"]'],
  supermarket: ['["shop"="supermarket"]'],
  gym: ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]'],
  park: ['["leisure"="park"]'],
  school: ['["amenity"="school"]'],
  hotel: ['["tourism"="hotel"]'],
  hospital: ['["amenity"="hospital"]', '["amenity"="clinic"]'],
  bank: ['["amenity"="bank"]'],
  gas_station: ['["amenity"="fuel"]'],
  shopping: ['["shop"="mall"]', '["shop"="department_store"]', '["shop"="clothes"]'],
  company: [
    '["office"]',
    '["shop"="yes"]',
    '["shop"="furniture"]',
    '["shop"="hardware"]',
    '["shop"="car"]',
    '["craft"]',
  ],
};

const OVERPASS_NEARBY_URLS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const CATEGORY_PHOTON_QUERY: Record<NearbyCategory, string> = {
  restaurant: 'restaurant',
  fast_food: 'fast food',
  bakery: 'bakery',
  bar: 'bar',
  cafe: 'cafe',
  pharmacy: 'pharmacy',
  atm: 'atm',
  shopping_center: 'shopping mall',
  market: 'market',
  supermarket: 'supermarket',
  gym: 'gym',
  park: 'park',
  school: 'school',
  hotel: 'hotel',
  hospital: 'hospital',
  bank: 'bank',
  gas_station: 'gas station',
  shopping: 'shop',
  company: 'company office',
};

/** Busca textual em PT-BR (Nominatim) — densifica POIs quando Overpass/Photon falham. */
const CATEGORY_NOMINATIM_QUERY: Record<NearbyCategory, string> = {
  restaurant: 'restaurante',
  fast_food: 'lanchonete',
  bakery: 'padaria',
  bar: 'bar',
  cafe: 'cafeteria',
  pharmacy: 'farmácia',
  atm: 'caixa eletrônico',
  shopping_center: 'shopping',
  market: 'mercado',
  supermarket: 'supermercado',
  gym: 'academia',
  park: 'parque',
  school: 'escola',
  hotel: 'hotel',
  hospital: 'hospital',
  bank: 'banco',
  gas_station: 'posto de combustível',
  shopping: 'shopping',
  company: 'empresa',
};

const NOMINATIM_PREFERRED_CLASS: Partial<Record<NearbyCategory, Set<string>>> = {
  restaurant: new Set(['amenity']),
  fast_food: new Set(['amenity']),
  bakery: new Set(['shop', 'amenity']),
  bar: new Set(['amenity']),
  cafe: new Set(['amenity']),
  pharmacy: new Set(['amenity', 'shop']),
  atm: new Set(['amenity']),
  shopping_center: new Set(['shop', 'amenity']),
  market: new Set(['shop', 'amenity']),
  supermarket: new Set(['shop']),
  gym: new Set(['leisure', 'amenity']),
  park: new Set(['leisure']),
  school: new Set(['amenity']),
  hotel: new Set(['tourism']),
  hospital: new Set(['amenity', 'healthcare']),
  bank: new Set(['amenity', 'office']),
  gas_station: new Set(['amenity']),
  shopping: new Set(['shop', 'amenity']),
  company: new Set(['office', 'shop', 'craft', 'amenity']),
};

function isOverpassRelatedFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('overpass') ||
    message.includes('502') ||
    message.includes('bad gateway') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('tempo esgotado') ||
    message.includes('places/nearby failed')
  );
}

function shouldFallbackToPlacesApi(error: unknown, baseUrl: string): boolean {
  const isLocalBase =
    baseUrl.includes('192.168.') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  return isLocalBase && isOverpassRelatedFailure(error);
}

function unwrapPlacesArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['data', 'places', 'results', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
}

function formatOsmAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', '),
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'],
  ].filter((p) => typeof p === 'string' && p.trim().length > 0);
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function parseOverpassElements(
  elements: Array<{
    type?: string;
    id?: number;
    lat?: number;
    lon?: number;
    center?: { lat?: number; lon?: number };
    tags?: Record<string, string>;
  }>,
  category: string,
  limit: number,
): NearbyPlace[] {
  const places: NearbyPlace[] = [];
  for (const el of elements) {
    if (places.length >= limit) break;
    const tags = el.tags ?? {};
    const name = (tags.name || tags.brand || tags.operator || '').trim();
    if (!name) continue;
    const lat = Number(el.lat ?? el.center?.lat);
    const lon = Number(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const type = (el.type || 'node').toLowerCase();
    const id = el.id != null ? `${type}/${el.id}` : '';
    if (!id) continue;
    places.push({
      id,
      name,
      latitude: lat,
      longitude: lon,
      category: tags.amenity || tags.shop || tags.leisure || tags.tourism || category,
      formattedAddress: formatOsmAddress(tags),
      telefone: tags.phone || tags['contact:phone'] || undefined,
    });
  }
  return places;
}

async function fetchNearbyFromOverpass(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  // Overpass público fica lento/timeout com raios muito grandes (ex.: 45 km da cidade).
  const radius = Math.min(params.radius ?? NEARBY_PLACES_RADIUS_METERS, 15_000);
  const limit = params.limit ?? 20;
  const category = params.category;

  const filters = category
    ? CATEGORY_OSM_FILTERS[category] ?? [`["amenity"="${category}"]`]
    : [
        '["amenity"="restaurant"]',
        '["amenity"="fast_food"]',
        '["amenity"="cafe"]',
        '["amenity"="pharmacy"]',
        '["shop"="supermarket"]',
        '["amenity"="bank"]',
        '["amenity"="fuel"]',
      ];

  const around = `(around:${Math.round(radius)},${params.lat},${params.lon})`;
  const union = filters.map((f) => `nwr${f}${around};`).join('');
  const body = `[out:json][timeout:25];(${union});out center ${Math.min(limit * 2, 60)};`;
  const payload = `data=${encodeURIComponent(body)}`;

  let lastError: Error | null = null;
  for (const overpassUrl of OVERPASS_NEARBY_URLS) {
    try {
      const res = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'RotaApp/1.0',
        },
        body: payload,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass failed (${res.status})`);
        continue;
      }
      const json = (await res.json()) as {
        elements?: Array<{
          type?: string;
          id?: number;
          lat?: number;
          lon?: number;
          center?: { lat?: number; lon?: number };
          tags?: Record<string, string>;
        }>;
      };
      return parseOverpassElements(json.elements ?? [], category ?? 'place', limit);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('Falha ao consultar Overpass');
}

function viewboxAround(lat: number, lon: number, radiusMeters: number): string {
  const dLat = radiusMeters / 111_320;
  const dLon = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  // Nominatim: left, top, right, bottom
  return `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`;
}

/** Nominatim com viewbox — retorna POIs reais perto do centro (melhor que Photon por nome EN). */
async function fetchNearbyFromNominatim(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  const limit = params.limit ?? 20;
  const category = params.category;
  const radius = Math.min(params.radius ?? NEARBY_PLACES_RADIUS_METERS, 12_000);
  const q = category
    ? CATEGORY_NOMINATIM_QUERY[category] ?? category
    : 'restaurante';
  const preferredClass = category ? NOMINATIM_PREFERRED_CLASS[category] : undefined;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(Math.min(Math.max(limit * 2, 20), 40)));
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('bounded', '1');
  url.searchParams.set('viewbox', viewboxAround(params.lat, params.lon, radius));
  url.searchParams.set('q', q);

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'RotaApp/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Nominatim failed (${res.status})`);
  }

  const data = (await res.json()) as Array<{
    place_id?: number;
    osm_type?: string;
    osm_id?: number;
    name?: string;
    display_name?: string;
    lat?: string;
    lon?: string;
    class?: string;
    type?: string;
    address?: {
      road?: string;
      suburb?: string;
      neighbourhood?: string;
      city?: string;
      town?: string;
      village?: string;
    };
  }>;

  if (!Array.isArray(data)) return [];

  const places: NearbyPlace[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    if (places.length >= limit) break;
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (distanceMeters([params.lon, params.lat], [lon, lat]) > radius) continue;

    const cls = (item.class || '').toLowerCase();
    if (preferredClass && preferredClass.size > 0 && !preferredClass.has(cls)) {
      // Mantém se o nome claramente casa com a busca (ex.: "Mendes Bar Restaurante").
      const nameLower = (item.name || '').toLowerCase();
      if (!nameLower.includes(q.toLowerCase().split(' ')[0] ?? q)) continue;
    }

    const name =
      (item.name || '').trim() ||
      (item.display_name || '').split(',')[0]?.trim() ||
      '';
    if (!name) continue;

    const osmType = (item.osm_type || 'node').toLowerCase();
    const id =
      item.osm_id != null
        ? `${osmType}/${item.osm_id}`
        : item.place_id != null
          ? `nom-${item.place_id}`
          : `nom-${lat}-${lon}-${places.length}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const addr = item.address ?? {};
    const addressParts = [
      addr.road,
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.village,
    ].filter((p) => typeof p === 'string' && p.trim().length > 0);

    places.push({
      id,
      name,
      latitude: lat,
      longitude: lon,
      category: item.type || category || 'place',
      formattedAddress: addressParts.length > 0 ? addressParts.join(' — ') : undefined,
    });
  }
  return places;
}

/** Photon (Komoot) — fallback secundário. */
async function fetchNearbyFromPhoton(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  const limit = params.limit ?? 20;
  const category = params.category;
  const q = category ? CATEGORY_PHOTON_QUERY[category] ?? category : 'amenity';

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lon));
  url.searchParams.set('limit', String(Math.min(limit, 40)));
  url.searchParams.set('lang', 'en');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'RotaApp/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Photon failed (${res.status})`);
  }

  const json = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        osm_id?: number;
        osm_type?: string;
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        type?: string;
        osm_key?: string;
        osm_value?: string;
      };
    }>;
  };

  const maxDistance = Math.min(params.radius ?? NEARBY_PLACES_RADIUS_METERS, 20_000);
  const places: NearbyPlace[] = [];
  for (const feature of json.features ?? []) {
    if (places.length >= limit) break;
    const coords = feature.geometry?.coordinates;
    const props = feature.properties;
    if (!coords || coords.length < 2 || !props?.name?.trim()) continue;
    const [lon, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (distanceMeters([params.lon, params.lat], [lon, lat]) > maxDistance) continue;

    const osmType = (props.osm_type || 'N').toLowerCase();
    const typeMap: Record<string, string> = { n: 'node', w: 'way', r: 'relation' };
    const id =
      props.osm_id != null
        ? `${typeMap[osmType] ?? 'node'}/${props.osm_id}`
        : `photon-${lat}-${lon}-${places.length}`;

    const addressParts = [
      [props.street, props.housenumber].filter(Boolean).join(', '),
      props.city,
    ].filter((p) => typeof p === 'string' && p.trim().length > 0);

    places.push({
      id,
      name: props.name.trim(),
      latitude: lat,
      longitude: lon,
      category: props.osm_value || props.type || category || 'place',
      formattedAddress: addressParts.length > 0 ? addressParts.join(' — ') : undefined,
    });
  }
  return places;
}

/** Nominatim (PT) primeiro; Photon/Overpass como reforço. */
async function fetchNearbyClientFallback(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  try {
    const nominatim = await fetchNearbyFromNominatim(params);
    if (nominatim.length > 0) return nominatim;
  } catch {
    // tenta próximos
  }
  try {
    const photon = await fetchNearbyFromPhoton(params);
    if (photon.length > 0) return photon;
  } catch {
    // tenta Overpass
  }
  return fetchNearbyFromOverpass(params);
}

// A busca de Maricá (raio de 45 km) leva ~8 s na API e mais um pouco no túnel.
// 6 s cancelava a resposta certa e caía no Overpass do celular, que estoura o alerta.
const PLACES_API_TIMEOUT_MS = 20_000;

function buildNearbyPlacesUrl(baseUrl: string, params: NearbyPlacesParams): string {
  const query = [
    `lat=${encodeURIComponent(String(params.lat))}`,
    `lon=${encodeURIComponent(String(params.lon))}`,
  ];
  if (params.category) query.push(`category=${encodeURIComponent(params.category)}`);
  if (params.radius != null) query.push(`radius=${encodeURIComponent(String(params.radius))}`);
  if (params.limit != null) query.push(`limit=${encodeURIComponent(String(params.limit))}`);
  return `${baseUrl.replace(/\/$/, '')}/api/v1/places/nearby?${query.join('&')}`;
}

async function requestNearbyPlaces(
  baseUrl: string,
  params: NearbyPlacesParams,
  timeoutMs = PLACES_API_TIMEOUT_MS,
): Promise<NearbyPlace[]> {
  const url = buildNearbyPlacesUrl(baseUrl, params);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tempo esgotado ao buscar locais.')), timeoutMs);
  });
  try {
    const res = await Promise.race([
      fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
      timeout,
    ]);
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
    return unwrapPlacesArray(raw)
      .map((item) =>
        item && typeof item === 'object' ? normalizeNearbyPlace(item as Record<string, unknown>) : null,
      )
      .filter((p): p is NearbyPlace => p != null);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getNearbyPlaces(params: NearbyPlacesParams): Promise<NearbyPlace[]> {
  const primaryBaseUrl = getApiBaseUrl();
  try {
    return await requestNearbyPlaces(primaryBaseUrl, params);
  } catch (primaryError) {
    const canTryBackup =
      PLACES_FALLBACK_API_BASE_URL !== primaryBaseUrl &&
      (shouldFallbackToPlacesApi(primaryError, primaryBaseUrl) || isOverpassRelatedFailure(primaryError));
    if (canTryBackup) {
      try {
        return await requestNearbyPlaces(PLACES_FALLBACK_API_BASE_URL, params);
      } catch {
        // Segue para a busca direta no OpenStreetMap.
      }
    }
    try {
      return await fetchNearbyClientFallback(params);
    } catch (fallbackError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(primaryMessage || fallbackMessage || 'Falha ao buscar locais');
    }
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
    'company',
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
