import { getAuthSession } from '@/services/authSessionStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let authToken: string | null = null;
let hydratePromise: Promise<string | null> | null = null;

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  // Web: hidrata síncrono do localStorage (evita 401 logo após refresh/Fast Refresh).
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const stored = (globalThis as { localStorage: Storage }).localStorage.getItem(
        'rota_auth_token',
      );
      if (stored?.trim()) {
        authToken = stored.trim();
        return authToken;
      }
    }
  } catch {
    /* ignore */
  }
  return authToken;
}

/** Garante que o token persistido foi carregado antes de chamadas autenticadas. */
export function ensureAuthTokenHydrated(): Promise<string | null> {
  const current = getAuthToken();
  if (current) return Promise.resolve(current);
  if (!hydratePromise) {
    hydratePromise = getAuthSession()
      .then((session) => {
        if (session?.token?.trim()) {
          authToken = session.token.trim();
        }
        return authToken;
      })
      .catch(() => authToken)
      .finally(() => {
        // permite nova tentativa se ainda não houver token
        if (!authToken) hydratePromise = null;
      });
  }
  return hydratePromise;
}

export function setAuthToken(token: string | null): void {
  authToken = token?.trim() || null;
  if (authToken) {
    hydratePromise = Promise.resolve(authToken);
  } else {
    hydratePromise = null;
  }
}

/** Headers com Bearer após hidratar o token persistido (evita 401 na corrida do boot). */
export async function buildAuthHeaders(json = true): Promise<Record<string, string>> {
  const token = await ensureAuthTokenHydrated();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL não definida');
  }
  return API_BASE_URL.replace(/\/$/, '');
}

export function getWhitelabelHostId(): string {
  const raw = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!raw) {
    throw new Error('EXPO_PUBLIC_HOST_ID não definida');
  }
  if (!UUID_REGEX.test(raw)) {
    throw new Error('EXPO_PUBLIC_HOST_ID inválida: informe um UUID válido');
  }
  return raw;
}

/** Dispara hidratação cedo (não bloqueia o import). */
void ensureAuthTokenHydrated();
