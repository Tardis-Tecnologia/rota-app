import type { PontoInteresse } from '@/types';
import { getApiBaseUrl, getAuthToken } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

export const EXPLORE_COMMUNITIES_CHIP_ID = 'communities';

const BASE_PATH = '/api/v1';

export type ForumCommunityPrivacy = 'PUBLIC' | 'PRIVATE';
export type ForumCommunityMemberRole = 'OWNER' | 'MEMBER';

export interface ForumCommunityCreator {
  id: string;
  name: string | null;
  photoUrl: string | null;
}

export interface ForumCommunityListItem {
  id: string;
  hostId: string;
  name: string;
  description: string | null;
  category: string | null;
  privacy: ForumCommunityPrivacy;
  coverMediaId: string | null;
  coverPublicUrl: string | null;
  cep: string | null;
  locationName: string | null;
  locationAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  membersCount: number;
  followersCount: number;
  isFollowing: boolean;
  isMember: boolean;
  /** Se o usuário logado pode criar post neste canal (regra no back: pública = seguidor/dono; privada = dono). */
  canPost: boolean;
  myRole: ForumCommunityMemberRole | null;
  createdAt: string;
  creator?: ForumCommunityCreator;
}

export interface ForumCommunityDetail extends ForumCommunityListItem {
  userId: string;
  updatedAt: string;
}

export interface CreateForumCommunityBody {
  name: string;
  description?: string;
  category?: string;
  privacy?: ForumCommunityPrivacy;
  coverMediaId?: string;
  cep?: string;
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateForumCommunityBody {
  name?: string;
  description?: string | null;
  category?: string | null;
  privacy?: ForumCommunityPrivacy;
  coverMediaId?: string | null;
  cep?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
      if (Array.isArray(j?.message)) return j.message.join(', ');
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

function parseCommunityList(data: unknown): ForumCommunityListItem[] {
  return Array.isArray(data) ? (data as ForumCommunityListItem[]) : [];
}

export async function listForumCommunities(
  hostId?: string,
  options?: {
    init?: number;
    end?: number;
    privacy?: ForumCommunityPrivacy;
    category?: string;
  },
): Promise<ForumCommunityListItem[]> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  if (options?.privacy) params.set('privacy', options.privacy);
  if (options?.category?.trim()) params.set('category', options.category.trim());
  const qs = params.toString();
  const url = `${base}${BASE_PATH}/forum/hosts/${encodeURIComponent(hid)}/communities${
    qs ? `?${qs}` : ''
  }`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return parseCommunityList(await res.json());
}

export async function createForumCommunity(
  body: CreateForumCommunityBody,
  hostId?: string,
): Promise<ForumCommunityDetail> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const url = `${base}${BASE_PATH}/forum/hosts/${encodeURIComponent(hid)}/communities`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ForumCommunityDetail;
}

export async function getForumCommunity(communityId: string): Promise<ForumCommunityDetail> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ForumCommunityDetail;
}

export async function updateForumCommunity(
  communityId: string,
  body: UpdateForumCommunityBody,
): Promise<ForumCommunityDetail> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ForumCommunityDetail;
}

export async function deleteForumCommunity(communityId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function listMyForumCommunities(options?: {
  init?: number;
  end?: number;
}): Promise<ForumCommunityListItem[]> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const url = `${base}${BASE_PATH}/forum/me/communities${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return parseCommunityList(await res.json());
}

/** Dono, participante e canais seguidos (sem duplicar por id). */
export function mergeMyAndFollowingCommunities(
  mine: ForumCommunityListItem[],
  following: ForumCommunityListItem[],
): ForumCommunityListItem[] {
  const map = new Map<string, ForumCommunityListItem>();
  for (const item of mine) {
    map.set(item.id, item);
  }
  for (const item of following) {
    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, {
        ...existing,
        isFollowing: existing.isFollowing || item.isFollowing,
        followersCount: Math.max(existing.followersCount, item.followersCount),
      });
    } else {
      map.set(item.id, item);
    }
  }
  const priority = (x: ForumCommunityListItem) => {
    if (x.myRole === 'OWNER') return 0;
    if (x.isMember) return 1;
    if (x.isFollowing) return 2;
    return 3;
  };
  return Array.from(map.values()).sort((a, b) => {
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export async function listMyRelatedForumCommunities(options?: {
  init?: number;
  end?: number;
}): Promise<ForumCommunityListItem[]> {
  const [mine, following] = await Promise.all([
    listMyForumCommunities(options),
    listFollowingForumCommunities(options),
  ]);
  return mergeMyAndFollowingCommunities(mine, following);
}

export async function listFollowingForumCommunities(options?: {
  init?: number;
  end?: number;
}): Promise<ForumCommunityListItem[]> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const qs = params.toString();
  const url = `${base}${BASE_PATH}/forum/me/following${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return parseCommunityList(await res.json());
}

export async function followForumCommunity(communityId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}/follow`;
  const res = await fetch(url, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function unfollowForumCommunity(communityId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}/follow`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function joinForumCommunity(communityId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}/join`;
  const res = await fetch(url, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function leaveForumCommunity(communityId: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/forum/communities/${encodeURIComponent(communityId)}/membership`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export function communityCoverUrl(
  item: Pick<ForumCommunityListItem, 'coverPublicUrl' | 'coverMediaId'>,
): string | null {
  const direct = item.coverPublicUrl?.trim();
  if (direct) return direct;
  if (!item.coverMediaId) return null;
  return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(item.coverMediaId)}`;
}

export function parseCommunityCoords(
  item: Pick<ForumCommunityListItem, 'latitude' | 'longitude'>,
): { lat: number; lng: number } | null {
  const lat = item.latitude != null ? parseFloat(item.latitude) : NaN;
  const lng = item.longitude != null ? parseFloat(item.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Ponto no mapa Explorar (só comunidades com lat/lng cadastrados). */
export function communityToExplorePonto(community: ForumCommunityListItem): PontoInteresse | null {
  const coords = parseCommunityCoords(community);
  if (!coords) return null;
  const cover = communityCoverUrl(community);
  return {
    id: `community-${community.id}`,
    titulo: community.name,
    descricao:
      community.locationName?.trim() ||
      community.locationAddress?.trim() ||
      'Canal da comunidade',
    latitude: coords.lat,
    longitude: coords.lng,
    tipo: 'cultura',
    photoUrl: cover ?? undefined,
    formattedAddress: community.locationAddress?.trim() || undefined,
    placeType: EXPLORE_COMMUNITIES_CHIP_ID,
  };
}

export function explorePontoCommunityId(ponto: Pick<PontoInteresse, 'id' | 'placeType'>): string | null {
  if (ponto.placeType !== EXPLORE_COMMUNITIES_CHIP_ID) return null;
  const prefix = 'community-';
  if (!ponto.id.startsWith(prefix)) return null;
  const id = ponto.id.slice(prefix.length).trim();
  return id || null;
}
