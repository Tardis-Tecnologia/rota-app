/** Distância em metros entre dois pontos (Haversine). */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

import { cityToMapCenter } from '@/constants/whitelabelCity';
import { resolveActiveCityConfig } from '@/utils/whitelabelHost';

/** Centro do Guia conforme host whitelabel (env ou JWT). */
export function getGuiaDefaultCenter() {
  const city = resolveActiveCityConfig();
  return {
    ...cityToMapCenter(city),
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };
}

/** @deprecated Prefer getGuiaDefaultCenter() — mantido para imports legados. */
export const GUIA_DEFAULT_CENTER = getGuiaDefaultCenter();
