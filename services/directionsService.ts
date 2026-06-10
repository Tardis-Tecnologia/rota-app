import type { DirectionsProfile, DirectionsRoute, RouteCoordinate } from '@/types/directions';

const DEFAULT_OSRM_BASE = 'https://router.project-osrm.org';
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const DEFAULT_ROUTING_FETCH_TIMEOUT_MS = 20_000;
const ORS_FETCH_TIMEOUT_MS = 15_000;

export const ROUTING_TIMEOUT_ERROR = 'ROUTING_TIMEOUT';

function getOsrmBaseUrl(): string {
  const custom = process.env.EXPO_PUBLIC_OSRM_URL?.trim().replace(/\/$/, '');
  return custom || DEFAULT_OSRM_BASE;
}

function getOrsApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_ORS_API_KEY?.trim();
  return key || null;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export { formatDistance as formatRouteDistance, formatDuration as formatRouteDuration };

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: RouteCoordinate[] };
  }>;
};

type OrsRouteResponse = {
  features?: Array<{
    properties?: { summary?: { distance?: number; duration?: number } };
    geometry?: { coordinates?: RouteCoordinate[] };
  }>;
};

type FetchJsonOptions = {
  timeoutMs?: number;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
};

async function fetchJsonWithTimeout<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_ROUTING_FETCH_TIMEOUT_MS, method = 'GET', headers, body } = options;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(ROUTING_TIMEOUT_ERROR)), timeoutMs);
  });

  try {
    const res = await Promise.race([
      fetch(url, {
        method,
        headers: { Accept: 'application/json', ...headers },
        body,
      }),
      timeoutPromise,
    ]);
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.message === ROUTING_TIMEOUT_ERROR) {
      throw error;
    }
    throw error instanceof Error ? error : new Error('Não foi possível calcular a rota.');
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchOsrmRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  profile: DirectionsProfile,
): Promise<DirectionsRoute> {
  const osrmProfile = profile === 'walking' ? 'foot' : 'driving';
  const [oLng, oLat] = origin;
  const [dLng, dLat] = destination;
  const url = `${getOsrmBaseUrl()}/route/v1/${osrmProfile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;

  const data = await fetchJsonWithTimeout<OsrmRouteResponse>(url);

  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
    throw new Error('Nenhuma rota encontrada entre os pontos.');
  }

  const route = data.routes[0];
  return {
    coordinates: route.geometry!.coordinates!,
    distanceMeters: route.distance ?? 0,
    durationSeconds: route.duration ?? 0,
    profile,
  };
}

async function fetchOrsRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  profile: DirectionsProfile,
  apiKey: string,
): Promise<DirectionsRoute> {
  const orsProfile = profile === 'walking' ? 'foot-walking' : 'driving-car';
  const url = `${ORS_BASE_URL}/v2/directions/${orsProfile}/geojson`;

  const data = await fetchJsonWithTimeout<OrsRouteResponse>(url, {
    timeoutMs: ORS_FETCH_TIMEOUT_MS,
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [origin, destination],
    }),
  });

  const feature = data.features?.[0];
  if (!feature) {
    throw new Error('Nenhuma rota encontrada entre os pontos.');
  }

  const coordinates = feature.geometry?.coordinates;
  if (!coordinates?.length) {
    throw new Error('Nenhuma rota encontrada entre os pontos.');
  }

  const summary = feature.properties?.summary;
  return {
    coordinates,
    distanceMeters: summary?.distance ?? 0,
    durationSeconds: summary?.duration ?? 0,
    profile,
  };
}

export async function getDirectionsRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  profile: DirectionsProfile = 'driving',
): Promise<DirectionsRoute> {
  const orsKey = getOrsApiKey();
  if (orsKey) {
    try {
      return await fetchOrsRoute(origin, destination, profile, orsKey);
    } catch {
      // fallback OSRM demo quando ORS falhar (limite, chave inválida, etc.)
    }
  }
  return fetchOsrmRoute(origin, destination, profile);
}

export function isOrsConfigured(): boolean {
  return getOrsApiKey() != null;
}
