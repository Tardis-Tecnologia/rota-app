
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '8080';


function getDevServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants.manifest as { hostUri?: string })?.hostUri;
  const debuggerHost = (Constants.manifest as { debuggerHost?: string })?.debuggerHost;
  const raw = hostUri ?? debuggerHost;
  if (!raw || typeof raw !== 'string') return null;
  const withoutScheme = raw.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
  const host = withoutScheme.split(':')[0]?.trim();
  return host && host !== 'localhost' ? host : null;
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const devHost = getDevServerHost();
  if (devHost) return `http://${devHost}:${API_PORT}/api/v1`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api/v1`;
  return `http://localhost:${API_PORT}/api/v1`;
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const devHost = getDevServerHost();
  if (devHost) return url.replace(/localhost/g, devHost);
  if (Platform.OS === 'android') return url.replace(/localhost/g, '10.0.2.2');
  return url;
}

/**
 * Função genérica para fazer requisições à API
 */
const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (__DEV__) console.log('[API]', url);
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${url}`);
    }

    return await response.json();
  } catch (error) {
    if (__DEV__) console.error('Erro na requisição:', url, error);
    throw error;
  }
};

/**
 * Buscar notícias (rota-back: painel Comunicação Oficial)
 * @param status - ex: 'published' para só publicadas
 */
export const getNoticias = async (status?: string): Promise<any> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetchAPI(`/news${query}`);
};

export const getNoticia = async (id: string): Promise<any> => {
  return fetchAPI(`/news/${id}`);
};


export const getEventos = async (): Promise<any> => {
  return fetchAPI('/eventos');
};

/**
 * Buscar um evento específico
 */
export const getEvento = async (id: string): Promise<any> => {
  return fetchAPI(`/eventos/${id}`);
};

/**
 * Buscar posts
 */
export const getPosts = async (): Promise<any> => {
  return fetchAPI('/posts');
};

/**
 * Curtir um post
 */
export const curtirPost = async (postId: string): Promise<any> => {
  return fetchAPI(`/posts/${postId}/curtir`, {
    method: 'POST',
  });
};

/**
 * Comentar em um post
 */
export const comentarPost = async (postId: string, comentario: string): Promise<any> => {
  return fetchAPI(`/posts/${postId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ comentario }),
  });
};

/**
 * Buscar pontos de interesse no mapa
 */
export const getPontosInteresse = async (): Promise<any> => {
  return fetchAPI('/mapa/pontos');
};

/**
 * Buscar pontos de interesse por categoria
 */
export const getPontosPorCategoria = async (categoria: string): Promise<any> => {
  return fetchAPI(`/mapa/pontos?categoria=${categoria}`);
};
