const getMockPhoto = (type: string, index: number): string => {
  const photoMap: Record<string, string[]> = {
    restaurant: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    ],
    gas_station: [
      'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    ],
    hospital: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
    ],
    shopping_mall: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop',
    ],
    bank: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
    ],
    pharmacy: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
    ],
    cafe: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4c7c98?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550c710adf1?w=800&h=600&fit=crop',
    ],
    gym: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop',
    ],
    park: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop',
    ],
    school: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
    ],
    hotel: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    ],
    atm: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
    ],
    supermarket: [
      'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    ],
    bakery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
    ],
    bar: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&h=600&fit=crop',
    ],
  };

  const photos = photoMap[type] || photoMap.restaurant;
  return photos[index % photos.length];
};

export interface Place {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    getUrl: (options: { maxWidth: number; maxHeight: number }) => string;
  }>;
  vicinity?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  types?: string[];
}

const generateNearbyPlaces = (
  type: string,
  userPosition: [number, number],
  count: number,
  radiusMeters: number = 1500
): Place[] => {
  const places: Place[] = [];
  const [userLng, userLat] = userPosition;

  const templates: Record<string, any[]> = {
    restaurant: [
      { name: 'Restaurante Sabor do Mar', rating: 4.5, reviews: 234, address: 'Av. Atlântica', phone: '(21) 98765-4321' },
      { name: 'Cantina Italiana', rating: 4.8, reviews: 156, address: 'Rua das Flores', phone: '(21) 98765-4322' },
    ],
    gas_station: [
      { name: 'Posto Shell', rating: 4.2, reviews: 89, address: 'Av. Brasil', phone: '(21) 3456-7890' },
      { name: 'Posto Ipiranga', rating: 4.3, reviews: 112, address: 'Av. Atlântica', phone: '(21) 3456-7891' },
    ],
    hospital: [
      { name: 'Hospital Municipal', rating: 4.6, reviews: 445, address: 'Rua da Saúde', phone: '(21) 2567-8901' },
      { name: 'Hospital São Lucas', rating: 4.5, reviews: 389, address: 'Av. Médica', phone: '(21) 2567-8902' },
    ],
    shopping_mall: [
      { name: 'Shopping Center', rating: 4.4, reviews: 1234, address: 'Av. das Américas', phone: '(21) 2345-6789' },
      { name: 'Shopping Plaza', rating: 4.3, reviews: 987, address: 'Av. Comercial', phone: '(21) 2345-6790' },
    ],
    bank: [
      { name: 'Banco do Brasil', rating: 3.8, reviews: 567, address: 'Rua do Comércio', phone: '(21) 4004-0001' },
      { name: 'Banco Itaú', rating: 4.0, reviews: 623, address: 'Av. Financeira', phone: '(21) 4004-0002' },
    ],
    pharmacy: [
      { name: 'Farmácia Popular', rating: 4.3, reviews: 234, address: 'Rua das Farmácias', phone: '(21) 3456-1234' },
      { name: 'Drogaria Central', rating: 4.2, reviews: 189, address: 'Av. Medicinal', phone: '(21) 3456-1235' },
    ],
    cafe: [
      { name: 'Café Central', rating: 4.5, reviews: 234, address: 'Rua do Café', phone: '(21) 2345-6789' },
      { name: 'Starbucks', rating: 4.3, reviews: 456, address: 'Av. Coffee', phone: '(21) 2345-6790' },
    ],
    gym: [
      { name: 'Academia Smart Fit', rating: 4.4, reviews: 567, address: 'Av. Fitness', phone: '(21) 3456-7890' },
      { name: 'Academia Bodytech', rating: 4.5, reviews: 623, address: 'Rua dos Atletas', phone: '(21) 3456-7891' },
    ],
    park: [
      { name: 'Parque da Tijuca', rating: 4.8, reviews: 1234, address: 'Estrada da Tijuca', phone: '(21) 2492-2252' },
      { name: 'Parque do Flamengo', rating: 4.7, reviews: 987, address: 'Av. Infante Dom Henrique', phone: '(21) 2557-4999' },
    ],
    school: [
      { name: 'Colégio Pedro II', rating: 4.6, reviews: 567, address: 'Rua dos Estudantes', phone: '(21) 2567-8901' },
      { name: 'Escola Municipal', rating: 4.3, reviews: 234, address: 'Av. Educação', phone: '(21) 2567-8902' },
    ],
    hotel: [
      { name: 'Hotel Copacabana Palace', rating: 4.8, reviews: 1234, address: 'Av. Atlântica', phone: '(21) 2548-7070' },
      { name: 'Hotel Ipanema', rating: 4.6, reviews: 987, address: 'Rua Ipanema', phone: '(21) 2525-2020' },
    ],
    atm: [
      { name: 'Caixa Eletrônico BB', rating: 4.0, reviews: 234, address: 'Rua do Comércio', phone: '(21) 4004-0001' },
      { name: 'Caixa Eletrônico Itaú', rating: 4.1, reviews: 189, address: 'Av. Financeira', phone: '(21) 4004-0002' },
    ],
    supermarket: [
      { name: 'Supermercado Zona Sul', rating: 4.3, reviews: 456, address: 'Av. Comercial', phone: '(21) 2345-6789' },
      { name: 'Supermercado Extra', rating: 4.2, reviews: 389, address: 'Rua dos Supermercados', phone: '(21) 2345-6790' },
    ],
    bakery: [
      { name: 'Padaria Real', rating: 4.5, reviews: 234, address: 'Rua das Padarias', phone: '(21) 3456-1234' },
      { name: 'Padaria do Bairro', rating: 4.4, reviews: 189, address: 'Av. Pão', phone: '(21) 3456-1235' },
    ],
    bar: [
      { name: 'Bar do Zé', rating: 4.4, reviews: 234, address: 'Rua dos Bares', phone: '(21) 9876-5432' },
      { name: 'Bar Central', rating: 4.3, reviews: 189, address: 'Av. Noturna', phone: '(21) 9876-5433' },
    ]
  };

  const categoryTemplates = templates[type] || [];
  const actualCount = Math.min(count, categoryTemplates.length);

  for (let i = 0; i < actualCount; i++) {
    const template = categoryTemplates[i];
    const angle = (Math.PI * 2 * i) / actualCount;
    const radiusKm = Math.max(0.2, radiusMeters / 1000);
    const maxDegLat = radiusKm / 111;
    const minDegLat = Math.min(0.001, maxDegLat);
    const distDegLat = minDegLat + Math.random() * Math.max(0, maxDegLat - minDegLat);
    const latRad = (userLat * Math.PI) / 180;
    const cosLat = Math.max(0.2, Math.cos(latRad));
    const offsetLat = Math.sin(angle) * distDegLat;
    const offsetLng = (Math.cos(angle) * distDegLat) / cosLat;
    
    const lng = userLng + offsetLng;
    const lat = userLat + offsetLat;
    
    const streetNumber = Math.floor(Math.random() * 9000) + 100;
    const fullAddress = `${template.address}, ${streetNumber}`;
    const neighborhoods = ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Tijuca', 'Centro', 'Barra da Tijuca', 'Recreio dos Bandeirantes'];
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const zipCode = `${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    const formattedAddress = `${fullAddress} - ${neighborhood}, Rio de Janeiro - RJ, ${zipCode}, Brasil`;
    const phone = template.phone || `(21) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    places.push({
      place_id: `${type}${i + 1}`,
      name: template.name,
      geometry: { 
        location: { 
          lat: () => lat, 
          lng: () => lng 
        } 
      },
      rating: template.rating,
      user_ratings_total: template.reviews,
      opening_hours: { open_now: Math.random() > 0.2 },
      photos: [{ 
        getUrl: () => getMockPhoto(type, i)
      }],
      vicinity: fullAddress,
      formatted_address: formattedAddress,
      formatted_phone_number: phone,
      types: [type]
    });
  }

  return places;
};

