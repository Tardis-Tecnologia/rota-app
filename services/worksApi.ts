import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export type WorkStatusDto = string;

export interface WorkResponseDto {
  hostId: string | null;
  id: string;
  title: string;
  description: string | null;
  status: WorkStatusDto;
  neighborhood: string;
  address: string;
  expectedEndDate: string;
  responsibleAgency: string;
  company: string;
  inspection: string | null;
  trafficImpact: string | null;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WorksStatsResponseDto {
  total: number;
  faseFinal: number;
  last7Days: number;
}

function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeWork(raw: unknown): WorkResponseDto {
  const r = raw as Record<string, unknown>;
  return {
    hostId: r.hostId == null ? null : String(r.hostId),
    id: String(r.id ?? ''),
    title: String(r.title ?? '').trim(),
    description: (() => {
      const raw = r.description ?? r.descricao;
      if (raw == null) return null;
      const text = String(raw).trim();
      return text || null;
    })(),
    status: String(r.status ?? ''),
    neighborhood: String(r.neighborhood ?? '').trim(),
    address: String(r.address ?? '').trim(),
    expectedEndDate: String(r.expectedEndDate ?? ''),
    responsibleAgency: String(r.responsibleAgency ?? '').trim(),
    company: String(r.company ?? '').trim(),
    inspection: r.inspection == null ? null : String(r.inspection),
    trafficImpact: r.trafficImpact == null ? null : String(r.trafficImpact),
    createdAt: String(r.createdAt ?? ''),
    latitude: parseCoord(r.latitude ?? r.lat),
    longitude: parseCoord(r.longitude ?? r.lng ?? r.lon),
  };
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text.trim()) return `Erro ao carregar (${res.status})`;
  try {
    const json = JSON.parse(text) as { message?: unknown };
    if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
    if (Array.isArray(json.message) && json.message.length) return String(json.message[0]);
  } catch {
    return text.slice(0, 220);
  }
  return text.slice(0, 220);
}

export async function getWorks(options: {
  hostId?: string;
  neighborhood?: string;
  init?: number;
  end?: number;
}): Promise<WorkResponseDto[]> {
  const params = new URLSearchParams();
  if (options.hostId?.trim()) params.set('hostId', options.hostId.trim());
  if (options.neighborhood?.trim()) params.set('neighborhood', options.neighborhood.trim());
  if (typeof options.init === 'number') params.set('init', String(options.init));
  if (typeof options.end === 'number') params.set('end', String(options.end));

  const url = `${getApiBaseUrl()}${BASE_PATH}/works?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeWork).filter((w) => w.id && w.title);
}

export async function getWorksStats(options: {
  hostId?: string;
  neighborhood?: string;
}): Promise<WorksStatsResponseDto> {
  const params = new URLSearchParams();
  if (options.hostId?.trim()) params.set('hostId', options.hostId.trim());
  if (options.neighborhood?.trim()) params.set('neighborhood', options.neighborhood.trim());

  const url = `${getApiBaseUrl()}${BASE_PATH}/works/stats?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as Partial<WorksStatsResponseDto>;
  return {
    total: toNumber(data.total),
    faseFinal: toNumber(data.faseFinal),
    last7Days: toNumber(data.last7Days),
  };
}

export async function getWorkById(options: { id: string; hostId?: string }): Promise<WorkResponseDto> {
  const params = new URLSearchParams();
  if (options.hostId?.trim()) params.set('hostId', options.hostId.trim());
  const qs = params.toString();
  const url = `${getApiBaseUrl()}${BASE_PATH}/works/${encodeURIComponent(options.id)}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return normalizeWork(await res.json());
}

