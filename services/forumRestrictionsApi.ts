import { getApiBaseUrl, getAuthToken } from './authApi';
import { resolveForumHostId } from './forumApi';
import { parseForumApiError } from './forumApiError';

const BASE_PATH = '/api/v1';

export interface ForumMeRestrictionsDto {
  hostId: string;
  active: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  canPublish: boolean;
  canComment: boolean;
  message: string | null;
}

const DEFAULT_RESTRICTIONS: ForumMeRestrictionsDto = {
  hostId: '',
  active: true,
  isBanned: false,
  isSuspended: false,
  suspendedUntil: null,
  suspensionReason: null,
  canPublish: true,
  canComment: true,
  message: null,
};

function pickBool(raw: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    if (typeof raw[key] === 'boolean') return raw[key] as boolean;
  }
  return false;
}

function pickStringOrNull(raw: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v === null) return null;
  }
  return null;
}

export function normalizeForumMeRestrictions(raw: unknown): ForumMeRestrictionsDto {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_RESTRICTIONS };
  }
  const r = raw as Record<string, unknown>;
  const hostId = String(r.hostId ?? r.host_id ?? '').trim();
  const active = typeof r.active === 'boolean' ? r.active : true;
  const isBanned =
    pickBool(r, 'isBanned', 'is_banned') || (!active && !pickBool(r, 'isSuspended', 'is_suspended'));
  const isSuspended = pickBool(r, 'isSuspended', 'is_suspended');
  const canPublish =
    typeof r.canPublish === 'boolean'
      ? r.canPublish
      : typeof r.can_publish === 'boolean'
        ? r.can_publish
        : active && !isBanned && !isSuspended;
  const canComment =
    typeof r.canComment === 'boolean'
      ? r.canComment
      : typeof r.can_comment === 'boolean'
        ? r.can_comment
        : canPublish;

  return {
    hostId,
    active,
    isBanned,
    isSuspended,
    suspendedUntil: pickStringOrNull(r, 'suspendedUntil', 'suspended_until'),
    suspensionReason: pickStringOrNull(r, 'suspensionReason', 'suspension_reason'),
    canPublish,
    canComment,
    message: pickStringOrNull(r, 'message'),
  };
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getMyForumRestrictions(
  hostId?: string,
): Promise<ForumMeRestrictionsDto> {
  const hid = resolveForumHostId(hostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/forum/me/restrictions?hostId=${encodeURIComponent(hid)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) {
    throw await parseForumApiError(res);
  }
  const data = await res.json();
  return normalizeForumMeRestrictions(data);
}
