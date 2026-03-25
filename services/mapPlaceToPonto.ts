import { Place } from '@/services/placesService';
import { PontoInteresse } from '@/types';

const PLACE_TYPE_TO_TIPO: Record<string, PontoInteresse['tipo']> = {
  restaurant: 'turismo',
  gas_station: 'lazer',
  hospital: 'saude',
  shopping_mall: 'turismo',
  bank: 'governo',
};

export function placeToPonto(place: Place, filterType: string): PontoInteresse {
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 });
  return {
    id: place.place_id,
    titulo: place.name,
    descricao: place.vicinity || place.formatted_address || '',
    latitude: lat,
    longitude: lng,
    tipo: PLACE_TYPE_TO_TIPO[filterType] || 'turismo',
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    openNow: place.opening_hours?.open_now,
    photoUrl,
    formattedAddress: place.formatted_address,
    telefone: place.formatted_phone_number,
    placeType: filterType,
  };
}
