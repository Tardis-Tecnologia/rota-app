import type { CommercialStorePublicProfile } from '@/types/forumCommercial';
import { getApiBaseUrl, getAuthToken } from './authApi';

const BASE_PATH = '/api/v1';

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

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Perfil público da loja (quando disponível no backend). */
export async function getCommercialStorePublicProfile(
  commercialAccountId: string,
): Promise<CommercialStorePublicProfile> {
  const id = commercialAccountId.trim();
  if (!id) throw new Error('Loja não identificada.');

  const url = `${getApiBaseUrl()}${BASE_PATH}/commercial/stores/${encodeURIComponent(id)}/profile`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders() });
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
