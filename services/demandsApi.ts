import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export interface DemandResponseDto {
  hostId: string | null;
  id: string;
  title: string;
  description: string | null;
  neighborhood: string;
  date: string;
  responsibleAgency: string;
  summary: string | null;
  impact: string | null;
  highlight: boolean;
  createdAt?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DemandsStatsResponseDto {
  highlights: number;
  lastMonth: number;
  publishedPercent: number;
}

function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
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

function normalizeDemand(raw: unknown): DemandResponseDto {
  const r = raw as Record<string, unknown>;
  const dateRaw = r.date ?? r.publishedAt ?? r.createdAt ?? r.updatedAt ?? '';
  const highlightRaw = r.highlight ?? r.isHighlight ?? r.highlighted ?? false;
  return {
    hostId: r.hostId == null ? null : String(r.hostId),
    id: String(r.id ?? ''),
    title: String(r.title ?? r.name ?? '').trim(),
    description: (() => {
      const raw = r.description ?? r.descricao;
      if (raw == null) return null;
      const text = String(raw).trim();
      return text || null;
    })(),
    neighborhood: String(r.neighborhood ?? '').trim(),
    date: String(dateRaw ?? ''),
    responsibleAgency: String(r.responsibleAgency ?? r.agency ?? '').trim(),
    summary: (() => {
      const raw = r.summary ?? r.resumo;
      if (raw == null) return null;
      const text = String(raw).trim();
      return text || null;
    })(),
    impact: r.impact == null ? null : String(r.impact),
    highlight: Boolean(highlightRaw),
    createdAt: r.createdAt == null ? undefined : String(r.createdAt),
    address: r.address == null ? null : String(r.address).trim() || null,
    latitude: parseCoord(r.latitude ?? r.lat),
    longitude: parseCoord(r.longitude ?? r.lng ?? r.lon),
  };
}

export async function getDemands(options: {
  hostId?: string;
  neighborhood?: string;
  init?: number;
  end?: number;
}): Promise<DemandResponseDto[]> {
  const params = new URLSearchParams();
  if (options.hostId?.trim()) params.set('hostId', options.hostId.trim());
  if (options.neighborhood?.trim()) params.set('neighborhood', options.neighborhood.trim());
  if (typeof options.init === 'number') params.set('init', String(options.init));
  if (typeof options.end === 'number') params.set('end', String(options.end));
  const url = `${getApiBaseUrl()}${BASE_PATH}/demands?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeDemand).filter((d) => d.id && d.title);
}

export async function getDemandsStats(options: {
  hostId?: string;
  neighborhood?: string;
}): Promise<DemandsStatsResponseDto> {
  const params = new URLSearchParams();
  if (options.hostId?.trim()) params.set('hostId', options.hostId.trim());
  if (options.neighborhood?.trim()) params.set('neighborhood', options.neighborhood.trim());
  const url = `${getApiBaseUrl()}${BASE_PATH}/demands/stats?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as Partial<DemandsStatsResponseDto>;
  return {
    highlights: typeof data.highlights === 'number' ? data.highlights : 0,
    lastMonth: typeof data.lastMonth === 'number' ? data.lastMonth : 0,
    publishedPercent: typeof data.publishedPercent === 'number' ? data.publishedPercent : 0,
  };
}

