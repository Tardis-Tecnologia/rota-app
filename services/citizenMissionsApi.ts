import {
  buildAuthHeaders,
  ensureAuthTokenHydrated,
  getApiBaseUrl,
  getAuthToken,
  getWhitelabelHostId,
} from './authApi';

const BASE_PATH = '/api/v1';

export type CitizenMissionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type CitizenMissionSubmissionStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type CitizenMissionListItem = {
  id: string;
  title: string;
  description: string | null;
  image: { id: string; publicUrl: string | null } | null;
  points: number;
  status: CitizenMissionStatus;
  deadline: string | null;
  maxParticipants: number | null;
  participantsCount?: number | null;
  mySubmission: {
    id: string;
    status: CitizenMissionSubmissionStatus;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type SubmitMissionSupabaseEvidenceImage = {
  id: string;
  publicUrl: string;
  path: string;
};

export type SubmitMissionSupabaseResult = {
  id: string;
  status: CitizenMissionSubmissionStatus;
  evidenceImageId: string;
  evidenceImage: SubmitMissionSupabaseEvidenceImage;
};

export type WeeklyMissionsRankingMy = {
  userId: string;
  weeklyPoints: number;
  position: number | null;
};

export type WeeklyMissionsRankingLeaderboardEntry = {
  userId: string;
  name: string;
  weeklyPoints: number;
  position: number;
};

export type WeeklyMissionsRankingResponse = {
  weekStart: string;
  weekEnd: string;
  my: WeeklyMissionsRankingMy;
  leaderboard: WeeklyMissionsRankingLeaderboardEntry[];
};

export type MySubmissionItem = {
  id: string;
  status: CitizenMissionSubmissionStatus;
  note: string | null;
  reviewedAt: string | null;
  createdAt: string;
  mission: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    status: CitizenMissionStatus;
    deadline: string | null;
    image: { id: string; publicUrl: string | null } | null;
  };
  evidenceImage: { id: string; publicUrl: string | null } | null;
};

async function requireAuthToken(): Promise<string> {
  const token = (await ensureAuthTokenHydrated()) || getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  return token;
}

function appendHostId(qs: URLSearchParams): void {
  try {
    const hostId = getWhitelabelHostId();
    if (hostId) qs.set('hostId', hostId);
  } catch {
    /* sem host configurado */
  }
}

function parseApiErrorMessage(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[]; error?: string };
    if (Array.isArray(json.message) && json.message.length > 0) return json.message.join(', ');
    if (typeof json.message === 'string' && json.message.trim()) return json.message;
    if (typeof json.error === 'string' && json.error.trim()) return json.error;
  } catch {
  }
  return text.trim() || 'Erro na requisição';
}

async function requestApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const token = await requireAuthToken();
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : null),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('Sessão expirada ou inválida. Faça login novamente para aceitar a missão.');
    }
    throw new Error(parseApiErrorMessage(text) || `Erro HTTP: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function requestApiOptionalAuth<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${BASE_PATH}${endpoint}`;
  const headers = await buildAuthHeaders(Boolean(options.body));
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro HTTP: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Lista missões. Use `init`/`end` para paginação (intervalo [init, end) no backend). */
export async function listMissions(params?: {
  init?: number;
  end?: number;
}): Promise<CitizenMissionListItem[]> {
  const qs = new URLSearchParams();
  if (params?.init != null && Number.isFinite(params.init)) {
    qs.set('init', String(Math.max(0, Math.floor(params.init))));
  }
  if (params?.end != null && Number.isFinite(params.end)) {
    qs.set('end', String(Math.max(0, Math.floor(params.end))));
  }
  // Sempre envia hostId (Maricá): evita lista vazia quando o JWT não traz host.
  appendHostId(qs);

  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await requestApiOptionalAuth<CitizenMissionListItem[]>(`/missions${suffix}`);
  return Array.isArray(data) ? data : [];
}

export async function submitMissionEvidenceSupabaseFromUri(
  missionId: string,
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<SubmitMissionSupabaseResult> {
  const token = await requireAuthToken();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'mission-evidence.jpg';

  const form = new FormData();
  form.append('file', { uri, name, type: mime } as unknown as Blob);

  const url = `${getApiBaseUrl()}${BASE_PATH}/missions/${encodeURIComponent(missionId)}/submissions/supabase`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro no envio da comprovação: ${res.status}`);
  }

  const raw = (await res.json()) as Partial<SubmitMissionSupabaseResult> & {
    evidenceImage?: Partial<SubmitMissionSupabaseEvidenceImage> | null;
  };

  if (!raw?.id || typeof raw.status !== 'string') {
    throw new Error('Resposta inválida do servidor');
  }

  const evidenceImageId = String(raw.evidenceImageId ?? raw.evidenceImage?.id ?? '').trim();
  const img = raw.evidenceImage;
  const publicUrl =
    typeof img?.publicUrl === 'string' && img.publicUrl.trim() ? img.publicUrl.trim() : '';

  if (!publicUrl) {
    throw new Error(
      'A comprovação foi registrada, mas a imagem não tem URL pública. Verifique a configuração do armazenamento (Supabase).',
    );
  }

  const evidenceId = String(img?.id ?? evidenceImageId).trim();
  if (!evidenceImageId && !evidenceId) {
    throw new Error('Resposta inválida: evidenceImageId ausente');
  }

  return {
    id: String(raw.id),
    status: raw.status as CitizenMissionSubmissionStatus,
    evidenceImageId: evidenceImageId || evidenceId,
    evidenceImage: {
      id: evidenceId || evidenceImageId,
      publicUrl,
      path: typeof img?.path === 'string' ? img.path : '',
    },
  };
}

export async function acceptMission(missionId: string): Promise<{ id: string; status: CitizenMissionSubmissionStatus }> {
  return requestApi<{ id: string; status: CitizenMissionSubmissionStatus }>(
    `/missions/${encodeURIComponent(missionId)}/accept`,
    { method: 'POST' },
  );
}

export async function listMySubmissions(): Promise<MySubmissionItem[]> {
  const data = await requestApi<MySubmissionItem[]>('/me/submissions');
  return Array.isArray(data) ? data : [];
}

export async function getWeeklyMissionsRanking(params?: {
  init?: number;
  end?: number;
}): Promise<WeeklyMissionsRankingResponse> {
  const init = Math.max(0, Number(params?.init ?? 0));
  const endDefault = init + 10;
  const end = Math.max(init, Number(params?.end ?? endDefault));
  const qs = new URLSearchParams({ init: String(init), end: String(end) }).toString();
  return requestApi<WeeklyMissionsRankingResponse>(`/me/missions-ranking/weekly?${qs}`);
}