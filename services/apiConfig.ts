const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
