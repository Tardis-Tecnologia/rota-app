import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export interface NotificationDto {
  id: string;
  hostId: string;
  name: string;
  description: string | null;
  createdAt: string;
  isRead?: boolean;
  readAt?: string | null;
  channelType?: string | null;
  channelId?: string | null;
}

export interface NotificationReadResponseDto {
  id: string;
  notificationId: string;
  readAt: string;
}

export function isNotificationUnreadDto(item: NotificationDto): boolean {
  if (typeof item.isRead === 'boolean') {
    return !item.isRead;
  }
  if (item.readAt != null && item.readAt !== '') {
    return false;
  }
  if (item.readAt === null) {
    return true;
  }
  return false;
}

function normalizeNotification(raw: unknown): NotificationDto {
  const r = raw as Record<string, unknown>;
  const readAtRaw = r.readAt;
  let readAt: string | null | undefined;
  if (readAtRaw === null) readAt = null;
  else if (readAtRaw === undefined) readAt = undefined;
  else readAt = String(readAtRaw);

  return {
    id: String(r.id),
    hostId: String(r.hostId),
    name: String(r.name),
    description: r.description == null ? null : String(r.description),
    createdAt: String(r.createdAt),
    isRead: typeof r.isRead === 'boolean' ? r.isRead : undefined,
    readAt,
    channelType: r.channelType == null ? null : String(r.channelType),
    channelId: r.channelId == null ? null : String(r.channelId),
  };
}

function getNotificationsHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;
  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!fromEnv) {
    throw new Error('Informe hostId ou defina EXPO_PUBLIC_HOST_ID');
  }
  return fromEnv;
}

export const NOTIFICATIONS_PAGE_SIZE = 10;

export interface GetNotificationsPageResult {
  items: NotificationDto[];
  total: number | null;
}

export async function getNotifications(options?: {
  hostId?: string;
  name?: string;
  init?: number;
  end?: number;
}): Promise<GetNotificationsPageResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }

  const hostId = getNotificationsHostId(options?.hostId);
  const params = new URLSearchParams({ hostId });
  if (options?.name?.trim()) params.set('name', options.name.trim());
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));

  const url = `${getApiBaseUrl()}${BASE_PATH}/notifications?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao carregar notificações: ${res.status}`);
  }

  const totalHeader = res.headers.get('X-Total-Count');
  let total: number | null = null;
  if (totalHeader != null && totalHeader.trim() !== '') {
    const n = Number.parseInt(totalHeader, 10);
    if (!Number.isNaN(n)) total = n;
  }

  const data = await res.json();
  if (!Array.isArray(data)) return { items: [], total };
  return { items: data.map(normalizeNotification), total };
}

export interface NotificationsUnreadCountResponse {
  count: number;
}

export async function getNotificationsUnreadCount(options?: {
  hostId?: string;
}): Promise<NotificationsUnreadCountResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }

  const hostId = getNotificationsHostId(options?.hostId);
  const params = new URLSearchParams({ hostId });
  const url = `${getApiBaseUrl()}${BASE_PATH}/notifications/unread-count?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { count: 0 };
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao carregar contador: ${res.status}`);
  }

  const data = (await res.json()) as { count?: unknown };
  const count = typeof data.count === 'number' ? data.count : 0;
  return { count };
}

export async function markNotificationRead(notificationId: string, options?: { hostId?: string }) {
  const token = getAuthToken();
  if (!token) throw new Error('Não autenticado');
  const hostId = options?.hostId?.trim() || process.env.EXPO_PUBLIC_HOST_ID?.trim();
  const qs = hostId ? `?${new URLSearchParams({ hostId }).toString()}` : '';
  const url = `${getApiBaseUrl()}${BASE_PATH}/notification-reads/${encodeURIComponent(notificationId)}${qs}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao marcar como lida: ${res.status}`);
  }
  return (await res.json()) as NotificationReadResponseDto;
}