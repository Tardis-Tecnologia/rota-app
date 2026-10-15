import type {
  FeedNovidade,
  FeedNovidadeCategoria,
  FeedNovidadeTipo,
  FeedPollData,
  FeedPostType,
} from '@/types/feedNovidade';
import { parsePollOptions } from '@/utils/pollOptions';
import type { FeedFilter } from '@/types';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';

export interface NewsImage {
  id: string;
  publicUrl: string | null;
  path: string;
}

export interface NewsItem {
  hostId?: string | null;
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  status: string;
  publishedAt: string | null;
  imageId: string | null;
  createdBy?: string | null;
  creatorName?: string | null;
  creatorPhotoUrl?: string | null;
  creatorProfile?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  image?: NewsImage | null;
  likesCount?: number;
  liked?: boolean;
  commentsCount?: number;
  postType?: string;
  pollId?: string | null;
  poll?: NewsPollEmbeddedDto | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
}

export interface NewsPollEmbeddedDto {
  id: string;
  options: unknown;
  optionCounts?: unknown;
  userVoted?: boolean;
  selectedOptionIndex?: number | null;
}

export interface NewsCommentAuthor {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface NewsCommentListItemDto {
  id: string;
  userId: string;
  content: string;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  author?: NewsCommentAuthor;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  return false;
}

function normalizeApiArray<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) return parsed as T[];
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    for (const key of [
      'data',
      'items',
      'comments',
      'results',
      'content',
      'rows',
      'list',
      'records',
    ]) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
      if (value && typeof value === 'object') {
        const nested = normalizeApiArray<T>(value);
        if (nested.length > 0) return nested;
      }
    }
  }
  return [];
}

function extractNewsCommentsPayload(data: unknown): (NewsCommentListItemDto & Record<string, unknown>)[] {
  const top = normalizeApiArray<NewsCommentListItemDto & Record<string, unknown>>(data);
  if (top.length > 0) return top;
  if (data && typeof data === 'object') {
    for (const value of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        return value as (NewsCommentListItemDto & Record<string, unknown>)[];
      }
    }
  }
  return [];
}

function mapNewsCommentRows(data: unknown): NewsCommentListItemDto[] {
  const rows = extractNewsCommentsPayload(data);
  return rows.map((row, index) => {
    const comment = normalizeNewsComment(row);
    if (!comment.id.trim()) {
      return {
        ...comment,
        id: `comment-${index}-${comment.createdAt || Date.now()}`,
      };
    }
    return comment;
  });
}

export function mergeNewsCommentsWithPending(
  server: NewsCommentListItemDto[],
  previous: NewsCommentListItemDto[],
): NewsCommentListItemDto[] {
  if (server.length > 0) return server;
  if (previous.length > 0) return previous;
  return server;
}

/** hostId do comunicado ou whitelabel/JWT — mesmo critério do POST de comentário. */
export function resolveNewsCommentsHostId(newsHostId?: string | null): string {
  const fromNews = newsHostId?.trim();
  if (fromNews) return fromNews;
  const fromJwtOrEnv = resolveNewsHostId();
  if (fromJwtOrEnv) return fromJwtOrEnv;
  return getWhitelabelHostId();
}

function normalizeNewsComment(
  raw: NewsCommentListItemDto & Record<string, unknown>,
): NewsCommentListItemDto {
  const authorRaw = (raw.author ?? raw.Author) as Record<string, unknown> | undefined;
  let author: NewsCommentAuthor | undefined;
  if (authorRaw && typeof authorRaw === 'object') {
    const id = String(authorRaw.id ?? '').trim();
    if (id) {
      author = {
        id,
        name: String(authorRaw.name ?? 'Morador(a)').trim() || 'Morador(a)',
        photoUrl:
          typeof authorRaw.photoUrl === 'string'
            ? authorRaw.photoUrl
            : typeof authorRaw.photo_url === 'string'
              ? authorRaw.photo_url
              : null,
      };
    }
  }
  const createdAt = String(raw.createdAt ?? raw.created_at ?? '');
  const userId = String(raw.userId ?? raw.user_id ?? '');
  const id =
    String(raw.id ?? raw.commentId ?? '').trim() ||
    (createdAt && userId ? `comment-${userId}-${createdAt}` : '');

  return {
    id,
    userId,
    content: String(
      raw.content ?? raw.text ?? raw.body ?? raw.message ?? raw.comment ?? '',
    ),
    likesCount: readNumber(raw.likesCount ?? raw.likes_count),
    liked: readBoolean(raw.liked),
    createdAt,
    ...(author ? { author } : {}),
  };
}

function readIndexOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = readNumber(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeNewsPollEmbedded(
  raw: unknown,
  pollIdFallback?: string | null,
): NewsPollEmbeddedDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const options = parsePollOptions(row.options);
  if (options.length === 0) return null;
  const countsRaw = row.optionCounts ?? row.option_counts;
  let optionCounts: number[] = [];
  if (Array.isArray(countsRaw)) {
    optionCounts = countsRaw.map((v) => readNumber(v));
  }
  while (optionCounts.length < options.length) optionCounts.push(0);
  if (optionCounts.length > options.length) optionCounts = optionCounts.slice(0, options.length);

  const id = String(row.id ?? pollIdFallback ?? '').trim();
  if (!id) return null;

  return {
    id,
    options,
    optionCounts,
    userVoted: readBoolean(row.userVoted ?? row.user_voted),
    selectedOptionIndex: readIndexOrNull(row.selectedOptionIndex ?? row.selected_option_index),
  };
}

function readCreatorProfile(raw: NewsItem & Record<string, unknown>): string | null {
  const value =
    raw.creatorProfile ??
    raw.creator_profile ??
    raw.createdByProfile ??
    raw.created_by_profile ??
    raw.publisherProfile ??
    raw.publisher_profile;
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function readPostType(raw: NewsItem & Record<string, unknown>): FeedPostType {
  const pt = String(raw.postType ?? raw.post_type ?? 'article').toLowerCase();
  return pt === 'poll' ? 'poll' : 'article';
}

function normalizeNewsItem(raw: NewsItem & Record<string, unknown>): NewsItem {
  const hostIdRaw = raw.hostId ?? raw.host_id;
  const hostId =
    hostIdRaw != null && String(hostIdRaw).trim() ? String(hostIdRaw).trim() : null;
  const postType = readPostType(raw);
  const pollIdRaw = raw.pollId ?? raw.poll_id;
  const pollId = pollIdRaw != null && String(pollIdRaw).trim() ? String(pollIdRaw).trim() : null;
  const poll = normalizeNewsPollEmbedded(raw.poll, pollId);
  const pinnedAtRaw = raw.pinnedAt ?? raw.pinned_at;
  const pinnedAt =
    pinnedAtRaw != null && String(pinnedAtRaw).trim() ? String(pinnedAtRaw).trim() : null;
  const isPinned =
    postType === 'poll' ? false : readBoolean(raw.isPinned ?? raw.is_pinned);

  return {
    ...raw,
    hostId,
    creatorProfile: readCreatorProfile(raw) ?? raw.creatorProfile ?? null,
    postType,
    pollId: pollId ?? poll?.id ?? null,
    poll,
    isPinned,
    pinnedAt: isPinned ? pinnedAt : null,
    likesCount: postType === 'poll' ? 0 : readNumber(raw.likesCount ?? raw.likes_count),
    liked: postType === 'poll' ? false : readBoolean(raw.liked),
    commentsCount: postType === 'poll' ? 0 : readNumber(raw.commentsCount ?? raw.comments_count),
  };
}

function requireNewsHostId(explicitHostId?: string | null): string {
  try {
    return resolveNewsCommentsHostId(explicitHostId);
  } catch {
    throw new Error(
      'Não foi possível identificar o município (hostId). Faça login novamente.',
    );
  }
}

async function parseNewsLikeErrorMessage(res: Response): Promise<string> {
  if (res.status === 400) {
    return 'Não foi possível curtir: hostId ausente ou inválido.';
  }
  if (res.status === 403) {
    return 'Você não tem permissão para curtir este comunicado.';
  }
  if (res.status === 404) {
    return 'Comunicado não encontrado ou indisponível neste município.';
  }
  return readErrorMessage(res);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
      if (Array.isArray(j?.message)) {
        return j.message.filter((x) => typeof x === 'string').join(', ');
      }
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function newsHostQuery(): string {
  const hostId = resolveNewsHostId();
  return hostId ? `?hostId=${encodeURIComponent(hostId)}` : '';
}

function newsHostQueryParams(extra?: URLSearchParams): string {
  const params = extra ?? new URLSearchParams();
  const hostId = resolveNewsHostId();
  if (hostId) params.set('hostId', hostId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
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

function resolveNewsHostId(): string | null {
  const token = getAuthToken();
  if (token) {
    try {
      const c = parseJwtAccessTokenPayload(token);
      const fromJwt = c.hostId != null && String(c.hostId).trim() ? String(c.hostId).trim() : null;
      if (fromJwt) return fromJwt;
    } catch {
      // token inválido — tenta env
    }
  }
  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  return fromEnv || null;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao carregar notícias: ${res.status}`);
  }
  return res.json();
}

export async function getNews(options?: {
  status?: string;
  category?: string;
  tag?: string;
  postType?: string;
  init?: number;
  end?: number;
}): Promise<NewsItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.category) params.set('category', options.category);
  if (options?.tag) params.set('tag', options.tag);
  if (options?.postType) params.set('postType', options.postType);
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const hostId = resolveNewsHostId();
  if (hostId) params.set('hostId', hostId);
  const qs = params.toString();
  const endpoint = qs ? `/news?${qs}` : '/news';
  const data = await fetchApi<NewsItem[]>(endpoint);
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeNewsItem(row as NewsItem & Record<string, unknown>));
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const raw = await fetchApi<NewsItem>(`/news/${id}${newsHostQuery()}`);
    return normalizeNewsItem(raw as NewsItem & Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Toggle de curtida: POST sem body; 200 vazio; 1ª chamada curte, 2ª descurte. */
export async function likeNews(newsId: string, hostId?: string | null): Promise<void> {
  const hid = requireNewsHostId(hostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/${encodeURIComponent(newsId)}/like?hostId=${encodeURIComponent(hid)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await parseNewsLikeErrorMessage(res));
  }
}

async function fetchNewsCommentsOnce(
  newsId: string,
  options?: { init?: number; end?: number; hostId?: string | null },
): Promise<NewsCommentListItemDto[]> {
  const params = new URLSearchParams();
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const hostId = options?.hostId?.trim() || resolveNewsHostId();
  if (hostId) params.set('hostId', hostId);
  const qs = params.toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/${encodeURIComponent(newsId)}/comments${
    qs ? `?${qs}` : ''
  }`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const rawText = await res.text();
  if (!rawText.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return [];
  }
  return mapNewsCommentRows(parsed);
}

export async function listNewsComments(
  newsId: string,
  options?: { init?: number; end?: number; hostId?: string | null; retryIfEmpty?: boolean },
): Promise<NewsCommentListItemDto[]> {
  const rows = await fetchNewsCommentsOnce(newsId, options);
  if (rows.length > 0 || !options?.retryIfEmpty) return rows;
  await new Promise((resolve) => setTimeout(resolve, 450));
  return fetchNewsCommentsOnce(newsId, options);
}

export async function createNewsComment(
  newsId: string,
  content: string,
  hostId?: string | null,
): Promise<void> {
  const hid = requireNewsHostId(hostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/${encodeURIComponent(newsId)}/comments?hostId=${encodeURIComponent(hid)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content: content.trim() }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function likeNewsComment(commentId: string): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/comments/${encodeURIComponent(commentId)}/like`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function updateNewsComment(commentId: string, content: string): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/comments/${encodeURIComponent(commentId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ content: content.trim() }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function deleteNewsComment(commentId: string): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/news/comments/${encodeURIComponent(commentId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export function isNewsCommentAuthor(comment: NewsCommentListItemDto): boolean {
  const userId = currentUserIdFromToken();
  return !!userId && comment.userId === userId;
}

export function buildOptimisticNewsComment(
  content: string,
  author: { id: string; name: string; photoUrl?: string | null },
): NewsCommentListItemDto {
  return {
    id: `pending-${Date.now()}`,
    userId: author.id,
    content: content.trim(),
    likesCount: 0,
    liked: false,
    createdAt: new Date().toISOString(),
    author: {
      id: author.id,
      name: author.name.trim() || 'Morador(a)',
      photoUrl: author.photoUrl ?? null,
    },
  };
}

const AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffH / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays === 1 ? '' : 's'}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatNewsPublicationDate(dateStr: string): {
  relativa: string;
  formatada: string;
} {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { relativa: '', formatada: '' };
  }
  return {
    relativa: formatTimeAgo(dateStr),
    formatada: date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };
}

function truncateText(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

const CATEGORIA_LABEL: Record<FeedNovidadeCategoria, string> = {
  noticias: 'Notícia',
  obras: 'Obras',
  lazer: 'Lazer',
  enquetes: 'Enquete',
};

function inferTipoNovidade(item: NewsItem, categoria: FeedNovidadeCategoria): FeedNovidadeTipo {
  const tags = new Set((item.tags ?? []).map((t) => t.toLowerCase()));
  const cat = (item.category ?? '').toLowerCase();
  if (tags.has('alert') || cat.includes('alerta')) return 'alerta';
  if (tags.has('event') || cat.includes('evento')) return 'evento';
  if (tags.has('notice') || cat.includes('aviso')) return 'aviso';
  if (categoria === 'obras') return 'atualizacao';
  return 'comunicado';
}

const TIPO_LABEL: Record<FeedNovidadeTipo, string> = {
  comunicado: 'Comunicado',
  alerta: 'Alerta',
  atualizacao: 'Atualização',
  evento: 'Evento',
  aviso: 'Aviso',
};

function pollDtoToFeedPoll(poll: NewsPollEmbeddedDto): FeedPollData {
  return {
    id: poll.id,
    options: poll.options as string[],
    optionCounts: poll.optionCounts as number[],
    userVoted: poll.userVoted ?? false,
    selectedOptionIndex:
      poll.selectedOptionIndex != null && poll.selectedOptionIndex >= 0
        ? poll.selectedOptionIndex
        : null,
  };
}

function newsItemToPollFeed(item: NewsItem): FeedNovidade {
  const post = newsItemToPost(item);
  const dataPublicacao = item.publishedAt || item.createdAt;
  const { relativa, formatada } = formatNewsPublicationDate(dataPublicacao);
  const titulo = item.title?.trim() || 'Enquete';
  const conteudo = item.content?.trim() || '';
  const pollRaw = item.poll;
  const poll = pollRaw ? pollDtoToFeedPoll(pollRaw) : null;

  return {
    id: item.id,
    postType: 'poll',
    hostId: item.hostId ?? null,
    pollId: item.pollId ?? poll?.id ?? null,
    poll,
    titulo,
    resumo: conteudo ? truncateText(conteudo, 280) : titulo,
    conteudo: conteudo || titulo,
    imagem: null,
    dataPublicacao,
    dataRelativa: relativa,
    dataFormatada: formatada,
    categoria: 'enquetes',
    categoriaLabel: CATEGORIA_LABEL.enquetes,
    tipoNovidade: 'comunicado',
    tipoLabel: 'Enquete',
    autorNome:
      item.creatorName?.trim() ||
      (item.creatorProfile?.toUpperCase() === 'SUPERADMIN' ? 'Superadmin' : 'Administrador'),
    autorAvatar: post.avatar,
    autorHandle: post.username ?? '@superadmin',
    autorPerfil: item.creatorProfile ?? null,
    curtidas: 0,
    liked: false,
    comentarios: 0,
    isPinned: false,
    pinnedAt: null,
  };
}

export function newsItemToFeedItem(item: NewsItem): FeedNovidade {
  if ((item.postType ?? 'article') === 'poll') {
    return newsItemToPollFeed(item);
  }
  return newsItemToNovidade(item);
}

export function newsItemToNovidade(item: NewsItem): FeedNovidade {
  const post = newsItemToPost(item);
  const categoria = mapNewsItemFeedCategory(item);
  const dataPublicacao = item.publishedAt || item.createdAt;
  const { relativa, formatada } = formatNewsPublicationDate(dataPublicacao);
  const titulo = item.title?.trim() || 'Comunicado oficial';
  const conteudo = item.content?.trim() || '';
  const tipoNovidade = inferTipoNovidade(item, categoria);
  const creatorName = item.creatorName?.trim();

  return {
    id: item.id,
    postType: 'article',
    hostId: item.hostId ?? null,
    pollId: null,
    poll: null,
    titulo,
    resumo: conteudo ? truncateText(conteudo, 280) : titulo,
    conteudo: conteudo || titulo,
    imagem: newsItemImageUri(item),
    dataPublicacao,
    dataRelativa: relativa,
    dataFormatada: formatada,
    categoria,
    categoriaLabel: CATEGORIA_LABEL[categoria],
    tipoNovidade,
    tipoLabel: TIPO_LABEL[tipoNovidade],
    autorNome: creatorName || post.autor || 'Prefeitura',
    autorAvatar: post.avatar,
    autorHandle: post.username ?? '@prefeitura',
    autorPerfil: item.creatorProfile ?? null,
    curtidas: item.likesCount ?? post.curtidas,
    liked: item.liked ?? post.curtido,
    comentarios: item.commentsCount ?? 0,
    isPinned: !!item.isPinned,
    pinnedAt: item.pinnedAt ?? null,
  };
}

export function sortNovidadesForFeed(items: FeedNovidade[]): FeedNovidade[] {
  return [...items].sort((a, b) => {
    const aPinned = !!a.isPinned;
    const bPinned = !!b.isPinned;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    if (aPinned && bPinned) {
      const aPin = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bPin = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      if (aPin !== bPin) return bPin - aPin;
    }
    return new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime();
  });
}

export function sortNovidadesByDate(items: FeedNovidade[]): FeedNovidade[] {
  return sortNovidadesForFeed(items);
}

export const NEWS_FEED_TAG = {
  noticias: 'news',
  obras: 'works',
  lazer: 'leisure',
} as const;

export type NewsFeedTagFilter = keyof typeof NEWS_FEED_TAG;

export function buildNewsFeedQuery(filter: FeedFilter): {
  tag?: string;
  postType?: string;
  category?: string;
} {
  if (filter === 'todos') return {};
  if (filter === 'enquetes') {
    return { postType: 'poll', category: 'enquete' };
  }
  return { tag: NEWS_FEED_TAG[filter] };
}

function mapCategoryFromTags(tags: string[] | undefined | null): 'noticias' | 'obras' | 'lazer' | null {
  const set = new Set((tags ?? []).map((t) => t.toLowerCase()));
  if (set.has('works')) return 'obras';
  if (set.has('leisure')) return 'lazer';
  if (set.has('news')) return 'noticias';
  return null;
}

function mapCategoryFromField(category: string | null): 'noticias' | 'obras' | 'lazer' {
  if (!category) return 'noticias';
  const c = category.toLowerCase();
  if (c === 'obras' || c === 'obra') return 'obras';
  if (c === 'lazer') return 'lazer';
  if (c === 'enquete' || c === 'poll') return 'noticias';
  return 'noticias';
}

export function mapNewsItemFeedCategory(item: NewsItem): 'noticias' | 'obras' | 'lazer' {
  return mapCategoryFromTags(item.tags) ?? mapCategoryFromField(item.category);
}


const NOTICIA_AUTOR_EXIBICAO = 'Prefeito';

const CREATED_BY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractCreatorUserId(createdBy: string | null | undefined): string | null {
  const raw = (createdBy ?? '').trim();
  if (!raw) return null;
  const first = raw.split('|', 2)[0]?.trim() ?? '';
  if (first && CREATED_BY_UUID_RE.test(first)) return first;
  return null;
}

function optionalUsernameFromCreatedBy(createdBy: string | null | undefined): string | undefined {
  const raw = (createdBy ?? '').trim();
  if (!raw) return undefined;
  const userPart = (raw.split('|', 2)[1] ?? '').trim();
  if (!userPart) return undefined;
  return userPart.startsWith('@') ? userPart : `@${userPart}`;
}

function newsItemImageUri(item: NewsItem): string | null {
  const direct = item.image?.publicUrl?.trim();
  if (direct) return direct;
  if (item.image?.id) {
    return `${getApiBaseUrl()}/api/v1/upload/files/${item.image.id}`;
  }
  return null;
}

export function newsItemToPost(item: NewsItem): {
  id: string;
  autor: string;
  avatar: string;
  data: string;
  conteudo: string;
  imagem: string | null;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  curtido: boolean;
  username?: string;
  createdByUserId?: string | null;
  tipo: 'post';
  categoria: 'noticias' | 'obras' | 'lazer';
} {
  const dateStr = item.publishedAt || item.createdAt;
  const conteudo = [item.title, item.content].filter(Boolean).join('\n\n') || item.title;
  const createdByUserId = extractCreatorUserId(item.createdBy);
  const username = optionalUsernameFromCreatedBy(item.createdBy);
  const photo = item.creatorPhotoUrl?.trim();
  const avatar = photo && photo.length > 0 ? photo : AVATAR_PLACEHOLDER;

  return {
    id: item.id,
    autor: NOTICIA_AUTOR_EXIBICAO,
    avatar,
    data: formatTimeAgo(dateStr),
    conteudo,
    imagem: newsItemImageUri(item),
    curtidas: item.likesCount ?? 0,
    comentarios: item.commentsCount ?? 0,
    compartilhamentos: 0,
    curtido: item.liked ?? false,
    ...(username ? { username } : {}),
    ...(createdByUserId ? { createdByUserId } : {}),
    tipo: 'post',
    categoria: mapNewsItemFeedCategory(item),
  };
}
