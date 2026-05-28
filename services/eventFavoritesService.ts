import { getApiBaseUrl, getAuthToken } from './authApi';
import { normalizeEventItem, resolveEventScopeHostId, type EventItem } from './eventsService';

const BASE_PATH = '/api/v1';

export class EventFavoriteApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EventFavoriteApiError';
    this.status = status;
  }
}

export interface MyFavoriteEventRow {
  eventId: string;
  event: EventItem;
  favoritedAt: string | null;
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
  const eventId = readString(r.eventId ?? r.event_id) ?? event.id;
  if (!eventId) return null;
  return {
    eventId,
    event,
    favoritedAt: readString(r.favoritedAt ?? r.favorited_at),
  };
}

function favoritesQuery(hostId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ hostId, ...extra });
  return params.toString();
}

/** GET /event-favorites?hostId=&init=&end= */
export async function listMyFavoriteEvents(
  init = 0,
  end = 20,
  hostId?: string | null,
): Promise<MyFavoriteEventRow[]> {
  const token = getAuthToken();
  if (!token) return [];

  const scopedHostId = resolveEventScopeHostId(hostId);
  const qs = favoritesQuery(scopedHostId, {
    init: String(init),
    end: String(end),
  });
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites?${qs}`;
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

/** POST /event-favorites?hostId= (idempotente) */
export async function addEventFavorite(
  eventId: string,
  hostId?: string | null,
): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new EventFavoriteApiError('Faça login para salvar eventos.', 401);
  }
  const scopedHostId = resolveEventScopeHostId(hostId);
  const qs = favoritesQuery(scopedHostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-favorites?${qs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      eventId,
      hostId: scopedHostId,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwFavoriteError(text, res.status, 'Não foi possível salvar o evento');
  }
}

/** DELETE /event-favorites/:eventId?hostId= */
export async function removeEventFavorite(
  eventId: string,
  hostId?: string | null,
): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new EventFavoriteApiError('Faça login para remover dos salvos.', 401);
  }
  const scopedHostId = resolveEventScopeHostId(hostId);
  const qs = favoritesQuery(scopedHostId);
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

export async function isEventFavorited(
  eventId: string,
  hostId?: string | null,
): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  const rows = await listMyFavoriteEvents(0, 200, hostId);
  return rows.some((r) => r.eventId === eventId || r.event.id === eventId);
}

export async function toggleEventFavorite(
  eventId: string,
  currentlyFavorited: boolean,
  hostId?: string | null,
): Promise<boolean> {
  if (currentlyFavorited) {
    await removeEventFavorite(eventId, hostId);
    return false;
  }
  await addEventFavorite(eventId, hostId);
  return true;
}
