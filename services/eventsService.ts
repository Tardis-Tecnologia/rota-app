import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';

/** Mesmo escopo de host usado em listagem, favoritos e RSVP. */
export function resolveEventScopeHostId(preferredHostId?: string | null): string {
  const preferred = preferredHostId?.trim();
  if (preferred) return preferred;

  try {
    return getWhitelabelHostId();
  } catch {
    /* EXPO_PUBLIC_HOST_ID ausente — tenta JWT */
  }

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
  creatorName?: string | null;
  creatorPhotoUrl?: string | null;
  image?: EventImage | null;
}

function readString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function normalizeEventImage(raw: unknown): EventImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = readString(r.id ?? r.imageId ?? r.image_id);
  const publicUrl = readString(r.publicUrl ?? r.public_url ?? r.url);
  const path = readString(r.path) ?? '';
  if (!id && !publicUrl) return null;
  return {
    id: id ?? 'image',
    publicUrl,
    path,
  };
}

function readCapacity(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function normalizeEventItem(raw: unknown): EventItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const imageFromApi = normalizeEventImage(r.image);
  const imageId = readString(r.imageId ?? r.image_id) ?? imageFromApi?.id ?? null;
  const image: EventImage | null =
    imageFromApi ??
    (imageId
      ? {
          id: imageId,
          publicUrl: null,
          path: '',
        }
      : null);

  return {
    hostId: r.hostId == null ? (r.host_id == null ? null : readString(r.host_id)) : readString(r.hostId),
    id: readString(r.id) ?? readString(r.eventId ?? r.event_id) ?? '',
    title: String(r.title ?? ''),
    description: r.description == null ? null : String(r.description),
    categories: Array.isArray(r.categories) ? r.categories.map(String) : [],
    startDate: readString(r.startDate ?? r.start_date),
    endDate: readString(r.endDate ?? r.end_date),
    locationName: readString(r.locationName ?? r.location_name),
    locationAddress: readString(r.locationAddress ?? r.location_address),
    latitude: readString(r.latitude),
    longitude: readString(r.longitude),
    capacity: readCapacity(r.capacity),
    featured: Boolean(r.featured),
    status: String(r.status ?? ''),
    authorId: readString(r.authorId ?? r.author_id),
    imageId,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
    createdBy: readString(r.createdBy ?? r.created_by) ?? undefined,
    updatedBy: readString(r.updatedBy ?? r.updated_by) ?? undefined,
    creatorName: readString(r.creatorName ?? r.creator_name),
    creatorPhotoUrl: readString(r.creatorPhotoUrl ?? r.creator_photo_url),
    image,
  };
}

async function fetchApi(endpoint: string): Promise<EventItem> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao carregar eventos: ${res.status}`);
  }
  const json: unknown = await res.json();
  return normalizeEventItem(json);
}

async function fetchApiList(endpoint: string): Promise<EventItem[]> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao carregar eventos: ${res.status}`);
  }
  const json: unknown = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map(normalizeEventItem);
}

function appendHostIdToEventsPath(path: string): string {
  const hostId = resolveEventScopeHostId();
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}hostId=${encodeURIComponent(hostId)}`;
}

export function explorePontoEventId(ponto: { id: string; placeType?: string }): string | null {
  if (ponto.id.startsWith('event-')) {
    const id = ponto.id.slice('event-'.length).trim();
    return id || null;
  }
  if (ponto.placeType === 'events') {
    const id = ponto.id.trim();
    return id || null;
  }
  return null;
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
  return fetchApiList(endpoint);
}

export async function getEventById(id: string): Promise<EventItem | null> {
  try {
    return await fetchApi(appendHostIdToEventsPath(`/events/${encodeURIComponent(id)}`));
  } catch {
    return null;
  }
}
