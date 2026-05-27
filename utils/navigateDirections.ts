import { router } from 'expo-router';

export function navigateToDirections(params: {
  destLat: number;
  destLng: number;
  destName?: string;
  originLat?: number;
  originLng?: number;
  profile?: 'driving' | 'walking';
}): void {
  router.push({
    pathname: '/directions',
    params: {
      destLat: String(params.destLat),
      destLng: String(params.destLng),
      destName: params.destName?.trim() ?? '',
      profile: params.profile ?? 'driving',
      ...(params.originLat != null ? { originLat: String(params.originLat) } : {}),
      ...(params.originLng != null ? { originLng: String(params.originLng) } : {}),
    },
  });
}
