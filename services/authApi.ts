const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const BASE_PATH = '/api/v1';

export interface LoginSuccess {
  token: string;
  userId: string;
  profile: string;
  themeSlug: string | null;
}

let authToken: string | null = null;

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL não definida');
  }
  return API_BASE_URL.replace(/\/$/, '');
}

export async function login(
  email: string,
  password: string
): Promise<LoginSuccess> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (res.status === 401) {
    throw new Error('EMAIL_OU_SENHA_INCORRETOS');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro no login: ${res.status}`);
  }

  const data = (await res.json()) as LoginSuccess;
  if (!data?.token) {
    throw new Error('Resposta inválida do servidor');
  }
  return data;
}