import type { ServiceProviderRegistrationPayload } from '@/services/guiaPrestadorCadastroApi';
import { GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';

export type GuiaProviderApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type StoredGuiaProviderRegistration = ServiceProviderRegistrationPayload & {
  id: string;
  ownerUserId: string;
  status: GuiaProviderApprovalStatus;
  submittedAt: string;
  latitude: number;
  longitude: number;
};

const STORAGE_KEY = '@rota/guia-provider-registrations';

let memoryCache: StoredGuiaProviderRegistration[] | null = null;

async function getAsyncStorage() {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

async function readAll(): Promise<StoredGuiaProviderRegistration[]> {
  if (memoryCache) return memoryCache;
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGuiaProviderRegistration[];
    memoryCache = Array.isArray(parsed) ? parsed : [];
    return memoryCache;
  } catch {
    return [];
  }
}

async function writeAll(items: StoredGuiaProviderRegistration[]): Promise<void> {
  memoryCache = items;
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listGuiaProviderRegistrations(): Promise<StoredGuiaProviderRegistration[]> {
  return readAll();
}

export async function getGuiaProviderRegistrationById(
  id: string,
): Promise<StoredGuiaProviderRegistration | null> {
  const items = await readAll();
  return items.find((item) => item.id === id) ?? null;
}

export async function saveGuiaProviderRegistration(
  ownerUserId: string,
  payload: ServiceProviderRegistrationPayload,
  coords?: { latitude: number; longitude: number } | null,
): Promise<StoredGuiaProviderRegistration> {
  const items = await readAll();
  const withoutPreviousPending = items.filter(
    (item) => !(item.ownerUserId === ownerUserId && item.status === 'PENDING'),
  );

  const registration: StoredGuiaProviderRegistration = {
    ...payload,
    id: `guia-pending-${ownerUserId}`,
    ownerUserId,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    latitude: coords?.latitude ?? GUIA_DEFAULT_CENTER.latitude,
    longitude: coords?.longitude ?? GUIA_DEFAULT_CENTER.longitude,
  };

  await writeAll([registration, ...withoutPreviousPending]);
  return registration;
}

/** Reservado para sincronização futura com o painel administrativo da Rota. */
export async function updateGuiaProviderRegistrationStatus(
  id: string,
  status: GuiaProviderApprovalStatus,
): Promise<StoredGuiaProviderRegistration | null> {
  const items = await readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  items[index] = { ...items[index], status };
  await writeAll(items);
  return items[index];
}
