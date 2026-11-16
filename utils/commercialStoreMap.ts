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
  const cover = store.photoUrl?.trim() || undefined;
  const gallery = (store.galleryImageUrls ?? [])
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
  const photoUrls = [...(cover ? [cover] : []), ...gallery].filter(
    (url, index, arr) => arr.indexOf(url) === index,
  );
  return {
    id: `commercial-${store.id}`,
    titulo: store.storeName.trim() || 'Loja parceira',
    descricao: address || segment || 'Loja parceira do Rota',
    latitude: coords.latitude,
    longitude: coords.longitude,
    tipo: 'turismo',
    photoUrl: photoUrls[0] || cover,
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    formattedAddress: address || undefined,
    telefone: store.phone?.trim() || undefined,
    placeType: EXPLORE_PARTNER_STORES_CHIP_ID,
    markerColor: '#d97706',
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

function partnerSegmentMatches(storeSegment: string | null | undefined, wanted: string): boolean {
  const value = (storeSegment ?? '').trim().toLowerCase();
  const groups: Record<string, string[]> = {
    restaurant: ['restaurant', 'restaurante'],
    bakery: ['bakery', 'padaria'],
    pharmacy: ['pharmacy', 'farmacia', 'farmácia'],
    market: ['market', 'mercado', 'supermercado'],
  };
  return (groups[wanted] ?? [wanted]).includes(value);
}
export async function loadPartnerStoresForMap(segment?: string): Promise<PontoInteresse[]> {
  const stores = await listCommercialStoresForMap();
  const wanted = segment?.trim().toLowerCase();
  const seen = new Set<string>();
  const unique = stores.filter((store) => {
    if (seen.has(store.id)) return false;
    seen.add(store.id);
    if (wanted && !partnerSegmentMatches(store.segment, wanted)) return false;
    return true;
  });

  const pontos: PontoInteresse[] = [];
  const needsGeocode: CommercialStoreMapItem[] = [];
  for (const store of unique) {
    if (store.latitude != null && store.longitude != null) {
      pontos.push(
        commercialStoreToExplorePonto(store, {
          latitude: store.latitude,
          longitude: store.longitude,
        }),
      );
      continue;
    }
    needsGeocode.push(store);
  }

  const toGeocode = segment ? [] : needsGeocode.slice(0, GEOCODE_BATCH_SIZE);
  for (let i = 0; i < toGeocode.length; i += GEOCODE_BATCH_SIZE) {
    const batch = toGeocode.slice(i, i + GEOCODE_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((store) => geocodeStoreForMap(store)));
    for (const ponto of batchResults) {
      if (ponto) pontos.push(ponto);
    }
  }
  return pontos;
}
