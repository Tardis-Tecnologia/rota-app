import {
  CATEGORIAS_EMPRESAS,
  CATEGORIES_WITH_ALL,
} from '@/constants/providerCategories';
import { COMPANIES } from '@/data/companies';
import { PROVIDERS } from '@/data/providers';
import type {
  GuiaProviderApprovalStatus,
  StoredGuiaProviderRegistration,
} from '@/services/guiaPendingProvidersStore';
import type { PontoInteresse, Profile, ProfileType } from '@/types';
import { distanceMeters, GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';

export type GuiaTab = 'prestadores' | 'empresas';

export type GuiaListItem = Profile & {
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  categoryLabel: string;
  approvalStatus?: GuiaProviderApprovalStatus;
  ownerUserId?: string;
  submittedAt?: string;
};

function categoryLabelFor(profile: Profile): string {
  if (profile.type === 'COMPANY') {
    return CATEGORIAS_EMPRESAS.find((c) => c.id === profile.categoryId)?.label ?? '';
  }
  return CATEGORIES_WITH_ALL.find((c) => c.id === profile.categoryId)?.label ?? '';
}

function withCoords(profile: Profile): GuiaListItem | null {
  const lat = profile.latitude;
  const lng = profile.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    ...profile,
    latitude: lat,
    longitude: lng,
    categoryLabel: categoryLabelFor(profile),
  };
}

function baseCatalog(type: ProfileType): GuiaListItem[] {
  const source = type === 'PROVIDER' ? PROVIDERS : COMPANIES;
  return source.map(withCoords).filter((p): p is GuiaListItem => p != null);
}

export function listGuiaCatalog(tab: GuiaTab): GuiaListItem[] {
  return baseCatalog(tab === 'prestadores' ? 'PROVIDER' : 'COMPANY');
}

export function storedRegistrationToGuiaListItem(
  stored: StoredGuiaProviderRegistration,
): GuiaListItem {
  return {
    id: stored.id,
    type: 'PROVIDER',
    name: stored.displayName,
    categoryId: stored.professionCategoryId ?? 'encanador',
    rating: 0,
    review: 0,
    image: '',
    about: stored.description,
    latitude: stored.latitude,
    longitude: stored.longitude,
    address: stored.locationAddress ?? stored.serviceArea,
    serviceArea: stored.serviceArea,
    hours: stored.businessHours,
    phone: stored.phone,
    email: stored.email,
    services: [],
    reviews: [],
    gallery: [],
    categoryLabel: stored.professionCustom,
    approvalStatus: stored.status,
    ownerUserId: stored.ownerUserId,
    submittedAt: stored.submittedAt,
  };
}

function mergeProviderRegistrations(
  items: GuiaListItem[],
  registrations: StoredGuiaProviderRegistration[],
  currentUserId?: string | null,
): GuiaListItem[] {
  if (!registrations.length) return items;

  const existingIds = new Set(items.map((item) => item.id));
  const approved = registrations
    .filter((item) => item.status === 'APPROVED')
    .map(storedRegistrationToGuiaListItem)
    .filter((item) => !existingIds.has(item.id));

  const ownPending = registrations
    .filter((item) => item.status === 'PENDING' && item.ownerUserId === currentUserId)
    .map(storedRegistrationToGuiaListItem)
    .filter((item) => !existingIds.has(item.id));

  return [...ownPending, ...approved, ...items];
}

export function getGuiaProfileById(
  id: string,
  registrations: StoredGuiaProviderRegistration[] = [],
  currentUserId?: string | null,
): GuiaListItem | null {
  const stored = registrations.find((item) => item.id === id);
  if (stored) {
    if (stored.status === 'PENDING' && stored.ownerUserId !== currentUserId) return null;
    if (stored.status === 'REJECTED' && stored.ownerUserId !== currentUserId) return null;
    return storedRegistrationToGuiaListItem(stored);
  }

  const found = [...PROVIDERS, ...COMPANIES].find((p) => p.id === id);
  if (!found) return null;
  return withCoords(found);
}

export function matchesGuiaSearch(item: GuiaListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.name,
    item.categoryLabel,
    item.categoryId,
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
  tab: GuiaTab,
  query: string,
  origin?: { latitude: number; longitude: number } | null,
  options?: {
    currentUserId?: string | null;
    registrations?: StoredGuiaProviderRegistration[];
  },
): GuiaListItem[] {
  let catalog = listGuiaCatalog(tab);
  if (tab === 'prestadores') {
    catalog = mergeProviderRegistrations(
      catalog,
      options?.registrations ?? [],
      options?.currentUserId,
    );
  }
  const filtered = catalog.filter((item) => matchesGuiaSearch(item, query));
  return sortGuiaByDistance(filtered, origin);
}

export function guiaProfileToPonto(item: GuiaListItem): PontoInteresse | null {
  if (item.approvalStatus === 'PENDING') return null;
  return {
    id: item.id,
    titulo: item.name,
    descricao: item.categoryLabel,
    latitude: item.latitude,
    longitude: item.longitude,
    tipo: item.type === 'COMPANY' ? 'turismo' : 'cultura',
    rating: item.rating,
    userRatingsTotal: item.review,
    formattedAddress: item.address ?? item.serviceArea,
  };
}