const mockPlaces: Record<string, Place[]> = {
  restaurant: [
    {
      place_id: 'rest1',
      name: 'Restaurante Sabor do Mar',
      geometry: { location: { lat: () => -22.9078, lng: () => -43.1729 } },
      rating: 4.5,
      user_ratings_total: 234,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 0) }],
      vicinity: 'Av. Atlântica, 1000',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest2',
      name: 'Cantina Italiana',
      geometry: { location: { lat: () => -22.9088, lng: () => -43.1739 } },
      rating: 4.8,
      user_ratings_total: 156,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 1) }],
      vicinity: 'Rua das Flores, 250',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest3',
      name: 'Churrascaria Gaúcha',
      geometry: { location: { lat: () => -22.9098, lng: () => -43.1749 } },
      rating: 4.7,
      user_ratings_total: 312,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 2) }],
      vicinity: 'Av. Copacabana, 500',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest4',
      name: 'Sushi House',
      geometry: { location: { lat: () => -22.9108, lng: () => -43.1759 } },
      rating: 4.6,
      user_ratings_total: 189,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 3) }],
      vicinity: 'Rua Ipanema, 200',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest5',
      name: 'Pizzaria Napolitana',
      geometry: { location: { lat: () => -22.9118, lng: () => -43.1769 } },
      rating: 4.4,
      user_ratings_total: 278,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 4) }],
      vicinity: 'Av. Leblon, 300',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest6',
      name: 'Café Central',
      geometry: { location: { lat: () => -22.9128, lng: () => -43.1779 } },
      rating: 4.3,
      user_ratings_total: 145,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('cafe', 0) }],
      vicinity: 'Rua do Catete, 150',
      types: ['restaurant', 'cafe', 'food']
    },
    {
      place_id: 'rest7',
      name: 'Hamburgueria Artesanal',
      geometry: { location: { lat: () => -22.9138, lng: () => -43.1789 } },
      rating: 4.9,
      user_ratings_total: 421,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 6) }],
      vicinity: 'Av. Botafogo, 400',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest8',
      name: 'Restaurante Vegetariano',
      geometry: { location: { lat: () => -22.9148, lng: () => -43.1799 } },
      rating: 4.5,
      user_ratings_total: 198,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 7) }],
      vicinity: 'Rua Flamengo, 250',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest9',
      name: 'Taco Mexicano',
      geometry: { location: { lat: () => -22.9158, lng: () => -43.1809 } },
      rating: 4.2,
      user_ratings_total: 167,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('restaurant', 8) }],
      vicinity: 'Av. Laranjeiras, 350',
      types: ['restaurant', 'food']
    },
    {
      place_id: 'rest10',
      name: 'Padaria e Confeitaria',
      geometry: { location: { lat: () => -22.9168, lng: () => -43.1819 } },
      rating: 4.6,
      user_ratings_total: 234,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('bakery', 0) }],
      vicinity: 'Rua Glória, 180',
      types: ['restaurant', 'bakery', 'food']
    }
  ],
  gas_station: [
    {
      place_id: 'gas1',
      name: 'Posto Shell',
      geometry: { location: { lat: () => -22.9068, lng: () => -43.1719 } },
      rating: 4.2,
      user_ratings_total: 89,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('gas_station', 0) }],
      vicinity: 'Av. Brasil, 2000',
      types: ['gas_station']
    }
  ],
  hospital: [
    {
      place_id: 'hosp1',
      name: 'Hospital Municipal',
      geometry: { location: { lat: () => -22.9058, lng: () => -43.1709 } },
      rating: 4.6,
      user_ratings_total: 445,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('hospital', 0) }],
      vicinity: 'Rua da Saúde, 500',
      types: ['hospital', 'health']
    }
  ],
  shopping_mall: [
    {
      place_id: 'shop1',
      name: 'Shopping Center',
      geometry: { location: { lat: () => -22.9048, lng: () => -43.1699 } },
      rating: 4.4,
      user_ratings_total: 1234,
      opening_hours: { open_now: true },
      photos: [{ getUrl: () => getMockPhoto('shopping_mall', 0) }],
      vicinity: 'Av. das Américas, 5000',
      types: ['shopping_mall']
    }
  ],
  bank: [
    {
      place_id: 'bank1',
      name: 'Banco do Brasil',
      geometry: { location: { lat: () => -22.9038, lng: () => -43.1689 } },
      rating: 3.8,
      user_ratings_total: 567,
      opening_hours: { open_now: false },
      photos: [{ getUrl: () => getMockPhoto('bank', 0) }],
      vicinity: 'Rua do Comércio, 100',
      types: ['bank', 'finance']
    }
  ]
};

