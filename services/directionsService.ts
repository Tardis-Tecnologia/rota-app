import type { DirectionsProfile, DirectionsRoute, RouteCoordinate } from '@/types/directions';

const DEFAULT_OSRM_BASE = 'https://router.project-osrm.org';

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

async function fetchOsrmRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  profile: DirectionsProfile,
): Promise<DirectionsRoute> {
  const osrmProfile = profile === 'walking' ? 'foot' : 'driving';
  const [oLng, oLat] = origin;
  const [dLng, dLat] = destination;
  const url = `${getOsrmBaseUrl()}/route/v1/${osrmProfile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error('Não foi possível calcular a rota.');
  }

  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: RouteCoordinate[] };
    }>;
  };

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
  const [oLng, oLat] = origin;
  const [dLng, dLat] = destination;
  const url = `https://api.openrouteservice.org/v2/directions/${orsProfile}?api_key=${encodeURIComponent(apiKey)}&start=${oLng},${oLat}&end=${dLng},${dLat}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error('Não foi possível calcular a rota.');
  }

  const data = (await res.json()) as {
    features?: Array<{
      properties?: { summary?: { distance?: number; duration?: number } };
      geometry?: { coordinates?: RouteCoordinate[] };
    }>;
  };

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
      // fallback OSRM
    }
  }
  return fetchOsrmRoute(origin, destination, profile);
}
