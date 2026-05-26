import {
  normalizeLostAnimalDto,
  normalizeLostAnimalList,
  prepareLostAnimalFormForApi,
  type LostAnimalDto,
  type LostAnimalFormState,
  type UploadImageResponse,
} from '@/components/animals/lostAnimalUtils';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from '@/services/authApi';

const PAGE_SIZE = 20;

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j?.message === 'string' && j.message.trim()) return j.message.trim();
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function authHeadersJson(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function authHeadersFormData(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function listLostAnimals(options?: {
  init?: number;
  end?: number;
  hostId?: string;
  species?: string;
  breed?: string;
  location?: string;
  missingDateFrom?: string;
  missingDateTo?: string;
}): Promise<LostAnimalDto[]> {
  const base = getApiBaseUrl();
  const init = options?.init ?? 0;
  const end = options?.end ?? PAGE_SIZE;
  const hostId = options?.hostId?.trim() || getWhitelabelHostId();
  const params = new URLSearchParams();
  params.set('init', String(init));
  params.set('end', String(end));
  if (options?.species?.trim()) params.set('species', options.species.trim());
  if (options?.breed?.trim()) params.set('breed', options.breed.trim());
  if (options?.location?.trim()) params.set('location', options.location.trim());
  if (options?.missingDateFrom?.trim()) params.set('missingDateFrom', options.missingDateFrom.trim());
  if (options?.missingDateTo?.trim()) params.set('missingDateTo', options.missingDateTo.trim());
  const url = `${base}/api/v1/lost-animals/hosts/${encodeURIComponent(hostId)}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: authHeadersJson() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  return normalizeLostAnimalList(data);
}

export async function uploadLostAnimalImageFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<UploadImageResponse> {
  const base = getApiBaseUrl();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'lost-animal.jpg';
  const form = new FormData();
  form.append('file', { uri, name, type: mime } as unknown as Blob);
  const url = `${base}/api/v1/upload/image`;
  const res = await fetch(url, { method: 'POST', headers: authHeadersFormData(), body: form });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as UploadImageResponse;
}

export async function createLostAnimal(
  form: LostAnimalFormState,
  imageUri: string,
  hostId?: string,
): Promise<void> {
  const prepared = prepareLostAnimalFormForApi(form);
  if (!prepared) {
    throw new Error('Data inválida. Use o formato DD/MM/AAAA.');
  }
  const base = getApiBaseUrl();
  const hid = hostId?.trim() || getWhitelabelHostId();
  const upload = await uploadLostAnimalImageFromUri(imageUri);
  const url = `${base}/api/v1/lost-animals/hosts/${encodeURIComponent(hid)}`;
  const body = {
    animalName: prepared.animalName || null,
    species: prepared.species,
    breed: prepared.breed || null,
    missingDate: prepared.missingDate,
    missingLocation: prepared.missingLocation,
    contact: prepared.contact,
    description: prepared.description,
    mediaId: upload.id,
  };
  const res = await fetch(url, { method: 'POST', headers: authHeadersJson(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

export async function getLostAnimal(id: string): Promise<LostAnimalDto> {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/lost-animals/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'GET', headers: authHeadersJson() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  const normalized = normalizeLostAnimalDto(data);
  if (!normalized) throw new Error('Resposta inválida do animal perdido.');
  return normalized;
}

export type UpdateLostAnimalBody = {
  animalName?: string | null;
  species?: string;
  breed?: string | null;
  missingDate?: string;
  missingLocation?: string;
  contact?: string;
  description?: string;
  mediaId?: string;
};

function buildLostAnimalBody(prepared: LostAnimalFormState, mediaId?: string) {
  return {
    animalName: prepared.animalName || null,
    species: prepared.species,
    breed: prepared.breed || null,
    missingDate: prepared.missingDate,
    missingLocation: prepared.missingLocation,
    contact: prepared.contact,
    description: prepared.description,
    ...(mediaId ? { mediaId } : {}),
  };
}

export async function updateLostAnimal(
  id: string,
  form: LostAnimalFormState,
  options?: { imageUri?: string | null; keepMediaId?: string | null },
): Promise<LostAnimalDto> {
  const prepared = prepareLostAnimalFormForApi(form);
  if (!prepared) {
    throw new Error('Data inválida. Use o formato DD/MM/AAAA.');
  }
  const base = getApiBaseUrl();
  let mediaId = options?.keepMediaId?.trim() || undefined;
  if (options?.imageUri) {
    const upload = await uploadLostAnimalImageFromUri(options.imageUri);
    mediaId = upload.id;
  }
  const url = `${base}/api/v1/lost-animals/${encodeURIComponent(id)}`;
  const body = buildLostAnimalBody(prepared, mediaId);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as unknown;
  const normalized = normalizeLostAnimalDto(data);
  if (!normalized) throw new Error('Resposta inválida ao atualizar animal perdido.');
  return normalized;
}

export async function deleteLostAnimal(id: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/lost-animals/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeadersJson() });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}

/** Posts antigos podem ter foto só no post do fórum vinculado. */
export async function enrichLostAnimalsMedia(items: LostAnimalDto[]): Promise<LostAnimalDto[]> {
  const missing = items.filter(
    (item) => !item.mediaId?.trim() && !item.imageUrl?.trim() && item.forumPostId?.trim(),
  );
  if (missing.length === 0) return items;

  const { getForumPost } = await import('@/services/forumApi');
  const mediaByForumPostId = new Map<string, string>();

  await Promise.all(
    missing.map(async (item) => {
      const forumPostId = item.forumPostId!.trim();
      try {
        const post = await getForumPost(forumPostId);
        const mediaId = post.mediaId?.trim();
        if (mediaId) mediaByForumPostId.set(forumPostId, mediaId);
      } catch {
        // ignora falha pontual
      }
    }),
  );

  if (mediaByForumPostId.size === 0) return items;

  return items.map((item) => {
    const forumPostId = item.forumPostId?.trim();
    if (!forumPostId || item.mediaId?.trim()) return item;
    const mediaId = mediaByForumPostId.get(forumPostId);
    return mediaId ? { ...item, mediaId } : item;
  });
}

export { PAGE_SIZE };
