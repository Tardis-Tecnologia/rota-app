import type { NearbyCategory } from '@/services/placesService';

/** Ordem: empresas/comércio geral primeiro; alimentação por último. */
export const GUIA_EMPRESA_PLACE_CATEGORIES: NearbyCategory[] = [
  'company',
  'shopping',
  'shopping_center',
  'market',
  'supermarket',
  'bank',
  'pharmacy',
  'hotel',
  'gym',
  'hospital',
  'school',
  'bakery',
  'cafe',
  'restaurant',
  'fast_food',
  'bar',
];

export const GUIA_PLACE_TYPE_LABELS: Record<string, string> = {
  company: 'Empresa',
  shopping: 'Comércio',
  shopping_center: 'Shopping',
  market: 'Mercado',
  supermarket: 'Supermercado',
  bank: 'Banco',
  pharmacy: 'Farmácia',
  hotel: 'Hotel',
  gym: 'Academia',
  hospital: 'Hospital',
  school: 'Escola',
  bakery: 'Padaria',
  cafe: 'Café',
  restaurant: 'Restaurante',
  fast_food: 'Fast-food',
  bar: 'Bar',
};
