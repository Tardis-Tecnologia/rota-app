import type { NearbyCategory } from '@/services/placesService';

export const GUIA_EMPRESA_PLACE_CATEGORIES: NearbyCategory[] = [
  'restaurant',
  'fast_food',
  'bakery',
  'bar',
  'cafe',
  'pharmacy',
  'market',
  'supermarket',
  'gym',
  'hotel',
  'shopping_center',
  'shopping',
  'bank',
];

export const GUIA_PLACE_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante',
  fast_food: 'Fast-food',
  bakery: 'Padaria',
  bar: 'Bar',
  cafe: 'Café',
  pharmacy: 'Farmácia',
  market: 'Mercado',
  supermarket: 'Supermercado',
  gym: 'Academia',
  hotel: 'Hotel',
  shopping_center: 'Shopping',
  shopping: 'Comércio',
  bank: 'Banco',
};
