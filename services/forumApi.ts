import type {
    ForumAuthorCommercial,
    ForumPromotedCoupon,
} from '@/types/forumCommercial';
import { getApiBaseUrl, getAuthToken } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';

export interface ForumAuthorDto {
  id: string;
  name: string | null;
  photoUrl: string | null;
}

export interface ForumPostListItemDto {
  id: string;
  hostId: string;
  userId: string | null;
  title: string;
  postType: string;
  likesCount: number;
  liked: boolean;
  commentsCount: number;
  locationDescription: string | null;
  mediaId: string | null;
  communityId: string | null;
  createdAt: string;
  author?: ForumAuthorDto;
  authorCommercial?: ForumAuthorCommercial;
  promotedCoupon?: ForumPromotedCoupon | null;
}

export interface ForumContactStoreResponse {
  cid: string;
  channelId: string;
  channelType: string;
  contactEventId: string;
  messageId: string;
}

export interface ForumPostResponseDto extends ForumPostListItemDto {
  content: string;
  updatedAt: string;
}

export interface ForumPostCommentListItemDto {
  id: string;
  userId: string;
  content: string;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  author?: ForumAuthorDto;
}

export interface CreateForumPostBody {
  title: string;
  content: string;
  postType: string;
  mediaId?: string;
  communityId?: string;
  locationDescription?: string;
}

function resolveHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;

  // App whitelabel: um host por build (.env). Prioriza o host da cidade para o feed
  // bater com publicações de lojas (cadastradas no mesmo host).
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
    'Não foi possível definir o host. Faça login com usuário vinculado a um host ou defina EXPO_PUBLIC_HOST_ID.',
  );
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
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

export async function listForumPosts(
  hostId?: string,
  options?: {
    postType?: string;
    communityId?: string;
    init?: number;
    end?: number;
  },
): Promise<ForumPostListItemDto[]> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams();
  if (options?.postType?.trim()) params.set('postType', options.postType.trim());
  if (options?.communityId?.trim()) params.set('communityId', options.communityId.trim());
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const url = `${base}${BASE_PATH}/forum/hosts/${encodeURIComponent(hid)}/posts${
    qs ? `?${qs}` : ''
  }`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as ForumPostListItemDto[]) : [];
}

export async function getForumPost(postId: string): Promise<ForumPostResponseDto> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(postId)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ForumPostResponseDto;
}

export async function listForumComments(
  postId: string,
  options?: { init?: number; end?: number },
): Promise<ForumPostCommentListItemDto[]> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(postId)}/comments${
    qs ? `?${qs}` : ''
  }`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as ForumPostCommentListItemDto[]) : [];
}

export async function createForumComment(postId: string, content: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(postId)}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content: content.trim() }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function createForumPost(
  hostId: string | undefined,
  body: CreateForumPostBody,
): Promise<void> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const url = `${base}${BASE_PATH}/forum/hosts/${encodeURIComponent(hid)}/posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function updateForumPost(
  postId: string,
  body: Partial<CreateForumPostBody>,
): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(postId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

function currentUserIdFromToken(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const c = parseJwtAccessTokenPayload(token);
    return (c.userId ?? c.sub ?? '').trim() || null;
  } catch {
    return null;
  }
}

export async function findRecentlyCreatedForumPostId(
  body: Pick<CreateForumPostBody, 'title' | 'content' | 'postType' | 'communityId'>,
  hostId?: string,
): Promise<string | null> {
  const userId = currentUserIdFromToken();
  const rows = await listForumPosts(hostId, {
    postType: body.postType,
    communityId: body.communityId,
    init: 0,
    end: 10,
  });
  for (const row of rows) {
    if (userId && row.userId != null && row.userId !== userId) continue;
    if (row.title.trim() !== body.title.trim()) continue;
    const full = await getForumPost(row.id);
    if (full.content.trim() === body.content.trim()) {
      return full.id;
    }
  }
  return null;
}

export async function uploadForumImageFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<{ id: string; publicUrl: string; path: string }> {
  const base = getApiBaseUrl();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'forum-image.jpg';
  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${base}${BASE_PATH}/upload/supabase/image`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { id: string; publicUrl: string; path: string };
}

export async function likeForumPost(postId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(postId)}/like`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function likeForumComment(commentId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/comments/${encodeURIComponent(commentId)}/like`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function contactForumStorePost(
  forumPostId: string,
  message?: string,
  hostId?: string,
): Promise<ForumContactStoreResponse> {
  const base = getApiBaseUrl();
  const body: Record<string, string> = {};
  const trimmedMessage = message?.trim();
  if (trimmedMessage) {
    body.message = trimmedMessage;
  }
  const hid = hostId?.trim();
  if (hid) {
    body.hostId = hid;
  } else {
    try {
      const resolved = resolveHostId();
      if (resolved) body.hostId = resolved;
    } catch {
      // JWT pode já trazer hostId no backend
    }
  }
  const url = `${base}${BASE_PATH}/forum/posts/${encodeURIComponent(forumPostId)}/contact`;
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
