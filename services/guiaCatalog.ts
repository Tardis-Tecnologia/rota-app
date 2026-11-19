import type { GuiaProviderApprovalStatus } from '@/utils/serviceProviderMappers';
import type { PontoInteresse, Profile } from '@/types';
import { distanceMeters, GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';

export type { GuiaProviderApprovalStatus };

export type GuiaTab = 'prestadores' | 'empresas';

export type GuiaListItem = Profile & {
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  categoryLabel: string;
  approvalStatus?: GuiaProviderApprovalStatus;
  /** Falso quando o cadastro não tem coordenada e o ponto cairia no centro da cidade. */
  hasMapLocation?: boolean;
};

export function matchesGuiaSearch(item: GuiaListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.name,
    item.categoryLabel,
    item.categoryId,
    ...(item.categoryIds ?? []),
    item.about,
    item.serviceArea ?? '',
    item.address ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function sortGuiaByDistance(
  items: GuiaListItem[],
  origin?: { latitude: number; longitude: number } | null,
): GuiaListItem[] {
  const lat = origin?.latitude ?? GUIA_DEFAULT_CENTER.latitude;
  const lng = origin?.longitude ?? GUIA_DEFAULT_CENTER.longitude;
  return [...items]
    .map((item) => ({
      ...item,
      distanceMeters: distanceMeters(lat, lng, item.latitude, item.longitude),
    }))
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
}

export function filterAndSortGuia(
  _tab: GuiaTab,
  query: string,
  origin: { latitude: number; longitude: number } | null | undefined,
  catalogItems: GuiaListItem[],
): GuiaListItem[] {
  return sortGuiaByDistance(
    catalogItems.filter((item) => matchesGuiaSearch(item, query)),
    origin,
  );
}

export function guiaProfileToPonto(item: GuiaListItem): PontoInteresse | null {
  if (item.approvalStatus && item.approvalStatus !== 'APPROVED') return null;
  if (item.hasMapLocation === false) return null;
  const photo = item.image?.trim();
  return {
    id: item.id,
    titulo: item.name,
    descricao: item.categoryLabel,
    latitude: item.latitude,
    longitude: item.longitude,
    tipo: item.type === 'COMPANY' ? 'turismo' : 'cultura',
    placeType: item.type === 'COMPANY' ? 'empresa' : 'prestador',
    rating: item.rating,
    userRatingsTotal: item.review,
    formattedAddress: item.address ?? item.serviceArea,
    photoUrl: photo || undefined,
  };
}

export function isNonApprovedProviderStatus(status?: GuiaProviderApprovalStatus): boolean {
  return status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'REJECTED';
}
