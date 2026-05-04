import { getApiBaseUrl, getAuthToken } from './authApi';
import { parseJwtAccessTokenPayload } from './jwtAccessTokenClaims';

const BASE_PATH = '/api/v1';

export interface HostAreaDto {
  id: string;
  hostId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AreaCategoryRatingSummaryDto {
  areaId: string;
  avgSecurity: number | null;
  avgCleanliness: number | null;
  avgTraffic: number | null;
  avgLighting: number | null;
  avgGreenAreas: number | null;
  totalSubmissions: number;
  currentUserSubmissionCount: number;
}

export type ApiTrendCategory =
  | 'security'
  | 'cleanliness'
  | 'traffic'
  | 'lighting'
  | 'green_areas';

export interface WeeklyCategoryTrendDto {
  category: ApiTrendCategory;
  currentWeekAverage: number | null;
  previousWeekAverage: number | null;
  deltaVsPreviousWeek: number | null;
}

export interface WeeklyPulseTrendsResponseDto {
  areaId: string;
  weekNote: string;
  trends: WeeklyCategoryTrendDto[];
}

export interface TopReportedProblemDto {
  problemKey: string;
  labelPtBr: string;
  reportCount: number;
}

export interface TopReportedProblemsResponseDto {
  areaId: string;
  items: TopReportedProblemDto[];
}

export interface CreateAreaCategoryRatingBody {
  security: number;
  cleanliness: number;
  traffic: number;
  lighting: number;
  greenAreas: number;
}

export interface AreaCategoryRatingUserStatusDto {
  areaId: string;
  hasVoted: boolean;
  lastVotedAt: string | null;
  submissionCount: number;
  canVoteNow: boolean;
  nextVoteAllowedAt: string | null;
}

function resolveHostId(explicit?: string): string {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;

  const token = getAuthToken();
  if (token) {
    try {
      const claims = parseJwtAccessTokenPayload(token);
      const fromJwt = claims.hostId?.trim();
      if (fromJwt) return fromJwt;
    } catch {
      // ignore
    }
  }

  const fromEnv = process.env.EXPO_PUBLIC_HOST_ID?.trim();
  if (!fromEnv) {
    throw new Error(
      'Não foi possível definir o host. Faça login com usuário vinculado a um host ou defina EXPO_PUBLIC_HOST_ID.',
    );
  }
  return fromEnv;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
    } catch {
      return raw.slice(0, 200);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function listHostAreas(hostId?: string): Promise<HostAreaDto[]> {
  const base = getApiBaseUrl();
  const hid = resolveHostId(hostId);
  const url = `${base}${BASE_PATH}/host-areas?hostId=${encodeURIComponent(hid)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as HostAreaDto[]) : [];
}

export async function getUserAreaRatingStatus(
  areaId: string,
): Promise<AreaCategoryRatingUserStatusDto> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/host-areas/${encodeURIComponent(areaId)}/category-ratings/me`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as AreaCategoryRatingUserStatusDto;
}

export async function getAreaCategorySummary(
  areaId: string,
): Promise<AreaCategoryRatingSummaryDto> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/host-areas/${encodeURIComponent(areaId)}/category-ratings/summary`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as AreaCategoryRatingSummaryDto;
}

export async function getWeeklyPulseTrends(
  areaId: string,
): Promise<WeeklyPulseTrendsResponseDto> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/host-areas/${encodeURIComponent(areaId)}/pulse/weekly-trends`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as WeeklyPulseTrendsResponseDto;
}

export async function getTopReportedProblems(
  areaId: string,
  limit = 5,
): Promise<TopReportedProblemsResponseDto> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/host-areas/${encodeURIComponent(
    areaId,
  )}/pulse/top-reported-problems?limit=${encodeURIComponent(String(limit))}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as TopReportedProblemsResponseDto;
}

export async function submitAreaCategoryRating(
  areaId: string,
  body: CreateAreaCategoryRatingBody,
): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/host-areas/${encodeURIComponent(areaId)}/category-ratings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
