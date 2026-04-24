import { getApiBaseUrl, getAuthToken } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';
const PUBLIC_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID?.trim();

function eventsHostIdForRequest(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const c = parseJwtAccessTokenPayload(token);
      const fromJwt = c.hostId != null && String(c.hostId).trim() ? String(c.hostId).trim() : null;
      if (fromJwt) return fromJwt;
    } catch {
      /* token inválido ou não-JWT */
    }
  }
  if (PUBLIC_HOST_ID) return PUBLIC_HOST_ID;
  throw new Error('EXPO_PUBLIC_HOST_ID não definida');
}

export interface EventImage {
  id: string;
  publicUrl: string | null;
  path: string;
}

export interface EventItem {
  hostId?: string | null;
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  locationAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  capacity: number | null;
  featured: boolean;
  status: string;
  authorId: string | null;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  image?: EventImage | null;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao carregar eventos: ${res.status}`);
  }
  return res.json();
}

function appendHostIdToEventsPath(path: string): string {
  const hostId = eventsHostIdForRequest();
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}hostId=${encodeURIComponent(hostId)}`;
}

export async function getEvents(options?: {
  status?: string;
  featured?: boolean;
  init?: number;
  end?: number;
  startDate?: string;
  endDate?: string;
  categories?: string;
  locationName?: string;
  title?: string;
}): Promise<EventItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.featured !== undefined) {
    const f = options.featured;
    if (typeof f === 'boolean') {
      params.set('featured', f ? 'true' : 'false');
    } else {
      params.set('featured', f);
    }
  }
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  if (options?.startDate) params.set('startDate', options.startDate);
  if (options?.endDate) params.set('endDate', options.endDate);
  if (options?.categories) params.set('categories', options.categories);
  if (options?.locationName) params.set('locationName', options.locationName);
  if (options?.title) params.set('title', options.title);
  const qs = params.toString();
  const path = qs ? `/events?${qs}` : '/events';
  const endpoint = appendHostIdToEventsPath(path);
  const data = await fetchApi<EventItem[]>(endpoint);
  return Array.isArray(data) ? data : [];
}

export async function getEventById(id: string): Promise<EventItem | null> {
  try {
    return await fetchApi<EventItem>(
      appendHostIdToEventsPath(`/events/${encodeURIComponent(id)}`),
    );
  } catch {
    return null;
  }
}
