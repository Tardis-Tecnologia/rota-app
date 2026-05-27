import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';

const BASE_PATH = '/api/v1';

export type UrbanReportCategory =
  | 'STREET'
  | 'LIGHTING'
  | 'WASTE'
  | 'WATER_SEWAGE'
  | 'TRAFFIC'
  | 'SIDEWALK'
  | 'OTHER';

export type UrbanReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELED';

export type UploadImageResponse = { id: string; publicUrl: string; path: string };

export interface CreateUrbanReportBody {
  title: string;
  description: string;
  category: UrbanReportCategory;
  hostId?: string;
  mediaId?: string | null;
}

export interface UrbanReportResponseDto {
  id: string;
  hostId: string;
  userId: string;
  title: string;
  description: string;
  category: UrbanReportCategory;
  status: UrbanReportStatus;
  mediaId?: string | null;
  imageUrl?: string | null;
  relatedWorkId: string | null;
  relatedDemandId: string | null;
  createdAt: string;
  updatedAt: string;
}

function requireToken(): string {
  const token = getAuthToken();
  if (!token) throw new Error('Não autenticado');
  return token;
}

function authHeadersJson(): HeadersInit {
  const token = requireToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function authHeadersFormData(): HeadersInit {
  const token = requireToken();
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      if (Array.isArray(j?.message) && j.message.length) return j.message.join(', ');
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
    } catch {
      // ignore
    }
    return raw.slice(0, 220);
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function uploadUrbanReportImageFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<UploadImageResponse> {
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'urban-report.jpg';
  const form = new FormData();
  form.append('file', { uri, name, type: mime } as unknown as Blob);
  const url = `${getApiBaseUrl()}${BASE_PATH}/upload/image`;
  const res = await fetch(url, { method: 'POST', headers: authHeadersFormData(), body: form });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as UploadImageResponse;
}

export async function createUrbanReport(
  body: CreateUrbanReportBody,
  options?: { imageUri?: string | null },
): Promise<UrbanReportResponseDto> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/urban-reports`;
  let mediaId = body.mediaId?.trim() || undefined;
  if (options?.imageUri?.trim()) {
    const upload = await uploadUrbanReportImageFromUri(options.imageUri.trim());
    mediaId = upload.id;
  }

  const payload: Record<string, unknown> = {
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category,
    hostId: body.hostId?.trim() || getWhitelabelHostId(),
  };
  if (mediaId) payload.mediaId = mediaId;

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as UrbanReportResponseDto;
}

