import type { GuiaListItem } from '@/services/guiaCatalog';
import type {
  ServiceProviderListItem,
  ServiceProviderResponse,
  ServiceProviderStatus,
} from '@/types/serviceProvider';
import type { Profile } from '@/types';
import { GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';
import {
  parseProviderRatingAverage,
  parseProviderRatingCount,
} from '@/utils/providerRatingDisplay';
import {
  categoryIdToLabel,
  formatCategoriesLabel,
  resolveProviderCategories,
} from '@/utils/serviceProviderCategories';
import { businessHoursFromApi } from '@/utils/serviceProviderForm';

export type GuiaProviderApprovalStatus = ServiceProviderStatus;

function parseCoord(value?: string | null, fallback?: number): number {
  if (value == null || value === '') return fallback ?? NaN;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : (fallback ?? NaN);
}

export function serviceProviderListItemToGuia(
  item: ServiceProviderListItem,
): GuiaListItem | null {
  let latitude = parseCoord(item.latitude);
  let longitude = parseCoord(item.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    // Alguns aprovados ainda podem não ter coord registrada; mantemos visível no Guia.
    latitude = GUIA_DEFAULT_CENTER.latitude;
    longitude = GUIA_DEFAULT_CENTER.longitude;
  }

  const categoryIds = resolveProviderCategories(item);
  const primaryId = categoryIds[0] ?? item.category ?? '';

  return {
    id: item.id,
    type: 'PROVIDER',
    name: item.name,
    categoryId: primaryId,
    categoryIds,
    rating: parseProviderRatingAverage(
      item.ratingAverage ?? (item as { rating_average?: unknown }).rating_average,
    ),
    review: parseProviderRatingCount(
      item.ratingCount ?? (item as { rating_count?: unknown }).rating_count,
    ),
    image: item.imagePublicUrl?.trim() ?? '',
    about: '',
    latitude,
    longitude,
    address: item.locationName ?? undefined,
    serviceArea: item.locationName ?? undefined,
    reviews: [],
    gallery: [],
    services: [],
    categoryLabel: formatCategoriesLabel(categoryIds) || item.category,
    approvalStatus: item.status,
  };
}

export function serviceProviderResponseToProfile(
  provider: ServiceProviderResponse,
): Profile {
  const item = serviceProviderListItemToGuia({
    id: provider.id,
    hostId: provider.hostId,
    type: provider.type,
    name: provider.name,
    categories: provider.categories,
    category: provider.category,
    primaryCategory: provider.primaryCategory,
    cnpj: provider.cnpj,
    status: provider.status,
    imagePublicUrl: provider.imagePublicUrl,
    ratingAverage: provider.ratingAverage,
    ratingCount: provider.ratingCount,
    locationName: provider.locationName,
    latitude: provider.latitude,
    longitude: provider.longitude,
  });

  const hoursText = businessHoursFromApi(provider.businessHours);
  const hours = hoursText || undefined;

  const categoryIds = resolveProviderCategories(provider);
  const primaryId = categoryIds[0] ?? provider.category ?? '';
  const normalizedDescription = provider.description?.trim() ?? '';
  const sharedDescription =
    categoryIds.length === 1
      ? normalizedDescription || 'Detalhes do serviço não informados.'
      : '';
  const services = categoryIds.map((id) => ({
    name: categoryIdToLabel(id),
    description: sharedDescription,
    price: 'A combinar',
  }));

  return {
    id: provider.id,
    type: 'PROVIDER',
    ownerUserId: provider.userId,
    name: provider.name,
    categoryId: primaryId,
    categoryIds,
    rating: parseProviderRatingAverage(provider.ratingAverage),
    review: parseProviderRatingCount(provider.ratingCount),
    image: provider.imagePublicUrl?.trim() ?? '',
    about: provider.description?.trim() ?? '',
    latitude: item?.latitude ?? GUIA_DEFAULT_CENTER.latitude,
    longitude: item?.longitude ?? GUIA_DEFAULT_CENTER.longitude,
    address: provider.locationAddress?.trim() ?? provider.locationName?.trim(),
    serviceArea: provider.locationName?.trim(),
    hours,
    phone: provider.phone,
    email: provider.email?.trim() ?? undefined,
    reviews: [],
    gallery: provider.imagePublicUrl ? [provider.imagePublicUrl] : [],
    services,
  };
}

export function mergeGuiaProviderLists(
  publicItems: ServiceProviderListItem[],
  myItems: ServiceProviderListItem[],
  currentUserId?: string | null,
): GuiaListItem[] {
  const byId = new Map<string, GuiaListItem>();

  for (const item of publicItems) {
    const mapped = serviceProviderListItemToGuia(item);
    if (mapped) byId.set(item.id, mapped);
  }

  if (currentUserId) {
    for (const item of myItems) {
      const mapped = serviceProviderListItemToGuia(item);
      if (mapped) byId.set(item.id, mapped);
    }
  }

  return [...byId.values()];
}
