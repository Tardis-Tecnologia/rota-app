import type { CommercialStorePublicProfile } from '@/types/forumCommercial';
import { buildAuthHeaders, getApiBaseUrl, getWhitelabelHostId } from './authApi';

const BASE_PATH = '/api/v1';

function hostQs(): string {
  return `hostId=${encodeURIComponent(getWhitelabelHostId())}`;
}

function pickOptionalString(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string,
): string | null | undefined {
  const v = raw[camel] ?? (snake ? raw[snake] : undefined);
  if (v === null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function parseCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function mapCommercialStorePublicProfile(raw: unknown): CommercialStorePublicProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.commercialAccountId ?? r.commercial_account_id ?? '').trim();
  if (!id) return null;

  const storeName = String(r.storeName ?? r.store_name ?? '').trim();
  const latitude = parseCoord(r.latitude ?? r.lat);
  const longitude = parseCoord(r.longitude ?? r.lng ?? r.lon);

  return {
    id,
    storeName: storeName || 'Loja parceira',
    photoUrl: pickOptionalString(r, 'photoUrl', 'photo_url'),
    description: pickOptionalString(r, 'description'),
    segment: pickOptionalString(r, 'segment'),
    address: pickOptionalString(r, 'address'),
    cep: pickOptionalString(r, 'cep'),
    phone: pickOptionalString(r, 'phone'),
    latitude,
    longitude,
    locationDescription: pickOptionalString(r, 'locationDescription', 'location_description'),
    galleryImageUrls: parseGalleryUrls(r.galleryImageUrls ?? r.gallery_image_urls),
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

export type CommercialStoreMapItem = {
  id: string;
  storeName: string;
  photoUrl?: string | null;
  galleryImageUrls?: string[];
  segment?: string | null;
  address?: string | null;
  cep?: string | null;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
};

function mapCommercialStoreMapItem(raw: unknown): CommercialStoreMapItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '').trim();
  if (!id) return null;
  const storeName = String(r.storeName ?? r.store_name ?? '').trim();
  const phone = String(r.phone ?? '').trim();
  return {
    id,
    storeName: storeName || 'Loja parceira',
    photoUrl: pickOptionalString(r, 'photoUrl', 'photo_url'),
    galleryImageUrls: parseGalleryUrls(r.galleryImageUrls ?? r.gallery_image_urls),
    segment: pickOptionalString(r, 'segment'),
    address: pickOptionalString(r, 'address'),
    cep: pickOptionalString(r, 'cep'),
    phone: phone || '',
    latitude: parseCoord(r.latitude ?? r.lat),
    longitude: parseCoord(r.longitude ?? r.lng ?? r.lon),
  };
}

/** Lojas parceiras aprovadas para o filtro do mapa. */
export async function listCommercialStoresForMap(): Promise<CommercialStoreMapItem[]> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/map?${hostQs()}`;
  const res = await fetch(url, { method: 'GET', headers: await buildAuthHeaders(false) });
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const raw = await res.text();
      if (raw) {
        const j = JSON.parse(raw) as { message?: string };
        if (typeof j.message === 'string' && j.message.trim()) message = j.message.trim();
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapCommercialStoreMapItem(row))
    .filter((row): row is CommercialStoreMapItem => row != null);
}

/** Perfil público da loja (quando disponível no backend). */
export async function getCommercialStorePublicProfile(
  commercialAccountId: string,
): Promise<CommercialStorePublicProfile> {
  const id = commercialAccountId.trim();
  if (!id) throw new Error('Loja não identificada.');

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/${encodeURIComponent(id)}/profile?${hostQs()}`;
  const res = await fetch(url, { method: 'GET', headers: await buildAuthHeaders(false) });
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const raw = await res.text();
      if (raw) {
        const j = JSON.parse(raw) as { message?: string };
        if (typeof j.message === 'string' && j.message.trim()) message = j.message.trim();
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const mapped = mapCommercialStorePublicProfile(await res.json());
  if (!mapped) throw new Error('Resposta inválida do servidor.');
  return mapped;
}

export type CommercialStoreReview = {
  id: string;
  authorName: string;
  stars: number;
  comment: string;
  createdAt: string;
};

export type CommercialStoreReviews = {
  ratingAverage: number;
  ratingCount: number;
  reviews: CommercialStoreReview[];
  mine: CommercialStoreReview | null;
};

function mapStoreReview(raw: unknown): CommercialStoreReview | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? '').trim();
  if (!id) return null;
  const stars = Number.parseFloat(String(row.stars ?? ''));
  return {
    id,
    authorName: String(row.authorName ?? row.author_name ?? 'Morador').trim() || 'Morador',
    stars: Number.isFinite(stars) ? stars : 0,
    comment: String(row.comment ?? '').trim(),
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
  };
}

async function readApiError(res: Response): Promise<string> {
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    const raw = await res.text();
    if (raw) {
      const parsed = JSON.parse(raw) as { message?: string | string[] };
      if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim();
      if (Array.isArray(parsed.message) && parsed.message.length > 0) {
        return parsed.message.map((item) => String(item)).join(' ');
      }
    }
  } catch {
    // ignore
  }
  return message;
}

function mapStoreReviews(raw: unknown): CommercialStoreReviews {
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const reviews = Array.isArray(body.reviews)
    ? body.reviews
        .map((item) => mapStoreReview(item))
        .filter((item): item is CommercialStoreReview => item != null)
    : [];
  const average = Number.parseFloat(String(body.ratingAverage ?? body.rating_average ?? '0'));
  const count = Number(body.ratingCount ?? body.rating_count ?? reviews.length);
  return {
    ratingAverage: Number.isFinite(average) ? average : 0,
    ratingCount: Number.isFinite(count) ? count : reviews.length,
    reviews,
    mine: mapStoreReview(body.mine),
  };
}

/** Avaliações públicas da loja. */
export async function listCommercialStoreReviews(
  commercialAccountId: string,
): Promise<CommercialStoreReviews> {
  const id = commercialAccountId.trim();
  if (!id) throw new Error('Loja não identificada.');
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/${encodeURIComponent(id)}/reviews?${hostQs()}`;
  const res = await fetch(url, { method: 'GET', headers: await buildAuthHeaders(false) });
  if (!res.ok) throw new Error(await readApiError(res));
  return mapStoreReviews(await res.json());
}

/** Cria ou atualiza a avaliação do cidadão logado. */
export async function upsertCommercialStoreReview(
  commercialAccountId: string,
  input: { stars: number; comment: string },
): Promise<CommercialStoreReviews> {
  const id = commercialAccountId.trim();
  if (!id) throw new Error('Loja não identificada.');
  const headers = await buildAuthHeaders(true);
  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/${encodeURIComponent(id)}/reviews`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ stars: input.stars, comment: input.comment.trim() }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return mapStoreReviews(await res.json());
}
