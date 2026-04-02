import { NearbyPlace } from '@/services/placesService';
import { PontoInteresse } from '@/types';

const PLACE_TYPE_TO_TIPO: Record<string, PontoInteresse['tipo']> = {
  restaurant: 'turismo',
  fast_food: 'turismo',
  bakery: 'turismo',
  bar: 'turismo',
  cafe: 'turismo',
  pharmacy: 'saude',
  atm: 'governo',
  market: 'turismo',
  supermarket: 'turismo',
  gym: 'lazer',
  park: 'lazer',
  school: 'governo',
  hotel: 'turismo',
  gas_station: 'lazer',
  hospital: 'saude',
  shopping_mall: 'turismo',
  shopping: 'turismo',
  shopping_center: 'turismo',
  bank: 'governo',
};

export function placeToPonto(place: NearbyPlace, filterType: string): PontoInteresse {
  return {
    id: place.id,
    titulo: place.name,
    descricao: place.category ? `Tipo: ${place.category}` : '',
    latitude: place.latitude,
    longitude: place.longitude,
    tipo: PLACE_TYPE_TO_TIPO[filterType] || 'turismo',
    placeType: filterType,
  };
}
