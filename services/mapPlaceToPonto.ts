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
  const categoryLabel = place.category ? `Tipo: ${place.category}` : '';
  return {
    id: place.id,
    titulo: place.name,
    descricao: place.formattedAddress?.trim() || categoryLabel,
    latitude: place.latitude,
    longitude: place.longitude,
    tipo: PLACE_TYPE_TO_TIPO[filterType] || 'turismo',
    placeType: filterType,
    photoUrl: place.photoUrl?.trim() || undefined,
    formattedAddress: place.formattedAddress?.trim() || undefined,
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
    openNow: place.openNow,
    telefone: place.telefone?.trim() || undefined,
  };
}
