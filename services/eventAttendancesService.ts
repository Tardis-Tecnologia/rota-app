import { getApiBaseUrl, getAuthToken } from './authApi';
import { normalizeEventItem, type EventItem } from './eventsService';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';
const PUBLIC_HOST_ID = process.env.EXPO_PUBLIC_HOST_ID?.trim();

export type EventAttendanceStatus = 'confirmed' | 'cancelled' | null;

export class EventAttendanceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EventAttendanceApiError';
    this.status = status;
  }
}

export interface MyEventAttendance {
  eventId: string;
  status: EventAttendanceStatus;
  confirmedAt: string | null;
}

export interface EventAttendanceCount {
  eventId: string;
  count: number;
}

export interface EventParticipant {
  userId: string;
  name: string;
  photoUrl: string | null;
  confirmedAt: string;
}

export interface MyEventWithAttendance {
  attendanceId: string;
  status: 'confirmed';
  confirmedAt: string;
  event: EventItem;
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

function throwAttendanceError(text: string, status: number, fallback: string): never {
  const msg = formatHttpErrorMessage(text, status, fallback);
  if (status === 409) {
    throw new EventAttendanceApiError('Este evento está lotado.', 409);
  }
  if (status === 400) {
    throw new EventAttendanceApiError(
      'Este evento não está disponível para confirmação de presença.',
      400,
    );
  }
  if (status === 403) {
    throw new EventAttendanceApiError('Você não tem permissão para esta ação.', 403);
  }
  if (status === 404) {
    throw new EventAttendanceApiError('Evento não encontrado.', 404);
  }
  throw new EventAttendanceApiError(msg, status);
}

function attendanceQuery(eventId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    hostId: resolveHostId(),
    eventId,
    ...extra,
  });
  return params.toString();
}

function hostQuery(extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    hostId: resolveHostId(),
    ...extra,
  });
  return params.toString();
}

function normalizeApiArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const inner = (parsed as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function readString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function normalizeMyAttendance(raw: unknown, eventId: string): MyEventAttendance {
  const r = (raw ?? {}) as Record<string, unknown>;
  const statusRaw = readString(r.status);
  const status: EventAttendanceStatus =
    statusRaw === 'confirmed' || statusRaw === 'cancelled' ? statusRaw : null;
  return {
    eventId: readString(r.eventId ?? r.event_id) ?? eventId,
    status,
    confirmedAt: readString(r.confirmedAt ?? r.confirmed_at),
  };
}

function normalizeCount(raw: unknown, eventId: string): EventAttendanceCount {
  const r = (raw ?? {}) as Record<string, unknown>;
  const count = Number(r.count);
  return {
    eventId: readString(r.eventId ?? r.event_id) ?? eventId,
    count: Number.isFinite(count) && count >= 0 ? count : 0,
  };
}

function normalizeParticipant(raw: unknown): EventParticipant | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const userId = readString(r.userId ?? r.user_id);
  if (!userId) return null;
  return {
    userId,
    name: readString(r.name) ?? 'Participante',
    photoUrl: readString(r.photoUrl ?? r.photo_url),
    confirmedAt: readString(r.confirmedAt ?? r.confirmed_at) ?? '',
  };
}

function normalizeMyEventRow(raw: unknown): MyEventWithAttendance | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const eventRaw = r.event;
  if (!eventRaw || typeof eventRaw !== 'object') return null;
  const event = normalizeEventItem(eventRaw);
  if (!event.id) return null;
  const statusRaw = readString(r.status);
  if (statusRaw && statusRaw !== 'confirmed') return null;
  return {
    attendanceId:
      readString(r.attendanceId ?? r.attendance_id ?? r.id) ?? '',
    status: 'confirmed',
    confirmedAt: readString(r.confirmedAt ?? r.confirmed_at) ?? '',
    event,
  };
}

export async function listMyEventsWithAttendance(
  init = 0,
  end = 20,
): Promise<MyEventWithAttendance[]> {
  const token = getAuthToken();
  if (!token) return [];

  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances/my-events?${hostQuery({
    init: String(init),
    end: String(end),
  })}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Erro ao carregar seus eventos');
  }
  const json: unknown = await res.json();
  return normalizeApiArray(json)
    .map(normalizeMyEventRow)
    .filter((r): r is MyEventWithAttendance => r != null);
}

export async function getMyEventAttendance(eventId: string): Promise<MyEventAttendance> {
  const token = getAuthToken();
  if (!token) {
    return { eventId, status: null, confirmedAt: null };
  }
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances/me?${attendanceQuery(eventId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) {
    return { eventId, status: null, confirmedAt: null };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Erro ao carregar sua presença');
  }
  const json: unknown = await res.json();
  return normalizeMyAttendance(json, eventId);
}

export async function getEventAttendanceCount(eventId: string): Promise<EventAttendanceCount> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances/count?${attendanceQuery(eventId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Erro ao carregar confirmações');
  }
  const json: unknown = await res.json();
  return normalizeCount(json, eventId);
}

export async function listEventParticipants(
  eventId: string,
  init = 0,
  end = 20,
): Promise<EventParticipant[]> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances?${attendanceQuery(eventId, {
    init: String(init),
    end: String(end),
  })}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Erro ao carregar participantes');
  }
  const json: unknown = await res.json();
  return normalizeApiArray(json)
    .map(normalizeParticipant)
    .filter((p): p is EventParticipant => p != null);
}

export async function confirmEventAttendance(eventId: string): Promise<MyEventAttendance> {
  const token = getAuthToken();
  if (!token) {
    throw new EventAttendanceApiError('Faça login para confirmar presença.', 401);
  }
  const qs = new URLSearchParams({ hostId: resolveHostId() }).toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances?${qs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ eventId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Não foi possível confirmar presença');
  }
  const json: unknown = await res.json();
  return normalizeMyAttendance(json, eventId);
}

export async function cancelEventAttendance(eventId: string): Promise<MyEventAttendance> {
  const token = getAuthToken();
  if (!token) {
    throw new EventAttendanceApiError('Faça login para cancelar presença.', 401);
  }
  const qs = new URLSearchParams({ hostId: resolveHostId() }).toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/event-attendances/${encodeURIComponent(eventId)}?${qs}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 404) {
    return { eventId, status: null, confirmedAt: null };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throwAttendanceError(text, res.status, 'Não foi possível cancelar presença');
  }
  const json: unknown = await res.json().catch(() => null);
  if (json) return normalizeMyAttendance(json, eventId);
  return { eventId, status: 'cancelled', confirmedAt: null };
}
