import { ensureAuthTokenHydrated, getApiBaseUrl, getAuthToken } from './authApi';

export interface MunicipalTerritory {
  hostId: string;
  municipalityName: string;
  uf: string | null;
  ibgeCode: string | null;
  immediateRegion: string | null;
  region: string | null;
  population: { display: string; year: string | null; source: string } | null;
  area: { display: string; year: string | null; source: string } | null;
  publicOccurrences: number | null;
  ibgeStatus: 'ok' | 'stale' | 'unavailable';
  notice: string | null;
  sourceNote: string;
  consultedAt: string | null;
}

export interface MunicipalBoundary {
  boundary: { type: string; features: unknown[] } | null;
  notice: string | null;
  ibgeStatus: 'ok' | 'stale' | 'unavailable';
}

async function authHeaders(): Promise<HeadersInit> {
  const token = (await ensureAuthTokenHydrated()) || getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchMunicipalTerritory(): Promise<MunicipalTerritory> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/territorial/me`, { headers: await authHeaders() });
  if (!response.ok) throw new Error('Não foi possível consultar o município.');
  return response.json() as Promise<MunicipalTerritory>;
}

export async function fetchMunicipalBoundary(): Promise<MunicipalBoundary> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/territorial/me/boundary`, { headers: await authHeaders() });
  if (!response.ok) throw new Error('Não foi possível consultar o limite municipal.');
  return response.json() as Promise<MunicipalBoundary>;
}
