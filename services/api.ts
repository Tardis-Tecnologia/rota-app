// Serviço de API para o app Maricá Conecta
// Substitua a URL base pela URL da API da Prefeitura de Maricá

const API_BASE_URL = 'https://api.prefeituramarica.rj.gov.br/v1';

/**
 * Função genérica para fazer requisições à API
 */
const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

/**
 * Buscar notícias
 */
export const getNoticias = async (): Promise<any> => {
  return fetchAPI('/noticias');
};

/**
 * Buscar uma notícia específica
 */
export const getNoticia = async (id: string): Promise<any> => {
  return fetchAPI(`/noticias/${id}`);
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

