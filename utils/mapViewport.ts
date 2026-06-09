import type { PontoInteresse } from '@/types';

export type MapVisibleBounds = {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
};

export type MapViewport = {
  bounds: MapVisibleBounds;
  zoom: number;
  centerLat: number;
  centerLng: number;
};

export function boundsFromRegionPayload(
  visibleBounds: [number, number][],
): MapVisibleBounds {
  const [ne, sw] = visibleBounds;
  const neLng = ne[0];
  const neLat = ne[1];
  const swLng = sw[0];
  const swLat = sw[1];
  return {
    neLat: Math.max(neLat, swLat),
    neLng: Math.max(neLng, swLng),
    swLat: Math.min(neLat, swLat),
    swLng: Math.min(neLng, swLng),
  };
}

export function isPontoInBounds(
  ponto: Pick<PontoInteresse, 'latitude' | 'longitude'>,
  bounds: MapVisibleBounds,
  paddingRatio = 0.08,
): boolean {
  const latPad = (bounds.neLat - bounds.swLat) * paddingRatio;
  const lngPad = (bounds.neLng - bounds.swLng) * paddingRatio;
  return (
    ponto.latitude <= bounds.neLat + latPad &&
    ponto.latitude >= bounds.swLat - latPad &&
    ponto.longitude <= bounds.neLng + lngPad &&
    ponto.longitude >= bounds.swLng - lngPad
  );
}

export function filterPontosInBounds(
  pontos: PontoInteresse[],
  bounds: MapVisibleBounds,
  maxItems?: number,
): PontoInteresse[] {
  const visible = pontos.filter((p) => isPontoInBounds(p, bounds));
  return maxItems != null ? visible.slice(0, maxItems) : visible;
}

export function projectLatLngToScreen(
  lat: number,
  lng: number,
  bounds: MapVisibleBounds,
  width: number,
  height: number,
): { x: number; y: number } | null {
  if (width <= 0 || height <= 0) return null;
  const lngSpan = bounds.neLng - bounds.swLng;
  const latSpan = bounds.neLat - bounds.swLat;
  if (lngSpan <= 1e-9 || latSpan <= 1e-9) return null;

  const x = ((lng - bounds.swLng) / lngSpan) * width;
  const y = ((bounds.neLat - lat) / latSpan) * height;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function shouldUseCardOverlay(zoom: number, visibleCount: number, minZoom: number, maxCards: number): boolean {
  return zoom >= minZoom && visibleCount > 0 && visibleCount <= maxCards;
}

const PLACE_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante',
  fast_food: 'Fast-food',
  bakery: 'Padaria',
  bar: 'Bar',
  cafe: 'Café',
  pharmacy: 'Farmácia',
  atm: 'Caixa',
  market: 'Mercado',
  supermarket: 'Supermercado',
  gas_station: 'Prestador',
  gym: 'Academia',
  park: 'Parque',
  school: 'Escola',
  hotel: 'Hotel',
  hospital: 'Hospital',
  shopping_center: 'Shopping',
  bank: 'Banco',
  community: 'Comunidade',
  partner_stores: 'Loja parceira',
};

const TIPO_LABELS: Record<PontoInteresse['tipo'], string> = {
  governo: 'Governo',
  saude: 'Saúde',
  lazer: 'Lazer',
  educacao: 'Educação',
  cultura: 'Cultura',
  turismo: 'Turismo',
};

export function poiCategoryLabel(ponto: PontoInteresse): string {
  if (ponto.placeType) {
    return PLACE_TYPE_LABELS[ponto.placeType] ?? ponto.placeType.replace(/_/g, ' ');
  }
  return TIPO_LABELS[ponto.tipo] ?? ponto.tipo;
}
