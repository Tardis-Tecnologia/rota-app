import { GUIA_PLACE_TYPE_LABELS } from '@/constants/guiaEmpresaPlaces';
import type { GuiaListItem } from '@/services/guiaCatalog';
import type { NearbyPlace } from '@/services/placesService';
import type { Profile } from '@/types';

export function nearbyPlaceToGuiaCompany(
  place: NearbyPlace,
  placeType: string,
): GuiaListItem {
  const categoryLabel =
    GUIA_PLACE_TYPE_LABELS[placeType] ??
    GUIA_PLACE_TYPE_LABELS[place.category] ??
    place.category ??
    'Empresa';

  const profile: Profile = {
    id: place.id,
    type: 'COMPANY',
    name: place.name,
    categoryId: placeType,
    rating: 0,
    review: 0,
    image: '',
    about: categoryLabel,
    latitude: place.latitude,
    longitude: place.longitude,
    reviews: [],
    gallery: [],
    services: [],
  };

  return {
    ...profile,
    latitude: place.latitude,
    longitude: place.longitude,
    categoryLabel,
  };
}
