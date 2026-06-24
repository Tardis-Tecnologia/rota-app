import type { ForumPostResponseDto } from '@/services/forumApi';
import { mapCommercialStorePublicProfile } from '@/services/commercialStoreApi';
import type { CommercialMyProfile } from '@/services/commercialProfileApi';
import type {
  CommercialStorePublicProfile,
  ForumAuthorCommercial,
} from '@/types/forumCommercial';
import * as Location from 'expo-location';

function hasCoords(
  profile: Pick<CommercialStorePublicProfile, 'latitude' | 'longitude'> | null | undefined,
): profile is CommercialStorePublicProfile & { latitude: number; longitude: number } {
  return (
    profile != null &&
    typeof profile.latitude === 'number' &&
    Number.isFinite(profile.latitude) &&
    typeof profile.longitude === 'number' &&
    Number.isFinite(profile.longitude)
  );
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return null;
}

export function commercialMyProfileToPublic(
  profile: CommercialMyProfile,
): CommercialStorePublicProfile {
  return {
    id: profile.id,
    storeName: profile.storeName,
    photoUrl: profile.photoUrl ?? null,
    description: profile.description ?? null,
    segment: profile.segment ?? null,
    address: profile.address ?? null,
    cep: profile.cep ?? null,
    phone: profile.phone || null,
    latitude: null,
    longitude: null,
    galleryImageUrls: profile.galleryImageUrls ?? [],
  };
}

export function forumAuthorCommercialToPublic(
  author: ForumAuthorCommercial,
): CommercialStorePublicProfile {
  return {
    id: author.id,
    storeName: author.storeName,
    photoUrl: author.photoUrl,
    description: author.description ?? null,
    segment: author.segment ?? null,
    address: author.address ?? null,
    cep: author.cep ?? null,
    phone: author.phone ?? null,
    latitude: author.latitude ?? null,
    longitude: author.longitude ?? null,
  };
}

export function forumPostToStoreProfile(
  post: ForumPostResponseDto,
): CommercialStorePublicProfile | null {
  const author = post.authorCommercial;
  if (!author?.id?.trim()) return null;
  const base = forumAuthorCommercialToPublic(author);
  const locationDescription = post.locationDescription?.trim() || null;
  return {
    ...base,
    locationDescription: locationDescription ?? base.locationDescription ?? null,
  };
}

export function mapForumAuthorCommercial(raw: unknown): ForumAuthorCommercial | null {
  const mapped = mapCommercialStorePublicProfile(raw);
  if (!mapped) return null;
  return {
    id: mapped.id,
    storeName: mapped.storeName,
    photoUrl: mapped.photoUrl ?? null,
    description: mapped.description,
    segment: mapped.segment,
    address: mapped.address,
    cep: mapped.cep,
    phone: mapped.phone,
    latitude: mapped.latitude,
    longitude: mapped.longitude,
  };
}

export function mergeCommercialStoreProfiles(
  ...sources: Array<CommercialStorePublicProfile | null | undefined>
): CommercialStorePublicProfile | null {
  const valid = sources.filter((s): s is CommercialStorePublicProfile => !!s?.id?.trim());
  if (valid.length === 0) return null;

  const base = { ...valid[0] };
  for (let i = 1; i < valid.length; i += 1) {
    const next = valid[i];
    base.storeName = firstNonEmpty(next.storeName, base.storeName) ?? base.storeName;
    base.photoUrl = firstNonEmpty(next.photoUrl ?? undefined, base.photoUrl ?? undefined) ?? base.photoUrl;
    base.description = firstNonEmpty(next.description ?? undefined, base.description ?? undefined);
    base.segment = firstNonEmpty(next.segment ?? undefined, base.segment ?? undefined);
    base.address = firstNonEmpty(next.address ?? undefined, base.address ?? undefined);
    base.cep = firstNonEmpty(next.cep ?? undefined, base.cep ?? undefined);
    base.phone = firstNonEmpty(next.phone ?? undefined, base.phone ?? undefined);
    base.locationDescription = firstNonEmpty(
      next.locationDescription ?? undefined,
      base.locationDescription ?? undefined,
    );
    if (!hasCoords(base) && hasCoords(next)) {
      base.latitude = next.latitude;
      base.longitude = next.longitude;
    }
    base.galleryImageUrls = mergeGalleryImageUrls(base.galleryImageUrls, next.galleryImageUrls);
  }
  return base;
}

