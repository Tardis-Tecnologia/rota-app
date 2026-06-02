import type {
  FeedNovidade,
  FeedNovidadeCategoria,
  FeedNovidadeTipo,
} from '@/types/feedNovidade';
import { getApiBaseUrl, getAuthToken } from './authApi';
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
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  image?: NewsImage | null;
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
  init?: number;
  end?: number;
}): Promise<NewsItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.category) params.set('category', options.category);
  if (options?.tag) params.set('tag', options.tag);
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const hostId = resolveNewsHostId();
  if (hostId) params.set('hostId', hostId);
  const qs = params.toString();
  const endpoint = qs ? `/news?${qs}` : '/news';
  const data = await fetchApi<NewsItem[]>(endpoint);
  return Array.isArray(data) ? data : [];
}


export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const hostId = resolveNewsHostId();
    const q = hostId ? `?hostId=${encodeURIComponent(hostId)}` : '';
    return await fetchApi<NewsItem>(`/news/${id}${q}`);
  } catch {
    return null;
  }
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

export function newsItemToNovidade(item: NewsItem): FeedNovidade {
  const categoria = mapNewsItemFeedCategory(item);
  const dataPublicacao = item.publishedAt || item.createdAt;
  const { relativa, formatada } = formatNewsPublicationDate(dataPublicacao);
  const titulo = item.title?.trim() || 'Comunicado oficial';
  const conteudo = item.content?.trim() || '';
  const tipoNovidade = inferTipoNovidade(item, categoria);

  return {
    id: item.id,
    titulo,
    resumo: conteudo ? truncateText(conteudo, 180) : titulo,
    conteudo: conteudo || titulo,
    imagem: newsItemImageUri(item),
    dataPublicacao,
    dataRelativa: relativa,
    dataFormatada: formatada,
    categoria,
    categoriaLabel: CATEGORIA_LABEL[categoria],
    tipoNovidade,
    tipoLabel: TIPO_LABEL[tipoNovidade],
  };
}

export function sortNovidadesByDate(items: FeedNovidade[]): FeedNovidade[] {
  return [...items].sort(
    (a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime(),
  );
}

export const NEWS_FEED_TAG = {
  noticias: 'news',
  obras: 'works',
  lazer: 'leisure',
} as const;

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
    curtidas: 0,
    comentarios: 0,
    compartilhamentos: 0,
    curtido: false,
    ...(username ? { username } : {}),
    ...(createdByUserId ? { createdByUserId } : {}),
    tipo: 'post',
    categoria: mapNewsItemFeedCategory(item),
  };
}
