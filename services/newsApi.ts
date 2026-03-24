import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export interface NewsImage {
  id: string;
  publicUrl: string | null;
  path: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  status: string;
  publishedAt: string | null;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  image?: NewsImage | null;
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
  const qs = params.toString();
  const endpoint = qs ? `/news?${qs}` : '/news';
  const data = await fetchApi<NewsItem[]>(endpoint);
  return Array.isArray(data) ? data : [];
}


export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    return await fetchApi<NewsItem>(`/news/${id}`);
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
  if (diffMin < 60) return `${diffMin} min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffDays < 7) return `${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
  tipo: 'post';
  categoria: 'noticias' | 'obras' | 'lazer';
} {
  const dateStr = item.publishedAt || item.createdAt;
  const conteudo = [item.title, item.content].filter(Boolean).join('\n\n') || item.title;
  return {
    id: item.id,
    autor: 'Prefeitura',
    avatar: AVATAR_PLACEHOLDER,
    data: formatTimeAgo(dateStr),
    conteudo,
    imagem: item.image?.id ? `${getApiBaseUrl()}/api/v1/upload/files/${item.image.id}` : null,
    curtidas: 0,
    comentarios: 0,
    compartilhamentos: 0,
    curtido: false,
    username: '@pref_cidade',
    tipo: 'post',
    categoria: mapNewsItemFeedCategory(item),
  };
}
