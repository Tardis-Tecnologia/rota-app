import type { RouteCoordinate } from '@/types/directions';
import type { Region } from '@/types';

export function regionFromRouteCoordinates(
  coordinates: RouteCoordinate[],
  paddingFactor = 1.35,
): Region {
  if (coordinates.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  const latSpan = Math.max((maxLat - minLat) * paddingFactor, 0.006);
  const lngSpan = Math.max((maxLng - minLng) * paddingFactor, 0.006);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan,
    longitudeDelta: lngSpan,
  };
}
