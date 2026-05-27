import type {
  CreateServiceProviderBody,
  ServiceProviderListItem,
  ServiceProviderResponse,
  UpdateServiceProviderBody,
} from '@/types/serviceProvider';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';
const DEFAULT_PAGE_SIZE = 50;

export function resolveServiceProviderHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;
  const token = getAuthToken();
  if (token) {
    try {
      const fromJwt = parseJwtAccessTokenPayload(token).hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // ignore
    }
  }
  return getWhitelabelHostId();
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      const msg = j?.message;
      if (Array.isArray(msg)) return msg.map(String).filter(Boolean).join(' ');
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function authHeaders(json = true, required = true): HeadersInit {
  const token = getAuthToken();
  if (!token && required) throw new Error('Faça login para continuar.');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseListPayload(raw: unknown): ServiceProviderListItem[] {
  if (Array.isArray(raw)) return raw as ServiceProviderListItem[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'content']) {
      const nested = obj[key];
      if (Array.isArray(nested)) return nested as ServiceProviderListItem[];
    }
  }
  return [];
}

function hostQuery(hostId: string, extra?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams({ hostId });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
  }
  return params.toString();
}

export async function listPublicServiceProviders(options?: {
  hostId?: string;
  init?: number;
  end?: number;
}): Promise<ServiceProviderListItem[]> {
  const hostId = resolveServiceProviderHostId(options?.hostId);
  const qs = hostQuery(hostId, {
    init: options?.init ?? 0,
    end: options?.end ?? DEFAULT_PAGE_SIZE,
  });
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/service-providers?${qs}`, {
    headers: authHeaders(false, false),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return parseListPayload(await res.json());
}

export async function getMyServiceProviders(options?: {
  hostId?: string;
  init?: number;
  end?: number;
}): Promise<ServiceProviderListItem[]> {
  const hostId = resolveServiceProviderHostId(options?.hostId);
  const qs = hostQuery(hostId, {
    init: options?.init ?? 0,
    end: options?.end ?? DEFAULT_PAGE_SIZE,
  });
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/service-providers/me?${qs}`, {
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return parseListPayload(await res.json());
}

export async function getServiceProviderById(
  id: string,
  options?: { hostId?: string },
): Promise<ServiceProviderResponse> {
  const hostId = resolveServiceProviderHostId(options?.hostId);
  const url = `${getApiBaseUrl()}${BASE_PATH}/service-providers/${encodeURIComponent(id)}?${hostQuery(hostId)}`;
  const res = await fetch(url, { headers: authHeaders(false, false) });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ServiceProviderResponse;
}

export async function createServiceProvider(
  body: Omit<CreateServiceProviderBody, 'hostId'>,
): Promise<ServiceProviderResponse> {
  const res = await fetch(`${getApiBaseUrl()}${BASE_PATH}/service-providers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...body, hostId: resolveServiceProviderHostId() }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ServiceProviderResponse;
}

export async function updateServiceProvider(
  id: string,
  body: UpdateServiceProviderBody,
): Promise<ServiceProviderResponse> {
  const hostId = resolveServiceProviderHostId();
  const url = `${getApiBaseUrl()}${BASE_PATH}/service-providers/${encodeURIComponent(id)}?${hostQuery(hostId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ServiceProviderResponse;
}
