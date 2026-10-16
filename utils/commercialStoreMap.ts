import {
  listCommercialStoresForMap,
  type CommercialStoreMapItem,
} from '@/services/commercialStoreApi';
import type { PontoInteresse } from '@/types';
import type { ImperativeRouter } from 'expo-router';
import {
  buildStoreGeocodeQuery,
  geocodeStoreLocation,
} from '@/utils/commercialStoreProfile';

export const EXPLORE_PARTNER_STORES_CHIP_ID = 'partner_stores';

const GEOCODE_BATCH_SIZE = 4;

export function commercialStoreToExplorePonto(
  store: CommercialStoreMapItem,
  coords: { latitude: number; longitude: number },
): PontoInteresse {
  const address = store.address?.trim();
  const segment = store.segment?.trim();
  return {
    id: `commercial-${store.id}`,
    titulo: store.storeName.trim() || 'Loja parceira',
    descricao: address || segment || 'Loja parceira do Rota',
    latitude: coords.latitude,
    longitude: coords.longitude,
    tipo: 'turismo',
    photoUrl: store.photoUrl?.trim() || undefined,
    formattedAddress: address || undefined,
    telefone: store.phone?.trim() || undefined,
    placeType: EXPLORE_PARTNER_STORES_CHIP_ID,
  };
}

export function explorePontoCommercialStoreId(
  ponto: Pick<PontoInteresse, 'id' | 'placeType'>,
): string | null {
  if (ponto.placeType !== EXPLORE_PARTNER_STORES_CHIP_ID) return null;
  const prefix = 'commercial-';
  if (!ponto.id.startsWith(prefix)) return null;
  const id = ponto.id.slice(prefix.length).trim();
  return id || null;
}

export function openCommercialStoreFromMapPonto(
  ponto: PontoInteresse,
  router: Pick<ImperativeRouter, 'push'>,
): void {
  const commercialId = explorePontoCommercialStoreId(ponto);
  if (!commercialId) return;
  const params: Record<string, string> = {
    commercialId,
    storeName: ponto.titulo.trim() || 'Loja parceira',
    photoUrl: ponto.photoUrl?.trim() ?? '',
    latitude: String(ponto.latitude),
    longitude: String(ponto.longitude),
  };
  if (ponto.formattedAddress?.trim()) params.address = ponto.formattedAddress.trim();
  if (ponto.telefone?.trim()) params.phone = ponto.telefone.trim();
  router.push({ pathname: '/forum/store', params });
}

async function geocodeStoreForMap(
  store: CommercialStoreMapItem,
): Promise<PontoInteresse | null> {
  const query = buildStoreGeocodeQuery({
    address: store.address,
    cep: store.cep,
    locationDescription: null,
  });
  if (!query) return null;
  const coords = await geocodeStoreLocation(query);
  if (!coords) return null;
  return commercialStoreToExplorePonto(store, coords);
}

/** Carrega lojas parceiras cadastradas e geocodifica endereço para pins no mapa. */
export async function loadPartnerStoresForMap(): Promise<PontoInteresse[]> {
  const stores = await listCommercialStoresForMap();
  const seen = new Set<string>();
  const unique = stores.filter((store) => {
    if (seen.has(store.id)) return false;
    seen.add(store.id);
    return true;
  });

  const pontos: PontoInteresse[] = [];
  for (let i = 0; i < unique.length; i += GEOCODE_BATCH_SIZE) {
    const batch = unique.slice(i, i + GEOCODE_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((store) => geocodeStoreForMap(store)));
    for (const ponto of batchResults) {
      if (ponto) pontos.push(ponto);
    }
  }
  return pontos;
}
