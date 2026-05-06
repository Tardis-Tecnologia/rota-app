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
  userId: string;
  title: string;
  postType: string;
  likesCount: number;
  liked: boolean;
  commentsCount: number;
  locationDescription: string | null;
  mediaId: string | null;
  createdAt: string;
  author?: ForumAuthorDto;
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
}

function resolveHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;

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

  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!fromEnv) {
    throw new Error(
      'Não foi possível definir o host. Faça login com usuário vinculado a um host ou defina EXPO_PUBLIC_HOST_ID.',
    );
  }
  return fromEnv;
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
  options?: { postType?: string; init?: number; end?: number },
): Promise<ForumPostListItemDto[]> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams();
  if (options?.postType?.trim()) params.set('postType', options.postType.trim());
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
  body: Pick<CreateForumPostBody, 'title' | 'content' | 'postType'>,
  hostId?: string,
): Promise<string | null> {
  const userId = currentUserIdFromToken();
  const rows = await listForumPosts(hostId, {
    postType: body.postType,
    init: 0,
    end: 10,
  });
  for (const row of rows) {
    if (userId && row.userId !== userId) continue;
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
