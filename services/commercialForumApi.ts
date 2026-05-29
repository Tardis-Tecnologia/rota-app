import type {
    CommercialForumPostDetail,
    CommercialForumPostListItem,
    CommercialMetrics,
} from '@/types/forumCommercial';
import { getApiBaseUrl, getAuthToken } from './authApi';
import type { ForumContactStoreResponse } from './forumApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';

export interface CreateCommercialForumPostBody {
  title: string;
  content: string;
  commercialCouponId?: string;
  mediaId?: string;
  locationDescription?: string;
}

export type UpdateCommercialForumPostBody = Partial<CreateCommercialForumPostBody> & {
  commercialCouponId?: string | null;
};

function resolveHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;

  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (fromEnv) return fromEnv;

  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromJwt = claims.hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // ignore
    }
  }

  throw new Error(
    'Não foi possível definir o host. Faça login com a conta da loja ou defina EXPO_PUBLIC_HOST_ID.',
  );
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
      if (Array.isArray(j?.message)) return j.message.filter((x) => typeof x === 'string').join(', ');
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getCommercialMetrics(): Promise<CommercialMetrics> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/metrics`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as CommercialMetrics;
}

export async function listCommercialForumPosts(options?: {
  init?: number;
  end?: number;
}): Promise<CommercialForumPostListItem[]> {
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/forum/posts${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as CommercialForumPostListItem[]) : [];
}

export async function getCommercialForumPost(
  commercialPostId: string,
): Promise<CommercialForumPostDetail> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/forum/posts/${encodeURIComponent(commercialPostId)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as CommercialForumPostDetail;
}

export async function createCommercialForumPost(
  body: CreateCommercialForumPostBody,
  hostId?: string,
): Promise<CommercialForumPostDetail> {
  const hid = resolveHostId(hostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/forum/hosts/${encodeURIComponent(hid)}/posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as CommercialForumPostDetail;
}

export async function updateCommercialForumPost(
  commercialPostId: string,
  body: UpdateCommercialForumPostBody,
): Promise<CommercialForumPostListItem> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/forum/posts/${encodeURIComponent(commercialPostId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as CommercialForumPostListItem;
}

export async function contactCommercialStore(
  commercialAccountId: string,
  message?: string,
  hostId?: string,
): Promise<ForumContactStoreResponse> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/${encodeURIComponent(commercialAccountId)}/contact`;
  const body: Record<string, string> = {};
  const trimmedMessage = message?.trim();
  if (trimmedMessage) {
    body.message = trimmedMessage;
  }
  const hid = hostId?.trim();
  if (hid) body.hostId = hid;

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as ForumContactStoreResponse & { channelType?: string };
  const cid = data.cid?.trim() ?? '';
  if (cid.includes(':')) {
    const colon = cid.indexOf(':');
    return {
      ...data,
      channelType: data.channelType?.trim() || cid.slice(0, colon),
      channelId: data.channelId?.trim() || cid.slice(colon + 1),
    };
  }
  return {
    ...data,
    channelType: data.channelType?.trim() || 'messaging',
    channelId: data.channelId?.trim() || '',
  };
}

export async function deleteCommercialForumPost(commercialPostId: string): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/forum/posts/${encodeURIComponent(commercialPostId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