export const searchNearbyPlaces = async (
  type: string,
  position: [number, number],
  radius: number = 5000
): Promise<Place[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const countByType: Record<string, number> = {
    restaurant: 12,
    gas_station: 6,
    hospital: 6,
    shopping_mall: 5,
    bank: 6,
    pharmacy: 6,
    cafe: 5,
    gym: 5,
    park: 5,
    school: 5,
    hotel: 5,
    atm: 5,
    supermarket: 5,
    bakery: 5,
    bar: 5
  };
  
  const count = countByType[type] || 5;
  const places = generateNearbyPlaces(type, position, count, radius);
  
  return places;
};

export const textSearchPlaces = async (query: string, position?: [number, number]): Promise<Place[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (position) {
    const allTypes = ['restaurant', 'gas_station', 'hospital', 'shopping_mall', 'bank', 'pharmacy', 'cafe', 'gym', 'park', 'school', 'hotel', 'atm', 'supermarket', 'bakery', 'bar'];
    const allPlaces: Place[] = [];
    
    allTypes.forEach(type => {
      const places = generateNearbyPlaces(type, position, 3, 5000);
      allPlaces.push(...places);
    });
    
    return allPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      (place.vicinity && place.vicinity.toLowerCase().includes(query.toLowerCase())) ||
      (place.formatted_address && place.formatted_address.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  const allPlaces = Object.values(mockPlaces).flat();
  return allPlaces.filter(place => 
    place.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const distanceMeters = (a: [number, number], b: [number, number]): number => {
  const R = 6371000;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

export const filterPlacesWithinRadius = (
  places: Place[],
  center: [number, number],
  radiusMeters: number
): Place[] => {
  return places.filter((p) => {
    const lng = p.geometry.location.lng();
    const lat = p.geometry.location.lat();
    return distanceMeters(center, [lng, lat]) <= radiusMeters;
  });
};