function mergeGalleryImageUrls(
  a?: string[] | null,
  b?: string[] | null,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...(a ?? []), ...(b ?? [])]) {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= 8) break;
  }
  return out;
}

export function storeProfileFromRouteParams(params: {
  commercialId?: string;
  storeName?: string;
  photoUrl?: string;
  address?: string;
  segment?: string;
  phone?: string;
  description?: string;
  cep?: string;
  latitude?: string;
  longitude?: string;
  locationDescription?: string;
}): CommercialStorePublicProfile | null {
  const id = String(params.commercialId ?? '').trim();
  if (!id) return null;

  const latRaw = String(params.latitude ?? '').trim();
  const lngRaw = String(params.longitude ?? '').trim();
  const lat = latRaw ? parseFloat(latRaw) : null;
  const lng = lngRaw ? parseFloat(lngRaw) : null;

  return {
    id,
    storeName: (params.storeName ?? 'Loja parceira').trim() || 'Loja parceira',
    photoUrl: params.photoUrl?.trim() || null,
    address: params.address?.trim() || null,
    segment: params.segment?.trim() || null,
    phone: params.phone?.trim() || null,
    description: params.description?.trim() || null,
    cep: params.cep?.trim() || null,
    latitude: lat != null && Number.isFinite(lat) ? lat : null,
    longitude: lng != null && Number.isFinite(lng) ? lng : null,
    locationDescription: params.locationDescription?.trim() || null,
  };
}

import { buildCityGeocodeQuery } from '@/constants/whitelabelCity';
import { resolveActiveCityConfig } from '@/utils/whitelabelHost';

/** Monta endereço completo para geocodificação (cidade do host whitelabel). */
export function buildStoreGeocodeQuery(
  profile: Pick<CommercialStorePublicProfile, 'address' | 'cep' | 'locationDescription'>,
): string | null {
  const address = profile.address?.trim();
  const cep = profile.cep?.trim();
  const locationDescription = profile.locationDescription?.trim();
  let base = address || locationDescription;
  if (!base) return null;

  if (cep && !base.includes(cep)) {
    base = `${base}, CEP ${cep}`;
  }

  return buildCityGeocodeQuery(base, resolveActiveCityConfig());
}

async function geocodeWithMapTiler(
  query: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const key = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();
  if (!key) return null;

  try {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${encodeURIComponent(key)}&limit=1&country=br`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

export async function geocodeStoreLocation(
  query: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const q = query.trim();
  if (!q) return null;

  const fromMapTiler = await geocodeWithMapTiler(q);
  if (fromMapTiler) return fromMapTiler;

  try {
    const results = await Location.geocodeAsync(q);
    const first = results[0];
    if (first && Number.isFinite(first.latitude) && Number.isFinite(first.longitude)) {
      return { latitude: first.latitude, longitude: first.longitude };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Coordenadas para a tela de rotas (/directions), como no Guia de empresas. */
export async function resolveStoreDirectionsCoords(
  profile: CommercialStorePublicProfile | null,
  geocodedCache: { latitude: number; longitude: number } | null,
): Promise<{ latitude: number; longitude: number } | null> {
  if (!profile) return null;
  if (hasCoords(profile)) {
    return { latitude: profile.latitude!, longitude: profile.longitude! };
  }
  if (geocodedCache) return geocodedCache;

  const query = buildStoreGeocodeQuery(profile);
  if (!query) return null;
  return geocodeStoreLocation(query);
}

export function resolveStoreMapTarget(
  profile: CommercialStorePublicProfile | null,
  geocoded: { latitude: number; longitude: number } | null,
): {
  latitude: number;
  longitude: number;
  label: string;
} | { searchQuery: string; label: string } | null {
  if (!profile) return null;

  const label = profile.storeName.trim() || 'Loja parceira';
  if (hasCoords(profile)) {
    return { latitude: profile.latitude, longitude: profile.longitude, label };
  }
  if (geocoded) {
    return { latitude: geocoded.latitude, longitude: geocoded.longitude, label };
  }

  const searchQuery = firstNonEmpty(
    profile.address ?? undefined,
    profile.locationDescription ?? undefined,
  );
  if (searchQuery) return { searchQuery, label };
  return null;
}

export { hasCoords };
