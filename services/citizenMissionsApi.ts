import { getApiBaseUrl, getAuthToken } from './authApi';

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

export type UploadImageResult = {
  id: string;
  publicUrl: string;
  path: string;
};

export type SubmitMissionResult = {
  id: string;
  status: CitizenMissionSubmissionStatus;
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

function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  return token;
}

function parseApiErrorMessage(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[]; error?: string };
    if (Array.isArray(json.message) && json.message.length > 0) return json.message.join(', ');
    if (typeof json.message === 'string' && json.message.trim()) return json.message;
    if (typeof json.error === 'string' && json.error.trim()) return json.error;
  } catch {
    // ignore
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
  const token = requireAuthToken();
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
    throw new Error(parseApiErrorMessage(text) || `Erro HTTP: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function listMissions(): Promise<CitizenMissionListItem[]> {
  const data = await requestApi<CitizenMissionListItem[]>('/missions');
  return Array.isArray(data) ? data : [];
}

export async function submitMission(
  missionId: string,
  payload: { evidenceImageId: string },
): Promise<SubmitMissionResult> {
  return requestApi<SubmitMissionResult>(`/missions/${encodeURIComponent(missionId)}/submissions`, {
    method: 'POST',
    body: payload,
  });
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

export async function uploadEvidenceImageFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<UploadImageResult> {
  const token = requireAuthToken();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'mission-evidence.jpg';

  const form = new FormData();
  form.append('file', { uri, name, type: mime } as unknown as Blob);

  const url = `${getApiBaseUrl()}${BASE_PATH}/upload/image`;
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
    throw new Error(parseApiErrorMessage(text) || `Erro no upload: ${res.status}`);
  }

  const raw = (await res.json()) as Partial<UploadImageResult>;
  if (!raw?.id) {
    throw new Error('Resposta inválida do upload');
  }
  return { id: String(raw.id), publicUrl: String(raw.publicUrl ?? ''), path: String(raw.path ?? '') };
}

