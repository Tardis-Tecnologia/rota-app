import type {
  CreateMarketplaceListingBody,
  MarketplaceListing,
  MarketplaceListingDetailDto,
  MarketplaceListingInput,
  MarketplaceListingListItemDto,
} from '@/types/marketplace';
import {
  mapMarketplaceDetail,
  mapMarketplaceListItem,
  parseMarketplaceListPayload,
} from '@/utils/marketplaceMappers';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';

const BASE_PATH = '/api/v1';
const DEFAULT_PAGE_SIZE = 20;

/** Host do município (EXPO_PUBLIC_HOST_ID). Obrigatório no body/query das requisições. */
function marketplaceHostId(): string {
  return getWhitelabelHostId();
}

function hostIdQuery(): string {
  return `hostId=${encodeURIComponent(marketplaceHostId())}`;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      const msg = j?.message;
      if (Array.isArray(msg)) {
        const joined = msg.map((m) => String(m).trim()).filter(Boolean).join(' ');
        if (joined) return joined;
      }
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

function authHeaders(json = true): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

async function resolveImageId(input: MarketplaceListingInput): Promise<string | undefined> {
  if (input.imageId?.trim()) return input.imageId.trim();
  const uri = input.imageUri?.trim();
  if (!uri) return undefined;
  if (!isLocalImageUri(uri)) return undefined;
  const uploaded = await uploadMarketplaceImageFromUri(uri);
  return uploaded.id;
}

export async function uploadMarketplaceImageFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<{ id: string; publicUrl: string }> {
  const base = getApiBaseUrl();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'marketplace-image.jpg';
  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${base}${BASE_PATH}/upload/supabase/image`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { id: string; publicUrl: string };
}

function buildListingQuery(
  hostId: string,
  options?: {
    category?: string;
    search?: string;
    init?: number;
    end?: number;
  },
): string {
  const params = new URLSearchParams();
  params.set('hostId', hostId);
  if (options?.category?.trim()) params.set('category', options.category.trim());
  if (options?.search?.trim()) params.set('title', options.search.trim());
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  return params.toString();
}

function mapListResponse(raw: unknown): MarketplaceListing[] {
  return parseMarketplaceListPayload(raw)
    .map(mapMarketplaceListItem)
    .filter((item): item is MarketplaceListing => item !== null);
}

export async function listMarketplaceListings(options?: {
  category?: string;
  search?: string;
  init?: number;
  end?: number;
}): Promise<MarketplaceListing[]> {
  const base = getApiBaseUrl();
  const hostId = marketplaceHostId();
  const qs = buildListingQuery(hostId, {
    ...options,
    init: options?.init ?? 0,
    end: options?.end ?? DEFAULT_PAGE_SIZE,
  });
  const url = `${base}${BASE_PATH}/marketplace?${qs}`;
  const res = await fetch(url, { headers: authHeaders(false) });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = await res.json();
  return mapListResponse(data);
}

export async function listMyMarketplaceListings(options?: {
  init?: number;
  end?: number;
}): Promise<MarketplaceListing[]> {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  params.set('hostId', marketplaceHostId());
  if (typeof options?.init === 'number') params.set('init', String(options.init));
  if (typeof options?.end === 'number') params.set('end', String(options.end));
  const url = `${base}${BASE_PATH}/marketplace/me?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(false) });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = await res.json();
  return mapListResponse(data);
}

export async function getMarketplaceListingById(id: string): Promise<MarketplaceListing | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/marketplace/${encodeURIComponent(trimmed)}?${hostIdQuery()}`;
  const res = await fetch(url, { headers: authHeaders(false) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as MarketplaceListingDetailDto;
  return mapMarketplaceDetail(data);
}

function inputToBody(
  input: MarketplaceListingInput,
  imageId?: string,
  status?: 'draft' | 'published',
): CreateMarketplaceListingBody {
  const hostId = marketplaceHostId();
  const body: CreateMarketplaceListingBody = {
    hostId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    price: input.price,
    advertiserContact: input.advertiserContact.trim(),
    locationName: input.locationName.trim(),
  };
  if (input.locationAddress?.trim()) body.locationAddress = input.locationAddress.trim();
  if (imageId) body.imageId = imageId;
  body.status = status ?? 'published';
  return body;
}

export async function createMarketplaceListing(
  input: MarketplaceListingInput,
  options?: { status?: 'draft' | 'published' },
): Promise<MarketplaceListing> {
  const base = getApiBaseUrl();
  const imageId = await resolveImageId(input);
  const body = inputToBody(input, imageId, options?.status ?? 'published');
  const url = `${base}${BASE_PATH}/marketplace?${hostIdQuery()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as MarketplaceListingDetailDto;
  return mapMarketplaceDetail(data);
}

export async function updateMarketplaceListing(
  id: string,
  input: MarketplaceListingInput,
): Promise<MarketplaceListing> {
  const trimmed = id.trim();
  if (!trimmed) throw new Error('Anúncio inválido.');
  const base = getApiBaseUrl();
  const imageId = await resolveImageId(input);
  const body = inputToBody(input, imageId);
  const url = `${base}${BASE_PATH}/marketplace/${encodeURIComponent(trimmed)}?${hostIdQuery()}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const data = (await res.json()) as MarketplaceListingDetailDto;
  return mapMarketplaceDetail(data);
}

export async function deleteMarketplaceListing(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) throw new Error('Anúncio inválido.');
  const base = getApiBaseUrl();
  const url = `${base}${BASE_PATH}/marketplace/${encodeURIComponent(trimmed)}?${hostIdQuery()}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
