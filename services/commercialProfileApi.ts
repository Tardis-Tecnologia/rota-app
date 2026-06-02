import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

export type CommercialMyProfile = {
  id: string;
  email: string;
  storeName: string;
  cnpj?: string | null;
  cep?: string | null;
  segment?: string | null;
  address?: string | null;
  responsibleName: string;
  phone: string;
  description?: string | null;
  photoUrl?: string | null;
  galleryImageUrls?: string[];
  status: string;
};

export type UpdateCommercialMyProfilePayload = {
  storeName?: string;
  cnpj?: string;
  cep?: string;
  segment?: string;
  address?: string;
  responsibleName?: string;
  phone?: string;
  description?: string;
};

function parseApiErrorMessage(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* ignore */
  }
  return text.trim() || 'Erro inesperado';
}

function authHeaders(json = false): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Não autenticado');
  }
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

function pickOptionalString(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string,
): string | null | undefined {
  const v = raw[camel] ?? (snake ? raw[snake] : undefined);
  if (v === null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function mapCommercialProfile(raw: unknown): CommercialMyProfile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Resposta inválida do servidor');
  }
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    email: String(r.email ?? ''),
    storeName: String(r.storeName ?? r.store_name ?? ''),
    cnpj: pickOptionalString(r, 'cnpj'),
    cep: pickOptionalString(r, 'cep'),
    segment: pickOptionalString(r, 'segment'),
    address: pickOptionalString(r, 'address'),
    responsibleName: String(r.responsibleName ?? r.responsible_name ?? ''),
    phone: String(r.phone ?? ''),
    description: pickOptionalString(r, 'description'),
    photoUrl: pickOptionalString(r, 'photoUrl', 'photo_url'),
    galleryImageUrls: parseGalleryUrls(r.galleryImageUrls ?? r.gallery_image_urls),
    status: String(r.status ?? ''),
  };
}

function parseGalleryUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function getCommercialMyProfile(): Promise<CommercialMyProfile> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/profile`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao carregar perfil: ${res.status}`);
  }
  return mapCommercialProfile(await res.json());
}

export async function updateCommercialMyProfile(
  payload: UpdateCommercialMyProfilePayload,
): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/profile`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao salvar perfil: ${res.status}`);
  }
}

function normalizeProfileUploadMime(mime?: string | null): string {
  const m = (mime ?? '').trim().toLowerCase();
  if (!m) return 'image/jpeg';
  if (m === 'image/jpg' || m === 'image/x-jpeg' || m === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (m === 'image/x-png') {
    return 'image/png';
  }
  return m;
}

export async function uploadCommercialMyProfilePhotoFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<{ photoUrl: string }> {
  const mime = normalizeProfileUploadMime(options?.mimeType);
  const name = options?.fileName?.trim() || 'profile-photo.jpg';

  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/profile-photo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro no upload da foto: ${res.status}`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const photoUrl =
    typeof raw.photoUrl === 'string'
      ? raw.photoUrl.trim()
      : typeof raw.photo_url === 'string'
        ? raw.photo_url.trim()
        : '';
  if (!photoUrl) {
    throw new Error('Resposta inválida ao enviar foto de perfil');
  }
  return { photoUrl };
}

export async function uploadCommercialGalleryPhotoFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<{ galleryImageUrls: string[] }> {
  const mime = normalizeProfileUploadMime(options?.mimeType);
  const name = options?.fileName?.trim() || 'gallery-photo.jpg';

  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/gallery-photo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao enviar imagem: ${res.status}`);
  }

  const raw = (await res.json()) as { galleryImageUrls?: unknown };
  return { galleryImageUrls: parseGalleryUrls(raw.galleryImageUrls) };
}

export async function removeCommercialGalleryPhoto(
  imageUrl: string,
): Promise<{ galleryImageUrls: string[] }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/me/gallery-photo`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(true),
    body: JSON.stringify({ imageUrl: imageUrl.trim() }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(parseApiErrorMessage(text) || `Erro ao remover imagem: ${res.status}`);
  }

  const raw = (await res.json()) as { galleryImageUrls?: unknown };
  return { galleryImageUrls: parseGalleryUrls(raw.galleryImageUrls) };
}
