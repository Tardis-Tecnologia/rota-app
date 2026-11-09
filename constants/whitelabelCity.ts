import type { Localizacao } from '@/types';

export const HOST_ID_MARICA = '36578ec5-ff28-4885-aa5f-1b383ff9c525';
/** Host real de Maricá no banco de produção (domínio marica.rj.gov.br). */
export const HOST_ID_MARICA_PRODUCTION = '2cf2b25c-747e-4d79-862c-8960e0b659cc';
export const HOST_ID_PIRAI = 'f0000002-0000-4000-8000-000000000002';
export const HOST_ID_NILOPOLIS = 'c1000002-0000-4000-8000-000000000002';

export type WhitelabelCityConfig = {
  hostId: string;
  cityName: string;
  uf: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  /** Sufixo para geocodificação quando o endereço não traz cidade. */
  geocodeSuffix: string;
  /** Raio de busca de POIs no Guia (metros). */
  placesSearchRadiusMeters: number;
  /** Mapa e buscas ancorados no centro da cidade (ignora GPS do dispositivo). */
  fixedMapCenter: boolean;
};

const MARICA: WhitelabelCityConfig = {
  hostId: HOST_ID_MARICA,
  cityName: 'Maricá',
  uf: 'RJ',
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
  geocodeSuffix: 'Maricá, RJ, Brasil',
  placesSearchRadiusMeters: 45_000,
  fixedMapCenter: false,
};

const PIRAI: WhitelabelCityConfig = {
  hostId: HOST_ID_PIRAI,
  cityName: 'Piraí',
  uf: 'RJ',
  // Centro de Piraí (Praça Getúlio Vargas, Centro).
  latitude: -22.6289,
  longitude: -43.898,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
  geocodeSuffix: 'Piraí, RJ, Brasil',
  placesSearchRadiusMeters: 35_000,
  fixedMapCenter: true,
};

const NILOPOLIS: WhitelabelCityConfig = {
  hostId: HOST_ID_NILOPOLIS,
  cityName: 'Nilópolis',
  uf: 'RJ',
  // Centro de Nilópolis (Praça da Matriz).
  latitude: -22.8078,
  longitude: -43.4142,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
  geocodeSuffix: 'Nilópolis, RJ, Brasil',
  placesSearchRadiusMeters: 12_000,
  fixedMapCenter: true,
};

const BY_HOST_ID: Record<string, WhitelabelCityConfig> = {
  [HOST_ID_MARICA.toLowerCase()]: MARICA,
  [HOST_ID_MARICA_PRODUCTION.toLowerCase()]: MARICA,
  [HOST_ID_PIRAI.toLowerCase()]: PIRAI,
  [HOST_ID_NILOPOLIS.toLowerCase()]: NILOPOLIS,
};

export function getWhitelabelCityConfig(hostId?: string | null): WhitelabelCityConfig {
  const normalized = hostId?.trim().toLowerCase();
  if (normalized && BY_HOST_ID[normalized]) {
    return BY_HOST_ID[normalized];
  }
  return MARICA;
}

export function cityToMapCenter(city: WhitelabelCityConfig): Localizacao {
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    latitudeDelta: city.latitudeDelta,
    longitudeDelta: city.longitudeDelta,
  };
}

export function buildCityGeocodeQuery(base: string, city?: WhitelabelCityConfig): string {
  const cfg = city ?? getWhitelabelCityConfig();
  const lower = base.toLowerCase();
  const cityLower = cfg.cityName.toLowerCase();
  if (
    lower.includes(cityLower) ||
    lower.includes('brasil') ||
    lower.includes(`, ${cfg.uf.toLowerCase()}`)
  ) {
    return base;
  }
  return `${base}, ${cfg.geocodeSuffix}`;
}
