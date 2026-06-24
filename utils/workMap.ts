import { buildCityGeocodeQuery } from '@/constants/whitelabelCity';
import type { WorkResponseDto } from '@/services/worksApi';
import { resolveActiveCityConfig } from '@/utils/whitelabelHost';
import { geocodeStoreLocation } from '@/utils/commercialStoreProfile';
import { router } from 'expo-router';
import { Alert } from 'react-native';

function buildWorkGeocodeQuery(
  work: Pick<WorkResponseDto, 'address' | 'neighborhood'>,
): string | null {
  const address = work.address?.trim();
  const neighborhood = work.neighborhood?.trim();
  let base = address || neighborhood;
  if (!base) return null;

  if (address && neighborhood && !address.toLowerCase().includes(neighborhood.toLowerCase())) {
    base = `${address}, ${neighborhood}`;
  }

  return buildCityGeocodeQuery(base, resolveActiveCityConfig());
}

function hasWorkCoords(
  work: WorkResponseDto,
): work is WorkResponseDto & { latitude: number; longitude: number } {
  return (
    work.latitude != null &&
    work.longitude != null &&
    Number.isFinite(work.latitude) &&
    Number.isFinite(work.longitude)
  );
}

export async function resolveWorkCoords(
  work: WorkResponseDto,
): Promise<{ latitude: number; longitude: number } | null> {
  if (hasWorkCoords(work)) {
    return { latitude: work.latitude, longitude: work.longitude };
  }
  const query = buildWorkGeocodeQuery(work);
  if (!query) return null;
  return geocodeStoreLocation(query);
}

export async function openWorkOnMap(work: WorkResponseDto): Promise<boolean> {
  const coords = await resolveWorkCoords(work);
  if (!coords) {
    Alert.alert(
      'Localização indisponível',
      work.address?.trim() || work.neighborhood?.trim()
        ? 'Não foi possível localizar este endereço no mapa.'
        : 'Esta obra ainda não tem endereço cadastrado.',
    );
    return false;
  }

  router.push({
    pathname: '/works/location',
    params: {
      destLat: String(coords.latitude),
      destLng: String(coords.longitude),
      title: work.title?.trim() || work.address?.trim() || 'Obra',
      address: work.address?.trim() ?? '',
    },
  });
  return true;
}
