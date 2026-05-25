import { getApiBaseUrl, getAuthToken } from './authApi';
import { normalizeEventItem, type EventItem } from './eventsService';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';
const PUBLIC_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID?.trim();

export class EventFavoriteApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EventFavoriteApiError';
    this.status = status;
  }
}

export interface MyFavoriteEventRow {
  favoriteId: string;
  event: EventItem;
  savedAt: string | null;
}

export interface MyEventFavoriteStatus {
  eventId: string;
  favorited: boolean;
}

function resolveHostId(): string {
  const token = getAuthToken();
  if (token) {
    try {
      const c = parseJwtAccessTokenPayload(token);
      const fromJwt = c.hostId != null && String(c.hostId).trim() ? String(c.hostId).trim() : null;
      if (fromJwt) return fromJwt;
    } catch {
      /* token inválido */
    }
  }
  if (PUBLIC_HOST_ID) return PUBLIC_HOST_ID;
  throw new Error('EXPO_PUBLIC_HOST_ID não definida');
}

function authHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function readString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function formatHttpErrorMessage(text: string, status: number, fallback: string): string {
  const raw = text.trim();
  if (!raw) return `${fallback} (${status}).`;
  try {
    const body = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    /* não é JSON */
  }
  if (raw.length > 220) return `${raw.slice(0, 220)}…`;
  return raw;
}

function throwFavoriteError(text: string, status: number, fallback: string): never {
  const msg = formatHttpErrorMessage(text, status, fallback);
  if (status === 400) {
    throw new EventFavoriteApiError('Não foi possível salvar este evento.', 400);
  }
  if (status === 403) {
    throw new EventFavoriteApiError('Você não tem permissão para esta ação.', 403);
  }
  if (status === 404) {
    throw new EventFavoriteApiError('Evento não encontrado.', 404);
  }
  throw new EventFavoriteApiError(msg, status);
}

function normalizeApiArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const inner = (parsed as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function normalizeFavoriteRow(raw: unknown): MyFavoriteEventRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const eventRaw = r.event;
  if (!eventRaw || typeof eventRaw !== 'object') return null;
  const event = normalizeEventItem(eventRaw);
  if (!event.id) return null;
  return {
    favoriteId:
      readString(r.favoriteId ?? r.favorite_id ?? r.id) ?? event.id,
    event,
    savedAt: readString(r.savedAt ?? r.saved_at ?? r.createdAt ?? r.created_at),
  };
}

function normalizeFavoriteMe(raw: unknown, eventId: string): MyEventFavoriteStatus {
  if (!raw || typeof raw !== 'object') {
    return { eventId, favorited: false };
  }
  const r = raw as Record<string, unknown>;
  const status = readString(r.status);
  const favorited =
    r.favorited === true ||
    r.isFavorite === true ||
    r.is_favorite === true ||
    status === 'saved' ||
    status === 'favorited' ||
    status === 'active';
  return {
    eventId: readString(r.eventId ?? r.event_id) ?? eventId,
    favorited,
  };
}

export async function getMyEventFavorite(eventId: string): Promise<MyEventFavoriteStatus> {
  const token = getAuthToken();
  if (!token) return { eventId, favorited: false };

  const params = new URLSearchParams({
    hostId: resolveHostId(),
    eventId,
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites/me?${params}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return { eventId, favorited: false };
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwFavoriteError(text, res.status, 'Erro ao verificar favorito');
  }
  const json: unknown = await res.json();
  return normalizeFavoriteMe(json, eventId);
}

export async function listMyFavoriteEvents(
  init = 0,
  end = 20,
): Promise<MyFavoriteEventRow[]> {
  const token = getAuthToken();
  if (!token) return [];

  const params = new URLSearchParams({
    hostId: resolveHostId(),
    init: String(init),
    end: String(end),
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites/my-events?${params}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwFavoriteError(text, res.status, 'Erro ao carregar eventos salvos');
  }
  const json: unknown = await res.json();
  return normalizeApiArray(json)
    .map(normalizeFavoriteRow)
    .filter((r): r is MyFavoriteEventRow => r != null);
}

export async function addEventFavorite(eventId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new EventFavoriteApiError('Faça login para salvar eventos.', 401);
  }
  const qs = new URLSearchParams({ hostId: resolveHostId() }).toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites?${qs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ eventId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwFavoriteError(text, res.status, 'Não foi possível salvar o evento');
  }
}

export async function removeEventFavorite(eventId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new EventFavoriteApiError('Faça login para remover dos salvos.', 401);
  }
  const qs = new URLSearchParams({ hostId: resolveHostId() }).toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites/${encodeURIComponent(eventId)}?${qs}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 404) return;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwFavoriteError(text, res.status, 'Não foi possível remover dos salvos');
  }
}

export async function toggleEventFavorite(
  eventId: string,
  currentlyFavorited: boolean,
): Promise<boolean> {
  if (currentlyFavorited) {
    await removeEventFavorite(eventId);
    return false;
  }
  await addEventFavorite(eventId);
  return true;
}
